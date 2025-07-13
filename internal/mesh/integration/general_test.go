package integration

import (
	"context"
	"encoding/json"
	"fmt"
	"net/netip"
	"strconv"
	"strings"
	"testing"
	"time"

	v1 "github.com/juanfont/headscale/gen/go/headscale/v1"
	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/juanfont/headscale/integration/hsic"
	"github.com/juanfont/headscale/integration/tsic"
	"github.com/rs/zerolog/log"
	"github.com/samber/lo"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/sync/errgroup"
	"tailscale.com/client/tailscale/apitype"
	"tailscale.com/types/key"
)

func TestPingAllByIP(t *testing.T) {
	IntegrationSkip(t)

	spec := ScenarioSpec{
		NodesPerUser: len(MustTestVersions),
		Users:        []string{"user1", "user2"},
		MaxWait:      dockertestMaxWait(),
	}

	scenario, err := NewScenario(spec)
	assertNoErr(t, err)
	defer scenario.ShutdownAssertNoPanics(t)

	err = scenario.CreateHeadscaleEnv(
		[]tsic.Option{},
		hsic.WithTestName("pingallbyip"),
		hsic.WithEmbeddedDERPServerOnly(),
		hsic.WithTLS(),
		hsic.WithIPAllocationStrategy(types.IPAllocationStrategyRandom),
	)
	assertNoErrHeadscaleEnv(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	allIps, err := scenario.ListTailscaleClientsIPs()
	assertNoErrListClientIPs(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	// assertClientsState(t, allClients)

	allAddrs := lo.Map(allIps, func(x netip.Addr, index int) string {
		return x.String()
	})

	success := pingAllHelper(t, allClients, allAddrs)
	t.Logf("%d successful pings out of %d", success, len(allClients)*len(allIps))
}

func TestPingAllByIPPublicDERP(t *testing.T) {
	IntegrationSkip(t)

	spec := ScenarioSpec{
		NodesPerUser: len(MustTestVersions),
		Users:        []string{"user1", "user2"},
	}

	scenario, err := NewScenario(spec)
	assertNoErr(t, err)
	defer scenario.ShutdownAssertNoPanics(t)

	err = scenario.CreateHeadscaleEnv(
		[]tsic.Option{},
		hsic.WithTestName("pingallbyippubderp"),
	)
	assertNoErrHeadscaleEnv(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	allIps, err := scenario.ListTailscaleClientsIPs()
	assertNoErrListClientIPs(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	// assertClientsState(t, allClients)

	allAddrs := lo.Map(allIps, func(x netip.Addr, index int) string {
		return x.String()
	})

	success := pingAllHelper(t, allClients, allAddrs)
	t.Logf("%d successful pings out of %d", success, len(allClients)*len(allIps))
}

func TestEphemeral(t *testing.T) {
	testEphemeralWithOptions(t, hsic.WithTestName("ephemeral"))
}

func TestEphemeralInAlternateTimezone(t *testing.T) {
	testEphemeralWithOptions(
		t,
		hsic.WithTestName("ephemeral-tz"),
		hsic.WithTimezone("America/Los_Angeles"),
	)
}

func testEphemeralWithOptions(t *testing.T, opts ...hsic.Option) {
	IntegrationSkip(t)

	spec := ScenarioSpec{
		NodesPerUser: len(MustTestVersions),
		Users:        []string{"user1", "user2"},
	}

	scenario, err := NewScenario(spec)
	assertNoErr(t, err)
	defer scenario.ShutdownAssertNoPanics(t)

	headscale, err := scenario.Headscale(opts...)
	assertNoErrHeadscaleEnv(t, err)

	for _, userName := range spec.Users {
		user, err := scenario.CreateUser(userName)
		if err != nil {
			t.Fatalf("failed to create user %s: %s", userName, err)
		}

		err = scenario.CreateTailscaleNodesInUser(userName, "all", spec.NodesPerUser, tsic.WithNetwork(scenario.networks[scenario.testDefaultNetwork]))
		if err != nil {
			t.Fatalf("failed to create tailscale nodes in user %s: %s", userName, err)
		}

		key, err := scenario.CreatePreAuthKey(user.GetId(), true, true)
		if err != nil {
			t.Fatalf("failed to create pre-auth key for user %s: %s", userName, err)
		}

		err = scenario.RunTailscaleUp(userName, headscale.GetEndpoint(), key.GetKey())
		if err != nil {
			t.Fatalf("failed to run tailscale up for user %s: %s", userName, err)
		}
	}

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	allIps, err := scenario.ListTailscaleClientsIPs()
	assertNoErrListClientIPs(t, err)

	allAddrs := lo.Map(allIps, func(x netip.Addr, index int) string {
		return x.String()
	})

	success := pingAllHelper(t, allClients, allAddrs)
	t.Logf("%d successful pings out of %d", success, len(allClients)*len(allIps))

	for _, client := range allClients {
		err := client.Logout()
		if err != nil {
			t.Fatalf("failed to logout client %s: %s", client.Hostname(), err)
		}
	}

	err = scenario.WaitForTailscaleLogout()
	assertNoErrLogout(t, err)

	t.Logf("all clients logged out")

	nodes, err := headscale.ListNodes()
	assertNoErr(t, err)
	require.Len(t, nodes, 0)
}

// TestEphemeral2006DeletedTooQuickly verifies that ephemeral nodes are not
// deleted by accident if they are still online and active.
func TestEphemeral2006DeletedTooQuickly(t *testing.T) {
	IntegrationSkip(t)

	spec := ScenarioSpec{
		NodesPerUser: len(MustTestVersions),
		Users:        []string{"user1", "user2"},
	}

	scenario, err := NewScenario(spec)
	assertNoErr(t, err)
	defer scenario.ShutdownAssertNoPanics(t)

	headscale, err := scenario.Headscale(
		hsic.WithTestName("ephemeral2006"),
		hsic.WithConfigEnv(map[string]string{
			"HEADSCALE_EPHEMERAL_NODE_INACTIVITY_TIMEOUT": "1m6s",
		}),
	)
	assertNoErrHeadscaleEnv(t, err)

	for _, userName := range spec.Users {
		user, err := scenario.CreateUser(userName)
		if err != nil {
			t.Fatalf("failed to create user %s: %s", userName, err)
		}

		err = scenario.CreateTailscaleNodesInUser(userName, "all", spec.NodesPerUser, tsic.WithNetwork(scenario.networks[scenario.testDefaultNetwork]))
		if err != nil {
			t.Fatalf("failed to create tailscale nodes in user %s: %s", userName, err)
		}

		key, err := scenario.CreatePreAuthKey(user.GetId(), true, true)
		if err != nil {
			t.Fatalf("failed to create pre-auth key for user %s: %s", userName, err)
		}

		err = scenario.RunTailscaleUp(userName, headscale.GetEndpoint(), key.GetKey())
		if err != nil {
			t.Fatalf("failed to run tailscale up for user %s: %s", userName, err)
		}
	}

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	allIps, err := scenario.ListTailscaleClientsIPs()
	assertNoErrListClientIPs(t, err)

	allAddrs := lo.Map(allIps, func(x netip.Addr, index int) string {
		return x.String()
	})

	// All ephemeral nodes should be online and reachable.
	success := pingAllHelper(t, allClients, allAddrs)
	t.Logf("%d successful pings out of %d", success, len(allClients)*len(allIps))

	// Take down all clients, this should start an expiry timer for each.
	for _, client := range allClients {
		err := client.Down()
		if err != nil {
			t.Fatalf("failed to take down client %s: %s", client.Hostname(), err)
		}
	}

	// Wait a bit and bring up the clients again before the expiry
	// time of the ephemeral nodes.
	// Nodes should be able to reconnect and work fine.
	for _, client := range allClients {
		err := client.Up()
		if err != nil {
			t.Fatalf("failed to take down client %s: %s", client.Hostname(), err)
		}
	}

	// Wait for clients to sync and be able to ping each other after reconnection
	assert.EventuallyWithT(t, func(ct *assert.CollectT) {
		err = scenario.WaitForTailscaleSync()
		assert.NoError(ct, err)

		success = pingAllHelper(t, allClients, allAddrs)
		assert.Greater(ct, success, 0, "Ephemeral nodes should be able to reconnect and ping")
	}, 60*time.Second, 2*time.Second)
	t.Logf("%d successful pings out of %d", success, len(allClients)*len(allIps))

	// Take down all clients, this should start an expiry timer for each.
	for _, client := range allClients {
		err := client.Down()
		if err != nil {
			t.Fatalf("failed to take down client %s: %s", client.Hostname(), err)
		}
	}

	// This time wait for all of the nodes to expire and check that they are no longer
	// registered.
	assert.EventuallyWithT(t, func(ct *assert.CollectT) {
		for _, userName := range spec.Users {
			nodes, err := headscale.ListNodes(userName)
			assert.NoError(ct, err)
			assert.Len(ct, nodes, 0, "Ephemeral nodes should be expired and removed for user %s", userName)
		}
	}, 4*time.Minute, 10*time.Second)

	for _, userName := range spec.Users {
		nodes, err := headscale.ListNodes(userName)
		if err != nil {
			log.Error().
				Err(err).
				Str("user", userName).
				Msg("Error listing nodes in user")

			return
		}

		if len(nodes) != 0 {
			t.Fatalf("expected no nodes, got %d in user %s", len(nodes), userName)
		}
	}
}

func TestPingAllByHostname(t *testing.T) {
	IntegrationSkip(t)

	spec := ScenarioSpec{
		NodesPerUser: len(MustTestVersions),
		Users:        []string{"user1", "user2"},
	}

	scenario, err := NewScenario(spec)
	assertNoErr(t, err)
	defer scenario.ShutdownAssertNoPanics(t)

	err = scenario.CreateHeadscaleEnv([]tsic.Option{}, hsic.WithTestName("pingallbyname"))
	assertNoErrHeadscaleEnv(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	// assertClientsState(t, allClients)

	allHostnames, err := scenario.ListTailscaleClientsFQDNs()
	assertNoErrListFQDN(t, err)

	success := pingAllHelper(t, allClients, allHostnames)

	t.Logf("%d successful pings out of %d", success, len(allClients)*len(allClients))
}

// If subtests are parallel, then they will start before setup is run.
// This might mean we approach setup slightly wrong, but for now, ignore
// the linter
// nolint:tparallel
func TestTaildrop(t *testing.T) {
	IntegrationSkip(t)

	spec := ScenarioSpec{
		NodesPerUser: len(MustTestVersions),
		Users:        []string{"user1"},
	}

	scenario, err := NewScenario(spec)
	assertNoErr(t, err)
	defer scenario.ShutdownAssertNoPanics(t)

	err = scenario.CreateHeadscaleEnv([]tsic.Option{},
		hsic.WithTestName("taildrop"),
		hsic.WithEmbeddedDERPServerOnly(),
		hsic.WithTLS(),
	)
	assertNoErrHeadscaleEnv(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	// This will essentially fetch and cache all the FQDNs
	_, err = scenario.ListTailscaleClientsFQDNs()
	assertNoErrListFQDN(t, err)

	for _, client := range allClients {
		if !strings.Contains(client.Hostname(), "head") {
			command := []string{"apk", "add", "curl"}
			_, _, err := client.Execute(command)
			if err != nil {
				t.Fatalf("failed to install curl on %s, err: %s", client.Hostname(), err)
			}
		}
		curlCommand := []string{
			"curl",
			"--unix-socket",
			"/var/run/tailscale/tailscaled.sock",
			"http://local-tailscaled.sock/localapi/v0/file-targets",
		}
		assert.EventuallyWithT(t, func(ct *assert.CollectT) {
			result, _, err := client.Execute(curlCommand)
			assert.NoError(ct, err)

			var fts []apitype.FileTarget
			err = json.Unmarshal([]byte(result), &fts)
			assert.NoError(ct, err)

			if len(fts) != len(allClients)-1 {
				ftStr := fmt.Sprintf("FileTargets for %s:\n", client.Hostname())
				for _, ft := range fts {
					ftStr += fmt.Sprintf("\t%s\n", ft.Node.Name)
				}
				assert.Failf(ct, "client %s does not have all its peers as FileTargets",
					"got %d, want: %d\n%s",
					len(fts),
					len(allClients)-1,
					ftStr,
				)
			}
		}, 10*time.Second, 1*time.Second)
	}

	for _, client := range allClients {
		command := []string{"touch", fmt.Sprintf("/tmp/file_from_%s", client.Hostname())}

		if _, _, err := client.Execute(command); err != nil {
			t.Fatalf("failed to create taildrop file on %s, err: %s", client.Hostname(), err)
		}

		for _, peer := range allClients {
			if client.Hostname() == peer.Hostname() {
				continue
			}

			// It is safe to ignore this error as we handled it when caching it
			peerFQDN, _ := peer.FQDN()

			t.Run(fmt.Sprintf("%s-%s", client.Hostname(), peer.Hostname()), func(t *testing.T) {
				command := []string{
					"tailscale", "file", "cp",
					fmt.Sprintf("/tmp/file_from_%s", client.Hostname()),
					fmt.Sprintf("%s:", peerFQDN),
				}

				assert.EventuallyWithT(t, func(ct *assert.CollectT) {
					t.Logf(
						"Sending file from %s to %s\n",
						client.Hostname(),
						peer.Hostname(),
					)
					_, _, err := client.Execute(command)
					assert.NoError(ct, err)
				}, 10*time.Second, 1*time.Second)
			})
		}
	}

	for _, client := range allClients {
		command := []string{
			"tailscale", "file",
			"get",
			"/tmp/",
		}
		if _, _, err := client.Execute(command); err != nil {
			t.Fatalf("failed to get taildrop file on %s, err: %s", client.Hostname(), err)
		}

		for _, peer := range allClients {
			if client.Hostname() == peer.Hostname() {
				continue
			}

			t.Run(fmt.Sprintf("%s-%s", client.Hostname(), peer.Hostname()), func(t *testing.T) {
				command := []string{
					"ls",
					fmt.Sprintf("/tmp/file_from_%s", peer.Hostname()),
				}
				log.Printf(
					"Checking file in %s from %s\n",
					client.Hostname(),
					peer.Hostname(),
				)

				result, _, err := client.Execute(command)
				assertNoErrf(t, "failed to execute command to ls taildrop: %s", err)

				log.Printf("Result for %s: %s\n", peer.Hostname(), result)
				if fmt.Sprintf("/tmp/file_from_%s\n", peer.Hostname()) != result {
					t.Fatalf(
						"taildrop result is not correct %s, wanted %s",
						result,
						fmt.Sprintf("/tmp/file_from_%s\n", peer.Hostname()),
					)
				}
			})
		}
	}
}

func TestUpdateHostnameFromClient(t *testing.T) {
	IntegrationSkip(t)

	hostnames := map[string]string{
		"1": "user1-host",
		"2": "User2-Host",
		"3": "user3-host",
	}

	spec := ScenarioSpec{
		NodesPerUser: 3,
		Users:        []string{"user1"},
	}

	scenario, err := NewScenario(spec)
	assertNoErrf(t, "failed to create scenario: %s", err)
	defer scenario.ShutdownAssertNoPanics(t)

	err = scenario.CreateHeadscaleEnv([]tsic.Option{}, hsic.WithTestName("updatehostname"))
	assertNoErrHeadscaleEnv(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	headscale, err := scenario.Headscale()
	assertNoErrGetHeadscale(t, err)

	// update hostnames using the up command
	for _, client := range allClients {
		status, err := client.Status()
		assertNoErr(t, err)

		command := []string{
			"tailscale",
			"set",
			"--hostname=" + hostnames[string(status.Self.ID)],
		}
		_, _, err = client.Execute(command)
		assertNoErrf(t, "failed to set hostname: %s", err)
	}

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	var nodes []*v1.Node
	err = executeAndUnmarshal(
		headscale,
		[]string{
			"headscale",
			"node",
			"list",
			"--output",
			"json",
		},
		&nodes,
	)

	assertNoErr(t, err)
	assert.Len(t, nodes, 3)

	for _, node := range nodes {
		hostname := hostnames[strconv.FormatUint(node.GetId(), 10)]
		assert.Equal(t, hostname, node.GetName())
		assert.Equal(t, util.ConvertWithFQDNRules(hostname), node.GetGivenName())
	}

	// Rename givenName in nodes
	for _, node := range nodes {
		givenName := fmt.Sprintf("%d-givenname", node.GetId())
		_, err = headscale.Execute(
			[]string{
				"headscale",
				"node",
				"rename",
				givenName,
				"--identifier",
				strconv.FormatUint(node.GetId(), 10),
			})
		assertNoErr(t, err)
	}

	// Verify that the server-side rename is reflected in DNSName while HostName remains unchanged
	assert.EventuallyWithT(t, func(ct *assert.CollectT) {
		// Build a map of expected DNSNames by node ID
		expectedDNSNames := make(map[string]string)
		for _, node := range nodes {
			nodeID := strconv.FormatUint(node.GetId(), 10)
			expectedDNSNames[nodeID] = fmt.Sprintf("%d-givenname.headscale.net.", node.GetId())
		}

		// Verify from each client's perspective
		for _, client := range allClients {
			status, err := client.Status()
			assert.NoError(ct, err)

			// Check self node
			selfID := string(status.Self.ID)
			expectedDNS := expectedDNSNames[selfID]
			assert.Equal(ct, expectedDNS, status.Self.DNSName,
				"Self DNSName should be renamed for client %s (ID: %s)", client.Hostname(), selfID)

			// HostName should remain as the original client-reported hostname
			originalHostname := hostnames[selfID]
			assert.Equal(ct, originalHostname, status.Self.HostName,
				"Self HostName should remain unchanged for client %s (ID: %s)", client.Hostname(), selfID)

			// Check peers
			for _, peer := range status.Peer {
				peerID := string(peer.ID)
				if expectedDNS, ok := expectedDNSNames[peerID]; ok {
					assert.Equal(ct, expectedDNS, peer.DNSName,
						"Peer DNSName should be renamed for peer ID %s as seen by client %s", peerID, client.Hostname())

					// HostName should remain as the original client-reported hostname
					originalHostname := hostnames[peerID]
					assert.Equal(ct, originalHostname, peer.HostName,
						"Peer HostName should remain unchanged for peer ID %s as seen by client %s", peerID, client.Hostname())
				}
			}
		}
	}, 60*time.Second, 2*time.Second)

	for _, client := range allClients {
		status, err := client.Status()
		assertNoErr(t, err)

		command := []string{
			"tailscale",
			"set",
			"--hostname=" + hostnames[string(status.Self.ID)] + "NEW",
		}
		_, _, err = client.Execute(command)
		assertNoErrf(t, "failed to set hostname: %s", err)
	}

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	err = executeAndUnmarshal(
		headscale,
		[]string{
			"headscale",
			"node",
			"list",
			"--output",
			"json",
		},
		&nodes,
	)

	assertNoErr(t, err)
	assert.Len(t, nodes, 3)

	for _, node := range nodes {
		hostname := hostnames[strconv.FormatUint(node.GetId(), 10)]
		givenName := fmt.Sprintf("%d-givenname", node.GetId())
		assert.Equal(t, hostname+"NEW", node.GetName())
		assert.Equal(t, givenName, node.GetGivenName())
	}
}

func TestExpireNode(t *testing.T) {
	IntegrationSkip(t)

	spec := ScenarioSpec{
		NodesPerUser: len(MustTestVersions),
		Users:        []string{"user1"},
	}

	scenario, err := NewScenario(spec)
	assertNoErr(t, err)
	defer scenario.ShutdownAssertNoPanics(t)

	err = scenario.CreateHeadscaleEnv([]tsic.Option{}, hsic.WithTestName("expirenode"))
	assertNoErrHeadscaleEnv(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	allIps, err := scenario.ListTailscaleClientsIPs()
	assertNoErrListClientIPs(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	// assertClientsState(t, allClients)

	allAddrs := lo.Map(allIps, func(x netip.Addr, index int) string {
		return x.String()
	})

	success := pingAllHelper(t, allClients, allAddrs)
	t.Logf("before expire: %d successful pings out of %d", success, len(allClients)*len(allIps))

	for _, client := range allClients {
		status, err := client.Status()
		assertNoErr(t, err)

		// Assert that we have the original count - self
		assert.Len(t, status.Peers(), spec.NodesPerUser-1)
	}

	headscale, err := scenario.Headscale()
	assertNoErr(t, err)

	// TODO(kradalby): This is Headscale specific and would not play nicely
	// with other implementations of the ControlServer interface
	result, err := headscale.Execute([]string{
		"headscale", "nodes", "expire", "--identifier", "1", "--output", "json",
	})
	assertNoErr(t, err)

	var node v1.Node
	err = json.Unmarshal([]byte(result), &node)
	assertNoErr(t, err)

	var expiredNodeKey key.NodePublic
	err = expiredNodeKey.UnmarshalText([]byte(node.GetNodeKey()))
	assertNoErr(t, err)

	t.Logf("Node %s with node_key %s has been expired", node.GetName(), expiredNodeKey.String())

	// Verify that the expired node has been marked in all peers list.
	assert.EventuallyWithT(t, func(ct *assert.CollectT) {
		for _, client := range allClients {
			status, err := client.Status()
			assert.NoError(ct, err)

			if client.Hostname() != node.GetName() {
				// Check if the expired node appears as expired in this client's peer list
				for key, peer := range status.Peer {
					if key == expiredNodeKey {
						assert.True(ct, peer.Expired, "Node should be marked as expired for client %s", client.Hostname())
						break
					}
				}
			}
		}
	}, 3*time.Minute, 10*time.Second)

	now := time.Now()

	// Verify that the expired node has been marked in all peers list.
	for _, client := range allClients {
		status, err := client.Status()
		assertNoErr(t, err)

		if client.Hostname() != node.GetName() {
			t.Logf("available peers of %s: %v", client.Hostname(), status.Peers())

			// Ensures that the node is present, and that it is expired.
			if peerStatus, ok := status.Peer[expiredNodeKey]; ok {
				assertNotNil(t, peerStatus.Expired)
				assert.NotNil(t, peerStatus.KeyExpiry)

				t.Logf(
					"node %q should have a key expire before %s, was %s",
					peerStatus.HostName,
					now.String(),
					peerStatus.KeyExpiry,
				)
				if peerStatus.KeyExpiry != nil {
					assert.Truef(
						t,
						peerStatus.KeyExpiry.Before(now),
						"node %q should have a key expire before %s, was %s",
						peerStatus.HostName,
						now.String(),
						peerStatus.KeyExpiry,
					)
				}

				assert.Truef(
					t,
					peerStatus.Expired,
					"node %q should be expired, expired is %v",
					peerStatus.HostName,
					peerStatus.Expired,
				)

				_, stderr, _ := client.Execute([]string{"tailscale", "ping", node.GetName()})
				if !strings.Contains(stderr, "node key has expired") {
					t.Errorf(
						"expected to be unable to ping expired host %q from %q",
						node.GetName(),
						client.Hostname(),
					)
				}
			} else {
				t.Errorf("failed to find node %q with nodekey (%s) in mapresponse, should be present even if it is expired", node.GetName(), expiredNodeKey)
			}
		} else {
			if status.Self.KeyExpiry != nil {
				assert.Truef(t, status.Self.KeyExpiry.Before(now), "node %q should have a key expire before %s, was %s", status.Self.HostName, now.String(), status.Self.KeyExpiry)
			}

			// NeedsLogin means that the node has understood that it is no longer
			// valid.
			assert.Equalf(t, "NeedsLogin", status.BackendState, "checking node %q", status.Self.HostName)
		}
	}
}

func TestNodeOnlineStatus(t *testing.T) {
	IntegrationSkip(t)

	spec := ScenarioSpec{
		NodesPerUser: len(MustTestVersions),
		Users:        []string{"user1"},
	}

	scenario, err := NewScenario(spec)
	assertNoErr(t, err)
	defer scenario.ShutdownAssertNoPanics(t)

	err = scenario.CreateHeadscaleEnv([]tsic.Option{}, hsic.WithTestName("online"))
	assertNoErrHeadscaleEnv(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	allIps, err := scenario.ListTailscaleClientsIPs()
	assertNoErrListClientIPs(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	// assertClientsState(t, allClients)

	allAddrs := lo.Map(allIps, func(x netip.Addr, index int) string {
		return x.String()
	})

	success := pingAllHelper(t, allClients, allAddrs)
	t.Logf("before expire: %d successful pings out of %d", success, len(allClients)*len(allIps))

	for _, client := range allClients {
		status, err := client.Status()
		assertNoErr(t, err)

		// Assert that we have the original count - self
		assert.Len(t, status.Peers(), len(MustTestVersions)-1)
	}

	headscale, err := scenario.Headscale()
	assertNoErr(t, err)

	// Duration is chosen arbitrarily, 10m is reported in #1561
	testDuration := 12 * time.Minute
	start := time.Now()
	end := start.Add(testDuration)

	log.Printf("Starting online test from %v to %v", start, end)

	for {
		// Let the test run continuously for X minutes to verify
		// all nodes stay connected and has the expected status over time.
		if end.Before(time.Now()) {
			return
		}

		result, err := headscale.Execute([]string{
			"headscale", "nodes", "list", "--output", "json",
		})
		assertNoErr(t, err)

		var nodes []*v1.Node
		err = json.Unmarshal([]byte(result), &nodes)
		assertNoErr(t, err)

		// Verify that headscale reports the nodes as online
		for _, node := range nodes {
			// All nodes should be online
			assert.Truef(
				t,
				node.GetOnline(),
				"expected %s to have online status in Headscale, marked as offline %s after start",
				node.GetName(),
				time.Since(start),
			)
		}

		// Verify that all nodes report all nodes to be online
		for _, client := range allClients {
			status, err := client.Status()
			assertNoErr(t, err)

			for _, peerKey := range status.Peers() {
				peerStatus := status.Peer[peerKey]

				// .Online is only available from CapVer 16, which
				// is not present in 1.18 which is the lowest we
				// test.
				if strings.Contains(client.Hostname(), "1-18") {
					continue
				}

				// All peers of this nodes are reporting to be
				// connected to the control server
				assert.Truef(
					t,
					peerStatus.Online,
					"expected node %s to be marked as online in %s peer list, marked as offline %s after start",
					peerStatus.HostName,
					client.Hostname(),
					time.Since(start),
				)
			}
		}

		// Check maximum once per second
		time.Sleep(time.Second)
	}
}

// TestPingAllByIPManyUpDown is a variant of the PingAll
// test which will take the tailscale node up and down
// five times ensuring they are able to restablish connectivity.
func TestPingAllByIPManyUpDown(t *testing.T) {
	IntegrationSkip(t)

	spec := ScenarioSpec{
		NodesPerUser: len(MustTestVersions),
		Users:        []string{"user1", "user2"},
	}

	scenario, err := NewScenario(spec)
	assertNoErr(t, err)
	defer scenario.ShutdownAssertNoPanics(t)

	err = scenario.CreateHeadscaleEnv(
		[]tsic.Option{},
		hsic.WithTestName("pingallbyipmany"),
		hsic.WithEmbeddedDERPServerOnly(),
		hsic.WithTLS(),
	)
	assertNoErrHeadscaleEnv(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	allIps, err := scenario.ListTailscaleClientsIPs()
	assertNoErrListClientIPs(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	// assertClientsState(t, allClients)

	allAddrs := lo.Map(allIps, func(x netip.Addr, index int) string {
		return x.String()
	})

	success := pingAllHelper(t, allClients, allAddrs)
	t.Logf("%d successful pings out of %d", success, len(allClients)*len(allIps))

	wg, _ := errgroup.WithContext(context.Background())

	for run := range 3 {
		t.Logf("Starting DownUpPing run %d", run+1)

		for _, client := range allClients {
			c := client
			wg.Go(func() error {
				t.Logf("taking down %q", c.Hostname())
				return c.Down()
			})
		}

		if err := wg.Wait(); err != nil {
			t.Fatalf("failed to take down all nodes: %s", err)
		}

		for _, client := range allClients {
			c := client
			wg.Go(func() error {
				t.Logf("bringing up %q", c.Hostname())
				return c.Up()
			})
		}

		if err := wg.Wait(); err != nil {
			t.Fatalf("failed to take down all nodes: %s", err)
		}

		// Wait for sync and successful pings after nodes come back up
		assert.EventuallyWithT(t, func(ct *assert.CollectT) {
			err = scenario.WaitForTailscaleSync()
			assert.NoError(ct, err)

			success := pingAllHelper(t, allClients, allAddrs)
			assert.Greater(ct, success, 0, "Nodes should be able to ping after coming back up")
		}, 30*time.Second, 2*time.Second)

		success := pingAllHelper(t, allClients, allAddrs)
		t.Logf("%d successful pings out of %d", success, len(allClients)*len(allIps))
	}
}

func Test2118DeletingOnlineNodePanics(t *testing.T) {
	IntegrationSkip(t)

	spec := ScenarioSpec{
		NodesPerUser: 1,
		Users:        []string{"user1", "user2"},
	}

	scenario, err := NewScenario(spec)
	assertNoErr(t, err)
	defer scenario.ShutdownAssertNoPanics(t)

	err = scenario.CreateHeadscaleEnv(
		[]tsic.Option{},
		hsic.WithTestName("deletenocrash"),
		hsic.WithEmbeddedDERPServerOnly(),
		hsic.WithTLS(),
	)
	assertNoErrHeadscaleEnv(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	allIps, err := scenario.ListTailscaleClientsIPs()
	assertNoErrListClientIPs(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	allAddrs := lo.Map(allIps, func(x netip.Addr, index int) string {
		return x.String()
	})

	success := pingAllHelper(t, allClients, allAddrs)
	t.Logf("%d successful pings out of %d", success, len(allClients)*len(allIps))

	headscale, err := scenario.Headscale()
	assertNoErr(t, err)

	// Test list all nodes after added otherUser
	var nodeList []v1.Node
	err = executeAndUnmarshal(
		headscale,
		[]string{
			"headscale",
			"nodes",
			"list",
			"--output",
			"json",
		},
		&nodeList,
	)
	require.NoError(t, err)
	assert.Len(t, nodeList, 2)
	assert.True(t, nodeList[0].GetOnline())
	assert.True(t, nodeList[1].GetOnline())

	// Delete the first node, which is online
	_, err = headscale.Execute(
		[]string{
			"headscale",
			"nodes",
			"delete",
			"--identifier",
			// Delete the last added machine
			fmt.Sprintf("%d", nodeList[0].GetId()),
			"--output",
			"json",
			"--force",
		},
	)
	require.NoError(t, err)

	// Ensure that the node has been deleted, this did not occur due to a panic.
	var nodeListAfter []v1.Node
	assert.EventuallyWithT(t, func(ct *assert.CollectT) {
		err = executeAndUnmarshal(
			headscale,
			[]string{
				"headscale",
				"nodes",
				"list",
				"--output",
				"json",
			},
			&nodeListAfter,
		)
		assert.NoError(ct, err)
		assert.Len(ct, nodeListAfter, 1, "Node should be deleted from list")
	}, 10*time.Second, 1*time.Second)

	err = executeAndUnmarshal(
		headscale,
		[]string{
			"headscale",
			"nodes",
			"list",
			"--output",
			"json",
		},
		&nodeListAfter,
	)
	require.NoError(t, err)
	assert.Len(t, nodeListAfter, 1)
	assert.True(t, nodeListAfter[0].GetOnline())
	assert.Equal(t, nodeList[1].GetId(), nodeListAfter[0].GetId())
}
