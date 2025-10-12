import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MonacoEditor } from './components/MonacoEditor';
import { ChatAssistant } from './components/ChatAssistant';
import { ProviderForm } from './components/ProviderForm';
import { ToolPanel } from './components/ToolPanel';
import { StatusBar } from './components/StatusBar';
import { NotificationContainer } from './components/Notification';

// Cloudflare Workers URLs
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://cursor-backend.YOUR_SUBDOMAIN.workers.dev';
const WS_URL = import.meta.env.VITE_WS_URL || 'wss://cursor-backend.YOUR_SUBDOMAIN.workers.dev';

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

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocket(WS_URL);
    setSocket(ws);

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Connected to Cloudflare Workers WebSocket');
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    // Load workspace files
    loadWorkspaceFiles();

    return () => {
      ws.close();
    };
  }, []);

  const loadWorkspaceFiles = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/workspace/files`);
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Failed to load workspace files:', error);
      addNotification({
        type: 'error',
        title: 'Failed to load files',
        message: 'Could not load workspace files from Cloudflare storage'
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
    // For Cloudflare Pages, we'll open a new tab with a code editor
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
              // Handle file change
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