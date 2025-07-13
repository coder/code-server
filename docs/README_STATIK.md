# Statik-Server: Sovereign AI Development Environment

<div align="center">
  <img src="https://img.shields.io/badge/Statik--Server-Sovereign%20AI-darkred?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Statik-Server"/>
  <img src="https://img.shields.io/badge/VS%20Code-1.102.0+-blue?style=for-the-badge&logo=visualstudiocode" alt="VS Code"/>
  <img src="https://img.shields.io/badge/Copilot-Chat%20Enabled-green?style=for-the-badge&logo=github" alt="Copilot"/>
  <img src="https://img.shields.io/badge/Mesh%20VPN-Integrated-orange?style=for-the-badge&logo=tailscale" alt="Mesh VPN"/>
</div>

## 🌟 Overview

Statik-Server is a self-contained, sovereign AI development environment that combines:

- **🖥️ VS Code 1.102.0+** with full GitHub Copilot Chat support
- **🤖 Unified AI Dashboard** integrating GremlinGPT, GodCore, Mobile-Mirror
- **🌐 Embedded Mesh VPN** (self-hosted Tailscale/headscale)
- **🔐 Persistent Authentication** (no GitHub login loops)
- **⚡ Real-time Memory Integration** across all AI modules

## 🚀 Quick Start

### Prerequisites

**Required:**
- Docker and Docker Compose
- GitHub account with Copilot subscription
- GitHub Personal Access Token with `repo` and `copilot` scopes

**System Requirements:**
- 4GB+ RAM (8GB recommended)
- 20GB+ disk space
- Linux/macOS/Windows with WSL2

### 1. Setup Authentication

```bash
# Create auth directory
mkdir -p ~/.statik/keys

# Add your GitHub token (replace with your actual token)
echo "ghp_your_github_token_here" > ~/.statik/keys/github-token
chmod 600 ~/.statik/keys/github-token
```

### 2. One-Command Launch

```bash
# Clone and build (if not already done)
git clone https://github.com/statikfintechllc/AscendNet.git
cd AscendNet/statik-server

# Build and launch
chmod +x quick-build.sh
./quick-build.sh
```

### 3. Access Your Environment

**Primary Interfaces:**
- **💻 VS Code + Copilot:** http://localhost:8080
- **🎛️ Unified Dashboard:** http://localhost:8080/statik-dashboard
- **🌐 Mesh VPN Admin:** http://localhost:8081

## 🎛️ Unified Dashboard Features

### 8-Tab Interface

**1. 📊 Overview**
- System status and health monitoring
- Quick navigation to all modules
- Real-time performance metrics

**2. 💻 VS Code**
- Full VS Code interface in browser
- GitHub Copilot Chat integration
- Extensions and customization support

**3. 🧠 GremlinGPT**
- Autonomous cognitive system control
- FSM state management (idle → thinking → active → evolving → autonomous)
- Signal trace visualization
- Chat interface with AI agent

**4. ⚡ GodCore**
- Multi-model AI routing (Auto, Mistral, GPT-4, Claude)
- Dynamic model selection and load balancing
- Advanced chat interface
- Quantum-level processing controls

**5. 📱 Mobile-Mirror**
- TouchCore dashboard for mobile development
- Remote device management and tunneling
- PWA installation and management
- Connected device monitoring

**6. 🧮 AI Memory**
- Real-time memory feeds from all modules
- Cross-system state synchronization
- Memory depth and recursion tracking
- Soul integrity monitoring

**7. 🌐 Mesh VPN**
- Network node management
- Preauth key generation for device onboarding
- Connection status and latency monitoring
- Infinite key generation capability

**8. ⚙️ System**
- Service management and control
- System restart and update capabilities
- Memory export/import functionality
- Complete system administration

## 🔧 Manual Setup

### Build Process

```bash
# Make scripts executable
chmod +x build.sh startup.sh

# Run build pipeline
./build.sh
```

**Build Steps:**
1. Forks statik-server to Statik-Server
2. Patches VS Code to 1.102.0+ with Copilot Chat
3. Embeds headscale mesh VPN server
4. Creates Copilot authentication system
5. Builds unified AI dashboard
6. Configures Docker container

### Docker Build

```bash
# Build image
docker build -t statikfintech/statik-server .

# Run container
docker run -d \
  --name statik-server \
  --restart unless-stopped \
  -p 8080:8080 \
  -p 8081:8081 \
  -p 50443:50443 \
  -v $HOME/AscendNet:/mnt/ascendnet \
  -v statik-data:/root/.statik \
  statikfintech/statik-server
```

## 🌐 Mesh VPN Setup

### Connect Devices

**1. Generate Preauth Key:**
```bash
# Via dashboard at http://localhost:8081
# Or CLI:
docker exec statik-server ./internal/mesh/headscale preauthkeys create --namespace statik --reusable
```

**2. Install Tailscale on devices:**
- iOS/Android: Install Tailscale app
- Desktop: Download from https://tailscale.com/download

**3. Connect with key:**
- Enter preauth key in Tailscale app
- Set login server: `http://your-server-ip:8081`
- Device will join mesh network automatically

### Network Features

- **Zero-config networking:** Devices automatically discover each other
- **Infinite preauth keys:** No expiration, unlimited device onboarding  
- **Cross-platform:** Works on iOS, Android, Windows, macOS, Linux
- **Secure tunnels:** All traffic encrypted end-to-end

## 🤖 AI Module Integration

### GremlinGPT (Autonomous System)

**Features:**
- Recursive Self-Referential Autonomous Cognitive System (R-SRACS)
- FSM state management with 5 states
- Autonomous mode for self-directed operation
- Signal trace for decision pathway analysis

**Dashboard Controls:**
- Start/stop autonomous mode
- Manual FSM state stepping
- Reset to idle state
- Chat interface for direct interaction

### GodCore (Multi-Model Routing)

**Features:**
- Dynamic routing across multiple AI models
- Load balancing and optimization
- Model performance monitoring
- Quantum-level processing simulation

**Dashboard Controls:**
- Model selection (Auto/Mistral/GPT-4/Claude)
- Refresh model status
- Optimize routing algorithms
- Direct chat with model routing

### Mobile-Mirror (TouchCore)

**Features:**
- Remote mobile development environment
- TouchCore dashboard for device management
- PWA installation and deployment
- Cross-device synchronization

**Dashboard Controls:**
- Start/stop tunnel connections
- Monitor connected devices
- PWA installation status
- Remote debugging capabilities

## 📊 API Reference

### Memory API

```bash
# Get unified memory state
curl http://localhost:8080/api/statik/memory

# Live memory feed (SSE)
curl http://localhost:8080/api/statik/memory/live

# Export memory snapshot
curl http://localhost:8080/api/statik/memory/export
```

### Module APIs

```bash
# GremlinGPT control
curl http://localhost:8080/api/statik/gremlin
curl -X POST http://localhost:8080/api/statik/gremlin/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello GremlinGPT"}'

# GodCore routing
curl http://localhost:8080/api/statik/godcore
curl -X POST http://localhost:8080/api/statik/godcore/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Route this query", "model": "auto"}'

# System status
curl http://localhost:8080/api/statik/status
curl http://localhost:8080/api/statik/mesh/status
```

## 🔍 Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs
docker logs statik-server

# Check port conflicts
sudo netstat -tulpn | grep -E ':(8080|8081|50443)'

# Restart Docker
sudo systemctl restart docker
```

**GitHub Copilot not working:**
```bash
# Verify token
cat ~/.statik/keys/github-token

# Test token validity
curl -H "Authorization: token $(cat ~/.statik/keys/github-token)" \
     https://api.github.com/user
```

**Dashboard not loading:**
```bash
# Check dashboard files
docker exec statik-server ls -la /app/src/browser/pages/

# Test API endpoints
curl http://localhost:8080/api/statik/memory

# Restart container
docker restart statik-server
```

### Performance Tuning

**Increase resources:**
```bash
docker run -d \
  --name statik-server \
  --memory=8g \
  --cpus=4 \
  statikfintech/statik-server
```

**Enable SSD caching:**
```bash
# Use SSD for volumes
docker volume create --driver local \
  --opt type=none \
  --opt o=bind \
  --opt device=/path/to/ssd \
  statik-data
```

## 📚 Documentation

- **Main README:** [../README.md](../README.md)
- **Installation Guide:** [../INSTALLATION_GUIDE.md](../INSTALLATION_GUIDE.md)
- **Architecture Docs:** [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- **API Documentation:** [../docs/API.md](../docs/API.md)

## 🛠️ Development

### Local Development

```bash
# Clone and setup
git clone https://github.com/statikfintechllc/AscendNet.git
cd AscendNet/statik-server

# Install dependencies
yarn install

# Development mode
yarn watch
```

### Custom Extensions

```bash
# Mount custom extensions
docker run -d \
  -v ~/.statik/extensions:/root/.statik/extensions \
  statikfintech/statik-server
```

### Custom Configuration

```bash
# Mount custom config
docker run -d \
  -v ~/.statik/config:/root/.statik/config \
  statikfintech/statik-server
```

## 🚀 What's Next?

**Immediate Use:**
1. Start developing with VS Code + Copilot
2. Explore the unified dashboard
3. Connect mobile devices to mesh VPN
4. Monitor AI systems in real-time

**Advanced Features:**
- Custom AI model integration
- Extended mesh networking
- Advanced dashboard customization
- Multi-user collaboration

## ⚡ Quick Commands

```bash
# Start
./quick-build.sh

# Status
docker ps && curl http://localhost:8080/healthz

# Logs
docker logs -f statik-server

# Stop
docker stop statik-server

# Restart
docker restart statik-server

# Clean up
docker stop statik-server && docker rm statik-server && docker rmi statikfintech/statik-server
```

---

🎉 **You now have a complete sovereign AI development environment!** Access at http://localhost:8080 and explore the unified dashboard at http://localhost:8080/statik-dashboard
