package integration

import (
	"net/netip"

	v1 "github.com/juanfont/headscale/gen/go/headscale/v1"
	policyv2 "github.com/juanfont/headscale/hscontrol/policy/v2"
	"github.com/ory/dockertest/v3"
)

type ControlServer interface {
	Shutdown() (string, string, error)
	SaveLog(string) (string, string, error)
	SaveProfile(string) error
	Execute(command []string) (string, error)
	WriteFile(path string, content []byte) error
	ConnectToNetwork(network *dockertest.Network) error
	GetHealthEndpoint() string
	GetEndpoint() string
	WaitForRunning() error
	CreateUser(user string) (*v1.User, error)
	CreateAuthKey(user uint64, reusable bool, ephemeral bool) (*v1.PreAuthKey, error)
	ListNodes(users ...string) ([]*v1.Node, error)
	NodesByUser() (map[string][]*v1.Node, error)
	NodesByName() (map[string]*v1.Node, error)
	ListUsers() ([]*v1.User, error)
	MapUsers() (map[string]*v1.User, error)
	ApproveRoutes(uint64, []netip.Prefix) (*v1.Node, error)
	GetCert() []byte
	GetHostname() string
	SetPolicy(*policyv2.Policy) error
}
