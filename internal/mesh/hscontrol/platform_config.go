package hscontrol

import (
	"bytes"
	_ "embed"
	"html/template"
	"net/http"
	textTemplate "text/template"

	"github.com/gofrs/uuid/v5"
	"github.com/gorilla/mux"
	"github.com/juanfont/headscale/hscontrol/templates"
)

// WindowsConfigMessage shows a simple message in the browser for how to configure the Windows Tailscale client.
func (h *Headscale) WindowsConfigMessage(
	writer http.ResponseWriter,
	req *http.Request,
) {
	writer.Header().Set("Content-Type", "text/html; charset=utf-8")
	writer.WriteHeader(http.StatusOK)
	writer.Write([]byte(templates.Windows(h.cfg.ServerURL).Render()))
}

// AppleConfigMessage shows a simple message in the browser to point the user to the iOS/MacOS profile and instructions for how to install it.
func (h *Headscale) AppleConfigMessage(
	writer http.ResponseWriter,
	req *http.Request,
) {
	writer.Header().Set("Content-Type", "text/html; charset=utf-8")
	writer.WriteHeader(http.StatusOK)
	writer.Write([]byte(templates.Apple(h.cfg.ServerURL).Render()))
}

func (h *Headscale) ApplePlatformConfig(
	writer http.ResponseWriter,
	req *http.Request,
) {
	vars := mux.Vars(req)
	platform, ok := vars["platform"]
	if !ok {
		httpError(writer, NewHTTPError(http.StatusBadRequest, "no platform specified", nil))
		return
	}

	id, err := uuid.NewV4()
	if err != nil {
		httpError(writer, err)
		return
	}

	contentID, err := uuid.NewV4()
	if err != nil {
		httpError(writer, err)
		return
	}

	platformConfig := AppleMobilePlatformConfig{
		UUID: contentID,
		URL:  h.cfg.ServerURL,
	}

	var payload bytes.Buffer

	switch platform {
	case "macos-standalone":
		if err := macosStandaloneTemplate.Execute(&payload, platformConfig); err != nil {
			httpError(writer, err)
			return
		}
	case "macos-app-store":
		if err := macosAppStoreTemplate.Execute(&payload, platformConfig); err != nil {
			httpError(writer, err)
			return
		}
	case "ios":
		if err := iosTemplate.Execute(&payload, platformConfig); err != nil {
			httpError(writer, err)
			return
		}
	default:
		httpError(writer, NewHTTPError(http.StatusBadRequest, "platform must be ios, macos-app-store or macos-standalone", nil))
		return
	}

	config := AppleMobileConfig{
		UUID:    id,
		URL:     h.cfg.ServerURL,
		Payload: payload.String(),
	}

	var content bytes.Buffer
	if err := commonTemplate.Execute(&content, config); err != nil {
		httpError(writer, err)
		return
	}

	writer.Header().
		Set("Content-Type", "application/x-apple-aspen-config; charset=utf-8")
	writer.WriteHeader(http.StatusOK)
	writer.Write(content.Bytes())
}

type AppleMobileConfig struct {
	UUID    uuid.UUID
	URL     string
	Payload string
}

type AppleMobilePlatformConfig struct {
	UUID uuid.UUID
	URL  string
}

var commonTemplate = textTemplate.Must(
	textTemplate.New("mobileconfig").Parse(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>PayloadUUID</key>
    <string>{{.UUID}}</string>
    <key>PayloadDisplayName</key>
    <string>Headscale</string>
    <key>PayloadDescription</key>
    <string>Configure Tailscale login server to: {{.URL}}</string>
    <key>PayloadIdentifier</key>
    <string>com.github.juanfont.headscale</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
    <key>PayloadContent</key>
    <array>
    {{.Payload}}
    </array>
  </dict>
</plist>`),
)

var iosTemplate = textTemplate.Must(textTemplate.New("iosTemplate").Parse(`
    <dict>
        <key>PayloadType</key>
        <string>io.tailscale.ipn.ios</string>
        <key>PayloadUUID</key>
        <string>{{.UUID}}</string>
        <key>PayloadIdentifier</key>
        <string>com.github.juanfont.headscale</string>
        <key>PayloadVersion</key>
        <integer>1</integer>
        <key>PayloadEnabled</key>
        <true/>

        <key>ControlURL</key>
        <string>{{.URL}}</string>
    </dict>
`))

var macosAppStoreTemplate = template.Must(template.New("macosTemplate").Parse(`
    <dict>
        <key>PayloadType</key>
        <string>io.tailscale.ipn.macos</string>
        <key>PayloadUUID</key>
        <string>{{.UUID}}</string>
        <key>PayloadIdentifier</key>
        <string>com.github.juanfont.headscale</string>
        <key>PayloadVersion</key>
        <integer>1</integer>
        <key>PayloadEnabled</key>
        <true/>
        <key>ControlURL</key>
        <string>{{.URL}}</string>
    </dict>
`))

var macosStandaloneTemplate = template.Must(template.New("macosStandaloneTemplate").Parse(`
    <dict>
        <key>PayloadType</key>
        <string>io.tailscale.ipn.macsys</string>
        <key>PayloadUUID</key>
        <string>{{.UUID}}</string>
        <key>PayloadIdentifier</key>
        <string>com.github.juanfont.headscale</string>
        <key>PayloadVersion</key>
        <integer>1</integer>
        <key>PayloadEnabled</key>
        <true/>
        <key>ControlURL</key>
        <string>{{.URL}}</string>
    </dict>
`))
