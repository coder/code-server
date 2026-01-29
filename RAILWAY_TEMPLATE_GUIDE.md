# Railway Template Setup Guide

Step-by-step guide to configure the Claude Code Server Railway template.

---

## Template Metadata

| Field | Value |
|-------|-------|
| **Name** | Claude Code Server |
| **Description** | Claude Code in Browser – Full VS Code with AI coding assistants |
| **Repository** | `sphinxcode/claude-code-server` |

---

## Step 1: Create Template

1. Go to [Railway Templates](https://railway.com/new/template)
2. Select your GitHub repository: `sphinxcode/claude-code-server`
3. Configure the template metadata as shown above

---

## Step 2: Configure Variables

### Required Variables

| Variable | Type | Description |
|----------|------|-------------|
| `PASSWORD` | **Secret** | Login password for code-server |
| `CLAUDER_HOME` | **Path** | Volume mount path (default: `/home/clauder`) |

> ⚠️ **CRITICAL**: `CLAUDER_HOME` MUST match your volume mount path!

### Optional User Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDER_UID` | `1000` | User ID |
| `CLAUDER_GID` | `1000` | Group ID |
| `RUN_AS_USER` | `clauder` | Set to `root` if you need root access |
---

## Step 3: Volume Configuration (REQUIRED)

> ⚠️ **CRITICAL**: Without a volume, ALL data is lost on every redeploy!

| Setting | Value |
|---------|-------|
| **Mount Path** | `/home/clauder` |
| **Size** | 5GB+ recommended |
| **Purpose** | Persists extensions, Claude auth, configs |

**Important**: Set `CLAUDER_HOME` to match your volume mount path!

---

## Step 4: Region Selection

> 📍 **CRITICAL**: Select **US West** region for optimal performance.

Railway region options:
- ✅ `us-west1` (recommended)
- `us-east4`
- `europe-west4`
- `asia-southeast1`

---

## Step 5: Deploy Settings

These are pre-configured in `railway.toml`:

| Setting | Value |
|---------|-------|
| Health Check Path | `/healthz` |
| Health Check Timeout | 300s |
| Restart Policy | On Failure |
| Max Retries | 10 |

---

## Step 6: Publish Template

1. Test the deployment with your own Railway account
2. Verify Claude Code authentication works
3. Confirm volume persistence across redeploys
4. Publish the template

---

## Marketing Copy

### Template Title
**Claude Code Server**

### Template Tagline
**Claude Code in Browser – YOLO Mode Enabled 🚀**

### Template Description

> **Full VS Code + Claude Code in your browser. YOLO mode ready.**
>
> Skip the approval prompts. Claude runs with `--dangerously-skip-permissions` out of the box—just type `claude-auto` and let it cook.
>
> **Why developers love it:**
> - 🔥 **YOLO Mode** – No permission prompts, pure flow state
> - ⚡ **Instant Setup** – Deploy in 60 seconds
> - 💾 **Persistent** – Extensions & auth survive redeploys
> - 🛡️ **Non-root** – Runs as `clauder` user for security
> - 🧠 **Claude Code** – AI coding assistant built-in
>
> Perfect for vibe coding, weekend hacks, and shipping fast.

---

## Reference: Original Template Comparison

| Old (code-server) | New (Claude Code Server) |
|-------------------|--------------------------|
| Generic VS Code | VS Code + Claude Code |
| `coder` user | `clauder` user |
| No AI tools | Claude Code pre-installed |
| Basic docs | Auth + region guidance |
