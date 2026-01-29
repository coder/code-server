# Claude Code Server

**Browser-based VS Code with Claude Code & AI Coding Assistants**

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/claude-code-server)

Cloud IDE with persistent extensions, settings, and tools. Pre-installed Claude Code CLI.

---

## Quick Start

```bash
# Claude Code with auto-accept
claude --dangerously-skip-permissions

# Or use the alias
claude-auto

# Interactive mode
claude
```

---

## ⚠️ Claude Code Authentication

When running `claude` for the first time:

1. The CLI will display an authentication URL
2. **Copy the URL to a different browser** (not this code-server browser)
3. Complete the login in that browser
4. Copy the code displayed after login
5. Paste the code back into the CLI

Your credentials persist in `~/.claude/` across redeployments.

---

## 📍 Railway Deployment

> **Region**: Set your Railway region to **US West** for the fastest performance.

### Required Variables

| Variable | Description |
|----------|-------------|
| `PASSWORD` | Login password for code-server |

### User Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDER_HOME` | `/home/clauder` | Volume mount path |
| `CLAUDER_UID` | `1000` | User ID for clauder |
| `CLAUDER_GID` | `1000` | Group ID for clauder |
| `RUN_AS_USER` | `root` | Set to `clauder` for non-root execution |

### Pre-Install AI CLIs

Set to `1` to install on startup (default: `0`):

| Variable | CLI | Description |
|----------|-----|-------------|
| `INSTALL_OPENCODE` | OpenCode | Google's agentic AI IDE |
| `INSTALL_GEMINI` | Gemini CLI | Google Gemini assistant |
| `INSTALL_KILOCODE` | KiloCode | VS Code AI coding |
| `INSTALL_CONTINUE` | Continue | Open-source AI code assistant |
| `INSTALL_CODEX` | Codex | OpenAI Codex CLI |

> **Note**: Claude Code is **always installed** and cannot be disabled.

### Pre-Install Development Frameworks

| Variable | Framework | Description |
|----------|-----------|-------------|
| `INSTALL_BMAD` | BMAD Method | Spec-driven development workflow |
| `INSTALL_OPENSPEC` | OpenSpec | AI-powered spec generation |
| `INSTALL_SPECKIT` | Spec-Kit | GitHub's specification toolkit |

---

## How It Works

1. **Starts as root** – fixes volume permissions
2. **Installs optional CLIs** – based on environment variables
3. **Switches to clauder** – uses `gosu` for clean handoff
4. **Runs code-server** – as non-root user

This means:
- ✅ No root permission warnings
- ✅ Existing volumes work fine
- ✅ Claude `--dangerously-skip-permissions` works

---

## Custom Startup Scripts

Add scripts to `$CLAUDER_HOME/entrypoint.d/`:

```bash
#!/bin/bash
git config --global user.name "Your Name"
```

Make executable: `chmod +x script.sh`

---

## Update Behavior

| Component | Behavior |
|-----------|----------|
| **Volume tools** | You control – install to `~/.local/bin/` |
| **Image tools** | Auto-update on redeploy (fallback) |
| **Extensions** | Persist on volume |
| **Claude auth** | Persists on volume |

Logs show `[volume]` or `[image]` next to each tool.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Permission denied | Check `CLAUDER_UID` matches your volume owner |
| Claude not found | Run `which claude` to check PATH |
| Extensions missing | Verify volume mounted at `CLAUDER_HOME` |
| Auth URL won't open | Copy URL to a different browser |

---

## Credits

- [code-server](https://github.com/coder/code-server) by Coder
- [Claude Code](https://github.com/anthropics/claude-code) by Anthropic

**License:** MIT
