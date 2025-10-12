import React, { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { Terminal, Play, Save, RefreshCw } from 'lucide-react';

interface EditorPanelProps {
  selectedFile: string | null;
  onFileChange: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  selectedFile,
  onFileChange
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [terminalInput, setTerminalInput] = useState<string>('');

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  useEffect(() => {
    if (selectedFile) {
      loadFileContent();
    }
  }, [selectedFile]);

  const loadFileContent = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/workspace/file/${selectedFile}`);
      const data = await response.json();
      setContent(data.content || '');
    } catch (error) {
      console.error('Failed to load file:', error);
      setContent('// Error loading file');
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    
    setSaving(true);
    try {
      await fetch(`${BACKEND_URL}/api/workspace/file/${selectedFile}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      onFileChange();
    } catch (error) {
      console.error('Failed to save file:', error);
    } finally {
      setSaving(false);
    }
  };

  const runCode = async () => {
    if (!selectedFile) return;
    
    setTerminalOutput('Running code...\n');
    setShowTerminal(true);
    
    try {
      // This would integrate with a real code execution service
      const response = await fetch(`${BACKEND_URL}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          file: selectedFile,
          content: content 
        }),
      });
      
      const result = await response.json();
      setTerminalOutput(prev => prev + result.output);
    } catch (error) {
      setTerminalOutput(prev => prev + `Error: ${error}\n`);
    }
  };

  const executeTerminalCommand = async (command: string) => {
    if (!command.trim()) return;
    
    setTerminalOutput(prev => prev + `$ ${command}\n`);
    setTerminalInput('');
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/terminal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });
      
      const result = await response.json();
      setTerminalOutput(prev => prev + result.output + '\n');
    } catch (error) {
      setTerminalOutput(prev => prev + `Error: ${error}\n`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeTerminalCommand(terminalInput);
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

  if (!selectedFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-cursor-bg">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-semibold mb-2">No file selected</h2>
          <p className="text-gray-400">Select a file from the sidebar to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-cursor-bg">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-3 border-b border-cursor-border bg-cursor-sidebar">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{selectedFile}</span>
          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={saveFile}
            disabled={saving}
            className="flex items-center px-3 py-1 bg-cursor-accent text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-1" />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={runCode}
            className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            <Play className="w-4 h-4 mr-1" />
            Run
          </button>
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`flex items-center px-3 py-1 rounded text-sm ${
              showTerminal ? 'bg-cursor-accent text-white' : 'bg-cursor-hover text-cursor-text'
            }`}
          >
            <Terminal className="w-4 h-4 mr-1" />
            Terminal
          </button>
        </div>
      </div>

      {/* Editor and Terminal */}
      <div className="flex-1 flex">
        {/* Monaco Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            language={getLanguageFromExtension(selectedFile)}
            value={content}
            onChange={(value) => setContent(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              tabSize: 2,
              insertSpaces: true,
            }}
          />
        </div>

        {/* Terminal Panel */}
        {showTerminal && (
          <div className="w-1/2 border-l border-cursor-border bg-black">
            <div className="p-2 border-b border-cursor-border bg-cursor-sidebar">
              <span className="text-sm font-medium">Terminal</span>
            </div>
            <div className="h-full flex flex-col">
              <div className="flex-1 p-2 overflow-y-auto font-mono text-sm">
                <pre className="whitespace-pre-wrap">{terminalOutput}</pre>
              </div>
              <div className="p-2 border-t border-cursor-border">
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter command..."
                  className="w-full bg-transparent border-none outline-none text-white font-mono text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};