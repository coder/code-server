import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { EditorPanel } from './components/EditorPanel';
import { ChatAssistant } from './components/ChatAssistant';
import { ProviderForm } from './components/ProviderForm';
import { ToolPanel } from './components/ToolPanel';
import { StatusBar } from './components/StatusBar';
import { NotificationContainer } from './components/Notification';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

function App() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentLine, setCurrentLine] = useState(1);
  const [currentColumn, setCurrentColumn] = useState(1);
  const [lineCount, setLineCount] = useState(0);
  const [gitBranch, setGitBranch] = useState<string>('');

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    // Load workspace files
    loadWorkspaceFiles();

    return () => {
      newSocket.close();
    };
  }, []);

  const loadWorkspaceFiles = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/workspace/files`);
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Failed to load workspace files:', error);
    }
  };

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
  };

  const handleApiKeySave = (provider: string, apiKey: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: apiKey }));
    setShowProviderForm(false);
  };

  const handleOpenCodeServer = () => {
    window.open('http://localhost:8081', '_blank');
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
          {/* Editor Panel */}
          <EditorPanel
            selectedFile={selectedFile}
            onFileChange={loadWorkspaceFiles}
          />

          {/* Chat Assistant */}
          {showChat && (
            <ChatAssistant
              socket={socket}
              apiKeys={apiKeys}
              selectedProvider={selectedProvider}
              onProviderChange={setSelectedProvider}
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
          />
        )}
      </div>

      {/* Status Bar */}
      <StatusBar
        isConnected={socket?.connected || false}
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