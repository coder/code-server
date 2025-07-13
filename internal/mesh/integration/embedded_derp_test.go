package integration

import (
	"strings"
	"testing"
	"time"

	"github.com/juanfont/headscale/integration/hsic"
	"github.com/juanfont/headscale/integration/tsic"
	"tailscale.com/tailcfg"
	"tailscale.com/types/key"
)

type ClientsSpec struct {
	Plain         int
	WebsocketDERP int
}

func TestDERPServerScenario(t *testing.T) {
	spec := ScenarioSpec{
		NodesPerUser: 1,
		Users:        []string{"user1", "user2", "user3"},
		Networks: map[string][]string{
			"usernet1": {"user1"},
			"usernet2": {"user2"},
			"usernet3": {"user3"},
		},
	}

	derpServerScenario(t, spec, false, func(scenario *Scenario) {
		allClients, err := scenario.ListTailscaleClients()
		assertNoErrListClients(t, err)
		t.Logf("checking %d clients for websocket connections", len(allClients))

		for _, client := range allClients {
			if didClientUseWebsocketForDERP(t, client) {
				t.Logf(
					"client %q used websocket a connection, but was not expected to",
					client.Hostname(),
				)
				t.Fail()
			}
		}

		hsServer, err := scenario.Headscale()
		assertNoErrGetHeadscale(t, err)

		derpRegion := tailcfg.DERPRegion{
			RegionCode: "test-derpverify",
			RegionName: "TestDerpVerify",
			Nodes: []*tailcfg.DERPNode{
				{
					Name:             "TestDerpVerify",
					RegionID:         900,
					HostName:         hsServer.GetHostname(),
					STUNPort:         3478,
					STUNOnly:         false,
					DERPPort:         443,
					InsecureForTests: true,
				},
			},
		}

		fakeKey := key.NewNode()
		DERPVerify(t, fakeKey, derpRegion, false)
	})
}

func TestDERPServerWebsocketScenario(t *testing.T) {
	spec := ScenarioSpec{
		NodesPerUser: 1,
		Users:        []string{"user1", "user2", "user3"},
		Networks: map[string][]string{
			"usernet1": {"user1"},
			"usernet2": {"user2"},
			"usernet3": {"user3"},
		},
	}

	derpServerScenario(t, spec, true, func(scenario *Scenario) {
		allClients, err := scenario.ListTailscaleClients()
		assertNoErrListClients(t, err)
		t.Logf("checking %d clients for websocket connections", len(allClients))

		for _, client := range allClients {
			if !didClientUseWebsocketForDERP(t, client) {
				t.Logf(
					"client %q does not seem to have used a websocket connection, even though it was expected to do so",
					client.Hostname(),
				)
				t.Fail()
			}
		}
	})
}

// This function implements the common parts of a DERP scenario,
// we *want* it to show up in stacktraces,
// so marking it as a test helper would be counterproductive.
//
//nolint:thelper
func derpServerScenario(
	t *testing.T,
	spec ScenarioSpec,
	websocket bool,
	furtherAssertions ...func(*Scenario),
) {
	IntegrationSkip(t)

	scenario, err := NewScenario(spec)
	assertNoErr(t, err)

	defer scenario.ShutdownAssertNoPanics(t)

	err = scenario.CreateHeadscaleEnv(
		[]tsic.Option{
			tsic.WithWebsocketDERP(websocket),
		},
		hsic.WithTestName("derpserver"),
		hsic.WithExtraPorts([]string{"3478/udp"}),
		hsic.WithEmbeddedDERPServerOnly(),
		hsic.WithPort(443),
		hsic.WithTLS(),
		hsic.WithConfigEnv(map[string]string{
			"HEADSCALE_DERP_AUTO_UPDATE_ENABLED":   "true",
			"HEADSCALE_DERP_UPDATE_FREQUENCY":      "10s",
			"HEADSCALE_LISTEN_ADDR":                "0.0.0.0:443",
			"HEADSCALE_DERP_SERVER_VERIFY_CLIENTS": "true",
		}),
	)
	assertNoErrHeadscaleEnv(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	err = scenario.WaitForTailscaleSync()
	assertNoErrSync(t, err)

	allHostnames, err := scenario.ListTailscaleClientsFQDNs()
	assertNoErrListFQDN(t, err)

	for _, client := range allClients {
		status, err := client.Status()
		assertNoErr(t, err)

		for _, health := range status.Health {
			if strings.Contains(health, "could not connect to any relay server") {
				t.Errorf("expected to be connected to derp, found: %s", health)
			}
			if strings.Contains(health, "could not connect to the 'Headscale Embedded DERP' relay server.") {
				t.Errorf("expected to be connected to derp, found: %s", health)
			}
		}
	}

	success := pingDerpAllHelper(t, allClients, allHostnames)
	if len(allHostnames)*len(allClients) > success {
		t.FailNow()

		return
	}

	for _, client := range allClients {
		status, err := client.Status()
		assertNoErr(t, err)

		for _, health := range status.Health {
			if strings.Contains(health, "could not connect to any relay server") {
				t.Errorf("expected to be connected to derp, found: %s", health)
			}
			if strings.Contains(health, "could not connect to the 'Headscale Embedded DERP' relay server.") {
				t.Errorf("expected to be connected to derp, found: %s", health)
			}
		}
	}

	t.Logf("Run 1: %d successful pings out of %d", success, len(allClients)*len(allHostnames))

	// Let the DERP updater run a couple of times to ensure it does not
	// break the DERPMap.
	time.Sleep(30 * time.Second)

	success = pingDerpAllHelper(t, allClients, allHostnames)
	if len(allHostnames)*len(allClients) > success {
		t.Fail()
	}

	for _, client := range allClients {
		status, err := client.Status()
		assertNoErr(t, err)

		for _, health := range status.Health {
			if strings.Contains(health, "could not connect to any relay server") {
				t.Errorf("expected to be connected to derp, found: %s", health)
			}
			if strings.Contains(health, "could not connect to the 'Headscale Embedded DERP' relay server.") {
				t.Errorf("expected to be connected to derp, found: %s", health)
			}
		}
	}

	t.Logf("Run2: %d successful pings out of %d", success, len(allClients)*len(allHostnames))

	for _, check := range furtherAssertions {
		check(scenario)
	}
}
