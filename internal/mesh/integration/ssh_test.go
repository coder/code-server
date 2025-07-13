package integration

import (
	"fmt"
	"log"
	"strings"
	"testing"
	"time"

	policyv2 "github.com/juanfont/headscale/hscontrol/policy/v2"
	"github.com/juanfont/headscale/integration/hsic"
	"github.com/juanfont/headscale/integration/tsic"
	"github.com/stretchr/testify/assert"
	"tailscale.com/tailcfg"
)

func isSSHNoAccessStdError(stderr string) bool {
	return strings.Contains(stderr, "Permission denied (tailscale)") ||
		// Since https://github.com/tailscale/tailscale/pull/14853
		strings.Contains(stderr, "failed to evaluate SSH policy") ||
		// Since https://github.com/tailscale/tailscale/pull/16127
		strings.Contains(stderr, "tailnet policy does not permit you to SSH to this node")
}

func sshScenario(t *testing.T, policy *policyv2.Policy, clientsPerUser int) *Scenario {
	t.Helper()

	spec := ScenarioSpec{
		NodesPerUser: clientsPerUser,
		Users:        []string{"user1", "user2"},
	}
	scenario, err := NewScenario(spec)
	assertNoErr(t, err)

	err = scenario.CreateHeadscaleEnv(
		[]tsic.Option{
			tsic.WithSSH(),

			// Alpine containers dont have ip6tables set up, which causes
			// tailscaled to stop configuring the wgengine, causing it
			// to not configure DNS.
			tsic.WithNetfilter("off"),
			tsic.WithDockerEntrypoint([]string{
				"/bin/sh",
				"-c",
				"/bin/sleep 3 ; apk add openssh ; adduser ssh-it-user ; update-ca-certificates ; tailscaled --tun=tsdev",
			}),
			tsic.WithDockerWorkdir("/"),
		},
		hsic.WithACLPolicy(policy),
		hsic.WithTestName("ssh"),
	)
	assertNoErr(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErr(t, err)

	_, err = scenario.ListTailscaleClientsFQDNs()
	assertNoErr(t, err)

	return scenario
}

func TestSSHOneUserToAll(t *testing.T) {
	IntegrationSkip(t)

	scenario := sshScenario(t,
		&policyv2.Policy{
			Groups: policyv2.Groups{
				policyv2.Group("group:integration-test"): []policyv2.Username{policyv2.Username("user1@")},
			},
			ACLs: []policyv2.ACL{
				{
					Action:   "accept",
					Protocol: "tcp",
					Sources:  []policyv2.Alias{wildcard()},
					Destinations: []policyv2.AliasWithPorts{
						aliasWithPorts(wildcard(), tailcfg.PortRangeAny),
					},
				},
			},
			SSHs: []policyv2.SSH{
				{
					Action:       "accept",
					Sources:      policyv2.SSHSrcAliases{groupp("group:integration-test")},
					Destinations: policyv2.SSHDstAliases{wildcard()},
					Users:        []policyv2.SSHUser{policyv2.SSHUser("ssh-it-user")},
				},
			},
		},
		len(MustTestVersions),
	)
	defer scenario.ShutdownAssertNoPanics(t)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	user1Clients, err := scenario.ListTailscaleClients("user1")
	assertNoErrListClients(t, err)

	user2Clients, err := scenario.ListTailscaleClients("user2")
	assertNoErrListClients(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	_, err = scenario.ListTailscaleClientsFQDNs()
	assertNoErrListFQDN(t, err)

	for _, client := range user1Clients {
		for _, peer := range allClients {
			if client.Hostname() == peer.Hostname() {
				continue
			}

			assertSSHHostname(t, client, peer)
		}
	}

	for _, client := range user2Clients {
		for _, peer := range allClients {
			if client.Hostname() == peer.Hostname() {
				continue
			}

			assertSSHPermissionDenied(t, client, peer)
		}
	}
}

func TestSSHMultipleUsersAllToAll(t *testing.T) {
	IntegrationSkip(t)

	scenario := sshScenario(t,
		&policyv2.Policy{
			Groups: policyv2.Groups{
				policyv2.Group("group:integration-test"): []policyv2.Username{policyv2.Username("user1@"), policyv2.Username("user2@")},
			},
			ACLs: []policyv2.ACL{
				{
					Action:   "accept",
					Protocol: "tcp",
					Sources:  []policyv2.Alias{wildcard()},
					Destinations: []policyv2.AliasWithPorts{
						aliasWithPorts(wildcard(), tailcfg.PortRangeAny),
					},
				},
			},
			SSHs: []policyv2.SSH{
				{
					Action:       "accept",
					Sources:      policyv2.SSHSrcAliases{groupp("group:integration-test")},
					Destinations: policyv2.SSHDstAliases{usernamep("user1@"), usernamep("user2@")},
					Users:        []policyv2.SSHUser{policyv2.SSHUser("ssh-it-user")},
				},
			},
		},
		len(MustTestVersions),
	)
	defer scenario.ShutdownAssertNoPanics(t)

	nsOneClients, err := scenario.ListTailscaleClients("user1")
	assertNoErrListClients(t, err)

	nsTwoClients, err := scenario.ListTailscaleClients("user2")
	assertNoErrListClients(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	_, err = scenario.ListTailscaleClientsFQDNs()
	assertNoErrListFQDN(t, err)

	testInterUserSSH := func(sourceClients []TailscaleClient, targetClients []TailscaleClient) {
		for _, client := range sourceClients {
			for _, peer := range targetClients {
				assertSSHHostname(t, client, peer)
			}
		}
	}

	testInterUserSSH(nsOneClients, nsTwoClients)
	testInterUserSSH(nsTwoClients, nsOneClients)
}

func TestSSHNoSSHConfigured(t *testing.T) {
	IntegrationSkip(t)

	scenario := sshScenario(t,
		&policyv2.Policy{
			Groups: policyv2.Groups{
				policyv2.Group("group:integration-test"): []policyv2.Username{policyv2.Username("user1@")},
			},
			ACLs: []policyv2.ACL{
				{
					Action:   "accept",
					Protocol: "tcp",
					Sources:  []policyv2.Alias{wildcard()},
					Destinations: []policyv2.AliasWithPorts{
						aliasWithPorts(wildcard(), tailcfg.PortRangeAny),
					},
				},
			},
			SSHs: []policyv2.SSH{},
		},
		len(MustTestVersions),
	)
	defer scenario.ShutdownAssertNoPanics(t)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	_, err = scenario.ListTailscaleClientsFQDNs()
	assertNoErrListFQDN(t, err)

	for _, client := range allClients {
		for _, peer := range allClients {
			if client.Hostname() == peer.Hostname() {
				continue
			}

			assertSSHPermissionDenied(t, client, peer)
		}
	}
}

func TestSSHIsBlockedInACL(t *testing.T) {
	IntegrationSkip(t)

	scenario := sshScenario(t,
		&policyv2.Policy{
			Groups: policyv2.Groups{
				policyv2.Group("group:integration-test"): []policyv2.Username{policyv2.Username("user1@")},
			},
			ACLs: []policyv2.ACL{
				{
					Action:   "accept",
					Protocol: "tcp",
					Sources:  []policyv2.Alias{wildcard()},
					Destinations: []policyv2.AliasWithPorts{
						aliasWithPorts(wildcard(), tailcfg.PortRange{First: 80, Last: 80}),
					},
				},
			},
			SSHs: []policyv2.SSH{
				{
					Action:       "accept",
					Sources:      policyv2.SSHSrcAliases{groupp("group:integration-test")},
					Destinations: policyv2.SSHDstAliases{usernamep("user1@")},
					Users:        []policyv2.SSHUser{policyv2.SSHUser("ssh-it-user")},
				},
			},
		},
		len(MustTestVersions),
	)
	defer scenario.ShutdownAssertNoPanics(t)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	_, err = scenario.ListTailscaleClientsFQDNs()
	assertNoErrListFQDN(t, err)

	for _, client := range allClients {
		for _, peer := range allClients {
			if client.Hostname() == peer.Hostname() {
				continue
			}

			assertSSHTimeout(t, client, peer)
		}
	}
}

func TestSSHUserOnlyIsolation(t *testing.T) {
	IntegrationSkip(t)

	scenario := sshScenario(t,
		&policyv2.Policy{
			Groups: policyv2.Groups{
				policyv2.Group("group:ssh1"): []policyv2.Username{policyv2.Username("user1@")},
				policyv2.Group("group:ssh2"): []policyv2.Username{policyv2.Username("user2@")},
			},
			ACLs: []policyv2.ACL{
				{
					Action:   "accept",
					Protocol: "tcp",
					Sources:  []policyv2.Alias{wildcard()},
					Destinations: []policyv2.AliasWithPorts{
						aliasWithPorts(wildcard(), tailcfg.PortRangeAny),
					},
				},
			},
			SSHs: []policyv2.SSH{
				{
					Action:       "accept",
					Sources:      policyv2.SSHSrcAliases{groupp("group:ssh1")},
					Destinations: policyv2.SSHDstAliases{usernamep("user1@")},
					Users:        []policyv2.SSHUser{policyv2.SSHUser("ssh-it-user")},
				},
				{
					Action:       "accept",
					Sources:      policyv2.SSHSrcAliases{groupp("group:ssh2")},
					Destinations: policyv2.SSHDstAliases{usernamep("user2@")},
					Users:        []policyv2.SSHUser{policyv2.SSHUser("ssh-it-user")},
				},
			},
		},
		len(MustTestVersions),
	)
	defer scenario.ShutdownAssertNoPanics(t)

	ssh1Clients, err := scenario.ListTailscaleClients("user1")
	assertNoErrListClients(t, err)

	ssh2Clients, err := scenario.ListTailscaleClients("user2")
	assertNoErrListClients(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	_, err = scenario.ListTailscaleClientsFQDNs()
	assertNoErrListFQDN(t, err)

	for _, client := range ssh1Clients {
		for _, peer := range ssh2Clients {
			if client.Hostname() == peer.Hostname() {
				continue
			}

			assertSSHPermissionDenied(t, client, peer)
		}
	}

	for _, client := range ssh2Clients {
		for _, peer := range ssh1Clients {
			if client.Hostname() == peer.Hostname() {
				continue
			}

			assertSSHPermissionDenied(t, client, peer)
		}
	}

	for _, client := range ssh1Clients {
		for _, peer := range ssh1Clients {
			if client.Hostname() == peer.Hostname() {
				continue
			}

			assertSSHHostname(t, client, peer)
		}
	}

	for _, client := range ssh2Clients {
		for _, peer := range ssh2Clients {
			if client.Hostname() == peer.Hostname() {
				continue
			}

			assertSSHHostname(t, client, peer)
		}
	}
}

func doSSH(t *testing.T, client TailscaleClient, peer TailscaleClient) (string, string, error) {
	return doSSHWithRetry(t, client, peer, true)
}

func doSSHWithoutRetry(t *testing.T, client TailscaleClient, peer TailscaleClient) (string, string, error) {
	return doSSHWithRetry(t, client, peer, false)
}

func doSSHWithRetry(t *testing.T, client TailscaleClient, peer TailscaleClient, retry bool) (string, string, error) {
	t.Helper()

	peerFQDN, _ := peer.FQDN()

	command := []string{
		"/usr/bin/ssh", "-o StrictHostKeyChecking=no", "-o ConnectTimeout=1",
		fmt.Sprintf("%s@%s", "ssh-it-user", peerFQDN),
		"'hostname'",
	}

	log.Printf("Running from %s to %s", client.Hostname(), peer.Hostname())
	log.Printf("Command: %s", strings.Join(command, " "))

	var result, stderr string
	var err error

	if retry {
		// Use assert.EventuallyWithT to retry SSH connections for success cases
		assert.EventuallyWithT(t, func(ct *assert.CollectT) {
			result, stderr, err = client.Execute(command)

			// If we get a permission denied error, we can fail immediately
			// since that is something we won't recover from by retrying.
			if err != nil && isSSHNoAccessStdError(stderr) {
				return // Don't retry permission denied errors
			}

			// For all other errors, assert no error to trigger retry
			assert.NoError(ct, err)
		}, 10*time.Second, 1*time.Second)
	} else {
		// For failure cases, just execute once
		result, stderr, err = client.Execute(command)
	}

	return result, stderr, err
}

func assertSSHHostname(t *testing.T, client TailscaleClient, peer TailscaleClient) {
	t.Helper()

	result, _, err := doSSH(t, client, peer)
	assertNoErr(t, err)

	assertContains(t, peer.ContainerID(), strings.ReplaceAll(result, "\n", ""))
}

func assertSSHPermissionDenied(t *testing.T, client TailscaleClient, peer TailscaleClient) {
	t.Helper()

	result, stderr, err := doSSHWithoutRetry(t, client, peer)

	assert.Empty(t, result)

	assertSSHNoAccessStdError(t, err, stderr)
}

func assertSSHTimeout(t *testing.T, client TailscaleClient, peer TailscaleClient) {
	t.Helper()

	result, stderr, _ := doSSHWithoutRetry(t, client, peer)

	assert.Empty(t, result)

	if !strings.Contains(stderr, "Connection timed out") &&
		!strings.Contains(stderr, "Operation timed out") {
		t.Fatalf("connection did not time out")
	}
}

func assertSSHNoAccessStdError(t *testing.T, err error, stderr string) {
	t.Helper()
	assert.Error(t, err)
	if !isSSHNoAccessStdError(stderr) {
		t.Errorf("expected stderr output suggesting access denied, got: %s", stderr)
	}
}
