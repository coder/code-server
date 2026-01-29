# VSCode Cloud IDE

**Browser-based VSCode with Claude Code & Node.js**

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/TEMPLATE_ID)

Cloud IDE with persistent extensions, settings, and tools. Runs as non-root user.

---

## Features

- **Claude Code** & **Node.js 20** pre-installed
- **Non-root execution** - runs as `coder` user (UID 1000)
- Extensions persist across redeployments  
- Volume permissions auto-fixed on startup

---

## Quick Start

```bash
# Claude Code with auto-accept (for automation)
claude --dangerously-skip-permissions

# Interactive mode
claude

# Node.js ready
node --version
npm --version
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PASSWORD` | Yes | - | Login password |
| `CODER_HOME` | No | `/home/coder` | Volume mount path |
| `CODER_UID` | No | `1000` | User ID for coder |
| `CODER_GID` | No | `1000` | Group ID for coder |

---

## How It Works

1. **Starts as root** - fixes volume permissions
2. **Switches to coder** - uses `gosu` for clean handoff
3. **Runs code-server** - as non-root user

This means:
- ✅ No root permission warnings in code-server
- ✅ Existing volumes with root-owned files work fine
- ✅ Claude `--dangerously-skip-permissions` works

---

## Claude Code Authentication

After running `claude` for the first time:

1. Follow the authentication prompts
2. Your credentials are stored in `~/.claude/`
3. They persist across redeployments (on volume)

---

## Custom Startup Scripts

Add to `$CODER_HOME/entrypoint.d/`:

```bash
#!/bin/bash
git config --global user.name "Your Name"
```

Make executable: `chmod +x script.sh`

---

## Update Behavior

| Component | Behavior |
|-----------|----------|
| **Volume tools** | You control - install to `~/.local/node/` or `~/.claude/local/` |
| **Image tools** | Auto-update on redeploy (fallback) |
| **Extensions** | Persist on volume |
| **Claude auth** | Persists on volume |

Logs show `[volume]` or `[image]` next to each tool.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Permission denied | Check `CODER_UID` matches your volume owner |
| Claude not found | Run `which claude` to check PATH |
| Extensions missing | Verify volume mounted at `CODER_HOME` |

---

## Credits

- [code-server](https://github.com/coder/code-server) by Coder
- [Claude Code](https://github.com/anthropics/claude-code) by Anthropic

**License:** MIT
