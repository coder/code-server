# VSCode Cloud IDE

**Browser-based VSCode with Claude Code & Node.js**

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/TEMPLATE_ID)

Cloud IDE with persistent extensions, settings, and tools.

---

## Features

- **Claude Code** & **Node.js 20** pre-installed
- Extensions persist across redeployments  
- Configurable user (root or coder)
- Shell profile auto-configured with PATH

---

## Quick Start

```bash
# Claude Code with auto-accept (for automation)
claude --dangerously-skip-permissions

# Or use the alias
claude-auto

# Interactive mode
claude
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PASSWORD` | Yes | - | Login password |
| `RUN_AS_USER` | No | `root` | Set to `coder` for non-root |
| `CODER_HOME` | No | `/home/coder` | Volume mount path |
| `CODER_UID` | No | `1000` | User ID (when RUN_AS_USER=coder) |
| `CODER_GID` | No | `1000` | Group ID (when RUN_AS_USER=coder) |

---

## Running as Non-Root (Recommended for Claude)

Set in Railway variables:
```
RUN_AS_USER=coder
```

This enables:
- ✅ No root permission warnings
- ✅ `claude --dangerously-skip-permissions` works properly
- ✅ Better security

---

## Update Behavior

| Component | Behavior |
|-----------|----------|
| **Volume tools** | You control - install to `~/.local/bin/` |
| **Image tools** | Auto-update on redeploy (fallback) |
| **Extensions** | Persist on volume |
| **Claude auth** | Persists in `~/.claude/` |

---

## Custom Startup Scripts

Add to `$CODER_HOME/entrypoint.d/`:

```bash
#!/bin/bash
git config --global user.name "Your Name"
```

Make executable: `chmod +x script.sh`

---

## Credits

- [code-server](https://github.com/coder/code-server) by Coder
- [Claude Code](https://github.com/anthropics/claude-code) by Anthropic

**License:** MIT
