# VSCode Cloud IDE

**Browser-based VSCode with Claude Code & Node.js**

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/TEMPLATE_ID)

Cloud IDE with persistent extensions, settings, and tools. Zero configuration.

---

## Features

- **Claude Code** & **Node.js 20** pre-installed
- Extensions persist across redeployments  
- Volume-installed tools take priority (update when YOU want)
- Custom startup scripts supported

---

## Quick Start

```bash
# Claude Code ready to use
claude

# Node.js ready to use  
node --version
npm --version
```

---

## How Updates Work

| Component | Behavior |
|-----------|----------|
| **Volume tools** | YOU control updates. Install to `~/.local/node/` or `~/.claude/local/` |
| **Image tools** | Auto-update on redeploy (fallback if no volume version) |
| **Extensions** | Never reset (persisted on volume) |

The startup logs show `[volume]` or `[image]` next to each tool.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PASSWORD` | Yes | - | Login password |
| `CODER_HOME` | No | `/home/coder` | Volume mount path |

---

## Custom Volume Path

If you change the volume mount location:

```
CODER_HOME=/your/volume/path
```

Everything adapts automatically.

---

## Custom Startup Scripts

Add to `$CODER_HOME/entrypoint.d/`:

```bash
#!/bin/bash
git config --global user.name "Your Name"
```

Make executable: `chmod +x script.sh`

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| Wrong Node version | Look for `[volume]` vs `[image]` in logs |
| Extensions missing | Verify volume at `CODER_HOME` |
| Claude not found | Run `which claude` to verify PATH |

---

## Credits

- [code-server](https://github.com/coder/code-server) by Coder
- [Claude Code](https://github.com/anthropics/claude-code) by Anthropic

**License:** MIT
