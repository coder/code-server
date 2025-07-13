package policy

import (
	"net/netip"

	"github.com/juanfont/headscale/hscontrol/policy/matcher"
	policyv2 "github.com/juanfont/headscale/hscontrol/policy/v2"
	"github.com/juanfont/headscale/hscontrol/types"
	"tailscale.com/tailcfg"
	"tailscale.com/types/views"
)

type PolicyManager interface {
	// Filter returns the current filter rules for the entire tailnet and the associated matchers.
	Filter() ([]tailcfg.FilterRule, []matcher.Match)
	SSHPolicy(types.NodeView) (*tailcfg.SSHPolicy, error)
	SetPolicy([]byte) (bool, error)
	SetUsers(users []types.User) (bool, error)
	SetNodes(nodes views.Slice[types.NodeView]) (bool, error)
	// NodeCanHaveTag reports whether the given node can have the given tag.
	NodeCanHaveTag(types.NodeView, string) bool

	// NodeCanApproveRoute reports whether the given node can approve the given route.
	NodeCanApproveRoute(types.NodeView, netip.Prefix) bool

	Version() int
	DebugString() string
}

// NewPolicyManager returns a new policy manager.
func NewPolicyManager(pol []byte, users []types.User, nodes views.Slice[types.NodeView]) (PolicyManager, error) {
	var polMan PolicyManager
	var err error
	polMan, err = policyv2.NewPolicyManager(pol, users, nodes)
	if err != nil {
		return nil, err
	}

	return polMan, err
}

// PolicyManagersForTest returns all available PostureManagers to be used
// in tests to validate them in tests that try to determine that they
// behave the same.
func PolicyManagersForTest(pol []byte, users []types.User, nodes views.Slice[types.NodeView]) ([]PolicyManager, error) {
	var polMans []PolicyManager

	for _, pmf := range PolicyManagerFuncsForTest(pol) {
		pm, err := pmf(users, nodes)
		if err != nil {
			return nil, err
		}
		polMans = append(polMans, pm)
	}

	return polMans, nil
}

func PolicyManagerFuncsForTest(pol []byte) []func([]types.User, views.Slice[types.NodeView]) (PolicyManager, error) {
	var polmanFuncs []func([]types.User, views.Slice[types.NodeView]) (PolicyManager, error)

	polmanFuncs = append(polmanFuncs, func(u []types.User, n views.Slice[types.NodeView]) (PolicyManager, error) {
		return policyv2.NewPolicyManager(pol, u, n)
	})

	return polmanFuncs
}
