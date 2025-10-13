import React, { useState, useEffect } from 'react';
import { FileText, Settings, Bot, Terminal, Play, Save, FolderOpen } from 'lucide-react';

// Backend URLs
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://cursor-backend.workers.dev';

function App() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [content, setContent] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Test backend connection
      const healthResponse = await fetch(`${BACKEND_URL}/health`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('Backend connected:', healthData);
        setIsConnected(true);
        
        // Load workspace files
        await loadWorkspaceFiles();
      } else {
        throw new Error('Backend not responding');
      }
    } catch (error) {
      console.error('Failed to connect to backend:', error);
      setError('Failed to connect to backend. Please check your connection.');
    } finally {
      setIsLoading(false);
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
    }
  };

  const loadFileContent = async (filePath: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/workspace/file/${filePath}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || '');
        setSelectedFile(filePath);
      } else {
        throw new Error('Failed to load file');
      }
    } catch (error) {
      console.error('Failed to load file:', error);
      setContent('// Error loading file');
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/workspace/file/${selectedFile}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (response.ok) {
        console.log('File saved successfully');
      } else {
        throw new Error('Failed to save file');
      }
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const runCode = async () => {
    if (!selectedFile) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/execute`, {
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
      console.log('Code executed:', result);
    } catch (error) {
      console.error('Failed to run code:', error);
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
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !apiKey) return;
    
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatMessage,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setChatMessage('');
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: chatMessage,
          provider: 'openai',
          apiKey: apiKey,
          model: 'gpt-4'
        }),
      });
      
      const data = await response.json();
      const assistantMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: data.response || 'No response received',
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send chat message:', error);
      const errorMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Failed to send message. Please check your connection.',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    }
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <div>Loading Cursor AI IDE...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading">
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#f44747', marginBottom: '16px' }}>⚠️</div>
          <div style={{ marginBottom: '16px' }}>{error}</div>
          <button 
            className="btn btn-primary"
            onClick={initializeApp}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-cursor-bg text-cursor-text">
      {/* Sidebar */}
      <div className="w-64 bg-cursor-sidebar border-r border-cursor-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-cursor-border">
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-cursor-accent" />
            <span className="font-semibold">Cursor AI IDE</span>
          </div>
          <div className="flex items-center space-x-1 mt-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Files */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-sm font-medium text-gray-400 mb-2">Files</div>
          {files.map((file, index) => (
            <div
              key={index}
              className={`p-2 rounded cursor-pointer hover:bg-cursor-hover ${
                selectedFile === file.path ? 'bg-cursor-selection' : ''
              }`}
              onClick={() => loadFileContent(file.path)}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm">{file.name}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="p-2 border-t border-cursor-border">
          <button
            className="btn btn-secondary w-full mb-2"
            onClick={() => setShowChat(!showChat)}
          >
            <Bot className="w-4 h-4 mr-2" />
            AI Chat
          </button>
          <button
            className="btn btn-secondary w-full"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Editor Header */}
        {selectedFile && (
          <div className="flex items-center justify-between p-3 border-b border-cursor-border bg-cursor-sidebar">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-cursor-accent" />
              <span className="font-medium">{selectedFile}</span>
              <span className="text-sm text-gray-400">
                {getLanguageFromExtension(selectedFile)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={saveFile}
                className="btn btn-primary"
                title="Save (Ctrl+S)"
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </button>
              
              <button
                onClick={runCode}
                className="btn btn-secondary"
                title="Run (Ctrl+Enter)"
              >
                <Play className="w-4 h-4 mr-1" />
                Run
              </button>
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 flex">
          <div className="flex-1 p-4">
            {selectedFile ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full bg-cursor-bg text-cursor-text p-4 border border-cursor-border rounded font-mono text-sm resize-none focus:outline-none focus:border-cursor-accent"
                placeholder="Start coding..."
                style={{ minHeight: '400px' }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No file selected</h3>
                  <p className="text-gray-400">Select a file from the sidebar to start coding</p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Panel */}
          {showChat && (
            <div className="w-80 border-l border-cursor-border bg-cursor-sidebar flex flex-col">
              <div className="p-3 border-b border-cursor-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-cursor-accent" />
                    <span className="font-semibold">AI Chat</span>
                  </div>
                  <button
                    onClick={() => setShowChat(false)}
                    className="text-gray-400 hover:text-cursor-text"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {chatHistory.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Start a conversation with AI</p>
                    <p className="text-sm">Set your API key in settings</p>
                  </div>
                )}
                
                {chatHistory.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-cursor-accent text-white ml-8'
                        : 'bg-cursor-bg border border-cursor-border mr-8'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-cursor-border">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder={apiKey ? "Ask me anything..." : "Set API key first"}
                    disabled={!apiKey}
                    className="flex-1 input"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!chatMessage.trim() || !apiKey}
                    className="btn btn-primary"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-3 py-1 border-t border-cursor-border bg-cursor-sidebar text-xs text-cursor-text">
          <div className="flex items-center space-x-4">
            <span>Ready</span>
            {selectedFile && <span>{selectedFile}</span>}
          </div>
          <div className="flex items-center space-x-4">
            <span>UTF-8</span>
            <span>2 spaces</span>
            <span>Cursor AI IDE</span>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-cursor-sidebar border border-cursor-border rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-cursor-text"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your OpenAI API key"
                  className="input"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="btn btn-primary"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
