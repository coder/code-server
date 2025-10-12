import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { Terminal, Play, Save, RefreshCw, Plus, Search, Settings, Maximize2, Minimize2 } from 'lucide-react';
import { useKeyboardShortcuts, defaultShortcuts } from '../hooks/useKeyboardShortcuts';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFind, setShowFind] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [isReplacing, setIsReplacing] = useState(false);
  const editorRef = useRef<any>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  useEffect(() => {
    if (selectedFile) {
      loadFileContent();
    }
  }, [selectedFile]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    ...defaultShortcuts,
    {
      key: 's',
      ctrlKey: true,
      action: saveFile,
      description: 'Save file'
    },
    {
      key: 'Enter',
      ctrlKey: true,
      action: runCode,
      description: 'Run code'
    },
    {
      key: 'f',
      ctrlKey: true,
      action: () => setShowFind(true),
      description: 'Find in file'
    },
    {
      key: 'h',
      ctrlKey: true,
      action: () => {
        setShowFind(true);
        setIsReplacing(true);
      },
      description: 'Find and replace'
    },
    {
      key: 'Escape',
      action: () => {
        setShowFind(false);
        setIsReplacing(false);
      },
      description: 'Close find/replace'
    },
    {
      key: 'F11',
      action: () => setIsFullscreen(!isFullscreen),
      description: 'Toggle fullscreen'
    }
  ]);

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

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const findInEditor = () => {
    if (editorRef.current && findText) {
      editorRef.current.getAction('actions.find').run();
    }
  };

  const replaceInEditor = () => {
    if (editorRef.current && findText && replaceText) {
      editorRef.current.getAction('editor.action.replaceAll').run();
    }
  };

  const newFile = () => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
      // This would be handled by the parent component
      console.log('New file:', fileName);
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
          <p className="text-gray-400 mb-4">Select a file from the sidebar to start editing</p>
          <button
            onClick={newFile}
            className="flex items-center px-4 py-2 bg-cursor-accent text-white rounded hover:bg-blue-600 mx-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            New File
          </button>
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
            onClick={() => setShowFind(true)}
            className="flex items-center px-3 py-1 bg-cursor-hover text-cursor-text rounded text-sm hover:bg-cursor-accent hover:text-white"
            title="Find (Ctrl+F)"
          >
            <Search className="w-4 h-4 mr-1" />
            Find
          </button>
          <button
            onClick={saveFile}
            disabled={saving}
            className="flex items-center px-3 py-1 bg-cursor-accent text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
            title="Save (Ctrl+S)"
          >
            <Save className="w-4 h-4 mr-1" />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={runCode}
            className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            title="Run (Ctrl+Enter)"
          >
            <Play className="w-4 h-4 mr-1" />
            Run
          </button>
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`flex items-center px-3 py-1 rounded text-sm ${
              showTerminal ? 'bg-cursor-accent text-white' : 'bg-cursor-hover text-cursor-text'
            }`}
            title="Toggle Terminal"
          >
            <Terminal className="w-4 h-4 mr-1" />
            Terminal
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center px-3 py-1 bg-cursor-hover text-cursor-text rounded text-sm hover:bg-cursor-accent hover:text-white"
            title="Toggle Fullscreen (F11)"
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
            language={getLanguageFromExtension(selectedFile)}
            value={content}
            onChange={(value) => setContent(value || '')}
            onMount={handleEditorDidMount}
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
              selectOnLineNumbers: true,
              renderLineHighlight: 'line',
              cursorStyle: 'line',
              cursorBlinking: 'blink',
              cursorWidth: 1,
              folding: true,
              foldingStrategy: 'indentation',
              showFoldingControls: 'always',
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true
              },
              suggest: {
                showKeywords: true,
                showSnippets: true,
                showFunctions: true,
                showConstructors: true,
                showFields: true,
                showVariables: true,
                showClasses: true,
                showStructs: true,
                showInterfaces: true,
                showModules: true,
                showProperties: true,
                showEvents: true,
                showOperators: true,
                showUnits: true,
                showValues: true,
                showConstants: true,
                showEnums: true,
                showEnumMembers: true,
                showColors: true,
                showFiles: true,
                showReferences: true,
                showFolders: true,
                showTypeParameters: true,
                showIssues: true,
                showUsers: true,
                showWords: true
              }
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

      {/* Find/Replace Modal */}
      {showFind && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-cursor-sidebar border border-cursor-border rounded-lg p-4 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {isReplacing ? 'Find and Replace' : 'Find in File'}
              </h3>
              <button
                onClick={() => {
                  setShowFind(false);
                  setIsReplacing(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Find</label>
                <input
                  type="text"
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  className="w-full bg-cursor-bg border border-cursor-border rounded px-3 py-2 text-sm focus:outline-none focus:border-cursor-accent"
                  placeholder="Enter text to find..."
                  autoFocus
                />
              </div>
              
              {isReplacing && (
                <div>
                  <label className="block text-sm font-medium mb-1">Replace</label>
                  <input
                    type="text"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    className="w-full bg-cursor-bg border border-cursor-border rounded px-3 py-2 text-sm focus:outline-none focus:border-cursor-accent"
                    placeholder="Enter replacement text..."
                  />
                </div>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={findInEditor}
                  disabled={!findText}
                  className="flex-1 bg-cursor-accent text-white py-2 px-4 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  Find
                </button>
                {isReplacing && (
                  <button
                    onClick={replaceInEditor}
                    disabled={!findText || !replaceText}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    Replace All
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};