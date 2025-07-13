package hscontrol

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"

	"github.com/tailscale/tailsql/server/tailsql"
	"tailscale.com/tsnet"
	"tailscale.com/tsweb"
	"tailscale.com/types/logger"
)

func runTailSQLService(ctx context.Context, logf logger.Logf, stateDir, dbPath string) error {
	opts := tailsql.Options{
		Hostname: "tailsql-headscale",
		StateDir: stateDir,
		Sources: []tailsql.DBSpec{
			{
				Source: "headscale",
				Label:  "headscale - sqlite",
				Driver: "sqlite",
				URL:    fmt.Sprintf("file:%s?mode=ro", dbPath),
				Named: map[string]string{
					"schema": `select * from sqlite_schema`,
				},
			},
		},
	}

	tsNode := &tsnet.Server{
		Dir:      os.ExpandEnv(opts.StateDir),
		Hostname: opts.Hostname,
		Logf:     logger.Discard,
	}
	// if *doDebugLog {
	// 	tsNode.Logf = logf
	// }
	defer tsNode.Close()

	logf("Starting tailscale (hostname=%q)", opts.Hostname)
	lc, err := tsNode.LocalClient()
	if err != nil {
		return fmt.Errorf("connect local client: %w", err)
	}
	opts.LocalClient = lc // for authentication

	// Make sure the Tailscale node starts up. It might not, if it is a new node
	// and the user did not provide an auth key.
	if st, err := tsNode.Up(ctx); err != nil {
		return fmt.Errorf("starting tailscale: %w", err)
	} else {
		logf("tailscale started, node state %q", st.BackendState)
	}

	// Reaching here, we have a running Tailscale node, now we can set up the
	// HTTP and/or HTTPS plumbing for TailSQL itself.
	tsql, err := tailsql.NewServer(opts)
	if err != nil {
		return fmt.Errorf("creating tailsql server: %w", err)
	}

	lst, err := tsNode.Listen("tcp", ":80")
	if err != nil {
		return fmt.Errorf("listen port 80: %w", err)
	}

	if opts.ServeHTTPS {
		// When serving TLS, add a redirect from HTTP on port 80 to HTTPS on 443.
		certDomains := tsNode.CertDomains()
		if len(certDomains) == 0 {
			return errors.New("no cert domains available for HTTPS")
		}
		base := "https://" + certDomains[0]
		go http.Serve(lst, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			target := base + r.RequestURI
			http.Redirect(w, r, target, http.StatusPermanentRedirect)
		}))
		// log.Printf("Redirecting HTTP to HTTPS at %q", base)

		// For the real service, start a separate listener.
		// Note: Replaces the port 80 listener.
		var err error
		lst, err = tsNode.ListenTLS("tcp", ":443")
		if err != nil {
			return fmt.Errorf("listen TLS: %w", err)
		}
		logf("enabled serving via HTTPS")
	}

	mux := tsql.NewMux()
	tsweb.Debugger(mux)
	go http.Serve(lst, mux)
	logf("TailSQL started")
	<-ctx.Done()
	logf("TailSQL shutting down...")

	return tsNode.Close()
}
