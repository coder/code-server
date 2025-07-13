package routes

import (
	"fmt"
	"net/netip"
	"slices"
	"sort"
	"strings"
	"sync"

	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/juanfont/headscale/hscontrol/util"
	xmaps "golang.org/x/exp/maps"
	"tailscale.com/net/tsaddr"
	"tailscale.com/util/set"
)

type PrimaryRoutes struct {
	mu sync.Mutex

	// routes is a map of prefixes that are adverties and approved and available
	// in the global headscale state.
	routes map[types.NodeID]set.Set[netip.Prefix]

	// primaries is a map of prefixes to the node that is the primary for that prefix.
	primaries map[netip.Prefix]types.NodeID
	isPrimary map[types.NodeID]bool
}

func New() *PrimaryRoutes {
	return &PrimaryRoutes{
		routes:    make(map[types.NodeID]set.Set[netip.Prefix]),
		primaries: make(map[netip.Prefix]types.NodeID),
		isPrimary: make(map[types.NodeID]bool),
	}
}

// updatePrimaryLocked recalculates the primary routes and updates the internal state.
// It returns true if the primary routes have changed.
// It is assumed that the caller holds the lock.
// The algorthm is as follows:
// 1. Reset the primaries map.
// 2. Iterate over the routes and count the number of times a prefix is advertised.
// 3. If a prefix is advertised by at least two nodes, it is a primary route.
// 4. If the primary routes have changed, update the internal state and return true.
// 5. Otherwise, return false.
func (pr *PrimaryRoutes) updatePrimaryLocked() bool {
	// reset the primaries map, as we are going to recalculate it.
	allPrimaries := make(map[netip.Prefix][]types.NodeID)
	pr.isPrimary = make(map[types.NodeID]bool)
	changed := false

	// sort the node ids so we can iterate over them in a deterministic order.
	// this is important so the same node is chosen two times in a row
	// as the primary route.
	ids := types.NodeIDs(xmaps.Keys(pr.routes))
	sort.Sort(ids)

	// Create a map of prefixes to nodes that serve them so we
	// can determine the primary route for each prefix.
	for _, id := range ids {
		routes := pr.routes[id]
		for route := range routes {
			if _, ok := allPrimaries[route]; !ok {
				allPrimaries[route] = []types.NodeID{id}
			} else {
				allPrimaries[route] = append(allPrimaries[route], id)
			}
		}
	}

	// Go through all prefixes and determine the primary route for each.
	// If the number of routes is below the minimum, remove the primary.
	// If the current primary is still available, continue.
	// If the current primary is not available, select a new one.
	for prefix, nodes := range allPrimaries {
		if node, ok := pr.primaries[prefix]; ok {
			// If the current primary is still available, continue.
			if slices.Contains(nodes, node) {
				continue
			}
		}
		if len(nodes) >= 1 {
			pr.primaries[prefix] = nodes[0]
			changed = true
		}
	}

	// Clean up any remaining primaries that are no longer valid.
	for prefix := range pr.primaries {
		if _, ok := allPrimaries[prefix]; !ok {
			delete(pr.primaries, prefix)
			changed = true
		}
	}

	// Populate the quick lookup index for primary routes
	for _, nodeID := range pr.primaries {
		pr.isPrimary[nodeID] = true
	}

	return changed
}

// SetRoutes sets the routes for a given Node ID and recalculates the primary routes
// of the headscale.
// It returns true if there was a change in primary routes.
// All exit routes are ignored as they are not used in primary route context.
func (pr *PrimaryRoutes) SetRoutes(node types.NodeID, prefixes ...netip.Prefix) bool {
	pr.mu.Lock()
	defer pr.mu.Unlock()

	// If no routes are being set, remove the node from the routes map.
	if len(prefixes) == 0 {
		if _, ok := pr.routes[node]; ok {
			delete(pr.routes, node)
			return pr.updatePrimaryLocked()
		}

		return false
	}

	rs := make(set.Set[netip.Prefix], len(prefixes))
	for _, prefix := range prefixes {
		if !tsaddr.IsExitRoute(prefix) {
			rs.Add(prefix)
		}
	}

	if rs.Len() != 0 {
		pr.routes[node] = rs
	} else {
		delete(pr.routes, node)
	}

	return pr.updatePrimaryLocked()
}

func (pr *PrimaryRoutes) PrimaryRoutes(id types.NodeID) []netip.Prefix {
	if pr == nil {
		return nil
	}

	pr.mu.Lock()
	defer pr.mu.Unlock()

	// Short circuit if the node is not a primary for any route.
	if _, ok := pr.isPrimary[id]; !ok {
		return nil
	}

	var routes []netip.Prefix

	for prefix, node := range pr.primaries {
		if node == id {
			routes = append(routes, prefix)
		}
	}

	tsaddr.SortPrefixes(routes)

	return routes
}

func (pr *PrimaryRoutes) String() string {
	pr.mu.Lock()
	defer pr.mu.Unlock()

	return pr.stringLocked()
}

func (pr *PrimaryRoutes) stringLocked() string {
	var sb strings.Builder

	fmt.Fprintln(&sb, "Available routes:")

	ids := types.NodeIDs(xmaps.Keys(pr.routes))
	sort.Sort(ids)
	for _, id := range ids {
		prefixes := pr.routes[id]
		fmt.Fprintf(&sb, "\nNode %d: %s", id, strings.Join(util.PrefixesToString(prefixes.Slice()), ", "))
	}

	fmt.Fprintln(&sb, "\n\nCurrent primary routes:")
	for route, nodeID := range pr.primaries {
		fmt.Fprintf(&sb, "\nRoute %s: %d", route, nodeID)
	}

	return sb.String()
}
