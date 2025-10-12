# Cursor Full Stack AI IDE

A complete full-stack AI-powered IDE similar to Cursor Web, built with real backend services, WebSocket communication, and comprehensive tool integrations.

## 🚀 Features

### Backend (Claudable + code-server)
- **Real AI Integration**: OpenAI, Anthropic Claude, Google Gemini, Mistral
- **WebSocket Communication**: Real-time chat and tool execution
- **Comprehensive Tool System**: File operations, Git, Terminal, Docker, NPM
- **Code Execution**: Support for JavaScript, Python, TypeScript, Shell
- **Live Code-server**: Full VS Code experience in browser

### Frontend (React + Vite + Tailwind)
- **Cursor-like UI**: Dark theme with professional design
- **Monaco Editor**: Full-featured code editor with syntax highlighting
- **Real-time Chat**: AI assistant with live WebSocket communication
- **Tool Panel**: Interactive tool execution interface
- **Live Preview**: Real-time code execution and preview
- **File Explorer**: Complete workspace management

### AI Tool Integration
- **File Operations**: Read, write, create, delete, move, copy files
- **Git Integration**: Status, commit, push, pull operations
- **Terminal Commands**: Execute any shell command
- **Code Search**: Search patterns across codebase
- **Package Management**: NPM install, run scripts
- **Docker Operations**: Build and run containers
- **Directory Management**: Create, navigate, list directories

## 🛠️ Tech Stack

### Backend
- **Bun**: Fast JavaScript runtime
- **Express**: Web framework
- **Socket.IO**: Real-time communication
- **WebSocket**: Native WebSocket support
- **Zod**: Schema validation
- **AI Providers**: OpenAI, Anthropic, Google, Mistral

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **Monaco Editor**: Code editor
- **Socket.IO Client**: Real-time communication
- **Lucide React**: Icons

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-service orchestration
- **Nginx**: Reverse proxy
- **code-server**: VS Code in browser

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd cursor-fullstack
```

2. **Start all services**
```bash
docker-compose up --build
```

3. **Access the application**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost:8080
- **code-server IDE**: http://localhost:8081

### Configuration

1. **Set AI Provider API Keys**
   - Click "AI Settings" in the sidebar
   - Select your preferred AI provider
   - Enter your API key
   - Test the connection

2. **Available AI Providers**
   - **OpenAI**: GPT-4, GPT-3.5 Turbo
   - **Anthropic**: Claude 3 Sonnet, Claude 3 Haiku
   - **Google**: Gemini Pro, Gemini Pro Vision
   - **Mistral**: Mistral Large, Mistral Medium

## 🔧 Usage

### Basic Usage

1. **File Management**
   - Browse files in the sidebar
   - Click to open files in the editor
   - Use Ctrl+S to save files

2. **AI Chat**
   - Click "AI Chat" in the sidebar
   - Type your questions or requests
   - AI will respond with real-time streaming

3. **Tool Execution**
   - Click "Tools" in the sidebar
   - Select a tool from the list
   - Configure parameters
   - Execute and view results

4. **Code Execution**
   - Write code in the editor
   - Click "Run" to execute
   - View output in the terminal panel

### Advanced Features

1. **AI Tool Integration**
   - Enable "Use Tools" in chat settings
   - AI can automatically use tools to help with tasks
   - Examples: "Create a new React component", "Search for all functions named 'handleClick'"

2. **Git Integration**
   - Use tools to check git status
   - Commit changes with custom messages
   - Push/pull from remote repositories

3. **Docker Operations**
   - Build Docker images from Dockerfiles
   - Run containers with custom configurations
   - Manage volumes and ports

4. **Package Management**
   - Install npm packages
   - Run npm scripts
   - Manage dependencies

## 🏗️ Architecture

```
cursor-fullstack/
├── docker-compose.yml          # Multi-service orchestration
├── packages/
│   ├── backend/claudable/      # Backend service
│   │   ├── src/
│   │   │   ├── index.ts        # Main server
│   │   │   ├── routes/         # API routes
│   │   │   ├── ai/             # AI providers
│   │   │   ├── tools/          # Tool system
│   │   │   └── ws.ts           # WebSocket handlers
│   │   └── Dockerfile
│   └── frontend/cursor-web/    # Frontend service
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── App.tsx         # Main app
│       │   └── main.tsx        # Entry point
│       └── Dockerfile
└── workspace/                  # Shared workspace
```

## 🔌 API Endpoints

### Chat & AI
- `POST /api/chat` - Send message to AI
- `GET /api/providers` - List available AI providers

### File Operations
- `GET /api/workspace/files` - List workspace files
- `GET /api/workspace/file/:path` - Read file content
- `POST /api/workspace/file/:path` - Write file content

### Tools
- `GET /api/tools` - List available tools
- `POST /api/tools/execute` - Execute a tool
- `POST /api/terminal` - Execute terminal command
- `POST /api/execute` - Execute code

### WebSocket Events
- `chat-message` - Send chat message
- `chat-response` - Receive AI response
- `typing-start/stop` - Typing indicators

## 🛡️ Security

- API keys are stored locally in browser
- No server-side storage of sensitive data
- Direct communication with AI providers
- Secure WebSocket connections
- Input validation and sanitization

## 🚀 Deployment

### Production Deployment

1. **Environment Variables**
```bash
# Backend
NODE_ENV=production
PORT=3001
WS_PORT=8080

# Frontend
VITE_BACKEND_URL=https://your-backend.com
VITE_WS_URL=wss://your-backend.com
```

2. **Docker Build**
```bash
docker-compose -f docker-compose.prod.yml up --build
```

3. **Reverse Proxy Setup**
   - Configure Nginx for SSL termination
   - Set up domain names
   - Enable HTTPS

### Scaling

- **Horizontal Scaling**: Multiple backend instances
- **Load Balancing**: Nginx load balancer
- **Database**: Add PostgreSQL for persistence
- **Caching**: Redis for session management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: GitHub Issues
- **Documentation**: README.md
- **Discussions**: GitHub Discussions

## 🔄 Updates

### Version 1.0.0
- Initial release
- Full AI integration
- Complete tool system
- Real-time communication
- Docker deployment

---

**Built with ❤️ using modern web technologies**