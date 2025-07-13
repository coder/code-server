package types

import (
	"errors"
	"fmt"
	"net/netip"
	"slices"
	"sort"
	"strconv"
	"strings"
	"time"

	v1 "github.com/juanfont/headscale/gen/go/headscale/v1"
	"github.com/juanfont/headscale/hscontrol/policy/matcher"
	"github.com/juanfont/headscale/hscontrol/util"
	"go4.org/netipx"
	"google.golang.org/protobuf/types/known/timestamppb"
	"tailscale.com/net/tsaddr"
	"tailscale.com/tailcfg"
	"tailscale.com/types/key"
	"tailscale.com/types/views"
)

var (
	ErrNodeAddressesInvalid = errors.New("failed to parse node addresses")
	ErrHostnameTooLong      = errors.New("hostname too long, cannot except 255 ASCII chars")
	ErrNodeHasNoGivenName   = errors.New("node has no given name")
	ErrNodeUserHasNoName    = errors.New("node user has no name")
)

type (
	NodeID  uint64
	NodeIDs []NodeID
)

func (n NodeIDs) Len() int           { return len(n) }
func (n NodeIDs) Less(i, j int) bool { return n[i] < n[j] }
func (n NodeIDs) Swap(i, j int)      { n[i], n[j] = n[j], n[i] }

func (id NodeID) StableID() tailcfg.StableNodeID {
	return tailcfg.StableNodeID(strconv.FormatUint(uint64(id), util.Base10))
}

func (id NodeID) NodeID() tailcfg.NodeID {
	return tailcfg.NodeID(id)
}

func (id NodeID) Uint64() uint64 {
	return uint64(id)
}

func (id NodeID) String() string {
	return strconv.FormatUint(id.Uint64(), util.Base10)
}

// Node is a Headscale client.
type Node struct {
	ID NodeID `gorm:"primary_key"`

	MachineKey key.MachinePublic `gorm:"serializer:text"`
	NodeKey    key.NodePublic    `gorm:"serializer:text"`
	DiscoKey   key.DiscoPublic   `gorm:"serializer:text"`

	Endpoints []netip.AddrPort `gorm:"serializer:json"`

	Hostinfo *tailcfg.Hostinfo `gorm:"column:host_info;serializer:json"`

	IPv4 *netip.Addr `gorm:"column:ipv4;serializer:text"`
	IPv6 *netip.Addr `gorm:"column:ipv6;serializer:text"`

	// Hostname represents the name given by the Tailscale
	// client during registration
	Hostname string

	// Givenname represents either:
	// a DNS normalized version of Hostname
	// a valid name set by the User
	//
	// GivenName is the name used in all DNS related
	// parts of headscale.
	GivenName string `gorm:"type:varchar(63);unique_index"`
	UserID    uint
	User      User `gorm:"constraint:OnDelete:CASCADE;"`

	RegisterMethod string

	// ForcedTags are tags set by CLI/API. It is not considered
	// the source of truth, but is one of the sources from
	// which a tag might originate.
	// ForcedTags are _always_ applied to the node.
	ForcedTags []string `gorm:"column:forced_tags;serializer:json"`

	// When a node has been created with a PreAuthKey, we need to
	// prevent the preauthkey from being deleted before the node.
	// The preauthkey can define "tags" of the node so we need it
	// around.
	AuthKeyID *uint64 `sql:"DEFAULT:NULL"`
	AuthKey   *PreAuthKey

	Expiry *time.Time

	// LastSeen is when the node was last in contact with
	// headscale. It is best effort and not persisted.
	LastSeen *time.Time `gorm:"column:last_seen"`

	// ApprovedRoutes is a list of routes that the node is allowed to announce
	// as a subnet router. They are not necessarily the routes that the node
	// announces at the moment.
	// See [Node.Hostinfo]
	ApprovedRoutes []netip.Prefix `gorm:"column:approved_routes;serializer:json"`

	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time

	IsOnline *bool `gorm:"-"`
}

type Nodes []*Node

func (ns Nodes) ViewSlice() views.Slice[NodeView] {
	vs := make([]NodeView, len(ns))
	for i, n := range ns {
		vs[i] = n.View()
	}

	return views.SliceOf(vs)
}

// GivenNameHasBeenChanged returns whether the `givenName` can be automatically changed based on the `Hostname` of the node.
func (node *Node) GivenNameHasBeenChanged() bool {
	return node.GivenName == util.ConvertWithFQDNRules(node.Hostname)
}

// IsExpired returns whether the node registration has expired.
func (node Node) IsExpired() bool {
	// If Expiry is not set, the client has not indicated that
	// it wants an expiry time, it is therefore considered
	// to mean "not expired"
	if node.Expiry == nil || node.Expiry.IsZero() {
		return false
	}

	return time.Since(*node.Expiry) > 0
}

// IsEphemeral returns if the node is registered as an Ephemeral node.
// https://tailscale.com/kb/1111/ephemeral-nodes/
func (node *Node) IsEphemeral() bool {
	return node.AuthKey != nil && node.AuthKey.Ephemeral
}

func (node *Node) IPs() []netip.Addr {
	var ret []netip.Addr

	if node.IPv4 != nil {
		ret = append(ret, *node.IPv4)
	}

	if node.IPv6 != nil {
		ret = append(ret, *node.IPv6)
	}

	return ret
}

// HasIP reports if a node has a given IP address.
func (node *Node) HasIP(i netip.Addr) bool {
	for _, ip := range node.IPs() {
		if ip.Compare(i) == 0 {
			return true
		}
	}

	return false
}

// IsTagged reports if a device is tagged
// and therefore should not be treated as a
// user owned device.
// Currently, this function only handles tags set
// via CLI ("forced tags" and preauthkeys).
func (node *Node) IsTagged() bool {
	if len(node.ForcedTags) > 0 {
		return true
	}

	if node.AuthKey != nil && len(node.AuthKey.Tags) > 0 {
		return true
	}

	if node.Hostinfo == nil {
		return false
	}

	// TODO(kradalby): Figure out how tagging should work
	// and hostinfo.requestedtags.
	// Do this in other work.

	return false
}

// HasTag reports if a node has a given tag.
// Currently, this function only handles tags set
// via CLI ("forced tags" and preauthkeys).
func (node *Node) HasTag(tag string) bool {
	return slices.Contains(node.Tags(), tag)
}

func (node *Node) Tags() []string {
	var tags []string

	if node.AuthKey != nil {
		tags = append(tags, node.AuthKey.Tags...)
	}

	// TODO(kradalby): Figure out how tagging should work
	// and hostinfo.requestedtags.
	// Do this in other work.
	// #2417

	tags = append(tags, node.ForcedTags...)
	sort.Strings(tags)
	tags = slices.Compact(tags)

	return tags
}

func (node *Node) RequestTags() []string {
	if node.Hostinfo == nil {
		return []string{}
	}

	return node.Hostinfo.RequestTags
}

func (node *Node) Prefixes() []netip.Prefix {
	var addrs []netip.Prefix
	for _, nodeAddress := range node.IPs() {
		ip := netip.PrefixFrom(nodeAddress, nodeAddress.BitLen())
		addrs = append(addrs, ip)
	}

	return addrs
}

// ExitRoutes returns a list of both exit routes if the
// node has any exit routes enabled.
// If none are enabled, it will return nil.
func (node *Node) ExitRoutes() []netip.Prefix {
	if slices.ContainsFunc(node.SubnetRoutes(), tsaddr.IsExitRoute) {
		return tsaddr.ExitRoutes()
	}

	return nil
}

func (node *Node) IPsAsString() []string {
	var ret []string

	for _, ip := range node.IPs() {
		ret = append(ret, ip.String())
	}

	return ret
}

func (node *Node) InIPSet(set *netipx.IPSet) bool {
	return slices.ContainsFunc(node.IPs(), set.Contains)
}

// AppendToIPSet adds the individual ips in NodeAddresses to a
// given netipx.IPSetBuilder.
func (node *Node) AppendToIPSet(build *netipx.IPSetBuilder) {
	for _, ip := range node.IPs() {
		build.Add(ip)
	}
}

func (node *Node) CanAccess(matchers []matcher.Match, node2 *Node) bool {
	src := node.IPs()
	allowedIPs := node2.IPs()

	for _, matcher := range matchers {
		if !matcher.SrcsContainsIPs(src...) {
			continue
		}

		if matcher.DestsContainsIP(allowedIPs...) {
			return true
		}

		if matcher.DestsOverlapsPrefixes(node2.SubnetRoutes()...) {
			return true
		}
	}

	return false
}

func (node *Node) CanAccessRoute(matchers []matcher.Match, route netip.Prefix) bool {
	src := node.IPs()

	for _, matcher := range matchers {
		if !matcher.SrcsContainsIPs(src...) {
			continue
		}

		if matcher.DestsOverlapsPrefixes(route) {
			return true
		}
	}

	return false
}

func (nodes Nodes) FilterByIP(ip netip.Addr) Nodes {
	var found Nodes

	for _, node := range nodes {
		if node.IPv4 != nil && ip == *node.IPv4 {
			found = append(found, node)
			continue
		}

		if node.IPv6 != nil && ip == *node.IPv6 {
			found = append(found, node)
		}
	}

	return found
}

func (nodes Nodes) ContainsNodeKey(nodeKey key.NodePublic) bool {
	for _, node := range nodes {
		if node.NodeKey == nodeKey {
			return true
		}
	}

	return false
}

func (node *Node) Proto() *v1.Node {
	nodeProto := &v1.Node{
		Id:         uint64(node.ID),
		MachineKey: node.MachineKey.String(),

		NodeKey:  node.NodeKey.String(),
		DiscoKey: node.DiscoKey.String(),

		// TODO(kradalby): replace list with v4, v6 field?
		IpAddresses: node.IPsAsString(),
		Name:        node.Hostname,
		GivenName:   node.GivenName,
		User:        node.User.Proto(),
		ForcedTags:  node.ForcedTags,

		// Only ApprovedRoutes and AvailableRoutes is set here. SubnetRoutes has
		// to be populated manually with PrimaryRoute, to ensure it includes the
		// routes that are actively served from the node.
		ApprovedRoutes:  util.PrefixesToString(node.ApprovedRoutes),
		AvailableRoutes: util.PrefixesToString(node.AnnouncedRoutes()),

		RegisterMethod: node.RegisterMethodToV1Enum(),

		CreatedAt: timestamppb.New(node.CreatedAt),
	}

	if node.AuthKey != nil {
		nodeProto.PreAuthKey = node.AuthKey.Proto()
	}

	if node.LastSeen != nil {
		nodeProto.LastSeen = timestamppb.New(*node.LastSeen)
	}

	if node.Expiry != nil {
		nodeProto.Expiry = timestamppb.New(*node.Expiry)
	}

	return nodeProto
}

func (node *Node) GetFQDN(baseDomain string) (string, error) {
	if node.GivenName == "" {
		return "", fmt.Errorf("failed to create valid FQDN: %w", ErrNodeHasNoGivenName)
	}

	hostname := node.GivenName

	if baseDomain != "" {
		hostname = fmt.Sprintf(
			"%s.%s.",
			node.GivenName,
			baseDomain,
		)
	}

	if len(hostname) > MaxHostnameLength {
		return "", fmt.Errorf(
			"failed to create valid FQDN (%s): %w",
			hostname,
			ErrHostnameTooLong,
		)
	}

	return hostname, nil
}

// AnnouncedRoutes returns the list of routes that the node announces.
// It should be used instead of checking Hostinfo.RoutableIPs directly.
func (node *Node) AnnouncedRoutes() []netip.Prefix {
	if node.Hostinfo == nil {
		return nil
	}

	return node.Hostinfo.RoutableIPs
}

// SubnetRoutes returns the list of routes that the node announces and are approved.
func (node *Node) SubnetRoutes() []netip.Prefix {
	var routes []netip.Prefix

	for _, route := range node.AnnouncedRoutes() {
		if slices.Contains(node.ApprovedRoutes, route) {
			routes = append(routes, route)
		}
	}

	return routes
}

func (node *Node) String() string {
	return node.Hostname
}

// PeerChangeFromMapRequest takes a MapRequest and compares it to the node
// to produce a PeerChange struct that can be used to updated the node and
// inform peers about smaller changes to the node.
// When a field is added to this function, remember to also add it to:
// - node.ApplyPeerChange
// - logTracePeerChange in poll.go.
func (node *Node) PeerChangeFromMapRequest(req tailcfg.MapRequest) tailcfg.PeerChange {
	ret := tailcfg.PeerChange{
		NodeID: tailcfg.NodeID(node.ID),
	}

	if node.NodeKey.String() != req.NodeKey.String() {
		ret.Key = &req.NodeKey
	}

	if node.DiscoKey.String() != req.DiscoKey.String() {
		ret.DiscoKey = &req.DiscoKey
	}

	if node.Hostinfo != nil &&
		node.Hostinfo.NetInfo != nil &&
		req.Hostinfo != nil &&
		req.Hostinfo.NetInfo != nil &&
		node.Hostinfo.NetInfo.PreferredDERP != req.Hostinfo.NetInfo.PreferredDERP {
		ret.DERPRegion = req.Hostinfo.NetInfo.PreferredDERP
	}

	if req.Hostinfo != nil && req.Hostinfo.NetInfo != nil {
		// If there is no stored Hostinfo or NetInfo, use
		// the new PreferredDERP.
		if node.Hostinfo == nil {
			ret.DERPRegion = req.Hostinfo.NetInfo.PreferredDERP
		} else if node.Hostinfo.NetInfo == nil {
			ret.DERPRegion = req.Hostinfo.NetInfo.PreferredDERP
		} else {
			// If there is a PreferredDERP check if it has changed.
			if node.Hostinfo.NetInfo.PreferredDERP != req.Hostinfo.NetInfo.PreferredDERP {
				ret.DERPRegion = req.Hostinfo.NetInfo.PreferredDERP
			}
		}
	}

	// TODO(kradalby): Find a good way to compare updates
	ret.Endpoints = req.Endpoints

	now := time.Now()
	ret.LastSeen = &now

	return ret
}

func (node *Node) RegisterMethodToV1Enum() v1.RegisterMethod {
	switch node.RegisterMethod {
	case "authkey":
		return v1.RegisterMethod_REGISTER_METHOD_AUTH_KEY
	case "oidc":
		return v1.RegisterMethod_REGISTER_METHOD_OIDC
	case "cli":
		return v1.RegisterMethod_REGISTER_METHOD_CLI
	default:
		return v1.RegisterMethod_REGISTER_METHOD_UNSPECIFIED
	}
}

// ApplyHostnameFromHostInfo takes a Hostinfo struct and updates the node.
func (node *Node) ApplyHostnameFromHostInfo(hostInfo *tailcfg.Hostinfo) {
	if hostInfo == nil {
		return
	}

	if node.Hostname != hostInfo.Hostname {
		if node.GivenNameHasBeenChanged() {
			node.GivenName = util.ConvertWithFQDNRules(hostInfo.Hostname)
		}

		node.Hostname = hostInfo.Hostname
	}
}

// ApplyPeerChange takes a PeerChange struct and updates the node.
func (node *Node) ApplyPeerChange(change *tailcfg.PeerChange) {
	if change.Key != nil {
		node.NodeKey = *change.Key
	}

	if change.DiscoKey != nil {
		node.DiscoKey = *change.DiscoKey
	}

	if change.Online != nil {
		node.IsOnline = change.Online
	}

	if change.Endpoints != nil {
		node.Endpoints = change.Endpoints
	}

	// This might technically not be useful as we replace
	// the whole hostinfo blob when it has changed.
	if change.DERPRegion != 0 {
		if node.Hostinfo == nil {
			node.Hostinfo = &tailcfg.Hostinfo{
				NetInfo: &tailcfg.NetInfo{
					PreferredDERP: change.DERPRegion,
				},
			}
		} else if node.Hostinfo.NetInfo == nil {
			node.Hostinfo.NetInfo = &tailcfg.NetInfo{
				PreferredDERP: change.DERPRegion,
			}
		} else {
			node.Hostinfo.NetInfo.PreferredDERP = change.DERPRegion
		}
	}

	node.LastSeen = change.LastSeen
}

func (nodes Nodes) String() string {
	temp := make([]string, len(nodes))

	for index, node := range nodes {
		temp[index] = node.Hostname
	}

	return fmt.Sprintf("[ %s ](%d)", strings.Join(temp, ", "), len(temp))
}

func (nodes Nodes) IDMap() map[NodeID]*Node {
	ret := map[NodeID]*Node{}

	for _, node := range nodes {
		ret[node.ID] = node
	}

	return ret
}

func (nodes Nodes) DebugString() string {
	var sb strings.Builder
	sb.WriteString("Nodes:\n")
	for _, node := range nodes {
		sb.WriteString(node.DebugString())
		sb.WriteString("\n")
	}

	return sb.String()
}

func (node Node) DebugString() string {
	var sb strings.Builder
	fmt.Fprintf(&sb, "%s(%s):\n", node.Hostname, node.ID)
	fmt.Fprintf(&sb, "\tUser: %s (%d, %q)\n", node.User.Display(), node.User.ID, node.User.Username())
	fmt.Fprintf(&sb, "\tTags: %v\n", node.Tags())
	fmt.Fprintf(&sb, "\tIPs: %v\n", node.IPs())
	fmt.Fprintf(&sb, "\tApprovedRoutes: %v\n", node.ApprovedRoutes)
	fmt.Fprintf(&sb, "\tAnnouncedRoutes: %v\n", node.AnnouncedRoutes())
	fmt.Fprintf(&sb, "\tSubnetRoutes: %v\n", node.SubnetRoutes())
	sb.WriteString("\n")

	return sb.String()
}

func (v NodeView) IPs() []netip.Addr {
	if !v.Valid() {
		return nil
	}
	return v.ж.IPs()
}

func (v NodeView) InIPSet(set *netipx.IPSet) bool {
	if !v.Valid() {
		return false
	}
	return v.ж.InIPSet(set)
}

func (v NodeView) CanAccess(matchers []matcher.Match, node2 NodeView) bool {
	if !v.Valid() || !node2.Valid() {
		return false
	}
	src := v.IPs()
	allowedIPs := node2.IPs()

	for _, matcher := range matchers {
		if !matcher.SrcsContainsIPs(src...) {
			continue
		}

		if matcher.DestsContainsIP(allowedIPs...) {
			return true
		}

		if matcher.DestsOverlapsPrefixes(node2.SubnetRoutes()...) {
			return true
		}
	}

	return false
}

func (v NodeView) CanAccessRoute(matchers []matcher.Match, route netip.Prefix) bool {
	if !v.Valid() {
		return false
	}
	src := v.IPs()

	for _, matcher := range matchers {
		if !matcher.SrcsContainsIPs(src...) {
			continue
		}

		if matcher.DestsOverlapsPrefixes(route) {
			return true
		}
	}

	return false
}

func (v NodeView) AnnouncedRoutes() []netip.Prefix {
	if !v.Valid() {
		return nil
	}
	return v.ж.AnnouncedRoutes()
}

func (v NodeView) SubnetRoutes() []netip.Prefix {
	if !v.Valid() {
		return nil
	}
	return v.ж.SubnetRoutes()
}

func (v NodeView) AppendToIPSet(build *netipx.IPSetBuilder) {
	if !v.Valid() {
		return
	}
	v.ж.AppendToIPSet(build)
}

func (v NodeView) RequestTagsSlice() views.Slice[string] {
	if !v.Valid() || !v.Hostinfo().Valid() {
		return views.Slice[string]{}
	}
	return v.Hostinfo().RequestTags()
}

func (v NodeView) Tags() []string {
	if !v.Valid() {
		return nil
	}
	return v.ж.Tags()
}

// IsTagged reports if a device is tagged
// and therefore should not be treated as a
// user owned device.
// Currently, this function only handles tags set
// via CLI ("forced tags" and preauthkeys).
func (v NodeView) IsTagged() bool {
	if !v.Valid() {
		return false
	}
	return v.ж.IsTagged()
}

// IsExpired returns whether the node registration has expired.
func (v NodeView) IsExpired() bool {
	if !v.Valid() {
		return true
	}
	return v.ж.IsExpired()
}

// IsEphemeral returns if the node is registered as an Ephemeral node.
// https://tailscale.com/kb/1111/ephemeral-nodes/
func (v NodeView) IsEphemeral() bool {
	if !v.Valid() {
		return false
	}
	return v.ж.IsEphemeral()
}

// PeerChangeFromMapRequest takes a MapRequest and compares it to the node
// to produce a PeerChange struct that can be used to updated the node and
// inform peers about smaller changes to the node.
func (v NodeView) PeerChangeFromMapRequest(req tailcfg.MapRequest) tailcfg.PeerChange {
	if !v.Valid() {
		return tailcfg.PeerChange{}
	}
	return v.ж.PeerChangeFromMapRequest(req)
}

// GetFQDN returns the fully qualified domain name for the node.
func (v NodeView) GetFQDN(baseDomain string) (string, error) {
	if !v.Valid() {
		return "", errors.New("failed to create valid FQDN: node view is invalid")
	}
	return v.ж.GetFQDN(baseDomain)
}

// ExitRoutes returns a list of both exit routes if the
// node has any exit routes enabled.
// If none are enabled, it will return nil.
func (v NodeView) ExitRoutes() []netip.Prefix {
	if !v.Valid() {
		return nil
	}
	return v.ж.ExitRoutes()
}

// HasIP reports if a node has a given IP address.
func (v NodeView) HasIP(i netip.Addr) bool {
	if !v.Valid() {
		return false
	}
	return v.ж.HasIP(i)
}

// HasTag reports if a node has a given tag.
func (v NodeView) HasTag(tag string) bool {
	if !v.Valid() {
		return false
	}
	return v.ж.HasTag(tag)
}

// Prefixes returns the node IPs as netip.Prefix.
func (v NodeView) Prefixes() []netip.Prefix {
	if !v.Valid() {
		return nil
	}
	return v.ж.Prefixes()
}

// IPsAsString returns the node IPs as strings.
func (v NodeView) IPsAsString() []string {
	if !v.Valid() {
		return nil
	}
	return v.ж.IPsAsString()
}
