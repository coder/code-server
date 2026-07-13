# Code-Server Deployment Guide for Dokploy

## Quick Start

1. **Set Environment Variables**
   - Edit `.env` file with your desired configuration
   - Set a strong `PASSWORD`
   - Configure feature flags as needed

2. **Deploy in Dokploy**
   - Create a new Dokploy project
   - Upload the entire `dokploy/` directory (or configure the git source to point to this repo)
   - Set the environment variables from `.env`
   - Deploy the service — the `Dockerfile` will build a custom image with opencode pre-installed

3. **Access Code-Server**
   - URL: `https://your-domain.com:8080`
   - Username: `admin`
   - Password: (from .env)

4. **Use OpenCode**
   - Open the integrated terminal in code-server
   - Run `opencode` to start the AI coding agent

## Directory Structure

```
code-server/
├── Dockerfile                 # Custom image with opencode pre-installed
├── dokploy/
│   ├── docker-compose.yml     # Dokploy deployment config
│   ├── .env                   # Environment variables
│   ├── code-server-data/      # Persisted data (created automatically)
│   └── fix-permissions.sh     # Permission fix helper (run once on host)
└── README.md                  # This file
```

## Environment Variables Reference

### Authentication
- `PASSWORD` - Admin password (required)
- `PASSWORD_HINT` - Password hint for users

### User Management
- `USER` - Username (default: admin)
- `GROUP` - User group (default: admin)
- `DISABLE_GUEST_ACCESS` - Block guest access (true/false)

### Features
- `DISABLE_TERMINAL` - Disable terminal (true/false)
- `DISABLE_SSH` - Disable SSH access (true/false)
- `DISABLE_DASHBOARD` - Hide dashboard (true/false)
- `DISABLE_FILE_BROWSER` - Disable file browser (true/false)
- `DISABLE_STARTUP_PAGE` - Skip the startup page (true/false)
- `DISABLE_EXTENSIONS` - Disable all extensions including opencode (true/false)

### File Browser
- `DISABLE_FILE_BROWSER_UPLOAD` - Disable uploads
- `DISABLE_FILE_BROWSER_DOWNLOAD` - Disable downloads
- `DISABLE_FILE_BROWSER_DELETE` - Disable deletes
- `DISABLE_FILE_BROWSER_CREATE` - Disable file creation
- `DISABLE_FILE_BROWSER_RENAME` - Disable renaming
- `DISABLE_FILE_BROWSER_MOVE` - Disable moving files
- `DISABLE_FILE_BROWSER_COPY` - Disable copying
- `DISABLE_FILE_BROWSER_SEARCH` - Disable search
- `DISABLE_FILE_BROWSER_ZIP` - Disable zipping
- `DISABLE_FILE_BROWSER_UNZIP` - Disable unzipping

### Updates
- `DISABLE_UPDATE_CHECK` - Disable update checks (true/false)
- `DISABLE_UPDATE_NOTIFICATION` - Disable update notifications
- `DISABLE_UPDATE_POPUP` - Disable update popups

## OpenCode

[OpenCode](https://opencode.ai) is an open-source AI coding agent pre-installed in this image.

- Run `opencode` in the code-server integrated terminal
- Use `Tab` to switch between **build** (full-access) and **plan** (read-only) agents
- Configure via `~/.opencode/config.json` or the `.opencode/` directory in your project

The fork is maintained at [kt-production-repo/opencode](https://github.com/kt-production-repo/opencode).

## Volume Mounts

Mount the entire config directory as a single volume to let code-server manage its own subdirectories:

- `./code-server-data:/home/coder/.local/share/code-server` — All user data, storage, settings, extensions, and logs

**Why a single mount?** Code-server runs as the `coder` user (UID 1001) internally. Using individual subdirectory mounts (like `./data`, `./extensions` separately) can cause permission mismatches because code-server creates files in parent directories on startup. A single mount avoids this.

If you previously used the old multi-volume layout, migrate existing data:
```bash
# Stop the container first, then:
mkdir -p code-server-data
cp -r data/* code-server-data/ 2>/dev/null || true
cp -r storage/* code-server-data/ 2>/dev/null || true
cp -r settings/* code-server-data/ 2>/dev/null || true
cp -r extensions/* code-server-data/ 2>/dev/null || true
cp -r logs/* code-server-data/ 2>/dev/null || true
cp -r User/* code-server-data/ 2>/dev/null || true
chown -R 1001:1001 code-server-data
```

## Resource Limits

- CPU: 2 cores (limit), 0.5 cores (reservation)
- Memory: 2GB (limit), 512MB (reservation)

## Troubleshooting

### Cannot Access Code-Server
- Check if port 8080 is not in use
- Verify the service is running in Dokploy
- Check firewall settings

### Password Reset
- Edit the `.env` file with a new password
- Redeploy the service in Dokploy
- Or access via SSH and reset: `coder --password <new-password>`

### Performance Issues
- Reduce resource limits in `docker-compose.yml`
- Increase available memory on host
- Check disk I/O on mounted volumes

## Security Recommendations

1. Use a strong, unique password
2. Enable HTTPS with your reverse proxy
3. Configure firewall rules
4. Regularly update the image
5. Monitor resource usage
6. Backup the `code-server-data` directory

## Updating

To update to the latest version:

1. Pull the latest image in Dokploy
2. Redeploy with the same configuration
3. Your data and settings are preserved in volumes

## Customization

Additional settings can be configured via:
- Command line flags in the service definition
- Environment variables
- Code-server configuration files in the `settings` volume
