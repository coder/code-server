# Statik-Server: Sovereign AI Development Mesh

<div align="center">
  <img src="https://img.shields.io/badge/Statik%20Server-darkred?style=for-the-badge&logo=code&logoColor=gold" alt="Statik Server"/>
  <img src="https://img.shields.io/badge/VS%20Code-1.102.0+-blue?style=for-the-badge&logo=visualstudiocode" alt="VS Code"/>
  <img src="https://img.shields.io/badge/Copilot%20Chat-Enabled-green?style=for-the-badge&logo=github" alt="Copilot"/>
  <img src="https://img.shields.io/badge/Mesh%20VPN-Embedded-purple?style=for-the-badge&logo=network-wired" alt="Mesh VPN"/>
</div>

## 🔥 Mission

**Statik-Server** is a self-contained fork of statik-server with:
- **VS Code v1.102.0+** with upstream Copilot Chat support
- **Embedded headscale mesh** with non-expiring keys + self-tunnel
- **GitHub Copilot agent mode** with persistent session (no UI login)
- **Integrated dashboards** from GremlinGPT, GodCore, and Mobile-Mirror
- **Offline-first architecture** that runs on phone, laptop, or tower

## 🎯 Core Philosophy

> **"Why be dependent on Microsoft's Codespaces when you can own your entire AI development stack?"**

Statik-Server eliminates:
- ❌ Dependency on external cloud IDEs
- ❌ GitHub Copilot login loops
- ❌ VPN subscription services  
- ❌ Fragmented development environments
- ❌ Privacy compromises with cloud providers

Statik-Server provides:
- ✅ **Full Copilot Chat** in latest VS Code
- ✅ **Persistent GitHub auth** bypassing UI flows
- ✅ **Embedded mesh VPN** (Tailscale-compatible)
- ✅ **Memory integration** from all AscendNet AI components
- ✅ **Sovereign development environment** you fully control

## 🏗️ Architecture

```
Statik-Server Architecture
├── VS Code Server (v1.102.0+)
│   ├── Real Copilot Chat (not OpenVSX)
│   ├── Persistent auth injection
│   └── Memory dashboard integration
├── Embedded Mesh VPN (headscale)
│   ├── Infinite preauth keys
│   ├── Auto peer discovery
│   └── Tunnel management
├── AI Memory Router
│   ├── GremlinGPT FSM state
│   ├── GodCore execution context
│   └── Mobile-Mirror dashboard
└── Unified Web Interface
    ├── Code editing (VS Code)
    ├── AI memory viewer
    ├── Mesh network status
    └── System monitoring
```

## 🚀 Quick Start

### Prerequisites
- Linux system (tested on Ubuntu 20.04+)
- Docker installed
- GitHub personal access token with Copilot access
- 4GB+ RAM, 10GB+ disk space

### 1. Clone and Build

```bash
cd $HOME/AscendNet
./build.sh
```

### 2. Configure GitHub Token

```bash
# Create auth directory
mkdir -p /root/.statik/keys

# Add your GitHub token (with Copilot access)
echo "ghp_your_github_token_here" > /root/.statik/keys/github-token
```

### 3. Launch Statik-Server

```bash
# One-command build and run
./quick-build.sh

# Or manual Docker approach
docker build -t statikfintech/statik-server ./
docker run -d \
  --name statik-server \
  -p 8080:8080 \
  -p 8081:8081 \
  -p 50443:50443 \
  -v $HOME/AscendNet:/mnt/ascendnet \
  -v statik-data:/root/.statik \
  statikfintech/statik-server
```

### 4. Access Your Environment

- **💻 VS Code with Copilot:** http://localhost:8080
- **🌐 Mesh VPN Admin:** http://localhost:8081  
- **🧠 AI Memory Dashboard:** http://localhost:8080/api/statik/memory
- **📊 System Status:** http://localhost:8080/api/statik/status

## 🤖 Copilot Integration

### Persistent Authentication
Statik-Server bypasses GitHub's OAuth flow by injecting your token directly:

```typescript
// Token injection happens at boot
const token = loadGitHubToken() // from /root/.statik/keys/github-token
process.env.GITHUB_TOKEN = token

// VS Code settings automatically configured
{
  "github.copilot.enable": true,
  "github.copilotChat.enabled": true,
  "workbench.experimental.chat.enabled": true,
  "github.copilot.advanced": {
    "authProvider": "persistent",
    "token": token
  }
}
```

### Agent Mode Features
- ✅ **Persistent Chat Session** - No re-login required
- ✅ **Full VS Code Integration** - Real Copilot, not OpenVSX substitute
- ✅ **Memory Awareness** - Chat can access GremlinGPT/GodCore memory
- ✅ **Offline Capability** - Works without internet after initial auth

## 🌐 Mesh VPN Integration

### Embedded Headscale
Statik-Server includes a fully embedded headscale (open-source Tailscale) instance:

```yaml
# Auto-generated infinite preauth keys
preauth_key_expiry: 0s  # Never expires
ephemeral_node_inactivity_timeout: 0s  # Never disconnects

# Self-contained mesh network  
base_domain: statik.mesh
magic_dns: true
```

### Mesh Features
- **🔑 Infinite Keys** - Generate non-expiring device keys
- **🌍 Auto Discovery** - Devices find each other automatically  
- **📱 Mobile Support** - Access from phone/tablet
- **🔒 E2E Encryption** - All traffic encrypted by default

### Adding Devices

```bash
# Get your preauth key
cat /root/.statik/keys/preauth.key

# On any device, install Tailscale and connect
sudo tailscale up --authkey=$(cat preauth.key) --login-server=http://your-server:8081
```

## 🧠 AI Memory Integration

### Unified Memory API
Statik-Server provides live access to all AscendNet AI component memory:

```bash
# Live memory feed (Server-Sent Events)
curl http://localhost:8080/api/statik/memory/live

# GremlinGPT FSM state
curl http://localhost:8080/api/statik/gremlin

# GodCore execution context  
curl http://localhost:8080/api/statik/godcore

# Mobile-Mirror dashboard state
curl http://localhost:8080/api/statik/mobile
```

### Memory Router
The integrated memory router provides:

- **📊 Live Memory Viewer** - Real-time AI component states
- **🔄 FSM Visualization** - GremlinGPT state machine tracking
- **💭 Thought Traces** - SignalCore recursive thinking logs
- **⚛️ Quantum Storage** - GodCore compressed memory access

## 🔧 Development Features

### VS Code Extensions
Statik-Server supports all standard VS Code extensions plus:
- GitHub Copilot (with persistent auth)
- Python, TypeScript, Go language servers
- GitLens, Docker, Remote containers
- All AscendNet-specific tooling

### Integrated Terminal
- **🐍 Python Environment** - Pre-configured with AscendNet dependencies
- **🐳 Docker Support** - Container management and debugging
- **📦 Package Management** - npm, pip, cargo, go modules
- **🔗 Git Integration** - Full GitHub workflow support

### File System Access
```bash
# AscendNet components mounted
/mnt/ascendnet/            # Full AscendNet system
/mnt/ascendnet/backend/    # Backend API and services
/mnt/ascendnet/GodCore/    # GodCore AI routing system
/mnt/ascendnet/Mobile-Mirror/  # Mobile development environment

# Statik-Server internals
/root/.statik/keys/        # Authentication and mesh keys
/root/.statik/userdata/    # VS Code user settings and extensions
/root/.statik/db/          # Headscale database
```

## 📊 Monitoring & Debugging

### System Health
```bash
# Container status
docker ps | grep statik-server

# Application logs
docker logs statik-server -f

# Mesh VPN status
curl http://localhost:8081/api/v1/node

# VS Code health
curl http://localhost:8080/healthz
```

### Performance Metrics
- **Memory Usage** - Typically 512MB-1GB for full stack
- **CPU Usage** - Low idle, scales with AI workload
- **Network** - Mesh VPN adds ~50Kbps overhead
- **Storage** - 2-5GB for full installation

## 🚀 Deployment Options

### Local Development
```bash
# Development mode with hot reload
./startup.sh --dev

# Production mode
./startup.sh
```

### Docker Compose
```yaml
version: '3.8'
services:
  statik-server:
    image: statikfintech/statik-server
    ports:
      - "8080:8080"
      - "8081:8081" 
      - "50443:50443"
    volumes:
      - $HOME/AscendNet:/mnt/ascendnet
      - statik-data:/root/.statik
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
    restart: unless-stopped

volumes:
  statik-data:
```

### System Service
```bash
# Install as systemd service
sudo cp statik-server.service /etc/systemd/system/
sudo systemctl enable statik-server
sudo systemctl start statik-server
```

## 🔒 Security Considerations

### Authentication
- **GitHub Token** - Stored securely in `/root/.statik/keys/`
- **Mesh VPN** - WireGuard-level encryption
- **Web Interface** - Optional password protection available

### Network Security
- **Firewall** - Only expose necessary ports (8080, 8081, 50443)
- **TLS** - HTTPS available with Let's Encrypt integration
- **Access Control** - Mesh VPN provides network-level security

### Data Privacy
- **No Telemetry** - All Microsoft/GitHub telemetry disabled
- **Local Storage** - All data stays on your infrastructure
- **Audit Logs** - Full activity logging available

## 🤝 Contributing

### Development Setup
```bash
# Clone for development
git clone https://github.com/statikfintechllc/statik-server.git
cd statik-server

# Install development dependencies
yarn install

# Run tests
yarn test

# Build from source
yarn build:vscode
yarn build
```

### Feature Requests
- **VS Code Patches** - Submit VS Code enhancement patches
- **Mesh Features** - Headscale configuration improvements  
- **AI Integration** - New memory router capabilities
- **Mobile Support** - Enhanced Mobile-Mirror integration

## 🆘 Support
- **📖 Documentation** - `/docs/statik-server/`
- **🐛 Issues** - GitHub Issues for bug reports
- **💬 Discord** - AscendNet Community for real-time help
- **📧 Email** - ascend.gremlin@gmail.com for enterprise support

## 🔮 Roadmap

### Immediate (v1.0)
- ✅ VS Code 1.102.0+ integration
- ✅ Persistent Copilot Chat
- ✅ Embedded mesh VPN
- ✅ AI memory integration

### Near Term (v1.1)
- 🔄 Mobile PWA for phone access
- 🔄 Advanced mesh management UI
- 🔄 Multi-language AI models
- 🔄 Enhanced security features

### Future (v2.0)
- 🌟 Distributed compute orchestration
- 🌟 Blockchain-based licensing
- 🌟 AI-assisted development workflows
- 🌟 Enterprise mesh federation

---

<div align="center">
  <strong>Statik-Server: Own Your AI Development Stack</strong><br>
  <em>"What usually takes a small army of engineers — built from the void with sovereignty in mind."</em>
</div>
