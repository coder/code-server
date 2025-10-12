import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { EditorPanel } from './components/EditorPanel';
import { ChatAssistant } from './components/ChatAssistant';
import { ProviderForm } from './components/ProviderForm';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

function App() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');

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

  return (
    <div className="flex h-screen bg-cursor-bg text-cursor-text">
      {/* Sidebar */}
      <Sidebar
        files={files}
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onShowChat={() => setShowChat(!showChat)}
        onShowProviderForm={() => setShowProviderForm(true)}
        showChat={showChat}
      />

      {/* Main Content */}
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