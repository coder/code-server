package integration

import (
	"fmt"
	"net"
	"strconv"
	"testing"

	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/juanfont/headscale/integration/dsic"
	"github.com/juanfont/headscale/integration/hsic"
	"github.com/juanfont/headscale/integration/integrationutil"
	"github.com/juanfont/headscale/integration/tsic"
	"tailscale.com/derp"
	"tailscale.com/derp/derphttp"
	"tailscale.com/net/netmon"
	"tailscale.com/tailcfg"
	"tailscale.com/types/key"
)

func TestDERPVerifyEndpoint(t *testing.T) {
	IntegrationSkip(t)

	// Generate random hostname for the headscale instance
	hash, err := util.GenerateRandomStringDNSSafe(6)
	assertNoErr(t, err)
	testName := "derpverify"
	hostname := fmt.Sprintf("hs-%s-%s", testName, hash)

	headscalePort := 8080

	// Create cert for headscale
	certHeadscale, keyHeadscale, err := integrationutil.CreateCertificate(hostname)
	assertNoErr(t, err)

	spec := ScenarioSpec{
		NodesPerUser: len(MustTestVersions),
		Users:        []string{"user1"},
	}

	scenario, err := NewScenario(spec)
	assertNoErr(t, err)
	defer scenario.ShutdownAssertNoPanics(t)

	derper, err := scenario.CreateDERPServer("head",
		dsic.WithCACert(certHeadscale),
		dsic.WithVerifyClientURL(fmt.Sprintf("https://%s/verify", net.JoinHostPort(hostname, strconv.Itoa(headscalePort)))),
	)
	assertNoErr(t, err)

	derpRegion := tailcfg.DERPRegion{
		RegionCode: "test-derpverify",
		RegionName: "TestDerpVerify",
		Nodes: []*tailcfg.DERPNode{
			{
				Name:             "TestDerpVerify",
				RegionID:         900,
				HostName:         derper.GetHostname(),
				STUNPort:         derper.GetSTUNPort(),
				STUNOnly:         false,
				DERPPort:         derper.GetDERPPort(),
				InsecureForTests: true,
			},
		},
	}
	derpMap := tailcfg.DERPMap{
		Regions: map[int]*tailcfg.DERPRegion{
			900: &derpRegion,
		},
	}

	err = scenario.CreateHeadscaleEnv([]tsic.Option{tsic.WithCACert(derper.GetCert())},
		hsic.WithHostname(hostname),
		hsic.WithPort(headscalePort),
		hsic.WithCustomTLS(certHeadscale, keyHeadscale),
		hsic.WithDERPConfig(derpMap))
	assertNoErrHeadscaleEnv(t, err)

	allClients, err := scenario.ListTailscaleClients()
	assertNoErrListClients(t, err)

	fakeKey := key.NewNode()
	DERPVerify(t, fakeKey, derpRegion, false)

	for _, client := range allClients {
		nodeKey, err := client.GetNodePrivateKey()
		assertNoErr(t, err)
		DERPVerify(t, *nodeKey, derpRegion, true)
	}
}

func DERPVerify(
	t *testing.T,
	nodeKey key.NodePrivate,
	region tailcfg.DERPRegion,
	expectSuccess bool,
) {
	t.Helper()

	c := derphttp.NewRegionClient(nodeKey, t.Logf, netmon.NewStatic(), func() *tailcfg.DERPRegion {
		return &region
	})
	defer c.Close()

	var result error
	if err := c.Connect(t.Context()); err != nil {
		result = fmt.Errorf("client Connect: %w", err)
	}
	if m, err := c.Recv(); err != nil {
		result = fmt.Errorf("client first Recv: %w", err)
	} else if v, ok := m.(derp.ServerInfoMessage); !ok {
		result = fmt.Errorf("client first Recv was unexpected type %T", v)
	}

	if expectSuccess && result != nil {
		t.Fatalf("DERP verify failed unexpectedly for client %s. Expected success but got error: %v", nodeKey.Public(), result)
	} else if !expectSuccess && result == nil {
		t.Fatalf("DERP verify succeeded unexpectedly for client %s. Expected failure but it succeeded.", nodeKey.Public())
	}
}
