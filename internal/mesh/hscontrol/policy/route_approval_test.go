package policy

import (
	"fmt"
	"net/netip"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestNodeCanApproveRoute(t *testing.T) {
	users := []types.User{
		{Name: "user1", Model: gorm.Model{ID: 1}},
		{Name: "user2", Model: gorm.Model{ID: 2}},
		{Name: "user3", Model: gorm.Model{ID: 3}},
	}

	// Create standard node setups used across tests
	normalNode := types.Node{
		ID:       1,
		Hostname: "user1-device",
		IPv4:     ap("100.64.0.1"),
		UserID:   1,
		User:     users[0],
	}

	exitNode := types.Node{
		ID:       2,
		Hostname: "user2-device",
		IPv4:     ap("100.64.0.2"),
		UserID:   2,
		User:     users[1],
	}

	taggedNode := types.Node{
		ID:         3,
		Hostname:   "tagged-server",
		IPv4:       ap("100.64.0.3"),
		UserID:     3,
		User:       users[2],
		ForcedTags: []string{"tag:router"},
	}

	multiTagNode := types.Node{
		ID:         4,
		Hostname:   "multi-tag-node",
		IPv4:       ap("100.64.0.4"),
		UserID:     2,
		User:       users[1],
		ForcedTags: []string{"tag:router", "tag:server"},
	}

	tests := []struct {
		name       string
		node       types.Node
		route      netip.Prefix
		policy     string
		canApprove bool
	}{
		{
			name:  "allow-all-routes-for-admin-user",
			node:  normalNode,
			route: p("192.168.1.0/24"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"192.168.0.0/16": ["group:admin"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "deny-route-that-doesnt-match-autoApprovers",
			node:  normalNode,
			route: p("10.0.0.0/24"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"192.168.0.0/16": ["group:admin"]
					}
				}
			}`,
			canApprove: false,
		},
		{
			name:  "user-not-in-group",
			node:  exitNode,
			route: p("192.168.1.0/24"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"192.168.0.0/16": ["group:admin"]
					}
				}
			}`,
			canApprove: false,
		},
		{
			name:  "tagged-node-can-approve",
			node:  taggedNode,
			route: p("10.0.0.0/8"),
			policy: `{
				"tagOwners": {
					"tag:router": ["user3@"]
				},
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"10.0.0.0/8": ["tag:router"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "multiple-routes-in-policy",
			node:  normalNode,
			route: p("172.16.10.0/24"),
			policy: `{
				"tagOwners": {
					"tag:router": ["user3@"]
				},
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"192.168.0.0/16": ["group:admin"],
						"172.16.0.0/12": ["group:admin"],
						"10.0.0.0/8": ["tag:router"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "match-specific-route-within-range",
			node:  normalNode,
			route: p("192.168.5.0/24"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"192.168.0.0/16": ["group:admin"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "ip-address-within-range",
			node:  normalNode,
			route: p("192.168.1.5/32"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"192.168.1.0/24": ["group:admin"],
						"192.168.1.128/25": ["group:admin"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "all-IPv4-routes-(0.0.0.0/0)-approval",
			node:  normalNode,
			route: p("0.0.0.0/0"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"0.0.0.0/0": ["group:admin"]
					}
				}
			}`,
			canApprove: false,
		},
		{
			name:  "all-IPv4-routes-exitnode-approval",
			node:  normalNode,
			route: p("0.0.0.0/0"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"exitNode": ["group:admin"]
				}
			}`,
			canApprove: true,
		},
		{
			name:  "all-IPv6-routes-exitnode-approval",
			node:  normalNode,
			route: p("::/0"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"exitNode": ["group:admin"]
				}
			}`,
			canApprove: true,
		},
		{
			name:  "specific-IPv4-route-with-exitnode-only-approval",
			node:  normalNode,
			route: p("192.168.1.0/24"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"exitNode": ["group:admin"]
				}
			}`,
			canApprove: false,
		},
		{
			name:  "specific-IPv6-route-with-exitnode-only-approval",
			node:  normalNode,
			route: p("fd00::/8"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"exitNode": ["group:admin"]
				}
			}`,
			canApprove: false,
		},
		{
			name:  "specific-IPv4-route-with-all-routes-policy",
			node:  normalNode,
			route: p("10.0.0.0/8"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"0.0.0.0/0": ["group:admin"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "all-IPv6-routes-(::0/0)-approval",
			node:  normalNode,
			route: p("::/0"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"::/0": ["group:admin"]
					}
				}
			}`,
			canApprove: false,
		},
		{
			name:  "specific-IPv6-route-with-all-routes-policy",
			node:  normalNode,
			route: p("fd00::/8"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"::/0": ["group:admin"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "IPv6-route-with-IPv4-all-routes-policy",
			node:  normalNode,
			route: p("fd00::/8"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"0.0.0.0/0": ["group:admin"]
					}
				}
			}`,
			canApprove: false,
		},
		{
			name:  "IPv4-route-with-IPv6-all-routes-policy",
			node:  normalNode,
			route: p("10.0.0.0/8"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"::/0": ["group:admin"]
					}
				}
			}`,
			canApprove: false,
		},
		{
			name:  "both-IPv4-and-IPv6-all-routes-policy",
			node:  normalNode,
			route: p("192.168.1.0/24"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"0.0.0.0/0": ["group:admin"],
						"::/0": ["group:admin"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "ip-address-with-all-routes-policy",
			node:  normalNode,
			route: p("192.168.101.5/32"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"0.0.0.0/0": ["group:admin"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "specific-IPv6-host-route-with-all-routes-policy",
			node:  normalNode,
			route: p("2001:db8::1/128"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"::/0": ["group:admin"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "multiple-groups-allowed-to-approve-same-route",
			node:  normalNode,
			route: p("192.168.1.0/24"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"],
					"group:netadmin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"192.168.1.0/24": ["group:admin", "group:netadmin"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "overlapping-routes-with-different-groups",
			node:  normalNode,
			route: p("192.168.1.0/24"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"],
					"group:restricted": ["user2@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"192.168.0.0/16": ["group:restricted"],
						"192.168.1.0/24": ["group:admin"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "unique-local-IPv6-address-with-all-routes-policy",
			node:  normalNode,
			route: p("fc00::/7"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"::/0": ["group:admin"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "exact-prefix-match-in-policy",
			node:  normalNode,
			route: p("203.0.113.0/24"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"203.0.113.0/24": ["group:admin"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "narrower-range-than-policy",
			node:  normalNode,
			route: p("203.0.113.0/26"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"203.0.113.0/24": ["group:admin"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "wider-range-than-policy-should-fail",
			node:  normalNode,
			route: p("203.0.113.0/23"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"203.0.113.0/24": ["group:admin"]
					}
				}
			}`,
			canApprove: false,
		},
		{
			name:  "adjacent-route-to-policy-route-should-fail",
			node:  normalNode,
			route: p("203.0.114.0/24"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"203.0.113.0/24": ["group:admin"]
					}
				}
			}`,
			canApprove: false,
		},
		{
			name:  "combined-routes-and-exitnode-approvers-specific-route",
			node:  normalNode,
			route: p("192.168.1.0/24"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"exitNode": ["group:admin"],
					"routes": {
						"192.168.1.0/24": ["group:admin"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "partly-overlapping-route-with-policy-should-fail",
			node:  normalNode,
			route: p("203.0.113.128/23"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"203.0.113.0/24": ["group:admin"]
					}
				}
			}`,
			canApprove: false,
		},
		{
			name:  "multiple-routes-with-aggregatable-ranges",
			node:  normalNode,
			route: p("10.0.0.0/8"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"10.0.0.0/9": ["group:admin"],
						"10.128.0.0/9": ["group:admin"]
					}
				}
			}`,
			canApprove: false,
		},
		{
			name:  "non-standard-IPv6-notation",
			node:  normalNode,
			route: p("2001:db8::1/128"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"2001:db8::/32": ["group:admin"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "node-with-multiple-tags-all-required",
			node:  multiTagNode,
			route: p("10.10.0.0/16"),
			policy: `{
				"tagOwners": {
					"tag:router": ["user2@"],
					"tag:server": ["user2@"]
				},
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"10.10.0.0/16": ["tag:router", "tag:server"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "node-with-multiple-tags-one-matching-is-sufficient",
			node:  multiTagNode,
			route: p("10.10.0.0/16"),
			policy: `{
				"tagOwners": {
					"tag:router": ["user2@"],
					"tag:server": ["user2@"]
				},
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"10.10.0.0/16": ["tag:router", "group:admin"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "node-with-multiple-tags-missing-required-tag",
			node:  multiTagNode,
			route: p("10.10.0.0/16"),
			policy: `{
				"tagOwners": {
				    "tag:othertag": ["user1@"]
				},
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"10.10.0.0/16": ["tag:othertag"]
					}
				}
			}`,
			canApprove: false,
		},
		{
			name:  "node-with-tag-and-group-membership",
			node:  normalNode,
			route: p("10.20.0.0/16"),
			policy: `{
				"tagOwners": {
					"tag:router": ["user3@"]
				},
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"routes": {
						"10.20.0.0/16": ["group:admin", "tag:router"]
					}
				}
			}`,
			canApprove: true,
		},
		{
			name:  "small-subnet-with-exitnode-only-approval",
			node:  normalNode,
			route: p("192.168.1.1/32"),
			policy: `{
				"groups": {
					"group:admin": ["user1@"]
				},
				"acls": [
					{"action": "accept", "src": ["group:admin"], "dst": ["*:*"]}
				],
				"autoApprovers": {
					"exitNode": ["group:admin"]
				}
			}`,
			canApprove: false,
		},
		{
			name:       "empty-policy",
			node:       normalNode,
			route:      p("192.168.1.0/24"),
			policy:     `{"acls":[{"action":"accept","src":["*"],"dst":["*:*"]}]}`,
			canApprove: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Initialize all policy manager implementations
			policyManagers, err := PolicyManagersForTest([]byte(tt.policy), users, types.Nodes{&tt.node}.ViewSlice())
			if tt.name == "empty policy" {
				// We expect this one to have a valid but empty policy
				require.NoError(t, err)
				if err != nil {
					return
				}
			} else {
				require.NoError(t, err)
			}

			for i, pm := range policyManagers {
				t.Run(fmt.Sprintf("policy-index%d", i), func(t *testing.T) {
					result := pm.NodeCanApproveRoute(tt.node.View(), tt.route)

					if diff := cmp.Diff(tt.canApprove, result); diff != "" {
						t.Errorf("NodeCanApproveRoute() mismatch (-want +got):\n%s", diff)
					}
					assert.Equal(t, tt.canApprove, result, "Unexpected route approval result")
				})
			}
		})
	}
}
