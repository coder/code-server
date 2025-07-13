package integration

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"net/netip"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/cenkalti/backoff/v5"
	policyv2 "github.com/juanfont/headscale/hscontrol/policy/v2"
	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/juanfont/headscale/integration/tsic"
	"github.com/stretchr/testify/assert"
	"tailscale.com/tailcfg"
	"tailscale.com/types/ptr"
)

const (
	derpPingTimeout = 2 * time.Second
	derpPingCount   = 10
)

func assertNoErr(t *testing.T, err error) {
	t.Helper()
	assertNoErrf(t, "unexpected error: %s", err)
}

func assertNoErrf(t *testing.T, msg string, err error) {
	t.Helper()
	if err != nil {
		t.Fatalf(msg, err)
	}
}

func assertNotNil(t *testing.T, thing interface{}) {
	t.Helper()
	if thing == nil {
		t.Fatal("got unexpected nil")
	}
}

func assertNoErrHeadscaleEnv(t *testing.T, err error) {
	t.Helper()
	assertNoErrf(t, "failed to create headscale environment: %s", err)
}

func assertNoErrGetHeadscale(t *testing.T, err error) {
	t.Helper()
	assertNoErrf(t, "failed to get headscale: %s", err)
}

func assertNoErrListClients(t *testing.T, err error) {
	t.Helper()
	assertNoErrf(t, "failed to list clients: %s", err)
}

func assertNoErrListClientIPs(t *testing.T, err error) {
	t.Helper()
	assertNoErrf(t, "failed to get client IPs: %s", err)
}

func assertNoErrSync(t *testing.T, err error) {
	t.Helper()
	assertNoErrf(t, "failed to have all clients sync up: %s", err)
}

func assertNoErrListFQDN(t *testing.T, err error) {
	t.Helper()
	assertNoErrf(t, "failed to list FQDNs: %s", err)
}

func assertNoErrLogout(t *testing.T, err error) {
	t.Helper()
	assertNoErrf(t, "failed to log out tailscale nodes: %s", err)
}

func assertContains(t *testing.T, str, subStr string) {
	t.Helper()
	if !strings.Contains(str, subStr) {
		t.Fatalf("%#v does not contain %#v", str, subStr)
	}
}

func didClientUseWebsocketForDERP(t *testing.T, client TailscaleClient) bool {
	t.Helper()

	buf := &bytes.Buffer{}
	err := client.WriteLogs(buf, buf)
	if err != nil {
		t.Fatalf("failed to fetch client logs: %s: %s", client.Hostname(), err)
	}

	count, err := countMatchingLines(buf, func(line string) bool {
		return strings.Contains(line, "websocket: connected to ")
	})
	if err != nil {
		t.Fatalf("failed to process client logs: %s: %s", client.Hostname(), err)
	}

	return count > 0
}

func pingAllHelper(t *testing.T, clients []TailscaleClient, addrs []string, opts ...tsic.PingOption) int {
	t.Helper()
	success := 0

	for _, client := range clients {
		for _, addr := range addrs {
			err := client.Ping(addr, opts...)
			if err != nil {
				t.Errorf("failed to ping %s from %s: %s", addr, client.Hostname(), err)
			} else {
				success++
			}
		}
	}

	return success
}

func pingDerpAllHelper(t *testing.T, clients []TailscaleClient, addrs []string) int {
	t.Helper()
	success := 0

	for _, client := range clients {
		for _, addr := range addrs {
			if isSelfClient(client, addr) {
				continue
			}

			err := client.Ping(
				addr,
				tsic.WithPingTimeout(derpPingTimeout),
				tsic.WithPingCount(derpPingCount),
				tsic.WithPingUntilDirect(false),
			)
			if err != nil {
				t.Logf("failed to ping %s from %s: %s", addr, client.Hostname(), err)
			} else {
				success++
			}
		}
	}

	return success
}

// assertClientsState validates the status and netmap of a list of
// clients for the general case of all to all connectivity.
func assertClientsState(t *testing.T, clients []TailscaleClient) {
	t.Helper()

	var wg sync.WaitGroup

	for _, client := range clients {
		wg.Add(1)
		c := client // Avoid loop pointer
		go func() {
			defer wg.Done()
			assertValidStatus(t, c)
			assertValidNetcheck(t, c)
			assertValidNetmap(t, c)
		}()
	}

	t.Logf("waiting for client state checks to finish")
	wg.Wait()
}

// assertValidNetmap asserts that the netmap of a client has all
// the minimum required fields set to a known working config for
// the general case. Fields are checked on self, then all peers.
// This test is not suitable for ACL/partial connection tests.
// This test can only be run on clients from 1.56.1. It will
// automatically pass all clients below that and is safe to call
// for all versions.
func assertValidNetmap(t *testing.T, client TailscaleClient) {
	t.Helper()

	if !util.TailscaleVersionNewerOrEqual("1.56", client.Version()) {
		t.Logf("%q has version %q, skipping netmap check...", client.Hostname(), client.Version())

		return
	}

	t.Logf("Checking netmap of %q", client.Hostname())

	netmap, err := client.Netmap()
	if err != nil {
		t.Fatalf("getting netmap for %q: %s", client.Hostname(), err)
	}

	assert.Truef(t, netmap.SelfNode.Hostinfo().Valid(), "%q does not have Hostinfo", client.Hostname())
	if hi := netmap.SelfNode.Hostinfo(); hi.Valid() {
		assert.LessOrEqual(t, 1, netmap.SelfNode.Hostinfo().Services().Len(), "%q does not have enough services, got: %v", client.Hostname(), netmap.SelfNode.Hostinfo().Services())
	}

	assert.NotEmptyf(t, netmap.SelfNode.AllowedIPs(), "%q does not have any allowed IPs", client.Hostname())
	assert.NotEmptyf(t, netmap.SelfNode.Addresses(), "%q does not have any addresses", client.Hostname())

	assert.Truef(t, netmap.SelfNode.Online().Get(), "%q is not online", client.Hostname())

	assert.Falsef(t, netmap.SelfNode.Key().IsZero(), "%q does not have a valid NodeKey", client.Hostname())
	assert.Falsef(t, netmap.SelfNode.Machine().IsZero(), "%q does not have a valid MachineKey", client.Hostname())
	assert.Falsef(t, netmap.SelfNode.DiscoKey().IsZero(), "%q does not have a valid DiscoKey", client.Hostname())

	for _, peer := range netmap.Peers {
		assert.NotEqualf(t, "127.3.3.40:0", peer.LegacyDERPString(), "peer (%s) has no home DERP in %q's netmap, got: %s", peer.ComputedName(), client.Hostname(), peer.LegacyDERPString())
		assert.NotEqualf(t, 0, peer.HomeDERP(), "peer (%s) has no home DERP in %q's netmap, got: %d", peer.ComputedName(), client.Hostname(), peer.HomeDERP())

		assert.Truef(t, peer.Hostinfo().Valid(), "peer (%s) of %q does not have Hostinfo", peer.ComputedName(), client.Hostname())
		if hi := peer.Hostinfo(); hi.Valid() {
			assert.LessOrEqualf(t, 3, peer.Hostinfo().Services().Len(), "peer (%s) of %q does not have enough services, got: %v", peer.ComputedName(), client.Hostname(), peer.Hostinfo().Services())

			// Netinfo is not always set
			// assert.Truef(t, hi.NetInfo().Valid(), "peer (%s) of %q does not have NetInfo", peer.ComputedName(), client.Hostname())
			if ni := hi.NetInfo(); ni.Valid() {
				assert.NotEqualf(t, 0, ni.PreferredDERP(), "peer (%s) has no home DERP in %q's netmap, got: %s", peer.ComputedName(), client.Hostname(), peer.Hostinfo().NetInfo().PreferredDERP())
			}
		}

		assert.NotEmptyf(t, peer.Endpoints(), "peer (%s) of %q does not have any endpoints", peer.ComputedName(), client.Hostname())
		assert.NotEmptyf(t, peer.AllowedIPs(), "peer (%s) of %q does not have any allowed IPs", peer.ComputedName(), client.Hostname())
		assert.NotEmptyf(t, peer.Addresses(), "peer (%s) of %q does not have any addresses", peer.ComputedName(), client.Hostname())

		assert.Truef(t, peer.Online().Get(), "peer (%s) of %q is not online", peer.ComputedName(), client.Hostname())

		assert.Falsef(t, peer.Key().IsZero(), "peer (%s) of %q does not have a valid NodeKey", peer.ComputedName(), client.Hostname())
		assert.Falsef(t, peer.Machine().IsZero(), "peer (%s) of %q does not have a valid MachineKey", peer.ComputedName(), client.Hostname())
		assert.Falsef(t, peer.DiscoKey().IsZero(), "peer (%s) of %q does not have a valid DiscoKey", peer.ComputedName(), client.Hostname())
	}
}

// assertValidStatus asserts that the status of a client has all
// the minimum required fields set to a known working config for
// the general case. Fields are checked on self, then all peers.
// This test is not suitable for ACL/partial connection tests.
func assertValidStatus(t *testing.T, client TailscaleClient) {
	t.Helper()
	status, err := client.Status(true)
	if err != nil {
		t.Fatalf("getting status for %q: %s", client.Hostname(), err)
	}

	assert.NotEmptyf(t, status.Self.HostName, "%q does not have HostName set, likely missing Hostinfo", client.Hostname())
	assert.NotEmptyf(t, status.Self.OS, "%q does not have OS set, likely missing Hostinfo", client.Hostname())
	assert.NotEmptyf(t, status.Self.Relay, "%q does not have a relay, likely missing Hostinfo/Netinfo", client.Hostname())

	assert.NotEmptyf(t, status.Self.TailscaleIPs, "%q does not have Tailscale IPs", client.Hostname())

	// This seem to not appear until version 1.56
	if status.Self.AllowedIPs != nil {
		assert.NotEmptyf(t, status.Self.AllowedIPs, "%q does not have any allowed IPs", client.Hostname())
	}

	assert.NotEmptyf(t, status.Self.Addrs, "%q does not have any endpoints", client.Hostname())

	assert.Truef(t, status.Self.Online, "%q is not online", client.Hostname())

	assert.Truef(t, status.Self.InNetworkMap, "%q is not in network map", client.Hostname())

	// This isn't really relevant for Self as it won't be in its own socket/wireguard.
	// assert.Truef(t, status.Self.InMagicSock, "%q is not tracked by magicsock", client.Hostname())
	// assert.Truef(t, status.Self.InEngine, "%q is not in wireguard engine", client.Hostname())

	for _, peer := range status.Peer {
		assert.NotEmptyf(t, peer.HostName, "peer (%s) of %q does not have HostName set, likely missing Hostinfo", peer.DNSName, client.Hostname())
		assert.NotEmptyf(t, peer.OS, "peer (%s) of %q does not have OS set, likely missing Hostinfo", peer.DNSName, client.Hostname())
		assert.NotEmptyf(t, peer.Relay, "peer (%s) of %q does not have a relay, likely missing Hostinfo/Netinfo", peer.DNSName, client.Hostname())

		assert.NotEmptyf(t, peer.TailscaleIPs, "peer (%s) of %q does not have Tailscale IPs", peer.DNSName, client.Hostname())

		// This seem to not appear until version 1.56
		if peer.AllowedIPs != nil {
			assert.NotEmptyf(t, peer.AllowedIPs, "peer (%s) of %q does not have any allowed IPs", peer.DNSName, client.Hostname())
		}

		// Addrs does not seem to appear in the status from peers.
		// assert.NotEmptyf(t, peer.Addrs, "peer (%s) of %q does not have any endpoints", peer.DNSName, client.Hostname())

		assert.Truef(t, peer.Online, "peer (%s) of %q is not online", peer.DNSName, client.Hostname())

		assert.Truef(t, peer.InNetworkMap, "peer (%s) of %q is not in network map", peer.DNSName, client.Hostname())
		assert.Truef(t, peer.InMagicSock, "peer (%s) of %q is not tracked by magicsock", peer.DNSName, client.Hostname())

		// TODO(kradalby): InEngine is only true when a proper tunnel is set up,
		// there might be some interesting stuff to test here in the future.
		// assert.Truef(t, peer.InEngine, "peer (%s) of %q is not in wireguard engine", peer.DNSName, client.Hostname())
	}
}

func assertValidNetcheck(t *testing.T, client TailscaleClient) {
	t.Helper()
	report, err := client.Netcheck()
	if err != nil {
		t.Fatalf("getting status for %q: %s", client.Hostname(), err)
	}

	assert.NotEqualf(t, 0, report.PreferredDERP, "%q does not have a DERP relay", client.Hostname())
}

// assertCommandOutputContains executes a command for a set time and asserts that the output
// reaches a desired state.
// It should be used instead of sleeping before executing.
func assertCommandOutputContains(t *testing.T, c TailscaleClient, command []string, contains string) {
	t.Helper()

	_, err := backoff.Retry(t.Context(), func() (struct{}, error) {
		stdout, stderr, err := c.Execute(command)
		if err != nil {
			return struct{}{}, fmt.Errorf("executing command, stdout: %q stderr: %q, err: %w", stdout, stderr, err)
		}

		if !strings.Contains(stdout, contains) {
			return struct{}{}, fmt.Errorf("executing command, expected string %q not found in %q", contains, stdout)
		}

		return struct{}{}, nil
	}, backoff.WithBackOff(backoff.NewExponentialBackOff()), backoff.WithMaxElapsedTime(10*time.Second))

	assert.NoError(t, err)
}

func isSelfClient(client TailscaleClient, addr string) bool {
	if addr == client.Hostname() {
		return true
	}

	ips, err := client.IPs()
	if err != nil {
		return false
	}

	for _, ip := range ips {
		if ip.String() == addr {
			return true
		}
	}

	return false
}

func dockertestMaxWait() time.Duration {
	wait := 120 * time.Second //nolint

	if util.IsCI() {
		wait = 300 * time.Second //nolint
	}

	return wait
}

func countMatchingLines(in io.Reader, predicate func(string) bool) (int, error) {
	count := 0
	scanner := bufio.NewScanner(in)
	{
		const logBufferInitialSize = 1024 << 10 // preallocate 1 MiB
		buff := make([]byte, logBufferInitialSize)
		scanner.Buffer(buff, len(buff))
		scanner.Split(bufio.ScanLines)
	}

	for scanner.Scan() {
		if predicate(scanner.Text()) {
			count += 1
		}
	}

	return count, scanner.Err()
}

// func dockertestCommandTimeout() time.Duration {
// 	timeout := 10 * time.Second //nolint
//
// 	if isCI() {
// 		timeout = 60 * time.Second //nolint
// 	}
//
// 	return timeout
// }

// pingAllNegativeHelper is intended to have 1 or more nodes timing out from the ping,
// it counts failures instead of successes.
// func pingAllNegativeHelper(t *testing.T, clients []TailscaleClient, addrs []string) int {
// 	t.Helper()
// 	failures := 0
//
// 	timeout := 100
// 	count := 3
//
// 	for _, client := range clients {
// 		for _, addr := range addrs {
// 			err := client.Ping(
// 				addr,
// 				tsic.WithPingTimeout(time.Duration(timeout)*time.Millisecond),
// 				tsic.WithPingCount(count),
// 			)
// 			if err != nil {
// 				failures++
// 			}
// 		}
// 	}
//
// 	return failures
// }

// // findPeerByIP takes an IP and a map of peers from status.Peer, and returns a *ipnstate.PeerStatus
// // if there is a peer with the given IP. If no peer is found, nil is returned.
// func findPeerByIP(
// 	ip netip.Addr,
// 	peers map[key.NodePublic]*ipnstate.PeerStatus,
// ) *ipnstate.PeerStatus {
// 	for _, peer := range peers {
// 		for _, peerIP := range peer.TailscaleIPs {
// 			if ip == peerIP {
// 				return peer
// 			}
// 		}
// }
//
// 	return nil
// }

// Helper functions for creating typed policy entities

// wildcard returns a wildcard alias (*).
func wildcard() policyv2.Alias {
	return policyv2.Wildcard
}

// usernamep returns a pointer to a Username as an Alias.
func usernamep(name string) policyv2.Alias {
	return ptr.To(policyv2.Username(name))
}

// hostp returns a pointer to a Host.
func hostp(name string) policyv2.Alias {
	return ptr.To(policyv2.Host(name))
}

// groupp returns a pointer to a Group as an Alias.
func groupp(name string) policyv2.Alias {
	return ptr.To(policyv2.Group(name))
}

// tagp returns a pointer to a Tag as an Alias.
func tagp(name string) policyv2.Alias {
	return ptr.To(policyv2.Tag(name))
}

// prefixp returns a pointer to a Prefix from a CIDR string.
func prefixp(cidr string) policyv2.Alias {
	prefix := netip.MustParsePrefix(cidr)
	return ptr.To(policyv2.Prefix(prefix))
}

// aliasWithPorts creates an AliasWithPorts structure from an alias and ports.
func aliasWithPorts(alias policyv2.Alias, ports ...tailcfg.PortRange) policyv2.AliasWithPorts {
	return policyv2.AliasWithPorts{
		Alias: alias,
		Ports: ports,
	}
}

// usernameOwner returns a Username as an Owner for use in TagOwners.
func usernameOwner(name string) policyv2.Owner {
	return ptr.To(policyv2.Username(name))
}

// groupOwner returns a Group as an Owner for use in TagOwners.
func groupOwner(name string) policyv2.Owner {
	return ptr.To(policyv2.Group(name))
}

// usernameApprover returns a Username as an AutoApprover.
func usernameApprover(name string) policyv2.AutoApprover {
	return ptr.To(policyv2.Username(name))
}

// groupApprover returns a Group as an AutoApprover.
func groupApprover(name string) policyv2.AutoApprover {
	return ptr.To(policyv2.Group(name))
}

// tagApprover returns a Tag as an AutoApprover.
func tagApprover(name string) policyv2.AutoApprover {
	return ptr.To(policyv2.Tag(name))
}

//
// // findPeerByHostname takes a hostname and a map of peers from status.Peer, and returns a *ipnstate.PeerStatus
// // if there is a peer with the given hostname. If no peer is found, nil is returned.
// func findPeerByHostname(
// 	hostname string,
// 	peers map[key.NodePublic]*ipnstate.PeerStatus,
// ) *ipnstate.PeerStatus {
// 	for _, peer := range peers {
// 		if hostname == peer.HostName {
// 			return peer
// 		}
// 	}
//
// 	return nil
// }
