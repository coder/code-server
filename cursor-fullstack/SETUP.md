# Cursor Full Stack AI IDE - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git installed
- At least 4GB RAM available
- Ports 3001, 5173, 8080, 8081 available

### Installation

1. **Clone and Navigate**
```bash
git clone <repository-url>
cd cursor-fullstack
```

2. **Build and Start**
```bash
# Option 1: Using npm scripts
npm run build

# Option 2: Using Docker Compose directly
docker compose up --build -d

# Option 3: Using the build script
./build.sh
```

3. **Verify Installation**
```bash
# Check if all services are running
docker compose ps

# Test the system
npm test
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost:8080
- **code-server IDE**: http://localhost:8081

## 🔧 Configuration

### 1. AI Provider Setup
1. Open http://localhost:5173
2. Click "AI Settings" in the sidebar
3. Select your preferred provider:
   - **OpenAI**: Get API key from https://platform.openai.com/api-keys
   - **Anthropic**: Get API key from https://console.anthropic.com/
   - **Google**: Get API key from https://makersuite.google.com/app/apikey
   - **Mistral**: Get API key from https://console.mistral.ai/
4. Enter your API key and test the connection

### 2. Workspace Setup
The workspace is located at `./workspace/` and is shared between all services.

### 3. Environment Variables
Create a `.env` file for custom configuration:

```bash
# Backend
NODE_ENV=production
PORT=3001
WS_PORT=8080

# Frontend
VITE_BACKEND_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:8080

# code-server
CODE_SERVER_PASSWORD=your_secure_password
```

## 🛠️ Development

### Local Development
```bash
# Backend development
npm run dev:backend

# Frontend development
npm run dev:frontend
```

### Adding New Tools
1. Add tool definition in `packages/backend/claudable/src/tools/index.ts`
2. Add tool implementation in the `ToolManager` class
3. Update the tool list in the API endpoint
4. Test the tool using the frontend tool panel

### Adding New AI Providers
1. Add provider implementation in `packages/backend/claudable/src/ai/providers.ts`
2. Update the providers list in the API endpoint
3. Add provider option in the frontend provider form

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
```bash
# Check what's using the port
lsof -i :3001
lsof -i :5173
lsof -i :8080
lsof -i :8081

# Kill the process or change ports in docker-compose.yml
```

2. **Docker Build Fails**
```bash
# Clean Docker cache
docker system prune -f
docker compose down -v
docker compose up --build -d
```

3. **WebSocket Connection Issues**
- Check if ports 8080 and 3001 are accessible
- Verify firewall settings
- Check browser console for errors

4. **AI Provider Errors**
- Verify API key is correct
- Check API key permissions
- Ensure sufficient API credits

### Logs
```bash
# View all logs
npm run logs

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f code-server
```

### Reset Everything
```bash
# Stop and remove all containers, volumes, and networks
npm run clean

# Rebuild from scratch
npm run build
```

## 📊 Monitoring

### Health Checks
```bash
# Check service status
curl http://localhost:3001/api/providers
curl http://localhost:5173
curl http://localhost:8081

# Check WebSocket
wscat -c ws://localhost:8080
```

### Performance Monitoring
- Monitor Docker container resource usage
- Check WebSocket connection stability
- Monitor AI API response times

## 🚀 Production Deployment

### Using Production Docker Compose
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Environment Setup
1. Set up reverse proxy (Nginx)
2. Configure SSL certificates
3. Set up domain names
4. Configure environment variables
5. Set up monitoring and logging

### Scaling
- Use multiple backend instances
- Set up load balancer
- Add database for persistence
- Implement Redis for session management

## 📚 API Documentation

### Backend Endpoints
- `GET /api/providers` - List AI providers
- `POST /api/chat` - Send chat message
- `GET /api/tools` - List available tools
- `POST /api/tools/execute` - Execute tool
- `GET /api/workspace/files` - List workspace files
- `GET /api/workspace/file/:path` - Read file
- `POST /api/workspace/file/:path` - Write file

### WebSocket Events
- `chat-message` - Send message
- `chat-response` - Receive response
- `typing-start/stop` - Typing indicators

## 🔒 Security

### Best Practices
- Use strong passwords for code-server
- Keep API keys secure
- Regularly update dependencies
- Use HTTPS in production
- Implement rate limiting
- Monitor for suspicious activity

### API Key Management
- Store API keys in environment variables
- Never commit API keys to version control
- Rotate API keys regularly
- Use different keys for different environments

## 📞 Support

### Getting Help
1. Check this setup guide
2. Review the README.md
3. Check GitHub issues
4. Create a new issue with detailed information

### Reporting Issues
When reporting issues, include:
- Operating system and version
- Docker version
- Error messages and logs
- Steps to reproduce
- Expected vs actual behavior

---

**Happy Coding with AI! 🚀**