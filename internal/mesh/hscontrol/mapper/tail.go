package mapper

import (
	"fmt"
	"time"

	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/samber/lo"
	"tailscale.com/net/tsaddr"
	"tailscale.com/tailcfg"
	"tailscale.com/types/views"
)

// NodeCanHaveTagChecker is an interface for checking if a node can have a tag.
type NodeCanHaveTagChecker interface {
	NodeCanHaveTag(node types.NodeView, tag string) bool
}

func tailNodes(
	nodes views.Slice[types.NodeView],
	capVer tailcfg.CapabilityVersion,
	checker NodeCanHaveTagChecker,
	primaryRouteFunc routeFilterFunc,
	cfg *types.Config,
) ([]*tailcfg.Node, error) {
	tNodes := make([]*tailcfg.Node, 0, nodes.Len())

	for _, node := range nodes.All() {
		tNode, err := tailNode(
			node,
			capVer,
			checker,
			primaryRouteFunc,
			cfg,
		)
		if err != nil {
			return nil, err
		}

		tNodes = append(tNodes, tNode)
	}

	return tNodes, nil
}

// tailNode converts a Node into a Tailscale Node.
func tailNode(
	node types.NodeView,
	capVer tailcfg.CapabilityVersion,
	checker NodeCanHaveTagChecker,
	primaryRouteFunc routeFilterFunc,
	cfg *types.Config,
) (*tailcfg.Node, error) {
	addrs := node.Prefixes()

	var derp int

	// TODO(kradalby): legacyDERP was removed in tailscale/tailscale@2fc4455e6dd9ab7f879d4e2f7cffc2be81f14077
	// and should be removed after 111 is the minimum capver.
	var legacyDERP string
	if node.Hostinfo().Valid() && node.Hostinfo().NetInfo().Valid() {
		legacyDERP = fmt.Sprintf("127.3.3.40:%d", node.Hostinfo().NetInfo().PreferredDERP())
		derp = node.Hostinfo().NetInfo().PreferredDERP()
	} else {
		legacyDERP = "127.3.3.40:0" // Zero means disconnected or unknown.
	}

	var keyExpiry time.Time
	if node.Expiry().Valid() {
		keyExpiry = node.Expiry().Get()
	} else {
		keyExpiry = time.Time{}
	}

	hostname, err := node.GetFQDN(cfg.BaseDomain)
	if err != nil {
		return nil, err
	}

	var tags []string
	for _, tag := range node.RequestTagsSlice().All() {
		if checker.NodeCanHaveTag(node, tag) {
			tags = append(tags, tag)
		}
	}
	for _, tag := range node.ForcedTags().All() {
		tags = append(tags, tag)
	}
	tags = lo.Uniq(tags)

	routes := primaryRouteFunc(node.ID())
	allowed := append(addrs, routes...)
	allowed = append(allowed, node.ExitRoutes()...)
	tsaddr.SortPrefixes(allowed)

	tNode := tailcfg.Node{
		ID:       tailcfg.NodeID(node.ID()), // this is the actual ID
		StableID: node.ID().StableID(),
		Name:     hostname,
		Cap:      capVer,

		User: tailcfg.UserID(node.UserID()),

		Key:       node.NodeKey(),
		KeyExpiry: keyExpiry.UTC(),

		Machine:          node.MachineKey(),
		DiscoKey:         node.DiscoKey(),
		Addresses:        addrs,
		PrimaryRoutes:    routes,
		AllowedIPs:       allowed,
		Endpoints:        node.Endpoints().AsSlice(),
		HomeDERP:         derp,
		LegacyDERPString: legacyDERP,
		Hostinfo:         node.Hostinfo(),
		Created:          node.CreatedAt().UTC(),

		Online: node.IsOnline().Clone(),

		Tags: tags,

		MachineAuthorized: !node.IsExpired(),
		Expired:           node.IsExpired(),
	}

	tNode.CapMap = tailcfg.NodeCapMap{
		tailcfg.CapabilityFileSharing: []tailcfg.RawMessage{},
		tailcfg.CapabilityAdmin:       []tailcfg.RawMessage{},
		tailcfg.CapabilitySSH:         []tailcfg.RawMessage{},
	}

	if cfg.RandomizeClientPort {
		tNode.CapMap[tailcfg.NodeAttrRandomizeClientPort] = []tailcfg.RawMessage{}
	}

	if !node.IsOnline().Valid() || !node.IsOnline().Get() {
		// LastSeen is only set when node is
		// not connected to the control server.
		if node.LastSeen().Valid() {
			lastSeen := node.LastSeen().Get()
			tNode.LastSeen = &lastSeen
		}
	}

	return &tNode, nil
}
