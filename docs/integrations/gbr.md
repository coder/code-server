# Phone spectator with Build Remote Agent

code-server is VS Code in the browser. The [setup guide](../guide.md) covers
exposing it (SSH `-L`, Caddy, NGINX, self-signed TLS). Those paths publish the
workbench.

If you only need a **phone to watch / veto a desktop coding-agent session**,
you do not have to expose code-server at all.

**Build Remote Agent** is a companion pairing device, not a code-server
replacement. Keep code-server on localhost. The phone spectates through free
MIT `gbr-agent` on loopback. Phone and PC never open ports to each other.

Website: https://grokbuildremote.com/
Agent: https://github.com/LinespottingOrg/GrokBuildRemote-Agents (MIT)
Protocol: `gbr/1` · need agent **v0.6.0+**

Not affiliated with xAI or SpaceX.

## When to use which

| Goal | Path |
|------|------|
| Full VS Code workbench on iPad / phone | [Expose code-server](../guide.md) or [iPad](../ipad.md) |
| Spectator / veto only, no inbound | this page (`gbr-agent pair` + `127.0.0.1:8788`) |

## Install + pair

```bash
# macOS / Linux
curl -fsSL https://grokbuildremote.com/install.sh | bash
gbr-agent version          # must print v0.6.0 or newer
gbr-agent pair             # QR in browser + printed 8-char code
gbr-agent run              # leave running
```

```powershell
# Windows
irm https://grokbuildremote.com/install.ps1 | iex
gbr-agent version
gbr-agent pair
gbr-agent run
```

Phone: open Build Remote Agent → **Scan QR from computer** (or type the 8-char
code). Sessions appear in the app. **Unpair** in Settings before changing PCs.
Force-close is not enough.

## Attach

After `gbr-agent run`:

- HTTP Bot API: `http://127.0.0.1:8788`
- MCP stdio: clone the agent repo and run `node mcp/gbr-mcp/bin/gbr-mcp.js`

```bash
curl -sS http://127.0.0.1:8788/health
curl -sS http://127.0.0.1:8788/v1/sessions
```

Phone is spectator. Orchestration stays on this desktop (code-server terminal,
or a Grok bot / Claude Cowork talking to the same Bot API).

Do not commit mailbox keys. Phone **Settings → Bot API** is the only place the
relay key is copied.
