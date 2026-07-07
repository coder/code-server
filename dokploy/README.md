# Code-Server Deployment Guide for Dokploy

## Quick Start

1. **Set Environment Variables**
   - Edit `.env` file with your desired configuration
   - Set a strong `PASSWORD`
   - Configure feature flags as needed

2. **Deploy in Dokploy**
   - Create a new Dokploy project
   - Upload `docker-compose.yml` as the deployment file
   - Set the environment variables from `.env`
   - Deploy the service

3. **Access Code-Server**
   - URL: `https://your-domain.com:8080`
   - Username: `admin`
   - Password: (from .env)

## Directory Structure

```
code-server/
├── dokploy/
│   ├── docker-compose.yml    # Dokploy deployment config
│   ├── .env                  # Environment variables
│   ├── data/                 # User data persistence
│   ├── storage/              # Code-server storage
│   ├── settings/             # User settings
│   └── extensions/           # Code-server extensions
└── README.md                 # This file
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

## Volume Mounts

- `./data:/home/coder/.local/share/code-server` - User data
- `./storage:/home/coder/.local/share/code-server/storage` - Code-server storage
- `./settings:/home/coder/.local/share/code-server/settings` - User settings

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
6. Backup the `data`, `storage`, and `settings` directories

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
