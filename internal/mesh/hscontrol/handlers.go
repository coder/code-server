package hscontrol

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/chasefleming/elem-go/styles"
	"github.com/gorilla/mux"
	"github.com/juanfont/headscale/hscontrol/templates"
	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/rs/zerolog/log"
	"tailscale.com/tailcfg"
)

const (
	// The CapabilityVersion is used by Tailscale clients to indicate
	// their codebase version. Tailscale clients can communicate over TS2021
	// from CapabilityVersion 28, but we only have good support for it
	// since https://github.com/tailscale/tailscale/pull/4323 (Noise in any HTTPS port).
	//
	// Related to this change, there is https://github.com/tailscale/tailscale/pull/5379,
	// where CapabilityVersion 39 is introduced to indicate #4323 was merged.
	//
	// See also https://github.com/tailscale/tailscale/blob/main/tailcfg/tailcfg.go
	NoiseCapabilityVersion = 39

	reservedResponseHeaderSize = 4
)

// httpError logs an error and sends an HTTP error response with the given.
func httpError(w http.ResponseWriter, err error) {
	var herr HTTPError
	if errors.As(err, &herr) {
		http.Error(w, herr.Msg, herr.Code)
		log.Error().Err(herr.Err).Int("code", herr.Code).Msgf("user msg: %s", herr.Msg)
	} else {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		log.Error().Err(err).Int("code", http.StatusInternalServerError).Msg("http internal server error")
	}
}

// HTTPError represents an error that is surfaced to the user via web.
type HTTPError struct {
	Code int    // HTTP response code to send to client; 0 means 500
	Msg  string // Response body to send to client
	Err  error  // Detailed error to log on the server
}

func (e HTTPError) Error() string { return fmt.Sprintf("http error[%d]: %s, %s", e.Code, e.Msg, e.Err) }
func (e HTTPError) Unwrap() error { return e.Err }

// Error returns an HTTPError containing the given information.
func NewHTTPError(code int, msg string, err error) HTTPError {
	return HTTPError{Code: code, Msg: msg, Err: err}
}

var errMethodNotAllowed = NewHTTPError(http.StatusMethodNotAllowed, "method not allowed", nil)

var ErrRegisterMethodCLIDoesNotSupportExpire = errors.New(
	"machines registered with CLI does not support expire",
)

func parseCapabilityVersion(req *http.Request) (tailcfg.CapabilityVersion, error) {
	clientCapabilityStr := req.URL.Query().Get("v")

	if clientCapabilityStr == "" {
		return 0, NewHTTPError(http.StatusBadRequest, "capability version must be set", nil)
	}

	clientCapabilityVersion, err := strconv.Atoi(clientCapabilityStr)
	if err != nil {
		return 0, NewHTTPError(http.StatusBadRequest, "invalid capability version", fmt.Errorf("failed to parse capability version: %w", err))
	}

	return tailcfg.CapabilityVersion(clientCapabilityVersion), nil
}

func (h *Headscale) handleVerifyRequest(
	req *http.Request,
	writer io.Writer,
) error {
	body, err := io.ReadAll(req.Body)
	if err != nil {
		return fmt.Errorf("cannot read request body: %w", err)
	}

	var derpAdmitClientRequest tailcfg.DERPAdmitClientRequest
	if err := json.Unmarshal(body, &derpAdmitClientRequest); err != nil {
		return fmt.Errorf("cannot parse derpAdmitClientRequest: %w", err)
	}

	nodes, err := h.state.ListNodes()
	if err != nil {
		return fmt.Errorf("cannot list nodes: %w", err)
	}

	resp := &tailcfg.DERPAdmitClientResponse{
		Allow: nodes.ContainsNodeKey(derpAdmitClientRequest.NodePublic),
	}

	return json.NewEncoder(writer).Encode(resp)
}

// VerifyHandler see https://github.com/tailscale/tailscale/blob/964282d34f06ecc06ce644769c66b0b31d118340/derp/derp_server.go#L1159
// DERP use verifyClientsURL to verify whether a client is allowed to connect to the DERP server.
func (h *Headscale) VerifyHandler(
	writer http.ResponseWriter,
	req *http.Request,
) {
	if req.Method != http.MethodPost {
		httpError(writer, errMethodNotAllowed)
		return
	}

	err := h.handleVerifyRequest(req, writer)
	if err != nil {
		httpError(writer, err)
		return
	}
	writer.Header().Set("Content-Type", "application/json")
}

// KeyHandler provides the Headscale pub key
// Listens in /key.
func (h *Headscale) KeyHandler(
	writer http.ResponseWriter,
	req *http.Request,
) {
	// New Tailscale clients send a 'v' parameter to indicate the CurrentCapabilityVersion
	capVer, err := parseCapabilityVersion(req)
	if err != nil {
		httpError(writer, err)
		return
	}

	// TS2021 (Tailscale v2 protocol) requires to have a different key
	if capVer >= NoiseCapabilityVersion {
		resp := tailcfg.OverTLSPublicKeyResponse{
			PublicKey: h.noisePrivateKey.Public(),
		}
		writer.Header().Set("Content-Type", "application/json")
		json.NewEncoder(writer).Encode(resp)

		return
	}
}

func (h *Headscale) HealthHandler(
	writer http.ResponseWriter,
	req *http.Request,
) {
	respond := func(err error) {
		writer.Header().Set("Content-Type", "application/health+json; charset=utf-8")

		res := struct {
			Status string `json:"status"`
		}{
			Status: "pass",
		}

		if err != nil {
			writer.WriteHeader(http.StatusInternalServerError)
			res.Status = "fail"
		}

		json.NewEncoder(writer).Encode(res)
	}

	if err := h.state.PingDB(req.Context()); err != nil {
		respond(err)

		return
	}

	respond(nil)
}

var codeStyleRegisterWebAPI = styles.Props{
	styles.Display:         "block",
	styles.Padding:         "20px",
	styles.Border:          "1px solid #bbb",
	styles.BackgroundColor: "#eee",
}

type AuthProviderWeb struct {
	serverURL string
}

func NewAuthProviderWeb(serverURL string) *AuthProviderWeb {
	return &AuthProviderWeb{
		serverURL: serverURL,
	}
}

func (a *AuthProviderWeb) AuthURL(registrationId types.RegistrationID) string {
	return fmt.Sprintf(
		"%s/register/%s",
		strings.TrimSuffix(a.serverURL, "/"),
		registrationId.String())
}

// RegisterWebAPI shows a simple message in the browser to point to the CLI
// Listens in /register/:registration_id.
//
// This is not part of the Tailscale control API, as we could send whatever URL
// in the RegisterResponse.AuthURL field.
func (a *AuthProviderWeb) RegisterHandler(
	writer http.ResponseWriter,
	req *http.Request,
) {
	vars := mux.Vars(req)
	registrationIdStr := vars["registration_id"]

	// We need to make sure we dont open for XSS style injections, if the parameter that
	// is passed as a key is not parsable/validated as a NodePublic key, then fail to render
	// the template and log an error.
	registrationId, err := types.RegistrationIDFromString(registrationIdStr)
	if err != nil {
		httpError(writer, NewHTTPError(http.StatusBadRequest, "invalid registration id", err))
		return
	}

	writer.Header().Set("Content-Type", "text/html; charset=utf-8")
	writer.WriteHeader(http.StatusOK)
	writer.Write([]byte(templates.RegisterWeb(registrationId).Render()))
}
