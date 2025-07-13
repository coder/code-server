package integration

import (
	"encoding/json"
	"fmt"
	"net/netip"
	"slices"
	"sort"
	"strings"
	"testing"
	"time"

	cmpdiff "github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	v1 "github.com/juanfont/headscale/gen/go/headscale/v1"
	policyv2 "github.com/juanfont/headscale/hscontrol/policy/v2"
	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/juanfont/headscale/integration/hsic"
	"github.com/juanfont/headscale/integration/tsic"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tailscale.com/ipn/ipnstate"
	"tailscale.com/net/tsaddr"
	"tailscale.com/tailcfg"
	"tailscale.com/types/ipproto"
	"tailscale.com/types/views"
	"tailscale.com/util/must"
	"tailscale.com/util/slicesx"
	"tailscale.com/wgengine/filter"
)

var allPorts = filter.PortRange{First: 0, Last: 0xffff}

// This test is both testing the routes command and the propagation of
// routes.
func TestEnablingRoutes(t *testing.T) {
	IntegrationSkip(t)

	spec := ScenarioSpec{
		NodesPerUser: 3,
		Users:        []string{"user1"},
	}

	scenario, err := NewScenario(spec)
	require.NoErrorf(t, err, "failed to create scenario: %s", err)
	defer scenario.ShutdownAssertNoPanics(t)

	err = scenario.CreateHeadscaleEnv(
		[]tsic.Option{tsic.WithAcceptRoutes()},
		hsic.WithTestName("clienableroute"))
	assertNoErrHeadscaleEnv(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	headscale, err := scenario.Headscale()
	assertNoErrGetHeadscale(t, err)

	expectedRoutes := map[string]string{
		"1": "10.0.0.0/24",
		"2": "10.0.1.0/24",
		"3": "10.0.2.0/24",
	}

	// advertise routes using the up command
	for _, client := range allClients {
		status, err := client.Status()
		require.NoError(t, err)

		command := []string{
			"tailscale",
			"set",
			"--advertise-routes=" + expectedRoutes[string(status.Self.ID)],
		}
		_, _, err = client.Execute(command)
		require.NoErrorf(t, err, "failed to advertise route: %s", err)
	}

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	nodes, err := headscale.ListNodes()
	require.NoError(t, err)

	for _, node := range nodes {
		assert.Len(t, node.GetAvailableRoutes(), 1)
		assert.Empty(t, node.GetApprovedRoutes())
		assert.Empty(t, node.GetSubnetRoutes())
	}

	// Verify that no routes has been sent to the client,
	// they are not yet enabled.
	for _, client := range allClients {
		status, err := client.Status()
		require.NoError(t, err)

		for _, peerKey := range status.Peers() {
			peerStatus := status.Peer[peerKey]

			assert.Nil(t, peerStatus.PrimaryRoutes)
		}
	}

	for _, node := range nodes {
		_, err := headscale.ApproveRoutes(
			node.GetId(),
			util.MustStringsToPrefixes(node.GetAvailableRoutes()),
		)
		require.NoError(t, err)
	}

	nodes, err = headscale.ListNodes()
	require.NoError(t, err)

	for _, node := range nodes {
		assert.Len(t, node.GetAvailableRoutes(), 1)
		assert.Len(t, node.GetApprovedRoutes(), 1)
		assert.Len(t, node.GetSubnetRoutes(), 1)
	}

	time.Sleep(5 * time.Second)

	// Verify that the clients can see the new routes
	for _, client := range allClients {
		status, err := client.Status()
		require.NoError(t, err)

		for _, peerKey := range status.Peers() {
			peerStatus := status.Peer[peerKey]

			assert.NotNil(t, peerStatus.PrimaryRoutes)

			assert.Len(t, peerStatus.AllowedIPs.AsSlice(), 3)
			requirePeerSubnetRoutes(t, peerStatus, []netip.Prefix{netip.MustParsePrefix(expectedRoutes[string(peerStatus.ID)])})
		}
	}

	_, err = headscale.ApproveRoutes(
		1,
		[]netip.Prefix{netip.MustParsePrefix("10.0.1.0/24")},
	)
	require.NoError(t, err)

	_, err = headscale.ApproveRoutes(
		2,
		[]netip.Prefix{},
	)
	require.NoError(t, err)

	time.Sleep(5 * time.Second)

	nodes, err = headscale.ListNodes()
	require.NoError(t, err)

	for _, node := range nodes {
		if node.GetId() == 1 {
			assert.Len(t, node.GetAvailableRoutes(), 1) // 10.0.0.0/24
			assert.Len(t, node.GetApprovedRoutes(), 1)  // 10.0.1.0/24
			assert.Empty(t, node.GetSubnetRoutes())
		} else if node.GetId() == 2 {
			assert.Len(t, node.GetAvailableRoutes(), 1) // 10.0.1.0/24
			assert.Empty(t, node.GetApprovedRoutes())
			assert.Empty(t, node.GetSubnetRoutes())
		} else {
			assert.Len(t, node.GetAvailableRoutes(), 1) // 10.0.2.0/24
			assert.Len(t, node.GetApprovedRoutes(), 1)  // 10.0.2.0/24
			assert.Len(t, node.GetSubnetRoutes(), 1)    // 10.0.2.0/24
		}
	}

	// Verify that the clients can see the new routes
	for _, client := range allClients {
		status, err := client.Status()
		require.NoError(t, err)

		for _, peerKey := range status.Peers() {
			peerStatus := status.Peer[peerKey]

			switch peerStatus.ID {
			case "1":
				requirePeerSubnetRoutes(t, peerStatus, nil)
			case "2":
				requirePeerSubnetRoutes(t, peerStatus, nil)
			default:
				requirePeerSubnetRoutes(t, peerStatus, []netip.Prefix{netip.MustParsePrefix("10.0.2.0/24")})
			}
		}
	}
}

func TestHASubnetRouterFailover(t *testing.T) {
	IntegrationSkip(t)

	spec := ScenarioSpec{
		NodesPerUser: 3,
		Users:        []string{"user1", "user2"},
		Networks: map[string][]string{
			"usernet1": {"user1"},
			"usernet2": {"user2"},
		},
		ExtraService: map[string][]extraServiceFunc{
			"usernet1": {Webservice},
		},
		// We build the head image with curl and traceroute, so only use
		// that for this test.
		Versions: []string{"head"},
	}

	scenario, err := NewScenario(spec)
	require.NoErrorf(t, err, "failed to create scenario: %s", err)
	defer scenario.ShutdownAssertNoPanics(t)

	err = scenario.CreateHeadscaleEnv(
		[]tsic.Option{tsic.WithAcceptRoutes()},
		hsic.WithTestName("clienableroute"),
		hsic.WithEmbeddedDERPServerOnly(),
		hsic.WithTLS(),
	)
	assertNoErrHeadscaleEnv(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	headscale, err := scenario.Headscale()
	assertNoErrGetHeadscale(t, err)

	prefp, err := scenario.SubnetOfNetwork("usernet1")
	require.NoError(t, err)
	pref := *prefp
	t.Logf("usernet1 prefix: %s", pref.String())

	usernet1, err := scenario.Network("usernet1")
	require.NoError(t, err)

	services, err := scenario.Services("usernet1")
	require.NoError(t, err)
	require.Len(t, services, 1)

	web := services[0]
	webip := netip.MustParseAddr(web.GetIPInNetwork(usernet1))
	weburl := fmt.Sprintf("http://%s/etc/hostname", webip)
	t.Logf("webservice: %s, %s", webip.String(), weburl)

	// Sort nodes by ID
	sort.SliceStable(allClients, func(i, j int) bool {
		statusI := allClients[i].MustStatus()
		statusJ := allClients[j].MustStatus()

		return statusI.Self.ID < statusJ.Self.ID
	})

	// This is ok because the scenario makes users in order, so the three first
	// nodes, which are subnet routes, will be created first, and the last user
	// will be created with the second.
	subRouter1 := allClients[0]
	subRouter2 := allClients[1]
	subRouter3 := allClients[2]

	client := allClients[3]

	t.Logf("Advertise route from r1 (%s), r2 (%s), r3 (%s), making it HA, n1 is primary", subRouter1.Hostname(), subRouter2.Hostname(), subRouter3.Hostname())
	// advertise HA route on node 1, 2, 3
	// ID 1 will be primary
	// ID 2 will be standby
	// ID 3 will be standby
	for _, client := range allClients[:3] {
		command := []string{
			"tailscale",
			"set",
			"--advertise-routes=" + pref.String(),
		}
		_, _, err = client.Execute(command)
		require.NoErrorf(t, err, "failed to advertise route: %s", err)
	}

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	time.Sleep(3 * time.Second)

	nodes, err := headscale.ListNodes()
	require.NoError(t, err)
	assert.Len(t, nodes, 6)

	requireNodeRouteCount(t, nodes[0], 1, 0, 0)
	requireNodeRouteCount(t, nodes[1], 1, 0, 0)
	requireNodeRouteCount(t, nodes[2], 1, 0, 0)

	// Verify that no routes has been sent to the client,
	// they are not yet enabled.
	for _, client := range allClients {
		status, err := client.Status()
		require.NoError(t, err)

		for _, peerKey := range status.Peers() {
			peerStatus := status.Peer[peerKey]

			assert.Nil(t, peerStatus.PrimaryRoutes)
			requirePeerSubnetRoutes(t, peerStatus, nil)
		}
	}

	// Enable route on node 1
	t.Logf("Enabling route on subnet router 1, no HA")
	_, err = headscale.ApproveRoutes(
		1,
		[]netip.Prefix{pref},
	)
	require.NoError(t, err)

	time.Sleep(3 * time.Second)

	nodes, err = headscale.ListNodes()
	require.NoError(t, err)
	assert.Len(t, nodes, 6)

	requireNodeRouteCount(t, nodes[0], 1, 1, 1)
	requireNodeRouteCount(t, nodes[1], 1, 0, 0)
	requireNodeRouteCount(t, nodes[2], 1, 0, 0)

	// Verify that the client has routes from the primary machine and can access
	// the webservice.
	srs1 := subRouter1.MustStatus()
	srs2 := subRouter2.MustStatus()
	srs3 := subRouter3.MustStatus()
	clientStatus := client.MustStatus()

	srs1PeerStatus := clientStatus.Peer[srs1.Self.PublicKey]
	srs2PeerStatus := clientStatus.Peer[srs2.Self.PublicKey]
	srs3PeerStatus := clientStatus.Peer[srs3.Self.PublicKey]

	assert.True(t, srs1PeerStatus.Online, "r1 up, r2 up")
	assert.True(t, srs2PeerStatus.Online, "r1 up, r2 up")
	assert.True(t, srs3PeerStatus.Online, "r1 up, r2 up")

	assert.Nil(t, srs2PeerStatus.PrimaryRoutes)
	assert.Nil(t, srs3PeerStatus.PrimaryRoutes)
	require.NotNil(t, srs1PeerStatus.PrimaryRoutes)

	requirePeerSubnetRoutes(t, srs1PeerStatus, []netip.Prefix{pref})
	requirePeerSubnetRoutes(t, srs2PeerStatus, nil)
	requirePeerSubnetRoutes(t, srs3PeerStatus, nil)

	t.Logf("got list: %v, want in: %v", srs1PeerStatus.PrimaryRoutes.AsSlice(), pref)
	assert.Contains(t,
		srs1PeerStatus.PrimaryRoutes.AsSlice(),
		pref,
	)

	t.Logf("Validating access via subnetrouter(%s) to %s, no HA", subRouter1.MustIPv4().String(), webip.String())
	result, err := client.Curl(weburl)
	require.NoError(t, err)
	assert.Len(t, result, 13)

	tr, err := client.Traceroute(webip)
	require.NoError(t, err)
	assertTracerouteViaIP(t, tr, subRouter1.MustIPv4())

	// Enable route on node 2, now we will have a HA subnet router
	t.Logf("Enabling route on subnet router 2, now HA, subnetrouter 1 is primary, 2 is standby")
	_, err = headscale.ApproveRoutes(
		2,
		[]netip.Prefix{pref},
	)
	require.NoError(t, err)

	time.Sleep(3 * time.Second)

	nodes, err = headscale.ListNodes()
	require.NoError(t, err)
	assert.Len(t, nodes, 6)

	requireNodeRouteCount(t, nodes[0], 1, 1, 1)
	requireNodeRouteCount(t, nodes[1], 1, 1, 0)
	requireNodeRouteCount(t, nodes[2], 1, 0, 0)

	// Verify that the client has routes from the primary machine
	srs1 = subRouter1.MustStatus()
	srs2 = subRouter2.MustStatus()
	srs3 = subRouter3.MustStatus()
	clientStatus = client.MustStatus()

	srs1PeerStatus = clientStatus.Peer[srs1.Self.PublicKey]
	srs2PeerStatus = clientStatus.Peer[srs2.Self.PublicKey]
	srs3PeerStatus = clientStatus.Peer[srs3.Self.PublicKey]

	assert.True(t, srs1PeerStatus.Online, "r1 up, r2 up")
	assert.True(t, srs2PeerStatus.Online, "r1 up, r2 up")
	assert.True(t, srs3PeerStatus.Online, "r1 up, r2 up")

	assert.Nil(t, srs2PeerStatus.PrimaryRoutes)
	assert.Nil(t, srs3PeerStatus.PrimaryRoutes)
	require.NotNil(t, srs1PeerStatus.PrimaryRoutes)

	requirePeerSubnetRoutes(t, srs1PeerStatus, []netip.Prefix{pref})
	requirePeerSubnetRoutes(t, srs2PeerStatus, nil)
	requirePeerSubnetRoutes(t, srs3PeerStatus, nil)

	t.Logf("got list: %v, want in: %v", srs1PeerStatus.PrimaryRoutes.AsSlice(), pref)
	assert.Contains(t,
		srs1PeerStatus.PrimaryRoutes.AsSlice(),
		pref,
	)

	t.Logf("Validating access via subnetrouter(%s) to %s, 2 is standby", subRouter1.MustIPv4().String(), webip.String())
	result, err = client.Curl(weburl)
	require.NoError(t, err)
	assert.Len(t, result, 13)

	tr, err = client.Traceroute(webip)
	require.NoError(t, err)
	assertTracerouteViaIP(t, tr, subRouter1.MustIPv4())

	// Enable route on node 3, now we will have a second standby and all will
	// be enabled.
	t.Logf("Enabling route on subnet router 3, now HA, subnetrouter 1 is primary, 2 and 3 is standby")
	_, err = headscale.ApproveRoutes(
		3,
		[]netip.Prefix{pref},
	)
	require.NoError(t, err)

	time.Sleep(3 * time.Second)

	nodes, err = headscale.ListNodes()
	require.NoError(t, err)
	assert.Len(t, nodes, 6)

	requireNodeRouteCount(t, nodes[0], 1, 1, 1)
	requireNodeRouteCount(t, nodes[1], 1, 1, 0)
	requireNodeRouteCount(t, nodes[2], 1, 1, 0)

	// Verify that the client has routes from the primary machine
	srs1 = subRouter1.MustStatus()
	srs2 = subRouter2.MustStatus()
	srs3 = subRouter3.MustStatus()
	clientStatus = client.MustStatus()

	srs1PeerStatus = clientStatus.Peer[srs1.Self.PublicKey]
	srs2PeerStatus = clientStatus.Peer[srs2.Self.PublicKey]
	srs3PeerStatus = clientStatus.Peer[srs3.Self.PublicKey]

	assert.True(t, srs1PeerStatus.Online, "r1 up, r2 up")
	assert.True(t, srs2PeerStatus.Online, "r1 up, r2 up")
	assert.True(t, srs3PeerStatus.Online, "r1 up, r2 up")

	assert.Nil(t, srs2PeerStatus.PrimaryRoutes)
	assert.Nil(t, srs3PeerStatus.PrimaryRoutes)
	require.NotNil(t, srs1PeerStatus.PrimaryRoutes)

	requirePeerSubnetRoutes(t, srs1PeerStatus, []netip.Prefix{pref})
	requirePeerSubnetRoutes(t, srs2PeerStatus, nil)
	requirePeerSubnetRoutes(t, srs3PeerStatus, nil)

	t.Logf("got list: %v, want in: %v", srs1PeerStatus.PrimaryRoutes.AsSlice(), pref)
	assert.Contains(t,
		srs1PeerStatus.PrimaryRoutes.AsSlice(),
		pref,
	)

	result, err = client.Curl(weburl)
	require.NoError(t, err)
	assert.Len(t, result, 13)

	tr, err = client.Traceroute(webip)
	require.NoError(t, err)
	assertTracerouteViaIP(t, tr, subRouter1.MustIPv4())

	// Take down the current primary
	t.Logf("taking down subnet router r1 (%s)", subRouter1.Hostname())
	t.Logf("expecting r2 (%s) to take over as primary", subRouter2.Hostname())
	err = subRouter1.Down()
	require.NoError(t, err)

	time.Sleep(5 * time.Second)

	srs2 = subRouter2.MustStatus()
	clientStatus = client.MustStatus()

	srs1PeerStatus = clientStatus.Peer[srs1.Self.PublicKey]
	srs2PeerStatus = clientStatus.Peer[srs2.Self.PublicKey]
	srs3PeerStatus = clientStatus.Peer[srs3.Self.PublicKey]

	assert.False(t, srs1PeerStatus.Online, "r1 down, r2 down")
	assert.True(t, srs2PeerStatus.Online, "r1 down, r2 up")
	assert.True(t, srs3PeerStatus.Online, "r1 down, r2 up")

	assert.Nil(t, srs1PeerStatus.PrimaryRoutes)
	require.NotNil(t, srs2PeerStatus.PrimaryRoutes)
	assert.Nil(t, srs3PeerStatus.PrimaryRoutes)

	requirePeerSubnetRoutes(t, srs1PeerStatus, nil)
	requirePeerSubnetRoutes(t, srs2PeerStatus, []netip.Prefix{pref})
	requirePeerSubnetRoutes(t, srs3PeerStatus, nil)

	assert.Contains(
		t,
		srs2PeerStatus.PrimaryRoutes.AsSlice(),
		pref,
	)

	result, err = client.Curl(weburl)
	require.NoError(t, err)
	assert.Len(t, result, 13)

	tr, err = client.Traceroute(webip)
	require.NoError(t, err)
	assertTracerouteViaIP(t, tr, subRouter2.MustIPv4())

	// Take down subnet router 2, leaving none available
	t.Logf("taking down subnet router r2 (%s)", subRouter2.Hostname())
	t.Logf("expecting no primary, r3 available, but no HA so no primary")
	err = subRouter2.Down()
	require.NoError(t, err)

	time.Sleep(5 * time.Second)

	// TODO(kradalby): Check client status
	// Both are expected to be down

	// Verify that the route is not presented from either router
	clientStatus, err = client.Status()
	require.NoError(t, err)

	srs1PeerStatus = clientStatus.Peer[srs1.Self.PublicKey]
	srs2PeerStatus = clientStatus.Peer[srs2.Self.PublicKey]
	srs3PeerStatus = clientStatus.Peer[srs3.Self.PublicKey]

	assert.False(t, srs1PeerStatus.Online, "r1 down, r2 down")
	assert.False(t, srs2PeerStatus.Online, "r1 down, r2 down")
	assert.True(t, srs3PeerStatus.Online, "r1 down, r2 down")

	assert.Nil(t, srs1PeerStatus.PrimaryRoutes)
	assert.Nil(t, srs2PeerStatus.PrimaryRoutes)
	require.NotNil(t, srs3PeerStatus.PrimaryRoutes)

	requirePeerSubnetRoutes(t, srs1PeerStatus, nil)
	requirePeerSubnetRoutes(t, srs2PeerStatus, nil)
	requirePeerSubnetRoutes(t, srs3PeerStatus, []netip.Prefix{pref})

	result, err = client.Curl(weburl)
	require.NoError(t, err)
	assert.Len(t, result, 13)

	tr, err = client.Traceroute(webip)
	require.NoError(t, err)
	assertTracerouteViaIP(t, tr, subRouter3.MustIPv4())

	// Bring up subnet router 1, making the route available from there.
	t.Logf("bringing up subnet router r1 (%s)", subRouter1.Hostname())
	t.Logf("expecting r1 (%s) to take over as primary, r1 and r3 available", subRouter1.Hostname())
	err = subRouter1.Up()
	require.NoError(t, err)

	time.Sleep(5 * time.Second)

	// Verify that the route is announced from subnet router 1
	clientStatus, err = client.Status()
	require.NoError(t, err)

	srs1PeerStatus = clientStatus.Peer[srs1.Self.PublicKey]
	srs2PeerStatus = clientStatus.Peer[srs2.Self.PublicKey]
	srs3PeerStatus = clientStatus.Peer[srs3.Self.PublicKey]

	assert.True(t, srs1PeerStatus.Online, "r1 is back up, r2 down")
	assert.False(t, srs2PeerStatus.Online, "r1 is back up, r2 down")
	assert.True(t, srs3PeerStatus.Online, "r1 is back up, r3 available")

	assert.Nil(t, srs1PeerStatus.PrimaryRoutes)
	assert.Nil(t, srs2PeerStatus.PrimaryRoutes)
	require.NotNil(t, srs3PeerStatus.PrimaryRoutes)

	requirePeerSubnetRoutes(t, srs1PeerStatus, nil)
	requirePeerSubnetRoutes(t, srs2PeerStatus, nil)
	requirePeerSubnetRoutes(t, srs3PeerStatus, []netip.Prefix{pref})

	assert.Contains(
		t,
		srs3PeerStatus.PrimaryRoutes.AsSlice(),
		pref,
	)

	result, err = client.Curl(weburl)
	require.NoError(t, err)
	assert.Len(t, result, 13)

	tr, err = client.Traceroute(webip)
	require.NoError(t, err)
	assertTracerouteViaIP(t, tr, subRouter3.MustIPv4())

	// Bring up subnet router 2, should result in no change.
	t.Logf("bringing up subnet router r2 (%s)", subRouter2.Hostname())
	t.Logf("all online, expecting r1 (%s) to still be primary (no flapping)", subRouter1.Hostname())
	err = subRouter2.Up()
	require.NoError(t, err)

	time.Sleep(5 * time.Second)

	// Verify that the route is announced from subnet router 1
	clientStatus, err = client.Status()
	require.NoError(t, err)

	srs1PeerStatus = clientStatus.Peer[srs1.Self.PublicKey]
	srs2PeerStatus = clientStatus.Peer[srs2.Self.PublicKey]
	srs3PeerStatus = clientStatus.Peer[srs3.Self.PublicKey]

	assert.True(t, srs1PeerStatus.Online, "r1 up, r2 up")
	assert.True(t, srs2PeerStatus.Online, "r1 up, r2 up")
	assert.True(t, srs3PeerStatus.Online, "r1 up, r2 up")

	assert.Nil(t, srs1PeerStatus.PrimaryRoutes)
	assert.Nil(t, srs2PeerStatus.PrimaryRoutes)
	require.NotNil(t, srs3PeerStatus.PrimaryRoutes)

	requirePeerSubnetRoutes(t, srs1PeerStatus, nil)
	requirePeerSubnetRoutes(t, srs2PeerStatus, nil)
	requirePeerSubnetRoutes(t, srs3PeerStatus, []netip.Prefix{pref})

	assert.Contains(
		t,
		srs3PeerStatus.PrimaryRoutes.AsSlice(),
		pref,
	)

	result, err = client.Curl(weburl)
	require.NoError(t, err)
	assert.Len(t, result, 13)

	tr, err = client.Traceroute(webip)
	require.NoError(t, err)
	assertTracerouteViaIP(t, tr, subRouter3.MustIPv4())

	t.Logf("disabling route in subnet router r3 (%s)", subRouter3.Hostname())
	t.Logf("expecting route to failover to r1 (%s), which is still available with r2", subRouter1.Hostname())
	_, err = headscale.ApproveRoutes(nodes[2].GetId(), []netip.Prefix{})

	time.Sleep(5 * time.Second)

	nodes, err = headscale.ListNodes()
	require.NoError(t, err)
	assert.Len(t, nodes, 6)

	requireNodeRouteCount(t, nodes[0], 1, 1, 1)
	requireNodeRouteCount(t, nodes[1], 1, 1, 0)
	requireNodeRouteCount(t, nodes[2], 1, 0, 0)

	// Verify that the route is announced from subnet router 1
	clientStatus, err = client.Status()
	require.NoError(t, err)

	srs1PeerStatus = clientStatus.Peer[srs1.Self.PublicKey]
	srs2PeerStatus = clientStatus.Peer[srs2.Self.PublicKey]
	srs3PeerStatus = clientStatus.Peer[srs3.Self.PublicKey]

	require.NotNil(t, srs1PeerStatus.PrimaryRoutes)
	assert.Nil(t, srs2PeerStatus.PrimaryRoutes)
	assert.Nil(t, srs3PeerStatus.PrimaryRoutes)

	requirePeerSubnetRoutes(t, srs1PeerStatus, []netip.Prefix{pref})
	requirePeerSubnetRoutes(t, srs2PeerStatus, nil)
	requirePeerSubnetRoutes(t, srs3PeerStatus, nil)

	assert.Contains(
		t,
		srs1PeerStatus.PrimaryRoutes.AsSlice(),
		pref,
	)

	result, err = client.Curl(weburl)
	require.NoError(t, err)
	assert.Len(t, result, 13)

	tr, err = client.Traceroute(webip)
	require.NoError(t, err)
	assertTracerouteViaIP(t, tr, subRouter1.MustIPv4())

	// Disable the route of subnet router 1, making it failover to 2
	t.Logf("disabling route in subnet router r1 (%s)", subRouter1.Hostname())
	t.Logf("expecting route to failover to r2 (%s)", subRouter2.Hostname())
	_, err = headscale.ApproveRoutes(nodes[0].GetId(), []netip.Prefix{})

	time.Sleep(5 * time.Second)

	nodes, err = headscale.ListNodes()
	require.NoError(t, err)
	assert.Len(t, nodes, 6)

	requireNodeRouteCount(t, nodes[0], 1, 0, 0)
	requireNodeRouteCount(t, nodes[1], 1, 1, 1)
	requireNodeRouteCount(t, nodes[2], 1, 0, 0)

	// Verify that the route is announced from subnet router 1
	clientStatus, err = client.Status()
	require.NoError(t, err)

	srs1PeerStatus = clientStatus.Peer[srs1.Self.PublicKey]
	srs2PeerStatus = clientStatus.Peer[srs2.Self.PublicKey]
	srs3PeerStatus = clientStatus.Peer[srs3.Self.PublicKey]

	assert.Nil(t, srs1PeerStatus.PrimaryRoutes)
	require.NotNil(t, srs2PeerStatus.PrimaryRoutes)
	assert.Nil(t, srs3PeerStatus.PrimaryRoutes)

	requirePeerSubnetRoutes(t, srs1PeerStatus, nil)
	requirePeerSubnetRoutes(t, srs2PeerStatus, []netip.Prefix{pref})
	requirePeerSubnetRoutes(t, srs3PeerStatus, nil)

	assert.Contains(
		t,
		srs2PeerStatus.PrimaryRoutes.AsSlice(),
		pref,
	)

	result, err = client.Curl(weburl)
	require.NoError(t, err)
	assert.Len(t, result, 13)

	tr, err = client.Traceroute(webip)
	require.NoError(t, err)
	assertTracerouteViaIP(t, tr, subRouter2.MustIPv4())

	// enable the route of subnet router 1, no change expected
	t.Logf("enabling route in subnet router 1 (%s)", subRouter1.Hostname())
	t.Logf("both online, expecting r2 (%s) to still be primary (no flapping)", subRouter2.Hostname())
	_, err = headscale.ApproveRoutes(
		nodes[0].GetId(),
		util.MustStringsToPrefixes(nodes[0].GetAvailableRoutes()),
	)

	time.Sleep(5 * time.Second)

	nodes, err = headscale.ListNodes()
	require.NoError(t, err)
	assert.Len(t, nodes, 6)

	requireNodeRouteCount(t, nodes[0], 1, 1, 0)
	requireNodeRouteCount(t, nodes[1], 1, 1, 1)
	requireNodeRouteCount(t, nodes[2], 1, 0, 0)

	// Verify that the route is announced from subnet router 1
	clientStatus, err = client.Status()
	require.NoError(t, err)

	srs1PeerStatus = clientStatus.Peer[srs1.Self.PublicKey]
	srs2PeerStatus = clientStatus.Peer[srs2.Self.PublicKey]
	srs3PeerStatus = clientStatus.Peer[srs3.Self.PublicKey]

	assert.Nil(t, srs1PeerStatus.PrimaryRoutes)
	require.NotNil(t, srs2PeerStatus.PrimaryRoutes)
	assert.Nil(t, srs3PeerStatus.PrimaryRoutes)

	assert.Contains(
		t,
		srs2PeerStatus.PrimaryRoutes.AsSlice(),
		pref,
	)

	result, err = client.Curl(weburl)
	require.NoError(t, err)
	assert.Len(t, result, 13)

	tr, err = client.Traceroute(webip)
	require.NoError(t, err)
	assertTracerouteViaIP(t, tr, subRouter2.MustIPv4())
}

// TestSubnetRouteACL verifies that Subnet routes are distributed
// as expected when ACLs are activated.
// It implements the issue from
// https://github.com/juanfont/headscale/issues/1604
func TestSubnetRouteACL(t *testing.T) {
	IntegrationSkip(t)

	user := "user4"

	spec := ScenarioSpec{
		NodesPerUser: 2,
		Users:        []string{user},
	}

	scenario, err := NewScenario(spec)
	require.NoErrorf(t, err, "failed to create scenario: %s", err)
	defer scenario.ShutdownAssertNoPanics(t)

	err = scenario.CreateHeadscaleEnv([]tsic.Option{
		tsic.WithAcceptRoutes(),
	}, hsic.WithTestName("clienableroute"), hsic.WithACLPolicy(
		&policyv2.Policy{
			Groups: policyv2.Groups{
				policyv2.Group("group:admins"): []policyv2.Username{policyv2.Username(user + "@")},
			},
			ACLs: []policyv2.ACL{
				{
					Action:  "accept",
					Sources: []policyv2.Alias{groupp("group:admins")},
					Destinations: []policyv2.AliasWithPorts{
						aliasWithPorts(groupp("group:admins"), tailcfg.PortRangeAny),
					},
				},
				{
					Action:  "accept",
					Sources: []policyv2.Alias{groupp("group:admins")},
					Destinations: []policyv2.AliasWithPorts{
						aliasWithPorts(prefixp("10.33.0.0/16"), tailcfg.PortRangeAny),
					},
				},
			},
		},
	))
	assertNoErrHeadscaleEnv(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	headscale, err := scenario.Headscale()
	assertNoErrGetHeadscale(t, err)

	expectedRoutes := map[string]string{
		"1": "10.33.0.0/16",
	}

	// Sort nodes by ID
	sort.SliceStable(allClients, func(i, j int) bool {
		statusI, err := allClients[i].Status()
		if err != nil {
			return false
		}

		statusJ, err := allClients[j].Status()
		if err != nil {
			return false
		}

		return statusI.Self.ID < statusJ.Self.ID
	})

	subRouter1 := allClients[0]

	client := allClients[1]

	for _, client := range allClients {
		status, err := client.Status()
		require.NoError(t, err)

		if route, ok := expectedRoutes[string(status.Self.ID)]; ok {
			command := []string{
				"tailscale",
				"set",
				"--advertise-routes=" + route,
			}
			_, _, err = client.Execute(command)
			require.NoErrorf(t, err, "failed to advertise route: %s", err)
		}
	}

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	nodes, err := headscale.ListNodes()
	require.NoError(t, err)
	require.Len(t, nodes, 2)

	requireNodeRouteCount(t, nodes[0], 1, 0, 0)
	requireNodeRouteCount(t, nodes[1], 0, 0, 0)

	// Verify that no routes has been sent to the client,
	// they are not yet enabled.
	for _, client := range allClients {
		status, err := client.Status()
		require.NoError(t, err)

		for _, peerKey := range status.Peers() {
			peerStatus := status.Peer[peerKey]

			assert.Nil(t, peerStatus.PrimaryRoutes)
			requirePeerSubnetRoutes(t, peerStatus, nil)
		}
	}

	_, err = headscale.ApproveRoutes(
		1,
		[]netip.Prefix{netip.MustParsePrefix(expectedRoutes["1"])},
	)
	require.NoError(t, err)

	time.Sleep(5 * time.Second)

	nodes, err = headscale.ListNodes()
	require.NoError(t, err)
	require.Len(t, nodes, 2)

	requireNodeRouteCount(t, nodes[0], 1, 1, 1)
	requireNodeRouteCount(t, nodes[1], 0, 0, 0)

	// Verify that the client has routes from the primary machine
	srs1, _ := subRouter1.Status()

	clientStatus, err := client.Status()
	require.NoError(t, err)

	srs1PeerStatus := clientStatus.Peer[srs1.Self.PublicKey]

	requirePeerSubnetRoutes(t, srs1PeerStatus, []netip.Prefix{netip.MustParsePrefix(expectedRoutes["1"])})

	clientNm, err := client.Netmap()
	require.NoError(t, err)

	wantClientFilter := []filter.Match{
		{
			IPProto: views.SliceOf([]ipproto.Proto{
				ipproto.TCP, ipproto.UDP, ipproto.ICMPv4, ipproto.ICMPv6,
			}),
			Srcs: []netip.Prefix{
				netip.MustParsePrefix("100.64.0.1/32"),
				netip.MustParsePrefix("100.64.0.2/32"),
				netip.MustParsePrefix("fd7a:115c:a1e0::1/128"),
				netip.MustParsePrefix("fd7a:115c:a1e0::2/128"),
			},
			Dsts: []filter.NetPortRange{
				{
					Net:   netip.MustParsePrefix("100.64.0.2/32"),
					Ports: allPorts,
				},
				{
					Net:   netip.MustParsePrefix("fd7a:115c:a1e0::2/128"),
					Ports: allPorts,
				},
			},
			Caps: []filter.CapMatch{},
		},
	}

	if diff := cmpdiff.Diff(wantClientFilter, clientNm.PacketFilter, util.ViewSliceIPProtoComparer, util.PrefixComparer); diff != "" {
		t.Errorf("Client (%s) filter, unexpected result (-want +got):\n%s", client.Hostname(), diff)
	}

	subnetNm, err := subRouter1.Netmap()
	require.NoError(t, err)

	wantSubnetFilter := []filter.Match{
		{
			IPProto: views.SliceOf([]ipproto.Proto{
				ipproto.TCP, ipproto.UDP, ipproto.ICMPv4, ipproto.ICMPv6,
			}),
			Srcs: []netip.Prefix{
				netip.MustParsePrefix("100.64.0.1/32"),
				netip.MustParsePrefix("100.64.0.2/32"),
				netip.MustParsePrefix("fd7a:115c:a1e0::1/128"),
				netip.MustParsePrefix("fd7a:115c:a1e0::2/128"),
			},
			Dsts: []filter.NetPortRange{
				{
					Net:   netip.MustParsePrefix("100.64.0.1/32"),
					Ports: allPorts,
				},
				{
					Net:   netip.MustParsePrefix("fd7a:115c:a1e0::1/128"),
					Ports: allPorts,
				},
			},
			Caps: []filter.CapMatch{},
		},
		{
			IPProto: views.SliceOf([]ipproto.Proto{
				ipproto.TCP, ipproto.UDP, ipproto.ICMPv4, ipproto.ICMPv6,
			}),
			Srcs: []netip.Prefix{
				netip.MustParsePrefix("100.64.0.1/32"),
				netip.MustParsePrefix("100.64.0.2/32"),
				netip.MustParsePrefix("fd7a:115c:a1e0::1/128"),
				netip.MustParsePrefix("fd7a:115c:a1e0::2/128"),
			},
			Dsts: []filter.NetPortRange{
				{
					Net:   netip.MustParsePrefix("10.33.0.0/16"),
					Ports: allPorts,
				},
			},
			Caps: []filter.CapMatch{},
		},
	}

	if diff := cmpdiff.Diff(wantSubnetFilter, subnetNm.PacketFilter, util.ViewSliceIPProtoComparer, util.PrefixComparer); diff != "" {
		t.Errorf("Subnet (%s) filter, unexpected result (-want +got):\n%s", subRouter1.Hostname(), diff)
	}
}

// TestEnablingExitRoutes tests enabling exit routes for clients.
// Its more or less the same as TestEnablingRoutes, but with the --advertise-exit-node flag
// set during login instead of set.
func TestEnablingExitRoutes(t *testing.T) {
	IntegrationSkip(t)

	user := "user2"

	spec := ScenarioSpec{
		NodesPerUser: 2,
		Users:        []string{user},
	}

	scenario, err := NewScenario(spec)
	assertNoErrf(t, "failed to create scenario: %s", err)
	defer scenario.ShutdownAssertNoPanics(t)

	err = scenario.CreateHeadscaleEnv([]tsic.Option{
		tsic.WithExtraLoginArgs([]string{"--advertise-exit-node"}),
	}, hsic.WithTestName("clienableroute"))
	assertNoErrHeadscaleEnv(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	headscale, err := scenario.Headscale()
	assertNoErrGetHeadscale(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	nodes, err := headscale.ListNodes()
	require.NoError(t, err)
	require.Len(t, nodes, 2)

	requireNodeRouteCount(t, nodes[0], 2, 0, 0)
	requireNodeRouteCount(t, nodes[1], 2, 0, 0)

	// Verify that no routes has been sent to the client,
	// they are not yet enabled.
	for _, client := range allClients {
		status, err := client.Status()
		assertNoErr(t, err)

		for _, peerKey := range status.Peers() {
			peerStatus := status.Peer[peerKey]

			assert.Nil(t, peerStatus.PrimaryRoutes)
		}
	}

	// Enable all routes, but do v4 on one and v6 on other to ensure they
	// are both added since they are exit routes.
	_, err = headscale.ApproveRoutes(
		nodes[0].GetId(),
		[]netip.Prefix{tsaddr.AllIPv4()},
	)
	require.NoError(t, err)
	_, err = headscale.ApproveRoutes(
		nodes[1].GetId(),
		[]netip.Prefix{tsaddr.AllIPv6()},
	)
	require.NoError(t, err)

	nodes, err = headscale.ListNodes()
	require.NoError(t, err)
	require.Len(t, nodes, 2)

	requireNodeRouteCount(t, nodes[0], 2, 2, 2)
	requireNodeRouteCount(t, nodes[1], 2, 2, 2)

	time.Sleep(5 * time.Second)

	// Verify that the clients can see the new routes
	for _, client := range allClients {
		status, err := client.Status()
		assertNoErr(t, err)

		for _, peerKey := range status.Peers() {
			peerStatus := status.Peer[peerKey]

			require.NotNil(t, peerStatus.AllowedIPs)
			assert.Len(t, peerStatus.AllowedIPs.AsSlice(), 4)
			assert.Contains(t, peerStatus.AllowedIPs.AsSlice(), tsaddr.AllIPv4())
			assert.Contains(t, peerStatus.AllowedIPs.AsSlice(), tsaddr.AllIPv6())
		}
	}
}

// TestSubnetRouterMultiNetwork is an evolution of the subnet router test.
// This test will set up multiple docker networks and use two isolated tailscale
// clients and a service available in one of the networks to validate that a
// subnet router is working as expected.
func TestSubnetRouterMultiNetwork(t *testing.T) {
	IntegrationSkip(t)

	spec := ScenarioSpec{
		NodesPerUser: 1,
		Users:        []string{"user1", "user2"},
		Networks: map[string][]string{
			"usernet1": {"user1"},
			"usernet2": {"user2"},
		},
		ExtraService: map[string][]extraServiceFunc{
			"usernet1": {Webservice},
		},
	}

	scenario, err := NewScenario(spec)
	require.NoErrorf(t, err, "failed to create scenario: %s", err)
	defer scenario.ShutdownAssertNoPanics(t)

	err = scenario.CreateHeadscaleEnv([]tsic.Option{tsic.WithAcceptRoutes()},
		hsic.WithTestName("clienableroute"),
		hsic.WithEmbeddedDERPServerOnly(),
		hsic.WithTLS(),
	)
	assertNoErrHeadscaleEnv(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	headscale, err := scenario.Headscale()
	assertNoErrGetHeadscale(t, err)
	assert.NotNil(t, headscale)

	pref, err := scenario.SubnetOfNetwork("usernet1")
	require.NoError(t, err)

	var user1c, user2c TailscaleClient

	for _, c := range allClients {
		s := c.MustStatus()
		if s.User[s.Self.UserID].LoginName == "user1@test.no" {
			user1c = c
		}
		if s.User[s.Self.UserID].LoginName == "user2@test.no" {
			user2c = c
		}
	}
	require.NotNil(t, user1c)
	require.NotNil(t, user2c)

	// Advertise the route for the dockersubnet of user1
	command := []string{
		"tailscale",
		"set",
		"--advertise-routes=" + pref.String(),
	}
	_, _, err = user1c.Execute(command)
	require.NoErrorf(t, err, "failed to advertise route: %s", err)

	nodes, err := headscale.ListNodes()
	require.NoError(t, err)
	assert.Len(t, nodes, 2)
	requireNodeRouteCount(t, nodes[0], 1, 0, 0)

	// Verify that no routes has been sent to the client,
	// they are not yet enabled.
	status, err := user1c.Status()
	require.NoError(t, err)

	for _, peerKey := range status.Peers() {
		peerStatus := status.Peer[peerKey]

		assert.Nil(t, peerStatus.PrimaryRoutes)
		requirePeerSubnetRoutes(t, peerStatus, nil)
	}

	// Enable route
	_, err = headscale.ApproveRoutes(
		nodes[0].GetId(),
		[]netip.Prefix{*pref},
	)
	require.NoError(t, err)

	time.Sleep(5 * time.Second)

	nodes, err = headscale.ListNodes()
	require.NoError(t, err)
	assert.Len(t, nodes, 2)
	requireNodeRouteCount(t, nodes[0], 1, 1, 1)

	// Verify that the routes have been sent to the client.
	status, err = user2c.Status()
	require.NoError(t, err)

	for _, peerKey := range status.Peers() {
		peerStatus := status.Peer[peerKey]

		assert.Contains(t, peerStatus.PrimaryRoutes.AsSlice(), *pref)
		requirePeerSubnetRoutes(t, peerStatus, []netip.Prefix{*pref})
	}

	usernet1, err := scenario.Network("usernet1")
	require.NoError(t, err)

	services, err := scenario.Services("usernet1")
	require.NoError(t, err)
	require.Len(t, services, 1)

	web := services[0]
	webip := netip.MustParseAddr(web.GetIPInNetwork(usernet1))

	url := fmt.Sprintf("http://%s/etc/hostname", webip)
	t.Logf("url from %s to %s", user2c.Hostname(), url)

	result, err := user2c.Curl(url)
	require.NoError(t, err)
	assert.Len(t, result, 13)

	tr, err := user2c.Traceroute(webip)
	require.NoError(t, err)
	assertTracerouteViaIP(t, tr, user1c.MustIPv4())
}

func TestSubnetRouterMultiNetworkExitNode(t *testing.T) {
	IntegrationSkip(t)

	spec := ScenarioSpec{
		NodesPerUser: 1,
		Users:        []string{"user1", "user2"},
		Networks: map[string][]string{
			"usernet1": {"user1"},
			"usernet2": {"user2"},
		},
		ExtraService: map[string][]extraServiceFunc{
			"usernet1": {Webservice},
		},
	}

	scenario, err := NewScenario(spec)
	require.NoErrorf(t, err, "failed to create scenario: %s", err)
	defer scenario.ShutdownAssertNoPanics(t)

	err = scenario.CreateHeadscaleEnv([]tsic.Option{},
		hsic.WithTestName("clienableroute"),
		hsic.WithEmbeddedDERPServerOnly(),
		hsic.WithTLS(),
	)
	assertNoErrHeadscaleEnv(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	headscale, err := scenario.Headscale()
	assertNoErrGetHeadscale(t, err)
	assert.NotNil(t, headscale)

	var user1c, user2c TailscaleClient

	for _, c := range allClients {
		s := c.MustStatus()
		if s.User[s.Self.UserID].LoginName == "user1@test.no" {
			user1c = c
		}
		if s.User[s.Self.UserID].LoginName == "user2@test.no" {
			user2c = c
		}
	}
	require.NotNil(t, user1c)
	require.NotNil(t, user2c)

	// Advertise the exit nodes for the dockersubnet of user1
	command := []string{
		"tailscale",
		"set",
		"--advertise-exit-node",
	}
	_, _, err = user1c.Execute(command)
	require.NoErrorf(t, err, "failed to advertise route: %s", err)

	nodes, err := headscale.ListNodes()
	require.NoError(t, err)
	assert.Len(t, nodes, 2)
	requireNodeRouteCount(t, nodes[0], 2, 0, 0)

	// Verify that no routes has been sent to the client,
	// they are not yet enabled.
	status, err := user1c.Status()
	require.NoError(t, err)

	for _, peerKey := range status.Peers() {
		peerStatus := status.Peer[peerKey]

		assert.Nil(t, peerStatus.PrimaryRoutes)
		requirePeerSubnetRoutes(t, peerStatus, nil)
	}

	// Enable route
	_, err = headscale.ApproveRoutes(nodes[0].GetId(), []netip.Prefix{tsaddr.AllIPv4()})
	require.NoError(t, err)

	time.Sleep(5 * time.Second)

	nodes, err = headscale.ListNodes()
	require.NoError(t, err)
	assert.Len(t, nodes, 2)
	requireNodeRouteCount(t, nodes[0], 2, 2, 2)

	// Verify that the routes have been sent to the client.
	status, err = user2c.Status()
	require.NoError(t, err)

	for _, peerKey := range status.Peers() {
		peerStatus := status.Peer[peerKey]

		requirePeerSubnetRoutes(t, peerStatus, []netip.Prefix{tsaddr.AllIPv4(), tsaddr.AllIPv6()})
	}

	// Tell user2c to use user1c as an exit node.
	command = []string{
		"tailscale",
		"set",
		"--exit-node",
		user1c.Hostname(),
	}
	_, _, err = user2c.Execute(command)
	require.NoErrorf(t, err, "failed to advertise route: %s", err)

	usernet1, err := scenario.Network("usernet1")
	require.NoError(t, err)

	services, err := scenario.Services("usernet1")
	require.NoError(t, err)
	require.Len(t, services, 1)

	web := services[0]
	webip := netip.MustParseAddr(web.GetIPInNetwork(usernet1))

	// We cant mess to much with ip forwarding in containers so
	// we settle for a simple ping here.
	// Direct is false since we use internal DERP which means we
	// cant discover a direct path between docker networks.
	err = user2c.Ping(webip.String(),
		tsic.WithPingUntilDirect(false),
		tsic.WithPingCount(1),
		tsic.WithPingTimeout(7*time.Second),
	)
	require.NoError(t, err)
}

func MustFindNode(hostname string, nodes []*v1.Node) *v1.Node {
	for _, node := range nodes {
		if node.GetName() == hostname {
			return node
		}
	}
	panic("node not found")
}

// TestAutoApproveMultiNetwork tests auto approving of routes
// by setting up two networks where network1 has three subnet
// routers:
// - routerUsernet1: advertising the docker network
// - routerSubRoute: advertising a subroute, a /24 inside a auto approved /16
// - routeExitNode: advertising an exit node
//
// Each router is tested step by step through the following scenarios
//   - Policy is set to auto approve the nodes route
//   - Node advertises route and it is verified that it is auto approved and sent to nodes
//   - Policy is changed to _not_ auto approve the route
//   - Verify that peers can still see the node
//   - Disable route, making it unavailable
//   - Verify that peers can no longer use node
//   - Policy is changed back to auto approve route, check that routes already existing is approved.
//   - Verify that routes can now be seen by peers.
func TestAutoApproveMultiNetwork(t *testing.T) {
	IntegrationSkip(t)
	bigRoute := netip.MustParsePrefix("10.42.0.0/16")
	subRoute := netip.MustParsePrefix("10.42.7.0/24")
	notApprovedRoute := netip.MustParsePrefix("192.168.0.0/24")

	tests := []struct {
		name     string
		pol      *policyv2.Policy
		approver string
		spec     ScenarioSpec
		withURL  bool
	}{
		{
			name: "authkey-tag",
			pol: &policyv2.Policy{
				ACLs: []policyv2.ACL{
					{
						Action:  "accept",
						Sources: []policyv2.Alias{wildcard()},
						Destinations: []policyv2.AliasWithPorts{
							aliasWithPorts(wildcard(), tailcfg.PortRangeAny),
						},
					},
				},
				TagOwners: policyv2.TagOwners{
					policyv2.Tag("tag:approve"): policyv2.Owners{usernameOwner("user1@")},
				},
				AutoApprovers: policyv2.AutoApproverPolicy{
					Routes: map[netip.Prefix]policyv2.AutoApprovers{
						bigRoute: {tagApprover("tag:approve")},
					},
					ExitNode: policyv2.AutoApprovers{tagApprover("tag:approve")},
				},
			},
			approver: "tag:approve",
			spec: ScenarioSpec{
				NodesPerUser: 3,
				Users:        []string{"user1", "user2"},
				Networks: map[string][]string{
					"usernet1": {"user1"},
					"usernet2": {"user2"},
				},
				ExtraService: map[string][]extraServiceFunc{
					"usernet1": {Webservice},
				},
				// We build the head image with curl and traceroute, so only use
				// that for this test.
				Versions: []string{"head"},
			},
		},
		{
			name: "authkey-user",
			pol: &policyv2.Policy{
				ACLs: []policyv2.ACL{
					{
						Action:  "accept",
						Sources: []policyv2.Alias{wildcard()},
						Destinations: []policyv2.AliasWithPorts{
							aliasWithPorts(wildcard(), tailcfg.PortRangeAny),
						},
					},
				},
				AutoApprovers: policyv2.AutoApproverPolicy{
					Routes: map[netip.Prefix]policyv2.AutoApprovers{
						bigRoute: {usernameApprover("user1@")},
					},
					ExitNode: policyv2.AutoApprovers{usernameApprover("user1@")},
				},
			},
			approver: "user1@",
			spec: ScenarioSpec{
				NodesPerUser: 3,
				Users:        []string{"user1", "user2"},
				Networks: map[string][]string{
					"usernet1": {"user1"},
					"usernet2": {"user2"},
				},
				ExtraService: map[string][]extraServiceFunc{
					"usernet1": {Webservice},
				},
				// We build the head image with curl and traceroute, so only use
				// that for this test.
				Versions: []string{"head"},
			},
		},
		{
			name: "authkey-group",
			pol: &policyv2.Policy{
				ACLs: []policyv2.ACL{
					{
						Action:  "accept",
						Sources: []policyv2.Alias{wildcard()},
						Destinations: []policyv2.AliasWithPorts{
							aliasWithPorts(wildcard(), tailcfg.PortRangeAny),
						},
					},
				},
				Groups: policyv2.Groups{
					policyv2.Group("group:approve"): []policyv2.Username{policyv2.Username("user1@")},
				},
				AutoApprovers: policyv2.AutoApproverPolicy{
					Routes: map[netip.Prefix]policyv2.AutoApprovers{
						bigRoute: {groupApprover("group:approve")},
					},
					ExitNode: policyv2.AutoApprovers{groupApprover("group:approve")},
				},
			},
			approver: "group:approve",
			spec: ScenarioSpec{
				NodesPerUser: 3,
				Users:        []string{"user1", "user2"},
				Networks: map[string][]string{
					"usernet1": {"user1"},
					"usernet2": {"user2"},
				},
				ExtraService: map[string][]extraServiceFunc{
					"usernet1": {Webservice},
				},
				// We build the head image with curl and traceroute, so only use
				// that for this test.
				Versions: []string{"head"},
			},
		},
		{
			name: "webauth-user",
			pol: &policyv2.Policy{
				ACLs: []policyv2.ACL{
					{
						Action:  "accept",
						Sources: []policyv2.Alias{wildcard()},
						Destinations: []policyv2.AliasWithPorts{
							aliasWithPorts(wildcard(), tailcfg.PortRangeAny),
						},
					},
				},
				AutoApprovers: policyv2.AutoApproverPolicy{
					Routes: map[netip.Prefix]policyv2.AutoApprovers{
						bigRoute: {usernameApprover("user1@")},
					},
					ExitNode: policyv2.AutoApprovers{usernameApprover("user1@")},
				},
			},
			approver: "user1@",
			spec: ScenarioSpec{
				NodesPerUser: 3,
				Users:        []string{"user1", "user2"},
				Networks: map[string][]string{
					"usernet1": {"user1"},
					"usernet2": {"user2"},
				},
				ExtraService: map[string][]extraServiceFunc{
					"usernet1": {Webservice},
				},
				// We build the head image with curl and traceroute, so only use
				// that for this test.
				Versions: []string{"head"},
			},
			withURL: true,
		},
		{
			name: "webauth-tag",
			pol: &policyv2.Policy{
				ACLs: []policyv2.ACL{
					{
						Action:  "accept",
						Sources: []policyv2.Alias{wildcard()},
						Destinations: []policyv2.AliasWithPorts{
							aliasWithPorts(wildcard(), tailcfg.PortRangeAny),
						},
					},
				},
				TagOwners: policyv2.TagOwners{
					policyv2.Tag("tag:approve"): policyv2.Owners{usernameOwner("user1@")},
				},
				AutoApprovers: policyv2.AutoApproverPolicy{
					Routes: map[netip.Prefix]policyv2.AutoApprovers{
						bigRoute: {tagApprover("tag:approve")},
					},
					ExitNode: policyv2.AutoApprovers{tagApprover("tag:approve")},
				},
			},
			approver: "tag:approve",
			spec: ScenarioSpec{
				NodesPerUser: 3,
				Users:        []string{"user1", "user2"},
				Networks: map[string][]string{
					"usernet1": {"user1"},
					"usernet2": {"user2"},
				},
				ExtraService: map[string][]extraServiceFunc{
					"usernet1": {Webservice},
				},
				// We build the head image with curl and traceroute, so only use
				// that for this test.
				Versions: []string{"head"},
			},
			withURL: true,
		},
		{
			name: "webauth-group",
			pol: &policyv2.Policy{
				ACLs: []policyv2.ACL{
					{
						Action:  "accept",
						Sources: []policyv2.Alias{wildcard()},
						Destinations: []policyv2.AliasWithPorts{
							aliasWithPorts(wildcard(), tailcfg.PortRangeAny),
						},
					},
				},
				Groups: policyv2.Groups{
					policyv2.Group("group:approve"): []policyv2.Username{policyv2.Username("user1@")},
				},
				AutoApprovers: policyv2.AutoApproverPolicy{
					Routes: map[netip.Prefix]policyv2.AutoApprovers{
						bigRoute: {groupApprover("group:approve")},
					},
					ExitNode: policyv2.AutoApprovers{groupApprover("group:approve")},
				},
			},
			approver: "group:approve",
			spec: ScenarioSpec{
				NodesPerUser: 3,
				Users:        []string{"user1", "user2"},
				Networks: map[string][]string{
					"usernet1": {"user1"},
					"usernet2": {"user2"},
				},
				ExtraService: map[string][]extraServiceFunc{
					"usernet1": {Webservice},
				},
				// We build the head image with curl and traceroute, so only use
				// that for this test.
				Versions: []string{"head"},
			},
			withURL: true,
		},
	}

	for _, tt := range tests {
		for _, polMode := range []types.PolicyMode{types.PolicyModeDB, types.PolicyModeFile} {
			for _, advertiseDuringUp := range []bool{false, true} {
				name := fmt.Sprintf("%s-advertiseduringup-%t-pol-%s", tt.name, advertiseDuringUp, polMode)
				t.Run(name, func(t *testing.T) {
					scenario, err := NewScenario(tt.spec)
					require.NoErrorf(t, err, "failed to create scenario: %s", err)
					defer scenario.ShutdownAssertNoPanics(t)

					opts := []hsic.Option{
						hsic.WithTestName("autoapprovemulti"),
						hsic.WithEmbeddedDERPServerOnly(),
						hsic.WithTLS(),
						hsic.WithACLPolicy(tt.pol),
						hsic.WithPolicyMode(polMode),
					}

					tsOpts := []tsic.Option{
						tsic.WithAcceptRoutes(),
					}

					if tt.approver == "tag:approve" {
						tsOpts = append(tsOpts,
							tsic.WithTags([]string{"tag:approve"}),
						)
					}

					route, err := scenario.SubnetOfNetwork("usernet1")
					require.NoError(t, err)

					err = scenario.createHeadscaleEnv(tt.withURL, tsOpts,
						opts...,
					)
					assertNoErrHeadscaleEnv(t, err)

					allClients, err := scenario.ListTailscaleClients()
					assertNoErrListClients(t, err)

					err = scenario.WaitForTailscaleSync()
					assertNoErrSync(t, err)

					services, err := scenario.Services("usernet1")
					require.NoError(t, err)
					require.Len(t, services, 1)

					usernet1, err := scenario.Network("usernet1")
					require.NoError(t, err)

					headscale, err := scenario.Headscale()
					assertNoErrGetHeadscale(t, err)
					assert.NotNil(t, headscale)

					// Set the route of usernet1 to be autoapproved
					var approvers policyv2.AutoApprovers
					switch {
					case strings.HasPrefix(tt.approver, "tag:"):
						approvers = append(approvers, tagApprover(tt.approver))
					case strings.HasPrefix(tt.approver, "group:"):
						approvers = append(approvers, groupApprover(tt.approver))
					default:
						approvers = append(approvers, usernameApprover(tt.approver))
					}
					if tt.pol.AutoApprovers.Routes == nil {
						tt.pol.AutoApprovers.Routes = make(map[netip.Prefix]policyv2.AutoApprovers)
					}
					prefix := *route
					tt.pol.AutoApprovers.Routes[prefix] = approvers
					err = headscale.SetPolicy(tt.pol)
					require.NoError(t, err)

					if advertiseDuringUp {
						tsOpts = append(tsOpts,
							tsic.WithExtraLoginArgs([]string{"--advertise-routes=" + route.String()}),
						)
					}

					tsOpts = append(tsOpts, tsic.WithNetwork(usernet1))

					// This whole dance is to add a node _after_ all the other nodes
					// with an additional tsOpt which advertises the route as part
					// of the `tailscale up` command. If we do this as part of the
					// scenario creation, it will be added to all nodes and turn
					// into a HA node, which isnt something we are testing here.
					routerUsernet1, err := scenario.CreateTailscaleNode("head", tsOpts...)
					require.NoError(t, err)
					defer routerUsernet1.Shutdown()

					if tt.withURL {
						u, err := routerUsernet1.LoginWithURL(headscale.GetEndpoint())
						assertNoErr(t, err)

						body, err := doLoginURL(routerUsernet1.Hostname(), u)
						assertNoErr(t, err)

						scenario.runHeadscaleRegister("user1", body)
					} else {
						userMap, err := headscale.MapUsers()
						assertNoErr(t, err)

						pak, err := scenario.CreatePreAuthKey(userMap["user1"].GetId(), false, false)
						assertNoErr(t, err)

						err = routerUsernet1.Login(headscale.GetEndpoint(), pak.GetKey())
						assertNoErr(t, err)
					}
					// extra creation end.

					routerUsernet1ID := routerUsernet1.MustID()

					web := services[0]
					webip := netip.MustParseAddr(web.GetIPInNetwork(usernet1))
					weburl := fmt.Sprintf("http://%s/etc/hostname", webip)
					t.Logf("webservice: %s, %s", webip.String(), weburl)

					// Sort nodes by ID
					sort.SliceStable(allClients, func(i, j int) bool {
						statusI := allClients[i].MustStatus()
						statusJ := allClients[j].MustStatus()

						return statusI.Self.ID < statusJ.Self.ID
					})

					// This is ok because the scenario makes users in order, so the three first
					// nodes, which are subnet routes, will be created first, and the last user
					// will be created with the second.
					routerSubRoute := allClients[1]
					routerExitNode := allClients[2]

					client := allClients[3]

					if !advertiseDuringUp {
						// Advertise the route for the dockersubnet of user1
						command := []string{
							"tailscale",
							"set",
							"--advertise-routes=" + route.String(),
						}
						_, _, err = routerUsernet1.Execute(command)
						require.NoErrorf(t, err, "failed to advertise route: %s", err)
					}

					time.Sleep(5 * time.Second)

					// These route should auto approve, so the node is expected to have a route
					// for all counts.
					nodes, err := headscale.ListNodes()
					require.NoError(t, err)
					requireNodeRouteCount(t, MustFindNode(routerUsernet1.Hostname(), nodes), 1, 1, 1)

					// Verify that the routes have been sent to the client.
					status, err := client.Status()
					require.NoError(t, err)

					for _, peerKey := range status.Peers() {
						peerStatus := status.Peer[peerKey]

						if peerStatus.ID == routerUsernet1ID.StableID() {
							assert.Contains(t, peerStatus.PrimaryRoutes.AsSlice(), *route)
							requirePeerSubnetRoutes(t, peerStatus, []netip.Prefix{*route})
						} else {
							requirePeerSubnetRoutes(t, peerStatus, nil)
						}
					}

					url := fmt.Sprintf("http://%s/etc/hostname", webip)
					t.Logf("url from %s to %s", client.Hostname(), url)

					result, err := client.Curl(url)
					require.NoError(t, err)
					assert.Len(t, result, 13)

					tr, err := client.Traceroute(webip)
					require.NoError(t, err)
					assertTracerouteViaIP(t, tr, routerUsernet1.MustIPv4())

					// Remove the auto approval from the policy, any routes already enabled should be allowed.
					prefix = *route
					delete(tt.pol.AutoApprovers.Routes, prefix)
					err = headscale.SetPolicy(tt.pol)
					require.NoError(t, err)

					time.Sleep(5 * time.Second)

					// These route should auto approve, so the node is expected to have a route
					// for all counts.
					nodes, err = headscale.ListNodes()
					require.NoError(t, err)
					requireNodeRouteCount(t, MustFindNode(routerUsernet1.Hostname(), nodes), 1, 1, 1)

					// Verify that the routes have been sent to the client.
					status, err = client.Status()
					require.NoError(t, err)

					for _, peerKey := range status.Peers() {
						peerStatus := status.Peer[peerKey]

						if peerStatus.ID == routerUsernet1ID.StableID() {
							assert.Contains(t, peerStatus.PrimaryRoutes.AsSlice(), *route)
							requirePeerSubnetRoutes(t, peerStatus, []netip.Prefix{*route})
						} else {
							requirePeerSubnetRoutes(t, peerStatus, nil)
						}
					}

					url = fmt.Sprintf("http://%s/etc/hostname", webip)
					t.Logf("url from %s to %s", client.Hostname(), url)

					result, err = client.Curl(url)
					require.NoError(t, err)
					assert.Len(t, result, 13)

					tr, err = client.Traceroute(webip)
					require.NoError(t, err)
					assertTracerouteViaIP(t, tr, routerUsernet1.MustIPv4())

					// Disable the route, making it unavailable since it is no longer auto-approved
					_, err = headscale.ApproveRoutes(
						MustFindNode(routerUsernet1.Hostname(), nodes).GetId(),
						[]netip.Prefix{},
					)
					require.NoError(t, err)

					time.Sleep(5 * time.Second)

					// These route should auto approve, so the node is expected to have a route
					// for all counts.
					nodes, err = headscale.ListNodes()
					require.NoError(t, err)
					requireNodeRouteCount(t, MustFindNode(routerUsernet1.Hostname(), nodes), 1, 0, 0)

					// Verify that the routes have been sent to the client.
					status, err = client.Status()
					require.NoError(t, err)

					for _, peerKey := range status.Peers() {
						peerStatus := status.Peer[peerKey]
						requirePeerSubnetRoutes(t, peerStatus, nil)
					}

					// Add the route back to the auto approver in the policy, the route should
					// now become available again.
					var newApprovers policyv2.AutoApprovers
					switch {
					case strings.HasPrefix(tt.approver, "tag:"):
						newApprovers = append(newApprovers, tagApprover(tt.approver))
					case strings.HasPrefix(tt.approver, "group:"):
						newApprovers = append(newApprovers, groupApprover(tt.approver))
					default:
						newApprovers = append(newApprovers, usernameApprover(tt.approver))
					}
					if tt.pol.AutoApprovers.Routes == nil {
						tt.pol.AutoApprovers.Routes = make(map[netip.Prefix]policyv2.AutoApprovers)
					}
					prefix = *route
					tt.pol.AutoApprovers.Routes[prefix] = newApprovers
					err = headscale.SetPolicy(tt.pol)
					require.NoError(t, err)

					time.Sleep(5 * time.Second)

					// These route should auto approve, so the node is expected to have a route
					// for all counts.
					nodes, err = headscale.ListNodes()
					require.NoError(t, err)
					requireNodeRouteCount(t, MustFindNode(routerUsernet1.Hostname(), nodes), 1, 1, 1)

					// Verify that the routes have been sent to the client.
					status, err = client.Status()
					require.NoError(t, err)

					for _, peerKey := range status.Peers() {
						peerStatus := status.Peer[peerKey]

						if peerStatus.ID == routerUsernet1ID.StableID() {
							require.NotNil(t, peerStatus.PrimaryRoutes)
							assert.Contains(t, peerStatus.PrimaryRoutes.AsSlice(), *route)
							requirePeerSubnetRoutes(t, peerStatus, []netip.Prefix{*route})
						} else {
							requirePeerSubnetRoutes(t, peerStatus, nil)
						}
					}

					url = fmt.Sprintf("http://%s/etc/hostname", webip)
					t.Logf("url from %s to %s", client.Hostname(), url)

					result, err = client.Curl(url)
					require.NoError(t, err)
					assert.Len(t, result, 13)

					tr, err = client.Traceroute(webip)
					require.NoError(t, err)
					assertTracerouteViaIP(t, tr, routerUsernet1.MustIPv4())

					// Advertise and validate a subnet of an auto approved route, /24 inside the
					// auto approved /16.
					command := []string{
						"tailscale",
						"set",
						"--advertise-routes=" + subRoute.String(),
					}
					_, _, err = routerSubRoute.Execute(command)
					require.NoErrorf(t, err, "failed to advertise route: %s", err)

					time.Sleep(5 * time.Second)

					// These route should auto approve, so the node is expected to have a route
					// for all counts.
					nodes, err = headscale.ListNodes()
					require.NoError(t, err)
					requireNodeRouteCount(t, MustFindNode(routerUsernet1.Hostname(), nodes), 1, 1, 1)
					requireNodeRouteCount(t, nodes[1], 1, 1, 1)

					// Verify that the routes have been sent to the client.
					status, err = client.Status()
					require.NoError(t, err)

					for _, peerKey := range status.Peers() {
						peerStatus := status.Peer[peerKey]

						if peerStatus.ID == routerUsernet1ID.StableID() {
							assert.Contains(t, peerStatus.PrimaryRoutes.AsSlice(), *route)
							requirePeerSubnetRoutes(t, peerStatus, []netip.Prefix{*route})
						} else if peerStatus.ID == "2" {
							assert.Contains(t, peerStatus.PrimaryRoutes.AsSlice(), subRoute)
							requirePeerSubnetRoutes(t, peerStatus, []netip.Prefix{subRoute})
						} else {
							requirePeerSubnetRoutes(t, peerStatus, nil)
						}
					}

					// Advertise a not approved route will not end up anywhere
					command = []string{
						"tailscale",
						"set",
						"--advertise-routes=" + notApprovedRoute.String(),
					}
					_, _, err = routerSubRoute.Execute(command)
					require.NoErrorf(t, err, "failed to advertise route: %s", err)

					time.Sleep(5 * time.Second)

					// These route should auto approve, so the node is expected to have a route
					// for all counts.
					nodes, err = headscale.ListNodes()
					require.NoError(t, err)
					requireNodeRouteCount(t, MustFindNode(routerUsernet1.Hostname(), nodes), 1, 1, 1)
					requireNodeRouteCount(t, nodes[1], 1, 1, 0)
					requireNodeRouteCount(t, nodes[2], 0, 0, 0)

					// Verify that the routes have been sent to the client.
					status, err = client.Status()
					require.NoError(t, err)

					for _, peerKey := range status.Peers() {
						peerStatus := status.Peer[peerKey]

						if peerStatus.ID == routerUsernet1ID.StableID() {
							assert.Contains(t, peerStatus.PrimaryRoutes.AsSlice(), *route)
							requirePeerSubnetRoutes(t, peerStatus, []netip.Prefix{*route})
						} else {
							requirePeerSubnetRoutes(t, peerStatus, nil)
						}
					}

					// Exit routes are also automatically approved
					command = []string{
						"tailscale",
						"set",
						"--advertise-exit-node",
					}
					_, _, err = routerExitNode.Execute(command)
					require.NoErrorf(t, err, "failed to advertise route: %s", err)

					time.Sleep(5 * time.Second)

					nodes, err = headscale.ListNodes()
					require.NoError(t, err)
					requireNodeRouteCount(t, MustFindNode(routerUsernet1.Hostname(), nodes), 1, 1, 1)
					requireNodeRouteCount(t, nodes[1], 1, 1, 0)
					requireNodeRouteCount(t, nodes[2], 2, 2, 2)

					// Verify that the routes have been sent to the client.
					status, err = client.Status()
					require.NoError(t, err)

					for _, peerKey := range status.Peers() {
						peerStatus := status.Peer[peerKey]

						if peerStatus.ID == routerUsernet1ID.StableID() {
							assert.Contains(t, peerStatus.PrimaryRoutes.AsSlice(), *route)
							requirePeerSubnetRoutes(t, peerStatus, []netip.Prefix{*route})
						} else if peerStatus.ID == "3" {
							requirePeerSubnetRoutes(t, peerStatus, []netip.Prefix{tsaddr.AllIPv4(), tsaddr.AllIPv6()})
						} else {
							requirePeerSubnetRoutes(t, peerStatus, nil)
						}
					}
				})
			}
		}
	}
}

func assertTracerouteViaIP(t *testing.T, tr util.Traceroute, ip netip.Addr) {
	t.Helper()

	require.NotNil(t, tr)
	require.True(t, tr.Success)
	require.NoError(t, tr.Err)
	require.NotEmpty(t, tr.Route)
	require.Equal(t, tr.Route[0].IP, ip)
}

// requirePeerSubnetRoutes asserts that the peer has the expected subnet routes.
func requirePeerSubnetRoutes(t *testing.T, status *ipnstate.PeerStatus, expected []netip.Prefix) {
	t.Helper()
	if status.AllowedIPs.Len() <= 2 && len(expected) != 0 {
		t.Fatalf("peer %s (%s) has no subnet routes, expected %v", status.HostName, status.ID, expected)
		return
	}

	if len(expected) == 0 {
		expected = []netip.Prefix{}
	}

	got := slicesx.Filter(nil, status.AllowedIPs.AsSlice(), func(p netip.Prefix) bool {
		if tsaddr.IsExitRoute(p) {
			return true
		}
		return !slices.ContainsFunc(status.TailscaleIPs, p.Contains)
	})

	if diff := cmpdiff.Diff(expected, got, util.PrefixComparer, cmpopts.EquateEmpty()); diff != "" {
		t.Fatalf("peer %s (%s) subnet routes, unexpected result (-want +got):\n%s", status.HostName, status.ID, diff)
	}
}

func requireNodeRouteCount(t *testing.T, node *v1.Node, announced, approved, subnet int) {
	t.Helper()
	require.Lenf(t, node.GetAvailableRoutes(), announced, "expected %q announced routes(%v) to have %d route, had %d", node.GetName(), node.GetAvailableRoutes(), announced, len(node.GetAvailableRoutes()))
	require.Lenf(t, node.GetApprovedRoutes(), approved, "expected %q approved routes(%v) to have %d route, had %d", node.GetName(), node.GetApprovedRoutes(), approved, len(node.GetApprovedRoutes()))
	require.Lenf(t, node.GetSubnetRoutes(), subnet, "expected %q subnet routes(%v) to have %d route, had %d", node.GetName(), node.GetSubnetRoutes(), subnet, len(node.GetSubnetRoutes()))
}

// TestSubnetRouteACLFiltering tests that a node can only access subnet routes
// that are explicitly allowed in the ACL.
func TestSubnetRouteACLFiltering(t *testing.T) {
	IntegrationSkip(t)

	// Use router and node users for better clarity
	routerUser := "router"
	nodeUser := "node"

	spec := ScenarioSpec{
		NodesPerUser: 1,
		Users:        []string{routerUser, nodeUser},
		Networks: map[string][]string{
			"usernet1": {routerUser, nodeUser},
		},
		ExtraService: map[string][]extraServiceFunc{
			"usernet1": {Webservice},
		},
		// We build the head image with curl and traceroute, so only use
		// that for this test.
		Versions: []string{"head"},
	}

	scenario, err := NewScenario(spec)
	require.NoErrorf(t, err, "failed to create scenario: %s", err)
	defer scenario.ShutdownAssertNoPanics(t)

	// Set up the ACL policy that allows the node to access only one of the subnet routes (10.10.10.0/24)
	aclPolicyStr := `{
		"hosts": {
			"router": "100.64.0.1/32",
			"node": "100.64.0.2/32"
		},
		"acls": [
			{
				"action": "accept",
				"src": [
					"*"
				],
				"dst": [
					"router:8000"
				]
			},
			{
				"action": "accept",
				"src": [
					"node"
				],
				"dst": [
					"*:*"
				]
			}
		]
	}`

	route, err := scenario.SubnetOfNetwork("usernet1")
	require.NoError(t, err)

	services, err := scenario.Services("usernet1")
	require.NoError(t, err)
	require.Len(t, services, 1)

	usernet1, err := scenario.Network("usernet1")
	require.NoError(t, err)

	web := services[0]
	webip := netip.MustParseAddr(web.GetIPInNetwork(usernet1))
	weburl := fmt.Sprintf("http://%s/etc/hostname", webip)
	t.Logf("webservice: %s, %s", webip.String(), weburl)

	aclPolicy := &policyv2.Policy{}
	err = json.Unmarshal([]byte(aclPolicyStr), aclPolicy)
	require.NoError(t, err)

	err = scenario.CreateHeadscaleEnv([]tsic.Option{
		tsic.WithAcceptRoutes(),
	}, hsic.WithTestName("routeaclfilter"),
		hsic.WithACLPolicy(aclPolicy),
		hsic.WithPolicyMode(types.PolicyModeDB),
	)
	assertNoErrHeadscaleEnv(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	headscale, err := scenario.Headscale()
	assertNoErrGetHeadscale(t, err)

	// Sort clients by ID for consistent order
	slices.SortFunc(allClients, func(a, b TailscaleClient) int {
		return b.MustIPv4().Compare(a.MustIPv4())
	})

	// Get the router and node clients
	routerClient := allClients[0]
	nodeClient := allClients[1]

	aclPolicy.Hosts = policyv2.Hosts{
		policyv2.Host(routerUser): policyv2.Prefix(must.Get(routerClient.MustIPv4().Prefix(32))),
		policyv2.Host(nodeUser):   policyv2.Prefix(must.Get(nodeClient.MustIPv4().Prefix(32))),
	}
	aclPolicy.ACLs[1].Destinations = []policyv2.AliasWithPorts{
		aliasWithPorts(prefixp(route.String()), tailcfg.PortRangeAny),
	}
	require.NoError(t, headscale.SetPolicy(aclPolicy))

	// Set up the subnet routes for the router
	routes := []netip.Prefix{
		*route,                                 // This should be accessible by the client
		netip.MustParsePrefix("10.10.11.0/24"), // These should NOT be accessible
		netip.MustParsePrefix("10.10.12.0/24"),
	}

	routeArg := "--advertise-routes=" + routes[0].String() + "," + routes[1].String() + "," + routes[2].String()
	command := []string{
		"tailscale",
		"set",
		routeArg,
	}

	_, _, err = routerClient.Execute(command)
	require.NoErrorf(t, err, "failed to advertise routes: %s", err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	// List nodes and verify the router has 3 available routes
	nodes, err := headscale.NodesByUser()
	require.NoError(t, err)
	require.Len(t, nodes, 2)

	// Find the router node
	routerNode := nodes[routerUser][0]
	nodeNode := nodes[nodeUser][0]

	require.NotNil(t, routerNode, "Router node not found")
	require.NotNil(t, nodeNode, "Client node not found")

	// Check that the router has 3 routes available but not approved yet
	requireNodeRouteCount(t, routerNode, 3, 0, 0)
	requireNodeRouteCount(t, nodeNode, 0, 0, 0)

	// Approve all routes for the router
	_, err = headscale.ApproveRoutes(
		routerNode.GetId(),
		util.MustStringsToPrefixes(routerNode.GetAvailableRoutes()),
	)
	require.NoError(t, err)

	// Give some time for the routes to propagate
	time.Sleep(5 * time.Second)

	// List nodes and verify the router has 3 available routes
	nodes, err = headscale.NodesByUser()
	require.NoError(t, err)
	require.Len(t, nodes, 2)

	// Find the router node
	routerNode = nodes[routerUser][0]

	// Check that the router has 3 routes now approved and available
	requireNodeRouteCount(t, routerNode, 3, 3, 3)

	// Now check the client node status
	nodeStatus, err := nodeClient.Status()
	require.NoError(t, err)

	routerStatus, err := routerClient.Status()
	require.NoError(t, err)

	// Check that the node can see the subnet routes from the router
	routerPeerStatus := nodeStatus.Peer[routerStatus.Self.PublicKey]

	// The node should only have 1 subnet route
	requirePeerSubnetRoutes(t, routerPeerStatus, []netip.Prefix{*route})

	result, err := nodeClient.Curl(weburl)
	require.NoError(t, err)
	assert.Len(t, result, 13)

	tr, err := nodeClient.Traceroute(webip)
	require.NoError(t, err)
	assertTracerouteViaIP(t, tr, routerClient.MustIPv4())
}
