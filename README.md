# Deploy and Host Claude Code Server on Railway

<p align="center">
  <img src="https://raw.githubusercontent.com/sphinxcode/claude-code-server/main/public/claude-code-server-logo.svg" alt="Claude Code Server Logo" width="120" height="120">
</p>

<p align="center">
  <strong>Browser-based VS Code with Claude Code pre-installed. YOLO mode ready.</strong>
</p>

<p align="center">
  <a href="https://railway.com/deploy/pHwM6f?referralCode=1uw5HI&utm_medium=integration&utm_source=template&utm_campaign=generic">
    <img src="https://railway.com/button.svg" alt="Deploy on Railway">
  </a>
</p>

---

Claude Code Server is a cloud-based VS Code environment with Claude Code CLI pre-installed. Deploy in 60 seconds and start AI-assisted coding directly in your browser. Runs as non-root `clauder` user with persistent storage for extensions, authentication, and workspace files.

## About Hosting Claude Code Server

Hosting Claude Code Server on Railway provides a fully configured development environment accessible from any browser. The template handles user permissions, volume persistence, and Claude Code installation automatically. On first deploy, set your `PASSWORD` environment variable and attach a volume to `/home/clauder`. The entrypoint script manages permission fixes, user switching via `gosu`, and shell configuration. Your Claude authentication tokens, VS Code extensions, and workspace files persist across redeploys via the mounted volume.

## Common Use Cases

- **Remote AI-assisted development** – Code with Claude from any device with a browser
- **Ephemeral dev environments** – Spin up isolated workspaces for experiments or client projects
- **Team onboarding** – Pre-configured environments for new developers with tools ready to go
- **CI/CD integration** – Use as a hosted development server for automated workflows

## Dependencies for Claude Code Server Hosting

- **Railway account** – Free tier available
- **Anthropic API access** – For Claude Code authentication

### Deployment Dependencies

- [code-server](https://github.com/coder/code-server) – VS Code in the browser by Coder
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) – AI coding assistant by Anthropic
- [Node.js 20 LTS](https://nodejs.org/) – JavaScript runtime

### Implementation Details

```bash
# YOLO mode - skip permission prompts
claude --dangerously-skip-permissions

# Or use the alias
claude-auto

# Interactive mode
claude
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PASSWORD` | Yes | - | Login password for code-server |
| `CLAUDER_HOME` | Yes | `/home/clauder` | Volume mount path |
| `CLAUDER_UID` | No | `1000` | User ID |
| `CLAUDER_GID` | No | `1000` | Group ID |
| `RUN_AS_USER` | No | `clauder` | Set to `root` if needed |

## Volume Configuration

> ⚠️ **CRITICAL**: Without a volume, ALL data is lost on every redeploy!

| Setting | Value |
|---------|-------|
| **Mount Path** | `/home/clauder` |
| **Size** | 5GB+ recommended |

## Why Deploy Claude Code Server on Railway?

Railway is a singular platform to deploy your infrastructure stack. Railway will host your infrastructure so you don't have to deal with configuration, while allowing you to vertically and horizontally scale it.

By deploying Claude Code Server on Railway, you are one step closer to supporting a complete full-stack application with minimal burden. Host your servers, databases, AI agents, and more on Railway.

---

## Credits

- [code-server](https://github.com/coder/code-server) by Coder
- [Claude Code](https://github.com/anthropics/claude-code) by Anthropic

**License:** MIT
