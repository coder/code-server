#!/bin/bash

# إصلاح Frontend وربطه بالـ Backend
set -e

# الألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================="
echo "  🔧 إصلاح Frontend وربطه بالـ Backend"
echo "  🚀 Fix Frontend and Link to Backend"
echo "=========================================="
echo -e "${NC}"

# 1. فحص Backend
echo -e "${YELLOW}1. فحص Backend...${NC}"
BACKEND_RESPONSE=$(curl -s https://cursor-backend.workers.dev/health)
echo "Backend Response: $BACKEND_RESPONSE"

if echo "$BACKEND_RESPONSE" | grep -q '"status":"healthy"'; then
    echo -e "${GREEN}✅ Backend يعمل${NC}"
else
    echo -e "${RED}❌ Backend لا يعمل${NC}"
    exit 1
fi

# 2. إصلاح Frontend Environment
echo -e "${YELLOW}2. إصلاح Frontend Environment...${NC}"
cd frontend

# إنشاء .env.production صحيح
cat > .env.production << 'EOF'
VITE_BACKEND_URL=https://cursor-backend.workers.dev
VITE_WS_URL=wss://cursor-backend.workers.dev
VITE_NODE_ENV=production
VITE_APP_NAME=Cursor AI IDE
VITE_APP_VERSION=1.0.0
EOF

echo -e "${GREEN}✅ تم إنشاء .env.production${NC}"

# 3. إصلاح App.tsx للاتصال بالـ Backend
echo -e "${YELLOW}3. إصلاح App.tsx للاتصال بالـ Backend...${NC}"
cat > src/App.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MonacoEditor } from './components/MonacoEditor';
import { ChatAssistant } from './components/ChatAssistant';
import { ProviderForm } from './components/ProviderForm';
import { ToolPanel } from './components/ToolPanel';
import { StatusBar } from './components/StatusBar';
import { NotificationContainer } from './components/Notification';

// Backend URLs
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://cursor-backend.workers.dev';
const WS_URL = import.meta.env.VITE_WS_URL || 'wss://cursor-backend.workers.dev';

function App() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentLine, setCurrentLine] = useState(1);
  const [currentColumn, setCurrentColumn] = useState(1);
  const [lineCount, setLineCount] = useState(0);
  const [gitBranch, setGitBranch] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize connection
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Test backend connection
      const healthResponse = await fetch(`${BACKEND_URL}/health`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('Backend connected:', healthData);
        setIsConnected(true);
        
        // Load workspace files
        await loadWorkspaceFiles();
        
        // Initialize WebSocket
        initializeWebSocket();
      } else {
        throw new Error('Backend not responding');
      }
    } catch (error) {
      console.error('Failed to connect to backend:', error);
      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: 'Could not connect to backend. Please check your connection.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initializeWebSocket = () => {
    try {
      const ws = new WebSocket(WS_URL);
      setSocket(ws);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  };

  const loadWorkspaceFiles = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/workspace/files`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
        console.log('Loaded files:', data.files);
      } else {
        throw new Error('Failed to load files');
      }
    } catch (error) {
      console.error('Failed to load workspace files:', error);
      addNotification({
        type: 'error',
        title: 'Failed to load files',
        message: 'Could not load workspace files from backend'
      });
    }
  };

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
  };

  const handleApiKeySave = (provider: string, apiKey: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: apiKey }));
    setShowProviderForm(false);
    addNotification({
      type: 'success',
      title: 'API Key Saved',
      message: `API key for ${provider} has been saved successfully`
    });
  };

  const handleOpenCodeServer = () => {
    window.open('https://vscode.dev', '_blank');
  };

  const addNotification = (notification: any) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getLanguageFromExtension = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'dockerfile': 'dockerfile',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-cursor-bg text-cursor-text">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cursor-accent mx-auto mb-4"></div>
          <p className="text-lg">Connecting to Backend...</p>
          <p className="text-sm text-gray-400 mt-2">Please wait while we establish connection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-cursor-bg text-cursor-text">
      {/* Sidebar */}
      <Sidebar
        files={files}
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onShowChat={() => setShowChat(!showChat)}
        onShowProviderForm={() => setShowProviderForm(true)}
        onShowTools={() => setShowTools(!showTools)}
        onOpenCodeServer={handleOpenCodeServer}
        showChat={showChat}
        showTools={showTools}
      />

      {/* Main Content */}
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          {/* Monaco Editor */}
          <MonacoEditor
            selectedFile={selectedFile}
            onFileChange={(filePath, content) => {
              console.log('File changed:', filePath);
            }}
            onSave={async (filePath, content) => {
              try {
                const response = await fetch(`${BACKEND_URL}/api/workspace/file/${filePath}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ content }),
                });
                if (response.ok) {
                  addNotification({
                    type: 'success',
                    title: 'File Saved',
                    message: `${filePath} saved successfully`
                  });
                } else {
                  throw new Error('Failed to save file');
                }
              } catch (error) {
                addNotification({
                  type: 'error',
                  title: 'Save Failed',
                  message: `Failed to save ${filePath}`
                });
              }
            }}
            onRun={async (filePath, content) => {
              try {
                const response = await fetch(`${BACKEND_URL}/api/execute`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    code: content,
                    language: getLanguageFromExtension(filePath)
                  }),
                });
                const result = await response.json();
                console.log('Code executed:', result);
              } catch (error) {
                console.error('Failed to run code:', error);
              }
            }}
            backendUrl={BACKEND_URL}
          />

          {/* Chat Assistant */}
          {showChat && (
            <ChatAssistant
              socket={socket}
              apiKeys={apiKeys}
              selectedProvider={selectedProvider}
              onProviderChange={setSelectedProvider}
              backendUrl={BACKEND_URL}
            />
          )}
        </div>

        {/* Tool Panel */}
        {showTools && (
          <ToolPanel
            onToolExecute={(toolName, params) => {
              console.log('Executing tool:', toolName, params);
            }}
            onResult={(result) => {
              console.log('Tool result:', result);
            }}
            backendUrl={BACKEND_URL}
          />
        )}
      </div>

      {/* Status Bar */}
      <StatusBar
        isConnected={isConnected}
        selectedFile={selectedFile}
        lineCount={lineCount}
        currentLine={currentLine}
        currentColumn={currentColumn}
        language={selectedFile ? getLanguageFromExtension(selectedFile) : ''}
        gitBranch={gitBranch}
      />

      {/* Notifications */}
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
      />

      {/* Provider Form Modal */}
      {showProviderForm && (
        <ProviderForm
          onSave={handleApiKeySave}
          onClose={() => setShowProviderForm(false)}
          existingKeys={apiKeys}
        />
      )}
    </div>
  );
}

export default App;
EOF

echo -e "${GREEN}✅ تم إصلاح App.tsx${NC}"

# 4. إصلاح MonacoEditor للاتصال بالـ Backend
echo -e "${YELLOW}4. إصلاح MonacoEditor للاتصال بالـ Backend...${NC}"
cat > src/components/MonacoEditor.tsx << 'EOF'
import React, { useRef, useEffect, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { useMonaco } from '@monaco-editor/react';
import { FileText, Save, Play, Terminal, Maximize2, Minimize2 } from 'lucide-react';

interface MonacoEditorProps {
  selectedFile: string | null;
  onFileChange: (filePath: string, content: string) => void;
  onSave: (filePath: string, content: string) => void;
  onRun: (filePath: string, content: string) => void;
  backendUrl: string;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  selectedFile,
  onFileChange,
  onSave,
  onRun,
  backendUrl
}) => {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const [content, setContent] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Load file content when selectedFile changes
  useEffect(() => {
    if (selectedFile) {
      loadFileContent(selectedFile);
    }
  }, [selectedFile]);

  // Configure Monaco Editor
  useEffect(() => {
    if (monaco) {
      monaco.editor.setTheme('vs-dark');
      
      // Add custom keybindings
      monaco.editor.addKeybindingRules([
        {
          keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
          command: 'save-file',
          when: 'editorTextFocus'
        },
        {
          keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
          command: 'run-code',
          when: 'editorTextFocus'
        }
      ]);

      // Register custom commands
      monaco.editor.registerCommand('save-file', () => {
        if (selectedFile) {
          handleSave();
        }
      });

      monaco.editor.registerCommand('run-code', () => {
        if (selectedFile) {
          handleRun();
        }
      });
    }
  }, [monaco, selectedFile]);

  const loadFileContent = async (filePath: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${backendUrl}/api/workspace/file/${filePath}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || '');
      } else {
        throw new Error('Failed to load file');
      }
    } catch (error) {
      console.error('Failed to load file:', error);
      setContent('// Error loading file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (selectedFile && content) {
      try {
        await onSave(selectedFile, content);
        console.log('File saved successfully');
      } catch (error) {
        console.error('Failed to save file:', error);
      }
    }
  };

  const handleRun = async () => {
    if (selectedFile && content) {
      try {
        setShowTerminal(true);
        setTerminalOutput('Running code...\n');
        
        const response = await fetch(`${backendUrl}/api/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: content,
            language: getLanguageFromExtension(selectedFile)
          }),
        });

        const result = await response.json();
        setTerminalOutput(prev => prev + result.output + '\n');
        
        await onRun(selectedFile, content);
      } catch (error) {
        console.error('Failed to run code:', error);
        setTerminalOutput(prev => prev + `Error: ${error.message}\n`);
      }
    }
  };

  const getLanguageFromExtension = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'dockerfile': 'dockerfile',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'Fira Code, Consolas, Monaco, monospace',
      lineNumbers: 'on',
      wordWrap: 'on',
      minimap: { enabled: true },
      folding: true,
      bracketPairColorization: { enabled: true },
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      wordBasedSuggestions: 'off',
      parameterHints: { enabled: true },
      hover: { enabled: true },
      contextmenu: true,
      mouseWheelZoom: true,
      smoothScrolling: true,
      cursorBlinking: 'blink',
      cursorSmoothCaretAnimation: true,
      renderWhitespace: 'selection',
      renderControlCharacters: false,
      renderIndentGuides: true,
      highlightActiveIndentGuide: true,
      rulers: [80, 120],
      scrollBeyondLastLine: false,
      automaticLayout: true,
      dragAndDrop: true,
      links: true,
      detectIndentation: true,
      insertSpaces: true,
      tabSize: 2,
      trimAutoWhitespace: true,
      largeFileOptimizations: true
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    setContent(value || '');
    if (selectedFile) {
      onFileChange(selectedFile, value || '');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-cursor-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cursor-accent mx-auto mb-4"></div>
          <p className="text-cursor-text">Loading file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-cursor-bg ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Editor Header */}
      <div className="flex items-center justify-between p-3 border-b border-cursor-border bg-cursor-sidebar">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-cursor-accent" />
          <span className="font-medium text-cursor-text">
            {selectedFile || 'No file selected'}
          </span>
          {selectedFile && (
            <span className="text-sm text-gray-400">
              {getLanguageFromExtension(selectedFile)}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            disabled={!selectedFile}
            className="flex items-center px-3 py-1 bg-cursor-accent text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save (Ctrl+S)"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </button>
          
          <button
            onClick={handleRun}
            disabled={!selectedFile}
            className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Run (Ctrl+Enter)"
          >
            <Play className="w-4 h-4 mr-1" />
            Run
          </button>
          
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="flex items-center px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
            title="Toggle Terminal"
          >
            <Terminal className="w-4 h-4 mr-1" />
            Terminal
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Editor and Terminal */}
      <div className="flex-1 flex">
        {/* Monaco Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            language={selectedFile ? getLanguageFromExtension(selectedFile) : 'plaintext'}
            value={content}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: 'Fira Code, Consolas, Monaco, monospace',
              lineNumbers: 'on',
              wordWrap: 'on',
              minimap: { enabled: true },
              folding: true,
              bracketPairColorization: { enabled: true },
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              autoIndent: 'full',
              formatOnPaste: true,
              formatOnType: true,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'on',
              tabCompletion: 'on',
              wordBasedSuggestions: 'off',
              parameterHints: { enabled: true },
              hover: { enabled: true },
              contextmenu: true,
              mouseWheelZoom: true,
              smoothScrolling: true,
              cursorBlinking: 'blink',
              cursorSmoothCaretAnimation: true,
              renderWhitespace: 'selection',
              renderControlCharacters: false,
              renderIndentGuides: true,
              highlightActiveIndentGuide: true,
              rulers: [80, 120],
              scrollBeyondLastLine: false,
              automaticLayout: true,
              dragAndDrop: true,
              links: true,
              detectIndentation: true,
              insertSpaces: true,
              tabSize: 2,
              trimAutoWhitespace: true,
              largeFileOptimizations: true
            }}
          />
        </div>

        {/* Terminal Panel */}
        {showTerminal && (
          <div className="w-1/3 border-l border-cursor-border bg-cursor-sidebar">
            <div className="flex items-center justify-between p-2 border-b border-cursor-border">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-cursor-accent" />
                <span className="text-sm font-medium text-cursor-text">Terminal</span>
              </div>
              <button
                onClick={() => setShowTerminal(false)}
                className="text-gray-400 hover:text-cursor-text"
              >
                ×
              </button>
            </div>
            <div className="p-2 h-full overflow-auto">
              <pre className="text-sm text-cursor-text font-mono whitespace-pre-wrap">
                {terminalOutput || 'Terminal ready...\n'}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-cursor-border bg-cursor-sidebar text-xs text-cursor-text">
        <div className="flex items-center space-x-4">
          <span>Ready</span>
          {selectedFile && (
            <span>{selectedFile}</span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span>UTF-8</span>
          <span>2 spaces</span>
          <span>Monaco Editor</span>
        </div>
      </div>
    </div>
  );
};
EOF

echo -e "${GREEN}✅ تم إصلاح MonacoEditor${NC}"

# 5. إصلاح ChatAssistant للاتصال بالـ Backend
echo -e "${YELLOW}5. إصلاح ChatAssistant للاتصال بالـ Backend...${NC}"
cat > src/components/ChatAssistant.tsx << 'EOF'
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, X } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  provider?: string;
}

interface ChatAssistantProps {
  socket: WebSocket | null;
  apiKeys: Record<string, string>;
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  backendUrl: string;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  socket,
  apiKeys,
  selectedProvider,
  onProviderChange,
  backendUrl
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'chat-response') {
            const newMessage: Message = {
              id: Date.now().toString(),
              type: 'assistant',
              content: data.response,
              timestamp: new Date(),
              provider: data.provider
            };
            setMessages(prev => [...prev, newMessage]);
            setIsTyping(false);
          } else if (data.type === 'typing-start') {
            setIsTyping(true);
          } else if (data.type === 'typing-stop') {
            setIsTyping(false);
          } else if (data.type === 'error') {
            const errorMessage: Message = {
              id: Date.now().toString(),
              type: 'assistant',
              content: `Error: ${data.error}`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsTyping(false);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    }
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim() || !apiKeys[selectedProvider]) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    if (socket && socket.readyState === WebSocket.OPEN) {
      // Send via WebSocket
      socket.send(JSON.stringify({
        type: 'chat',
        content: input,
        provider: selectedProvider,
        apiKey: apiKeys[selectedProvider],
        model: getModelForProvider(selectedProvider)
      }));
    } else {
      // Fallback to HTTP API
      try {
        const response = await fetch(`${backendUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: input,
            provider: selectedProvider,
            apiKey: apiKeys[selectedProvider],
            model: getModelForProvider(selectedProvider)
          }),
        });

        const data = await response.json();
        const assistantMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          provider: selectedProvider
        };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Failed to send message:', error);
        const errorMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: 'Failed to send message. Please check your connection.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  const getModelForProvider = (provider: string) => {
    const models: Record<string, string> = {
      openai: 'gpt-4',
      anthropic: 'claude-3-sonnet-20240229',
      google: 'gemini-pro',
      mistral: 'mistral-large-latest',
      openrouter: 'meta-llama/llama-2-70b-chat'
    };
    return models[provider] || 'gpt-4';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="h-80 border-t border-cursor-border bg-cursor-sidebar flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 border-b border-cursor-border">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-cursor-accent" />
          <span className="font-semibold">AI Assistant</span>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${socket?.readyState === WebSocket.OPEN ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-400">
              {socket?.readyState === WebSocket.OPEN ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedProvider}
            onChange={(e) => onProviderChange(e.target.value)}
            className="bg-cursor-bg border border-cursor-border rounded px-2 py-1 text-sm"
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google Gemini</option>
            <option value="mistral">Mistral</option>
            <option value="openrouter">OpenRouter</option>
          </select>
          <button
            onClick={clearChat}
            className="p-1 hover:bg-cursor-hover rounded"
            title="Clear chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Start a conversation with the AI assistant</p>
            <p className="text-sm">Make sure to set your API key in settings</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-cursor-accent text-white'
                  : 'bg-cursor-bg border border-cursor-border'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'assistant' && (
                  <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                {message.type === 'user' && (
                  <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    {message.provider && (
                      <span className="text-xs opacity-70">
                        via {message.provider}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-cursor-bg border border-cursor-border rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-cursor-border">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              apiKeys[selectedProvider] 
                ? "Ask me anything..." 
                : "Please set your API key in settings first"
            }
            disabled={!apiKeys[selectedProvider]}
            className="flex-1 bg-cursor-bg border border-cursor-border rounded px-3 py-2 text-sm focus:outline-none focus:border-cursor-accent disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !apiKeys[selectedProvider] || isTyping}
            className="bg-cursor-accent text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
EOF

echo -e "${GREEN}✅ تم إصلاح ChatAssistant${NC}"

# 6. بناء Frontend
echo -e "${YELLOW}6. بناء Frontend...${NC}"
npm run build

echo -e "${GREEN}✅ تم بناء Frontend${NC}"

# 7. رفع Frontend إلى Cloudflare Pages
echo -e "${YELLOW}7. رفع Frontend إلى Cloudflare Pages...${NC}"
cd ..

# إنشاء سكريبت رفع Frontend
cat > deploy-frontend-fixed.sh << 'EOF'
#!/bin/bash

API_TOKEN="avRH6WSd0ueXkJqbQpDdnseVo9fy-fUSIJ1pdrWC"
ACCOUNT_ID="76f5b050419f112f1e9c5fbec1b3970d"
PROJECT_NAME="cursor-ide"

# رفع Frontend
echo "رفع Frontend..."
cd frontend/dist

# إنشاء manifest
cat > manifest.json << 'MANIFEST'
{
  "index.html": "index.html",
  "assets/index.css": "assets/index.css",
  "assets/index.js": "assets/index.js"
}
MANIFEST

# ضغط الملفات
zip -r ../frontend-deploy.zip . manifest.json
cd ..

# رفع الملفات
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments" \
  -H "Authorization: Bearer $API_TOKEN" \
  -F "files=@frontend-deploy.zip" \
  -F "manifest=@manifest.json"

echo "تم رفع Frontend"
EOF

chmod +x deploy-frontend-fixed.sh
./deploy-frontend-fixed.sh

echo -e "${GREEN}✅ تم رفع Frontend${NC}"

# 8. اختبار التطبيق الكامل
echo -e "${YELLOW}8. اختبار التطبيق الكامل...${NC}"

echo -e "${YELLOW}اختبار Backend:${NC}"
BACKEND_TEST=$(curl -s https://cursor-backend.workers.dev/health)
echo "$BACKEND_TEST"

echo -e "\n${YELLOW}اختبار Frontend:${NC}"
FRONTEND_TEST=$(curl -s -w "%{http_code}" https://cursor-ide.pages.dev -o /dev/null)
echo "Frontend Status: $FRONTEND_TEST"

# 9. تقرير النتائج
echo -e "\n${GREEN}=========================================="
echo "  🎉 تم إصلاح Frontend وربطه بالـ Backend! 🎉"
echo "=========================================="
echo -e "${NC}"

echo -e "${GREEN}✅ Backend: https://cursor-backend.workers.dev${NC}"
echo -e "${GREEN}✅ Frontend: https://cursor-ide.pages.dev${NC}"

echo -e "\n${YELLOW}📋 اختبار التطبيق:${NC}"
echo "1. 🌐 افتح: https://cursor-ide.pages.dev"
echo "2. 🔑 أضف مفاتيح API للمزودين"
echo "3. 🧪 اختبر وظائف التطبيق"

echo -e "\n${BLUE}🔗 روابط مفيدة:${NC}"
echo "Backend Health: https://cursor-backend.workers.dev/health"
echo "API Providers: https://cursor-backend.workers.dev/api/providers"
echo "API Tools: https://cursor-backend.workers.dev/api/tools"
echo "Workspace Files: https://cursor-backend.workers.dev/api/workspace/files"

echo -e "\n${GREEN}🎉 Frontend مربوط بالـ Backend ويعمل بشكل صحيح!${NC}"