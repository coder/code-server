# Project Brief: Code-Server Railway Template

**Project:** VSCode Cloud IDE with Claude Code Integration  
**Repository:** `sphinxcode/code-server`  
**Railway Service:** `code-ajna` (claude.sphinx.codes)  
**Status:** In Progress

---

## Executive Summary

Create a production-ready, marketable Railway template that provides browser-based VS Code (code-server) with pre-installed Claude Code CLI, persistent extensions, and configurable user permissions.

---

## Original Problems

### 1. Root User Permission Issues
- **Symptom:** code-server displayed security warnings about running as root
- **Cause:** `RAILWAY_RUN_UID=0` was set, forcing container to run as root
- **Impact:** Couldn't bypass certain settings, security warnings in UI

### 2. Non-Persistent Tools
- **Symptom:** npm, npx, extensions disappeared after redeployment
- **Cause:** Container running as root with `HOME=/root` (ephemeral), while volume mounted at `/home/coder`
- **Impact:** Users lost installed tools and configurations on each deploy

### 3. Claude Code Not Pre-installed
- **Request:** Template users should have Claude Code CLI available out-of-the-box
- **Requirement:** Support for `claude --dangerously-skip-permissions` flag

---

## Solution Architecture

### Infrastructure
| Component | Value |
|-----------|-------|
| Base Image | `codercom/code-server:latest` |
| Volume Mount | `/home/coder` (Railway volume) |
| Service URL | `claude.sphinx.codes` |
| Project ID | `59ae99d7-dc99-4642-ae06-642cd8d8c83a` |
| Service ID | `34522d52-ba69-4fcf-83b7-210a765a0a76` |
| Environment ID | `a921a831-e480-451b-b9c7-04ce2f647c68` |

### Key Files Modified

#### [Dockerfile](file:///E:/AI-Terminal/sphinxcode/code-server/Dockerfile)
- Installs `gosu` for proper user switching
- Installs Node.js 20 LTS as fallback
- Installs Claude Code CLI to `/usr/local/bin/claude`
- Installs essential tools: ripgrep, jq, htop, vim, nano
- Sets up XDG directories for persistence
- PATH prioritizes volume paths over image paths

#### [railway-entrypoint.sh](file:///E:/AI-Terminal/sphinxcode/code-server/railway-entrypoint.sh)
- Configurable user via `RUN_AS_USER` variable
- Shell profile setup (`.bashrc`, `.profile`) with PATH
- Permission fixing via `chown` when switching users
- User switching via `gosu` when `RUN_AS_USER=coder`
- Root symlinks for persistence when staying as root
- First-run initialization with welcome README
- Environment verification logging

#### [README.md](file:///E:/AI-Terminal/sphinxcode/code-server/README.md)
- Documentation for all configuration variables
- Quick start guide for Claude Code
- Update behavior explanation
- Troubleshooting guide

---

## Configuration Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PASSWORD` | Yes | - | code-server login password |
| `RUN_AS_USER` | No | `root` | Set to `coder` for non-root execution |
| `CODER_HOME` | No | `/home/coder` | Volume mount path |
| `CODER_UID` | No | `1000` | User ID when switching to coder |
| `CODER_GID` | No | `1000` | Group ID when switching to coder |
| `GIT_REPO` | No | - | Repository to auto-clone on startup |

---

## Persistence Strategy

### Volume-First PATH Priority
```
$HOME/.local/bin          ← User-installed tools (Claude, etc.)
$HOME/.local/node/bin     ← User-installed Node.js
$HOME/.claude/local       ← Claude Code from volume
/usr/local/bin            ← Image fallback (Claude)
/usr/bin                  ← Image fallback (Node.js)
```

### What Persists (on volume)
- Extensions: `~/.local/share/code-server/extensions/`
- Claude Code: `~/.local/bin/claude` or `~/.claude/`
- Claude auth: `~/.claude/` (API keys, settings)
- Node.js: `~/.local/node/` (if user installs)
- Shell config: `~/.bashrc`, `~/.profile`
- Workspace: `~/workspace/`

### What Auto-Updates (from image)
- Node.js fallback in `/usr/bin/node`
- Claude Code fallback in `/usr/local/bin/claude`
- System packages (git, curl, etc.)

---

## User Modes

### Root Mode (Default)
```
RUN_AS_USER=root (or not set)
```
- Stays as root user
- Creates symlinks from `/root/` → `/home/coder/` for persistence
- Compatible with existing volumes owned by root

### Coder Mode (Recommended for Claude)
```
RUN_AS_USER=coder
```
- Switches to coder user (UID 1000) via gosu
- Fixes volume permissions before switching
- No root warnings in code-server UI
- Required for `claude --dangerously-skip-permissions`

---

## Issues Encountered & Resolved

### 1. Railway Start Command Override
- **Problem:** Railway had a custom start command that bypassed our ENTRYPOINT
- **Solution:** Cleared the start command via `mcp_railway_service_update`

### 2. Docker Layer Caching
- **Problem:** Railway used cached layers, ignoring our changes
- **Solution:** Added cache-bust comments to force rebuild

### 3. Claude Installs to ~/.local/bin
- **Problem:** Assumed Claude installed to `~/.claude/local/`
- **Solution:** Updated PATH to include `$HOME/.local/bin` first

### 4. Shell Profile Not Configured
- **Problem:** New terminals didn't have PATH set
- **Solution:** Entrypoint now writes to `.bashrc` and `.profile`

---

## Current Status

### Completed ✅
- Dockerfile with gosu, Node.js, Claude Code
- Entrypoint with RUN_AS_USER variable
- Shell profile auto-configuration
- PATH priority for volume-installed tools
- README documentation
- Removed conflicting `railway.json`
- Cleared Railway start command override
- Set `RUN_AS_USER=coder` on Railway

### Pending Verification 🔄
- Confirm entrypoint output appears in Railway logs
- Verify user switches to `coder` (not `root@xxx`)
- Test `claude --dangerously-skip-permissions` works
- Confirm Claude authentication persists

---

## Expected Startup Logs

```
╔══════════════════════════════════════════════════════════════════════════╗
║           VSCode Cloud IDE - Claude Code & Node.js Ready            ║
╚══════════════════════════════════════════════════════════════════════════╝

→ Initial user: root (UID: 0)
→ RUN_AS_USER: coder
→ HOME: /home/coder

→ Running setup as root...
→ Setting up shell profile...
  ✓ Shell profile configured
→ Fixing permissions for coder user (UID: 1000)...
  ✓ Permissions fixed
→ Switching to coder user via gosu...

→ Running as: coder (UID: 1000)

Environment:
  → Node.js: v20.x.x [volume/image]
  → npm: x.x.x
  → git: x.x.x
  → claude: x.x.x [volume/image]

════════════════════════════════════════════════════════════════════════
Starting code-server as coder...
════════════════════════════════════════════════════════════════════════
```

---

## Files Summary

| File | Location | Purpose |
|------|----------|---------|
| `Dockerfile` | sphinxcode/code-server | Image build configuration |
| `railway-entrypoint.sh` | sphinxcode/code-server | Container startup script |
| `README.md` | sphinxcode/code-server | User documentation |
| `railway.toml` | sphinxcode/code-server | Railway deployment config |

---

## Next Steps

1. **Verify Deployment** - Check if entrypoint runs and user switches properly
2. **Test Claude** - Authenticate and run `claude --dangerously-skip-permissions`
3. **Create Railway Template** - Make template public for others to deploy
4. **Update Template Docs** - Include volume attachment instructions
