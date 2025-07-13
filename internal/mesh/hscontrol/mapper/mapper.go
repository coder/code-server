package mapper

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io/fs"
	"net/netip"
	"net/url"
	"os"
	"path"
	"slices"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/juanfont/headscale/hscontrol/notifier"
	"github.com/juanfont/headscale/hscontrol/policy"
	"github.com/juanfont/headscale/hscontrol/state"
	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/klauspost/compress/zstd"
	"github.com/rs/zerolog/log"
	"tailscale.com/envknob"
	"tailscale.com/smallzstd"
	"tailscale.com/tailcfg"
	"tailscale.com/types/dnstype"
	"tailscale.com/types/views"
)

const (
	nextDNSDoHPrefix           = "https://dns.nextdns.io"
	reservedResponseHeaderSize = 4
	mapperIDLength             = 8
	debugMapResponsePerm       = 0o755
)

var debugDumpMapResponsePath = envknob.String("HEADSCALE_DEBUG_DUMP_MAPRESPONSE_PATH")

// TODO: Optimise
// As this work continues, the idea is that there will be one Mapper instance
// per node, attached to the open stream between the control and client.
// This means that this can hold a state per node and we can use that to
// improve the mapresponses sent.
// We could:
// - Keep information about the previous mapresponse so we can send a diff
// - Store hashes
// - Create a "minifier" that removes info not needed for the node
// - some sort of batching, wait for 5 or 60 seconds before sending

type Mapper struct {
	// Configuration
	state *state.State
	cfg   *types.Config
	notif *notifier.Notifier

	uid     string
	created time.Time
	seq     uint64
}

type patch struct {
	timestamp time.Time
	change    *tailcfg.PeerChange
}

func NewMapper(
	state *state.State,
	cfg *types.Config,
	notif *notifier.Notifier,
) *Mapper {
	uid, _ := util.GenerateRandomStringDNSSafe(mapperIDLength)

	return &Mapper{
		state: state,
		cfg:   cfg,
		notif: notif,

		uid:     uid,
		created: time.Now(),
		seq:     0,
	}
}

func (m *Mapper) String() string {
	return fmt.Sprintf("Mapper: { seq: %d, uid: %s, created: %s }", m.seq, m.uid, m.created)
}

func generateUserProfiles(
	node types.NodeView,
	peers views.Slice[types.NodeView],
) []tailcfg.UserProfile {
	userMap := make(map[uint]*types.User)
	ids := make([]uint, 0, peers.Len()+1)
	user := node.User()
	userMap[user.ID] = &user
	ids = append(ids, user.ID)
	for _, peer := range peers.All() {
		peerUser := peer.User()
		userMap[peerUser.ID] = &peerUser
		ids = append(ids, peerUser.ID)
	}

	slices.Sort(ids)
	ids = slices.Compact(ids)
	var profiles []tailcfg.UserProfile
	for _, id := range ids {
		if userMap[id] != nil {
			profiles = append(profiles, userMap[id].TailscaleUserProfile())
		}
	}

	return profiles
}

func generateDNSConfig(
	cfg *types.Config,
	node types.NodeView,
) *tailcfg.DNSConfig {
	if cfg.TailcfgDNSConfig == nil {
		return nil
	}

	dnsConfig := cfg.TailcfgDNSConfig.Clone()

	addNextDNSMetadata(dnsConfig.Resolvers, node)

	return dnsConfig
}

// If any nextdns DoH resolvers are present in the list of resolvers it will
// take metadata from the node metadata and instruct tailscale to add it
// to the requests. This makes it possible to identify from which device the
// requests come in the NextDNS dashboard.
//
// This will produce a resolver like:
// `https://dns.nextdns.io/<nextdns-id>?device_name=node-name&device_model=linux&device_ip=100.64.0.1`
func addNextDNSMetadata(resolvers []*dnstype.Resolver, node types.NodeView) {
	for _, resolver := range resolvers {
		if strings.HasPrefix(resolver.Addr, nextDNSDoHPrefix) {
			attrs := url.Values{
				"device_name":  []string{node.Hostname()},
				"device_model": []string{node.Hostinfo().OS()},
			}

			nodeIPs := node.IPs()
			if len(nodeIPs) > 0 {
				attrs.Add("device_ip", nodeIPs[0].String())
			}

			resolver.Addr = fmt.Sprintf("%s?%s", resolver.Addr, attrs.Encode())
		}
	}
}

// fullMapResponse creates a complete MapResponse for a node.
// It is a separate function to make testing easier.
func (m *Mapper) fullMapResponse(
	node types.NodeView,
	peers views.Slice[types.NodeView],
	capVer tailcfg.CapabilityVersion,
) (*tailcfg.MapResponse, error) {
	resp, err := m.baseWithConfigMapResponse(node, capVer)
	if err != nil {
		return nil, err
	}

	err = appendPeerChanges(
		resp,
		true, // full change
		m.state,
		node,
		capVer,
		peers,
		m.cfg,
	)
	if err != nil {
		return nil, err
	}

	return resp, nil
}

// FullMapResponse returns a MapResponse for the given node.
func (m *Mapper) FullMapResponse(
	mapRequest tailcfg.MapRequest,
	node types.NodeView,
	messages ...string,
) ([]byte, error) {
	peers, err := m.ListPeers(node.ID())
	if err != nil {
		return nil, err
	}

	resp, err := m.fullMapResponse(node, peers.ViewSlice(), mapRequest.Version)
	if err != nil {
		return nil, err
	}

	return m.marshalMapResponse(mapRequest, resp, node, mapRequest.Compress, messages...)
}

// ReadOnlyMapResponse returns a MapResponse for the given node.
// Lite means that the peers has been omitted, this is intended
// to be used to answer MapRequests with OmitPeers set to true.
func (m *Mapper) ReadOnlyMapResponse(
	mapRequest tailcfg.MapRequest,
	node types.NodeView,
	messages ...string,
) ([]byte, error) {
	resp, err := m.baseWithConfigMapResponse(node, mapRequest.Version)
	if err != nil {
		return nil, err
	}

	return m.marshalMapResponse(mapRequest, resp, node, mapRequest.Compress, messages...)
}

func (m *Mapper) KeepAliveResponse(
	mapRequest tailcfg.MapRequest,
	node types.NodeView,
) ([]byte, error) {
	resp := m.baseMapResponse()
	resp.KeepAlive = true

	return m.marshalMapResponse(mapRequest, &resp, node, mapRequest.Compress)
}

func (m *Mapper) DERPMapResponse(
	mapRequest tailcfg.MapRequest,
	node types.NodeView,
	derpMap *tailcfg.DERPMap,
) ([]byte, error) {
	resp := m.baseMapResponse()
	resp.DERPMap = derpMap

	return m.marshalMapResponse(mapRequest, &resp, node, mapRequest.Compress)
}

func (m *Mapper) PeerChangedResponse(
	mapRequest tailcfg.MapRequest,
	node types.NodeView,
	changed map[types.NodeID]bool,
	patches []*tailcfg.PeerChange,
	messages ...string,
) ([]byte, error) {
	var err error
	resp := m.baseMapResponse()

	var removedIDs []tailcfg.NodeID
	var changedIDs []types.NodeID
	for nodeID, nodeChanged := range changed {
		if nodeChanged {
			if nodeID != node.ID() {
				changedIDs = append(changedIDs, nodeID)
			}
		} else {
			removedIDs = append(removedIDs, nodeID.NodeID())
		}
	}
	changedNodes := types.Nodes{}
	if len(changedIDs) > 0 {
		changedNodes, err = m.ListNodes(changedIDs...)
		if err != nil {
			return nil, err
		}
	}

	err = appendPeerChanges(
		&resp,
		false, // partial change
		m.state,
		node,
		mapRequest.Version,
		changedNodes.ViewSlice(),
		m.cfg,
	)
	if err != nil {
		return nil, err
	}

	resp.PeersRemoved = removedIDs

	// Sending patches as a part of a PeersChanged response
	// is technically not suppose to be done, but they are
	// applied after the PeersChanged. The patch list
	// should _only_ contain Nodes that are not in the
	// PeersChanged or PeersRemoved list and the caller
	// should filter them out.
	//
	// From tailcfg docs:
	// These are applied after Peers* above, but in practice the
	// control server should only send these on their own, without
	// the Peers* fields also set.
	if patches != nil {
		resp.PeersChangedPatch = patches
	}

	_, matchers := m.state.Filter()
	// Add the node itself, it might have changed, and particularly
	// if there are no patches or changes, this is a self update.
	tailnode, err := tailNode(
		node, mapRequest.Version, m.state,
		func(id types.NodeID) []netip.Prefix {
			return policy.ReduceRoutes(node, m.state.GetNodePrimaryRoutes(id), matchers)
		},
		m.cfg)
	if err != nil {
		return nil, err
	}
	resp.Node = tailnode

	return m.marshalMapResponse(mapRequest, &resp, node, mapRequest.Compress, messages...)
}

// PeerChangedPatchResponse creates a patch MapResponse with
// incoming update from a state change.
func (m *Mapper) PeerChangedPatchResponse(
	mapRequest tailcfg.MapRequest,
	node types.NodeView,
	changed []*tailcfg.PeerChange,
) ([]byte, error) {
	resp := m.baseMapResponse()
	resp.PeersChangedPatch = changed

	return m.marshalMapResponse(mapRequest, &resp, node, mapRequest.Compress)
}

func (m *Mapper) marshalMapResponse(
	mapRequest tailcfg.MapRequest,
	resp *tailcfg.MapResponse,
	node types.NodeView,
	compression string,
	messages ...string,
) ([]byte, error) {
	atomic.AddUint64(&m.seq, 1)

	jsonBody, err := json.Marshal(resp)
	if err != nil {
		return nil, fmt.Errorf("marshalling map response: %w", err)
	}

	if debugDumpMapResponsePath != "" {
		data := map[string]any{
			"Messages":    messages,
			"MapRequest":  mapRequest,
			"MapResponse": resp,
		}

		responseType := "keepalive"

		switch {
		case resp.Peers != nil && len(resp.Peers) > 0:
			responseType = "full"
		case resp.Peers == nil && resp.PeersChanged == nil && resp.PeersChangedPatch == nil && resp.DERPMap == nil && !resp.KeepAlive:
			responseType = "self"
		case resp.PeersChanged != nil && len(resp.PeersChanged) > 0:
			responseType = "changed"
		case resp.PeersChangedPatch != nil && len(resp.PeersChangedPatch) > 0:
			responseType = "patch"
		case resp.PeersRemoved != nil && len(resp.PeersRemoved) > 0:
			responseType = "removed"
		}

		body, err := json.MarshalIndent(data, "", "  ")
		if err != nil {
			return nil, fmt.Errorf("marshalling map response: %w", err)
		}

		perms := fs.FileMode(debugMapResponsePerm)
		mPath := path.Join(debugDumpMapResponsePath, node.Hostname())
		err = os.MkdirAll(mPath, perms)
		if err != nil {
			panic(err)
		}

		now := time.Now().Format("2006-01-02T15-04-05.999999999")

		mapResponsePath := path.Join(
			mPath,
			fmt.Sprintf("%s-%s-%d-%s.json", now, m.uid, atomic.LoadUint64(&m.seq), responseType),
		)

		log.Trace().Msgf("Writing MapResponse to %s", mapResponsePath)
		err = os.WriteFile(mapResponsePath, body, perms)
		if err != nil {
			panic(err)
		}
	}

	var respBody []byte
	if compression == util.ZstdCompression {
		respBody = zstdEncode(jsonBody)
	} else {
		respBody = jsonBody
	}

	data := make([]byte, reservedResponseHeaderSize)
	binary.LittleEndian.PutUint32(data, uint32(len(respBody)))
	data = append(data, respBody...)

	return data, nil
}

func zstdEncode(in []byte) []byte {
	encoder, ok := zstdEncoderPool.Get().(*zstd.Encoder)
	if !ok {
		panic("invalid type in sync pool")
	}
	out := encoder.EncodeAll(in, nil)
	_ = encoder.Close()
	zstdEncoderPool.Put(encoder)

	return out
}

var zstdEncoderPool = &sync.Pool{
	New: func() any {
		encoder, err := smallzstd.NewEncoder(
			nil,
			zstd.WithEncoderLevel(zstd.SpeedFastest))
		if err != nil {
			panic(err)
		}

		return encoder
	},
}

// baseMapResponse returns a tailcfg.MapResponse with
// KeepAlive false and ControlTime set to now.
func (m *Mapper) baseMapResponse() tailcfg.MapResponse {
	now := time.Now()

	resp := tailcfg.MapResponse{
		KeepAlive:   false,
		ControlTime: &now,
		// TODO(kradalby): Implement PingRequest?
	}

	return resp
}

// baseWithConfigMapResponse returns a tailcfg.MapResponse struct
// with the basic configuration from headscale set.
// It is used in for bigger updates, such as full and lite, not
// incremental.
func (m *Mapper) baseWithConfigMapResponse(
	node types.NodeView,
	capVer tailcfg.CapabilityVersion,
) (*tailcfg.MapResponse, error) {
	resp := m.baseMapResponse()

	_, matchers := m.state.Filter()
	tailnode, err := tailNode(
		node, capVer, m.state,
		func(id types.NodeID) []netip.Prefix {
			return policy.ReduceRoutes(node, m.state.GetNodePrimaryRoutes(id), matchers)
		},
		m.cfg)
	if err != nil {
		return nil, err
	}
	resp.Node = tailnode

	resp.DERPMap = m.state.DERPMap()

	resp.Domain = m.cfg.Domain()

	// Do not instruct clients to collect services we do not
	// support or do anything with them
	resp.CollectServices = "false"

	resp.KeepAlive = false

	resp.Debug = &tailcfg.Debug{
		DisableLogTail: !m.cfg.LogTail.Enabled,
	}

	return &resp, nil
}

// ListPeers returns peers of node, regardless of any Policy or if the node is expired.
// If no peer IDs are given, all peers are returned.
// If at least one peer ID is given, only these peer nodes will be returned.
func (m *Mapper) ListPeers(nodeID types.NodeID, peerIDs ...types.NodeID) (types.Nodes, error) {
	peers, err := m.state.ListPeers(nodeID, peerIDs...)
	if err != nil {
		return nil, err
	}

	for _, peer := range peers {
		online := m.notif.IsLikelyConnected(peer.ID)
		peer.IsOnline = &online
	}

	return peers, nil
}

// ListNodes queries the database for either all nodes if no parameters are given
// or for the given nodes if at least one node ID is given as parameter.
func (m *Mapper) ListNodes(nodeIDs ...types.NodeID) (types.Nodes, error) {
	nodes, err := m.state.ListNodes(nodeIDs...)
	if err != nil {
		return nil, err
	}

	for _, node := range nodes {
		online := m.notif.IsLikelyConnected(node.ID)
		node.IsOnline = &online
	}

	return nodes, nil
}

// routeFilterFunc is a function that takes a node ID and returns a list of
// netip.Prefixes that are allowed for that node. It is used to filter routes
// from the primary route manager to the node.
type routeFilterFunc func(id types.NodeID) []netip.Prefix

// appendPeerChanges mutates a tailcfg.MapResponse with all the
// necessary changes when peers have changed.
func appendPeerChanges(
	resp *tailcfg.MapResponse,

	fullChange bool,
	state *state.State,
	node types.NodeView,
	capVer tailcfg.CapabilityVersion,
	changed views.Slice[types.NodeView],
	cfg *types.Config,
) error {
	filter, matchers := state.Filter()

	sshPolicy, err := state.SSHPolicy(node)
	if err != nil {
		return err
	}

	// If there are filter rules present, see if there are any nodes that cannot
	// access each-other at all and remove them from the peers.
	var reducedChanged views.Slice[types.NodeView]
	if len(filter) > 0 {
		reducedChanged = policy.ReduceNodes(node, changed, matchers)
	} else {
		reducedChanged = changed
	}

	profiles := generateUserProfiles(node, reducedChanged)

	dnsConfig := generateDNSConfig(cfg, node)

	tailPeers, err := tailNodes(
		reducedChanged, capVer, state,
		func(id types.NodeID) []netip.Prefix {
			return policy.ReduceRoutes(node, state.GetNodePrimaryRoutes(id), matchers)
		},
		cfg)
	if err != nil {
		return err
	}

	// Peers is always returned sorted by Node.ID.
	sort.SliceStable(tailPeers, func(x, y int) bool {
		return tailPeers[x].ID < tailPeers[y].ID
	})

	if fullChange {
		resp.Peers = tailPeers
	} else {
		resp.PeersChanged = tailPeers
	}
	resp.DNSConfig = dnsConfig
	resp.UserProfiles = profiles
	resp.SSHPolicy = sshPolicy

	// CapVer 81: 2023-11-17: MapResponse.PacketFilters (incremental packet filter updates)
	// Currently, we do not send incremental package filters, however using the
	// new PacketFilters field and "base" allows us to send a full update when we
	// have to send an empty list, avoiding the hack in the else block.
	resp.PacketFilters = map[string][]tailcfg.FilterRule{
		"base": policy.ReduceFilterRules(node, filter),
	}

	return nil
}
