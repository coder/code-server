import React, { useRef, useEffect, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { useMonaco } from '@monaco-editor/react';
import { FileText, Save, Play, Terminal, Settings, Maximize2, Minimize2 } from 'lucide-react';

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
      // Configure Monaco Editor options
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
        },
        {
          keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.F11,
          command: 'toggle-fullscreen',
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

      monaco.editor.registerCommand('toggle-fullscreen', () => {
        setIsFullscreen(!isFullscreen);
      });
    }
  }, [monaco, selectedFile, isFullscreen]);

  const loadFileContent = async (filePath: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${backendUrl}/api/workspace/file/${filePath}`);
      const data = await response.json();
      setContent(data.content || '');
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
        // Show success notification
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
    
    // Configure editor options
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
      largeFileOptimizations: true,
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        useShadows: true,
        verticalHasArrows: true,
        horizontalHasArrows: true,
        verticalScrollbarSize: 12,
        horizontalScrollbarSize: 12
      }
    });

    // Add custom actions
    editor.addAction({
      id: 'save-file',
      label: 'Save File',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: handleSave
    });

    editor.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: handleRun
    });

    editor.addAction({
      id: 'toggle-fullscreen',
      label: 'Toggle Fullscreen',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.F11],
      run: () => setIsFullscreen(!isFullscreen)
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
            title="Toggle Fullscreen (Ctrl+F11)"
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