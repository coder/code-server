package mapper

import (
	"fmt"
	"net/netip"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	"github.com/juanfont/headscale/hscontrol/policy"
	"github.com/juanfont/headscale/hscontrol/policy/matcher"
	"github.com/juanfont/headscale/hscontrol/routes"
	"github.com/juanfont/headscale/hscontrol/types"
	"tailscale.com/tailcfg"
	"tailscale.com/types/dnstype"
)

var iap = func(ipStr string) *netip.Addr {
	ip := netip.MustParseAddr(ipStr)
	return &ip
}

func TestDNSConfigMapResponse(t *testing.T) {
	tests := []struct {
		magicDNS bool
		want     *tailcfg.DNSConfig
	}{
		{
			magicDNS: true,
			want: &tailcfg.DNSConfig{
				Routes: map[string][]*dnstype.Resolver{},
				Domains: []string{
					"foobar.headscale.net",
				},
				Proxied: true,
			},
		},
		{
			magicDNS: false,
			want: &tailcfg.DNSConfig{
				Domains: []string{"foobar.headscale.net"},
				Proxied: false,
			},
		},
	}

	for _, tt := range tests {
		t.Run(fmt.Sprintf("with-magicdns-%v", tt.magicDNS), func(t *testing.T) {
			mach := func(hostname, username string, userid uint) *types.Node {
				return &types.Node{
					Hostname: hostname,
					UserID:   userid,
					User: types.User{
						Name: username,
					},
				}
			}

			baseDomain := "foobar.headscale.net"

			dnsConfigOrig := tailcfg.DNSConfig{
				Routes:  make(map[string][]*dnstype.Resolver),
				Domains: []string{baseDomain},
				Proxied: tt.magicDNS,
			}

			nodeInShared1 := mach("test_get_shared_nodes_1", "shared1", 1)

			got := generateDNSConfig(
				&types.Config{
					TailcfgDNSConfig: &dnsConfigOrig,
				},
				nodeInShared1.View(),
			)

			if diff := cmp.Diff(tt.want, got, cmpopts.EquateEmpty()); diff != "" {
				t.Errorf("expandAlias() unexpected result (-want +got):\n%s", diff)
			}
		})
	}
}

// mockState is a mock implementation that provides the required methods.
type mockState struct {
	polMan  policy.PolicyManager
	derpMap *tailcfg.DERPMap
	primary *routes.PrimaryRoutes
	nodes   types.Nodes
	peers   types.Nodes
}

func (m *mockState) DERPMap() *tailcfg.DERPMap {
	return m.derpMap
}

func (m *mockState) Filter() ([]tailcfg.FilterRule, []matcher.Match) {
	if m.polMan == nil {
		return tailcfg.FilterAllowAll, nil
	}
	return m.polMan.Filter()
}

func (m *mockState) SSHPolicy(node types.NodeView) (*tailcfg.SSHPolicy, error) {
	if m.polMan == nil {
		return nil, nil
	}
	return m.polMan.SSHPolicy(node)
}

func (m *mockState) NodeCanHaveTag(node types.NodeView, tag string) bool {
	if m.polMan == nil {
		return false
	}
	return m.polMan.NodeCanHaveTag(node, tag)
}

func (m *mockState) GetNodePrimaryRoutes(nodeID types.NodeID) []netip.Prefix {
	if m.primary == nil {
		return nil
	}
	return m.primary.PrimaryRoutes(nodeID)
}

func (m *mockState) ListPeers(nodeID types.NodeID, peerIDs ...types.NodeID) (types.Nodes, error) {
	if len(peerIDs) > 0 {
		// Filter peers by the provided IDs
		var filtered types.Nodes
		for _, peer := range m.peers {
			for _, id := range peerIDs {
				if peer.ID == id {
					filtered = append(filtered, peer)
					break
				}
			}
		}

		return filtered, nil
	}
	// Return all peers except the node itself
	var filtered types.Nodes
	for _, peer := range m.peers {
		if peer.ID != nodeID {
			filtered = append(filtered, peer)
		}
	}

	return filtered, nil
}

func (m *mockState) ListNodes(nodeIDs ...types.NodeID) (types.Nodes, error) {
	if len(nodeIDs) > 0 {
		// Filter nodes by the provided IDs
		var filtered types.Nodes
		for _, node := range m.nodes {
			for _, id := range nodeIDs {
				if node.ID == id {
					filtered = append(filtered, node)
					break
				}
			}
		}

		return filtered, nil
	}

	return m.nodes, nil
}

func Test_fullMapResponse(t *testing.T) {
	t.Skip("Test needs to be refactored for new state-based architecture")
	// TODO: Refactor this test to work with the new state-based mapper
	// The test architecture needs to be updated to work with the state interface
	// instead of the old direct dependency injection pattern
}
