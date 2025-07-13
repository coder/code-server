package v2

import (
	"errors"
	"fmt"
	"time"

	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/rs/zerolog/log"
	"go4.org/netipx"
	"tailscale.com/tailcfg"
	"tailscale.com/types/views"
)

var ErrInvalidAction = errors.New("invalid action")

// compileFilterRules takes a set of nodes and an ACLPolicy and generates a
// set of Tailscale compatible FilterRules used to allow traffic on clients.
func (pol *Policy) compileFilterRules(
	users types.Users,
	nodes views.Slice[types.NodeView],
) ([]tailcfg.FilterRule, error) {
	if pol == nil {
		return tailcfg.FilterAllowAll, nil
	}

	var rules []tailcfg.FilterRule

	for _, acl := range pol.ACLs {
		if acl.Action != "accept" {
			return nil, ErrInvalidAction
		}

		srcIPs, err := acl.Sources.Resolve(pol, users, nodes)
		if err != nil {
			log.Trace().Err(err).Msgf("resolving source ips")
		}

		if srcIPs == nil || len(srcIPs.Prefixes()) == 0 {
			continue
		}

		// TODO(kradalby): integrate type into schema
		// TODO(kradalby): figure out the _ is wildcard stuff
		protocols, _, err := parseProtocol(acl.Protocol)
		if err != nil {
			return nil, fmt.Errorf("parsing policy, protocol err: %w ", err)
		}

		var destPorts []tailcfg.NetPortRange
		for _, dest := range acl.Destinations {
			ips, err := dest.Resolve(pol, users, nodes)
			if err != nil {
				log.Trace().Err(err).Msgf("resolving destination ips")
			}

			if ips == nil {
				continue
			}

			for _, pref := range ips.Prefixes() {
				for _, port := range dest.Ports {
					pr := tailcfg.NetPortRange{
						IP:    pref.String(),
						Ports: port,
					}
					destPorts = append(destPorts, pr)
				}
			}
		}

		if len(destPorts) == 0 {
			continue
		}

		rules = append(rules, tailcfg.FilterRule{
			SrcIPs:   ipSetToPrefixStringList(srcIPs),
			DstPorts: destPorts,
			IPProto:  protocols,
		})
	}

	return rules, nil
}

func sshAction(accept bool, duration time.Duration) tailcfg.SSHAction {
	return tailcfg.SSHAction{
		Reject:                   !accept,
		Accept:                   accept,
		SessionDuration:          duration,
		AllowAgentForwarding:     true,
		AllowLocalPortForwarding: true,
	}
}

func (pol *Policy) compileSSHPolicy(
	users types.Users,
	node types.NodeView,
	nodes views.Slice[types.NodeView],
) (*tailcfg.SSHPolicy, error) {
	if pol == nil || pol.SSHs == nil || len(pol.SSHs) == 0 {
		return nil, nil
	}

	var rules []*tailcfg.SSHRule

	for index, rule := range pol.SSHs {
		var dest netipx.IPSetBuilder
		for _, src := range rule.Destinations {
			ips, err := src.Resolve(pol, users, nodes)
			if err != nil {
				log.Trace().Err(err).Msgf("resolving destination ips")
			}
			dest.AddSet(ips)
		}

		destSet, err := dest.IPSet()
		if err != nil {
			return nil, err
		}

		if !node.InIPSet(destSet) {
			continue
		}

		var action tailcfg.SSHAction
		switch rule.Action {
		case "accept":
			action = sshAction(true, 0)
		case "check":
			action = sshAction(true, time.Duration(rule.CheckPeriod))
		default:
			return nil, fmt.Errorf("parsing SSH policy, unknown action %q, index: %d: %w", rule.Action, index, err)
		}

		var principals []*tailcfg.SSHPrincipal
		srcIPs, err := rule.Sources.Resolve(pol, users, nodes)
		if err != nil {
			log.Trace().Err(err).Msgf("resolving source ips")
		}

		for addr := range util.IPSetAddrIter(srcIPs) {
			principals = append(principals, &tailcfg.SSHPrincipal{
				NodeIP: addr.String(),
			})
		}

		userMap := make(map[string]string, len(rule.Users))
		for _, user := range rule.Users {
			userMap[user.String()] = "="
		}
		rules = append(rules, &tailcfg.SSHRule{
			Principals: principals,
			SSHUsers:   userMap,
			Action:     &action,
		})
	}

	return &tailcfg.SSHPolicy{
		Rules: rules,
	}, nil
}

func ipSetToPrefixStringList(ips *netipx.IPSet) []string {
	var out []string

	if ips == nil {
		return out
	}

	for _, pref := range ips.Prefixes() {
		out = append(out, pref.String())
	}

	return out
}
