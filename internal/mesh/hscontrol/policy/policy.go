package policy

import (
	"net/netip"
	"slices"

	"github.com/juanfont/headscale/hscontrol/policy/matcher"
	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/samber/lo"
	"tailscale.com/net/tsaddr"
	"tailscale.com/tailcfg"
	"tailscale.com/types/views"
)

// ReduceNodes returns the list of peers authorized to be accessed from a given node.
func ReduceNodes(
	node types.NodeView,
	nodes views.Slice[types.NodeView],
	matchers []matcher.Match,
) views.Slice[types.NodeView] {
	var result []types.NodeView

	for _, peer := range nodes.All() {
		if peer.ID() == node.ID() {
			continue
		}

		if node.CanAccess(matchers, peer) || peer.CanAccess(matchers, node) {
			result = append(result, peer)
		}
	}

	return views.SliceOf(result)
}

// ReduceRoutes returns a reduced list of routes for a given node that it can access.
func ReduceRoutes(
	node types.NodeView,
	routes []netip.Prefix,
	matchers []matcher.Match,
) []netip.Prefix {
	var result []netip.Prefix

	for _, route := range routes {
		if node.CanAccessRoute(matchers, route) {
			result = append(result, route)
		}
	}

	return result
}

// BuildPeerMap builds a map of all peers that can be accessed by each node.
func BuildPeerMap(
	nodes views.Slice[types.NodeView],
	matchers []matcher.Match,
) map[types.NodeID][]types.NodeView {
	ret := make(map[types.NodeID][]types.NodeView, nodes.Len())

	// Build the map of all peers according to the matchers.
	// Compared to ReduceNodes, which builds the list per node, we end up with doing
	// the full work for every node (On^2), while this will reduce the list as we see
	// relationships while building the map, making it O(n^2/2) in the end, but with less work per node.
	for i := range nodes.Len() {
		for j := i + 1; j < nodes.Len(); j++ {
			if nodes.At(i).ID() == nodes.At(j).ID() {
				continue
			}

			if nodes.At(i).CanAccess(matchers, nodes.At(j)) || nodes.At(j).CanAccess(matchers, nodes.At(i)) {
				ret[nodes.At(i).ID()] = append(ret[nodes.At(i).ID()], nodes.At(j))
				ret[nodes.At(j).ID()] = append(ret[nodes.At(j).ID()], nodes.At(i))
			}
		}
	}

	return ret
}

// ReduceFilterRules takes a node and a set of rules and removes all rules and destinations
// that are not relevant to that particular node.
func ReduceFilterRules(node types.NodeView, rules []tailcfg.FilterRule) []tailcfg.FilterRule {
	ret := []tailcfg.FilterRule{}

	for _, rule := range rules {
		// record if the rule is actually relevant for the given node.
		var dests []tailcfg.NetPortRange
	DEST_LOOP:
		for _, dest := range rule.DstPorts {
			expanded, err := util.ParseIPSet(dest.IP, nil)
			// Fail closed, if we can't parse it, then we should not allow
			// access.
			if err != nil {
				continue DEST_LOOP
			}

			if node.InIPSet(expanded) {
				dests = append(dests, dest)
				continue DEST_LOOP
			}

			// If the node exposes routes, ensure they are note removed
			// when the filters are reduced.
			if node.Hostinfo().Valid() {
				routableIPs := node.Hostinfo().RoutableIPs()
				if routableIPs.Len() > 0 {
					for _, routableIP := range routableIPs.All() {
						if expanded.OverlapsPrefix(routableIP) {
							dests = append(dests, dest)
							continue DEST_LOOP
						}
					}
				}
			}
		}

		if len(dests) > 0 {
			ret = append(ret, tailcfg.FilterRule{
				SrcIPs:   rule.SrcIPs,
				DstPorts: dests,
				IPProto:  rule.IPProto,
			})
		}
	}

	return ret
}

// AutoApproveRoutes approves any route that can be autoapproved from
// the nodes perspective according to the given policy.
// It reports true if any routes were approved.
// Note: This function now takes a pointer to the actual node to modify ApprovedRoutes.
func AutoApproveRoutes(pm PolicyManager, node *types.Node) bool {
	if pm == nil {
		return false
	}
	nodeView := node.View()
	var newApproved []netip.Prefix
	for _, route := range nodeView.AnnouncedRoutes() {
		if pm.NodeCanApproveRoute(nodeView, route) {
			newApproved = append(newApproved, route)
		}
	}
	if newApproved != nil {
		newApproved = append(newApproved, node.ApprovedRoutes...)
		tsaddr.SortPrefixes(newApproved)
		newApproved = slices.Compact(newApproved)
		newApproved = lo.Filter(newApproved, func(route netip.Prefix, index int) bool {
			return route.IsValid()
		})
		node.ApprovedRoutes = newApproved

		return true
	}

	return false
}
