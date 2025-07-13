package mapper

import (
	"encoding/json"
	"net/netip"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	"github.com/juanfont/headscale/hscontrol/policy"
	"github.com/juanfont/headscale/hscontrol/routes"
	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/stretchr/testify/require"
	"tailscale.com/net/tsaddr"
	"tailscale.com/tailcfg"
	"tailscale.com/types/key"
)

func TestTailNode(t *testing.T) {
	mustNK := func(str string) key.NodePublic {
		var k key.NodePublic
		_ = k.UnmarshalText([]byte(str))

		return k
	}

	mustDK := func(str string) key.DiscoPublic {
		var k key.DiscoPublic
		_ = k.UnmarshalText([]byte(str))

		return k
	}

	mustMK := func(str string) key.MachinePublic {
		var k key.MachinePublic
		_ = k.UnmarshalText([]byte(str))

		return k
	}

	hiview := func(hoin tailcfg.Hostinfo) tailcfg.HostinfoView {
		return hoin.View()
	}

	created := time.Date(2009, time.November, 10, 23, 0, 0, 0, time.UTC)
	lastSeen := time.Date(2009, time.November, 10, 23, 9, 0, 0, time.UTC)
	expire := time.Date(2500, time.November, 11, 23, 0, 0, 0, time.UTC)

	tests := []struct {
		name       string
		node       *types.Node
		pol        []byte
		dnsConfig  *tailcfg.DNSConfig
		baseDomain string
		want       *tailcfg.Node
		wantErr    bool
	}{
		{
			name: "empty-node",
			node: &types.Node{
				GivenName: "empty",
				Hostinfo:  &tailcfg.Hostinfo{},
			},
			dnsConfig:  &tailcfg.DNSConfig{},
			baseDomain: "",
			want: &tailcfg.Node{
				Name:              "empty",
				StableID:          "0",
				HomeDERP:          0,
				LegacyDERPString:  "127.3.3.40:0",
				Hostinfo:          hiview(tailcfg.Hostinfo{}),
				Tags:              []string{},
				MachineAuthorized: true,

				CapMap: tailcfg.NodeCapMap{
					tailcfg.CapabilityFileSharing: []tailcfg.RawMessage{},
					tailcfg.CapabilityAdmin:       []tailcfg.RawMessage{},
					tailcfg.CapabilitySSH:         []tailcfg.RawMessage{},
				},
			},
			wantErr: false,
		},
		{
			name: "minimal-node",
			node: &types.Node{
				ID: 0,
				MachineKey: mustMK(
					"mkey:f08305b4ee4250b95a70f3b7504d048d75d899993c624a26d422c67af0422507",
				),
				NodeKey: mustNK(
					"nodekey:9b2ffa7e08cc421a3d2cca9012280f6a236fd0de0b4ce005b30a98ad930306fe",
				),
				DiscoKey: mustDK(
					"discokey:cf7b0fd05da556fdc3bab365787b506fd82d64a70745db70e00e86c1b1c03084",
				),
				IPv4:      iap("100.64.0.1"),
				Hostname:  "mini",
				GivenName: "mini",
				UserID:    0,
				User: types.User{
					Name: "mini",
				},
				ForcedTags: []string{},
				AuthKey:    &types.PreAuthKey{},
				LastSeen:   &lastSeen,
				Expiry:     &expire,
				Hostinfo: &tailcfg.Hostinfo{
					RoutableIPs: []netip.Prefix{
						tsaddr.AllIPv4(),
						netip.MustParsePrefix("192.168.0.0/24"),
						netip.MustParsePrefix("172.0.0.0/10"),
					},
				},
				ApprovedRoutes: []netip.Prefix{tsaddr.AllIPv4(), netip.MustParsePrefix("192.168.0.0/24")},
				CreatedAt:      created,
			},
			dnsConfig:  &tailcfg.DNSConfig{},
			baseDomain: "",
			want: &tailcfg.Node{
				ID:       0,
				StableID: "0",
				Name:     "mini",

				User: 0,

				Key: mustNK(
					"nodekey:9b2ffa7e08cc421a3d2cca9012280f6a236fd0de0b4ce005b30a98ad930306fe",
				),
				KeyExpiry: expire,

				Machine: mustMK(
					"mkey:f08305b4ee4250b95a70f3b7504d048d75d899993c624a26d422c67af0422507",
				),
				DiscoKey: mustDK(
					"discokey:cf7b0fd05da556fdc3bab365787b506fd82d64a70745db70e00e86c1b1c03084",
				),
				Addresses: []netip.Prefix{netip.MustParsePrefix("100.64.0.1/32")},
				AllowedIPs: []netip.Prefix{
					tsaddr.AllIPv4(),
					netip.MustParsePrefix("192.168.0.0/24"),
					netip.MustParsePrefix("100.64.0.1/32"),
					tsaddr.AllIPv6(),
				},
				PrimaryRoutes: []netip.Prefix{
					netip.MustParsePrefix("192.168.0.0/24"),
				},
				HomeDERP:         0,
				LegacyDERPString: "127.3.3.40:0",
				Hostinfo: hiview(tailcfg.Hostinfo{
					RoutableIPs: []netip.Prefix{
						tsaddr.AllIPv4(),
						netip.MustParsePrefix("192.168.0.0/24"),
						netip.MustParsePrefix("172.0.0.0/10"),
					},
				}),
				Created: created,

				Tags: []string{},

				LastSeen:          &lastSeen,
				MachineAuthorized: true,

				CapMap: tailcfg.NodeCapMap{
					tailcfg.CapabilityFileSharing: []tailcfg.RawMessage{},
					tailcfg.CapabilityAdmin:       []tailcfg.RawMessage{},
					tailcfg.CapabilitySSH:         []tailcfg.RawMessage{},
				},
			},
			wantErr: false,
		},
		{
			name: "check-dot-suffix-on-node-name",
			node: &types.Node{
				GivenName: "minimal",
				Hostinfo:  &tailcfg.Hostinfo{},
			},
			dnsConfig:  &tailcfg.DNSConfig{},
			baseDomain: "example.com",
			want: &tailcfg.Node{
				// a node name should have a dot appended
				Name:              "minimal.example.com.",
				StableID:          "0",
				HomeDERP:          0,
				LegacyDERPString:  "127.3.3.40:0",
				Hostinfo:          hiview(tailcfg.Hostinfo{}),
				Tags:              []string{},
				MachineAuthorized: true,

				CapMap: tailcfg.NodeCapMap{
					tailcfg.CapabilityFileSharing: []tailcfg.RawMessage{},
					tailcfg.CapabilityAdmin:       []tailcfg.RawMessage{},
					tailcfg.CapabilitySSH:         []tailcfg.RawMessage{},
				},
			},
			wantErr: false,
		},
		// TODO: Add tests to check other aspects of the node conversion:
		// - With tags and policy
		// - dnsconfig and basedomain
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			polMan, err := policy.NewPolicyManager(tt.pol, []types.User{}, types.Nodes{tt.node}.ViewSlice())
			require.NoError(t, err)
			primary := routes.New()
			cfg := &types.Config{
				BaseDomain:          tt.baseDomain,
				TailcfgDNSConfig:    tt.dnsConfig,
				RandomizeClientPort: false,
			}
			_ = primary.SetRoutes(tt.node.ID, tt.node.SubnetRoutes()...)

			// This is a hack to avoid having a second node to test the primary route.
			// This should be baked into the test case proper if it is extended in the future.
			_ = primary.SetRoutes(2, netip.MustParsePrefix("192.168.0.0/24"))
			got, err := tailNode(
				tt.node.View(),
				0,
				polMan,
				func(id types.NodeID) []netip.Prefix {
					return primary.PrimaryRoutes(id)
				},
				cfg,
			)

			if (err != nil) != tt.wantErr {
				t.Errorf("tailNode() error = %v, wantErr %v", err, tt.wantErr)

				return
			}

			if diff := cmp.Diff(tt.want, got, cmpopts.EquateEmpty()); diff != "" {
				t.Errorf("tailNode() unexpected result (-want +got):\n%s", diff)
			}
		})
	}
}

func TestNodeExpiry(t *testing.T) {
	tp := func(t time.Time) *time.Time {
		return &t
	}
	tests := []struct {
		name         string
		exp          *time.Time
		wantTime     time.Time
		wantTimeZero bool
	}{
		{
			name:         "no-expiry",
			exp:          nil,
			wantTimeZero: true,
		},
		{
			name:         "zero-expiry",
			exp:          &time.Time{},
			wantTimeZero: true,
		},
		{
			name:         "localtime",
			exp:          tp(time.Time{}.Local()),
			wantTimeZero: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			node := &types.Node{
				ID:        0,
				GivenName: "test",
				Expiry:    tt.exp,
			}
			polMan, err := policy.NewPolicyManager(nil, nil, types.Nodes{}.ViewSlice())
			require.NoError(t, err)

			tn, err := tailNode(
				node.View(),
				0,
				polMan,
				func(id types.NodeID) []netip.Prefix {
					return []netip.Prefix{}
				},
				&types.Config{},
			)
			if err != nil {
				t.Fatalf("nodeExpiry() error = %v", err)
			}

			// Round trip the node through JSON to ensure the time is serialized correctly
			seri, err := json.Marshal(tn)
			if err != nil {
				t.Fatalf("nodeExpiry() error = %v", err)
			}
			var deseri tailcfg.Node
			err = json.Unmarshal(seri, &deseri)
			if err != nil {
				t.Fatalf("nodeExpiry() error = %v", err)
			}

			if tt.wantTimeZero {
				if !deseri.KeyExpiry.IsZero() {
					t.Errorf("nodeExpiry() = %v, want zero", deseri.KeyExpiry)
				}
			} else if deseri.KeyExpiry != tt.wantTime {
				t.Errorf("nodeExpiry() = %v, want %v", deseri.KeyExpiry, tt.wantTime)
			}
		})
	}
}
