package hscontrol

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/arl/statsviz"
	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"tailscale.com/tailcfg"
	"tailscale.com/tsweb"
)

func (h *Headscale) debugHTTPServer() *http.Server {
	debugMux := http.NewServeMux()
	debug := tsweb.Debugger(debugMux)
	debug.Handle("notifier", "Connected nodes in notifier", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(h.nodeNotifier.String()))
	}))
	debug.Handle("config", "Current configuration", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		config, err := json.MarshalIndent(h.cfg, "", "  ")
		if err != nil {
			httpError(w, err)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(config)
	}))
	debug.Handle("policy", "Current policy", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch h.cfg.Policy.Mode {
		case types.PolicyModeDB:
			p, err := h.state.GetPolicy()
			if err != nil {
				httpError(w, err)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(p.Data))
		case types.PolicyModeFile:
			// Read the file directly for debug purposes
			absPath := util.AbsolutePathFromConfigPath(h.cfg.Policy.Path)
			pol, err := os.ReadFile(absPath)
			if err != nil {
				httpError(w, err)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write(pol)
		default:
			httpError(w, fmt.Errorf("unsupported policy mode: %s", h.cfg.Policy.Mode))
		}
	}))
	debug.Handle("filter", "Current filter", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		filter, _ := h.state.Filter()

		filterJSON, err := json.MarshalIndent(filter, "", "  ")
		if err != nil {
			httpError(w, err)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(filterJSON)
	}))
	debug.Handle("ssh", "SSH Policy per node", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		nodes, err := h.state.ListNodes()
		if err != nil {
			httpError(w, err)
			return
		}

		sshPol := make(map[string]*tailcfg.SSHPolicy)
		for _, node := range nodes {
			pol, err := h.state.SSHPolicy(node.View())
			if err != nil {
				httpError(w, err)
				return
			}

			sshPol[fmt.Sprintf("id:%d  hostname:%s givenname:%s", node.ID, node.Hostname, node.GivenName)] = pol
		}

		sshJSON, err := json.MarshalIndent(sshPol, "", "  ")
		if err != nil {
			httpError(w, err)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(sshJSON)
	}))
	debug.Handle("derpmap", "Current DERPMap", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		dm := h.state.DERPMap()

		dmJSON, err := json.MarshalIndent(dm, "", "  ")
		if err != nil {
			httpError(w, err)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(dmJSON)
	}))
	debug.Handle("registration-cache", "Pending registrations", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// TODO(kradalby): This should be replaced with a proper state method that returns registration info
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("{}")) // For now, return empty object
	}))
	debug.Handle("routes", "Routes", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(h.state.PrimaryRoutesString()))
	}))
	debug.Handle("policy-manager", "Policy Manager", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(h.state.PolicyDebugString()))
	}))

	err := statsviz.Register(debugMux)
	if err == nil {
		debug.URL("/debug/statsviz", "Statsviz (visualise go metrics)")
	}

	debug.URL("/metrics", "Prometheus metrics")
	debugMux.Handle("/metrics", promhttp.Handler())

	debugHTTPServer := &http.Server{
		Addr:         h.cfg.MetricsAddr,
		Handler:      debugMux,
		ReadTimeout:  types.HTTPTimeout,
		WriteTimeout: 0,
	}

	return debugHTTPServer
}
