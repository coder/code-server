#!/bin/bash

# Cursor Full Stack AI IDE - Workspace Setup Script
# This script sets up the complete workspace structure

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================="
echo "  🏗️  Cursor Full Stack AI IDE"
echo "  📁 Workspace Setup"
echo "=========================================="
echo -e "${NC}"

# Create workspace structure
create_workspace() {
    echo -e "${GREEN}Creating workspace structure...${NC}"
    
    # Create main directories
    mkdir -p workspace/{projects,examples,templates,shared}
    mkdir -p workspace/projects/{web,api,mobile,desktop}
    mkdir -p workspace/examples/{react,node,python,go,rust}
    mkdir -p workspace/templates/{starter,boilerplate,minimal}
    mkdir -p workspace/shared/{components,utils,types,configs}
    
    # Create sample files
    create_sample_files
    
    echo -e "${GREEN}✅ Workspace structure created${NC}"
}

# Create sample files
create_sample_files() {
    echo -e "${YELLOW}Creating sample files...${NC}"
    
    # Sample React component
    cat > workspace/shared/components/Button.tsx << 'EOF'
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false
}) => {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600'
  };
  const sizeClasses = {
    sm: 'text-sm px-3 py-1',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
EOF

    # Sample utility functions
    cat > workspace/shared/utils/helpers.ts << 'EOF'
// Utility functions for the workspace

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
EOF

    # Sample TypeScript types
    cat > workspace/shared/types/index.ts << 'EOF'
// Shared types for the workspace

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  owner: User;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: User;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
EOF

    # Sample configuration
    cat > workspace/shared/configs/app.config.ts << 'EOF'
// Application configuration

export const appConfig = {
  name: 'Cursor Full Stack AI IDE',
  version: '1.0.0',
  description: 'A complete AI-powered development environment',
  
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    timeout: 10000,
    retries: 3
  },
  
  websocket: {
    url: process.env.REACT_APP_WS_URL || 'ws://localhost:8080',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5
  },
  
  ai: {
    providers: ['openai', 'anthropic', 'google', 'mistral', 'openrouter'],
    defaultProvider: 'openai',
    maxTokens: 4000,
    temperature: 0.7
  },
  
  editor: {
    theme: 'vs-dark',
    fontSize: 14,
    tabSize: 2,
    wordWrap: 'on',
    minimap: true,
    lineNumbers: 'on'
  },
  
  storage: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.html', '.css', '.scss', '.json', '.xml', '.yaml', '.yml', '.md', '.sql', '.sh', '.bash', '.dockerfile'],
    maxFiles: 1000
  }
};

export default appConfig;
EOF

    # Sample React project
    cat > workspace/examples/react/package.json << 'EOF'
{
  "name": "react-example",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "typescript": "^4.9.5",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF

    # Sample Node.js project
    cat > workspace/examples/node/package.json << 'EOF'
{
  "name": "node-example",
  "version": "1.0.0",
  "description": "Node.js example project",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest",
    "build": "tsc",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "typescript": "^5.2.2",
    "@types/node": "^20.8.0",
    "@types/express": "^4.17.17",
    "@types/cors": "^2.8.13",
    "jest": "^29.7.0",
    "eslint": "^8.50.0",
    "prettier": "^3.0.3"
  },
  "keywords": ["node", "express", "api", "typescript"],
  "author": "Cursor AI IDE",
  "license": "MIT"
}
EOF

    # Sample Python project
    cat > workspace/examples/python/requirements.txt << 'EOF'
# Python dependencies
flask==2.3.3
flask-cors==4.0.0
python-dotenv==1.0.0
requests==2.31.0
pytest==7.4.2
black==23.9.1
flake8==6.1.0
mypy==1.5.1
EOF

    # Sample Go project
    cat > workspace/examples/go/go.mod << 'EOF'
module go-example

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/gorilla/websocket v1.5.0
    github.com/joho/godotenv v1.4.0
)
EOF

    # Sample Rust project
    cat > workspace/examples/rust/Cargo.toml << 'EOF'
[package]
name = "rust-example"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
warp = "0.3"
tracing = "0.1"
tracing-subscriber = "0.3"
EOF

    # Sample README
    cat > workspace/README.md << 'EOF'
# Cursor Full Stack AI IDE - Workspace

This is your AI-powered development workspace. Here you can:

## 🚀 Features
- **AI-Powered Coding**: Get help from multiple AI providers
- **Real-time Collaboration**: Work with others in real-time
- **Multi-language Support**: Support for 20+ programming languages
- **Integrated Tools**: Built-in terminal, Git, Docker, and more
- **Live Preview**: See your changes instantly

## 📁 Workspace Structure
```
workspace/
├── projects/          # Your active projects
├── examples/          # Example projects and templates
├── templates/         # Project templates
└── shared/           # Shared components and utilities
```

## 🛠️ Getting Started
1. Open a file in the editor
2. Start coding with AI assistance
3. Use the integrated tools
4. Deploy your projects

## 🤖 AI Providers
- OpenAI GPT-4
- Anthropic Claude
- Google Gemini
- Mistral AI
- OpenRouter

## 🔧 Tools Available
- File operations
- Git integration
- Terminal access
- Docker support
- NPM package management
- Code search and analysis

Happy coding! 🎉
EOF

    echo -e "${GREEN}✅ Sample files created${NC}"
}

# Create Git repository
setup_git() {
    echo -e "${YELLOW}Setting up Git repository...${NC}"
    
    if [ ! -d ".git" ]; then
        git init
        git add .
        git commit -m "Initial workspace setup"
        echo -e "${GREEN}✅ Git repository initialized${NC}"
    else
        echo -e "${YELLOW}Git repository already exists${NC}"
    fi
}

# Create .gitignore
create_gitignore() {
    echo -e "${YELLOW}Creating .gitignore...${NC}"
    
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/
out/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# next.js build output
.next

# Nuxt.js build output
.nuxt

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
EOF

    echo -e "${GREEN}✅ .gitignore created${NC}"
}

# Main execution
main() {
    create_workspace
    create_gitignore
    setup_git
    
    echo -e "${GREEN}"
    echo "=========================================="
    echo "  ✅ Workspace setup complete!"
    echo "=========================================="
    echo -e "${NC}"
    
    echo -e "${BLUE}Your workspace is ready with:${NC}"
    echo "📁 Complete project structure"
    echo "📝 Sample files and templates"
    echo "🔧 Shared components and utilities"
    echo "📚 Documentation and examples"
    echo "🔀 Git repository initialized"
    
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Start coding in the editor"
    echo "2. Use AI assistance for development"
    echo "3. Explore the example projects"
    echo "4. Deploy your applications"
    
    echo -e "\n${GREEN}Happy coding! 🚀${NC}"
}

# Run main function
main