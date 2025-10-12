import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Play, 
  FileText, 
  Terminal, 
  GitBranch, 
  Package, 
  Search,
  Plus,
  Trash2,
  Copy,
  Move,
  FolderPlus,
  Loader2
} from 'lucide-react';

interface Tool {
  name: string;
  description: string;
  parameters: any;
}

interface ToolPanelProps {
  onToolExecute: (toolName: string, params: any) => void;
  onResult: (result: any) => void;
}

export const ToolPanel: React.FC<ToolPanelProps> = ({ onToolExecute, onResult }) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [params, setParams] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tools`);
      const data = await response.json();
      setTools(data.tools || []);
    } catch (error) {
      console.error('Failed to load tools:', error);
    }
  };

  const handleToolSelect = (toolName: string) => {
    const tool = tools.find(t => t.name === toolName);
    if (tool) {
      setSelectedTool(toolName);
      setParams({});
    }
  };

  const handleParamChange = (paramName: string, value: any) => {
    setParams(prev => ({ ...prev, [paramName]: value }));
  };

  const executeTool = async () => {
    if (!selectedTool) return;

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/tools/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolName: selectedTool,
          params: params
        }),
      });

      const result = await response.json();
      setResults(prev => [{
        id: Date.now(),
        tool: selectedTool,
        params: params,
        result: result,
        timestamp: new Date()
      }, ...prev]);
      
      onResult(result);
    } catch (error) {
      console.error('Tool execution failed:', error);
      setResults(prev => [{
        id: Date.now(),
        tool: selectedTool,
        params: params,
        result: { success: false, error: error.message },
        timestamp: new Date()
      }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const getToolIcon = (toolName: string) => {
    if (toolName.includes('file')) return <FileText className="w-4 h-4" />;
    if (toolName.includes('terminal') || toolName.includes('command')) return <Terminal className="w-4 h-4" />;
    if (toolName.includes('git')) return <GitBranch className="w-4 h-4" />;
    if (toolName.includes('npm')) return <Package className="w-4 h-4" />;
    if (toolName.includes('search')) return <Search className="w-4 h-4" />;
    if (toolName.includes('create')) return <Plus className="w-4 h-4" />;
    if (toolName.includes('delete')) return <Trash2 className="w-4 h-4" />;
    if (toolName.includes('copy')) return <Copy className="w-4 h-4" />;
    if (toolName.includes('move')) return <Move className="w-4 h-4" />;
    if (toolName.includes('directory')) return <FolderPlus className="w-4 h-4" />;
    return <Wrench className="w-4 h-4" />;
  };

  const renderParameterInput = (paramName: string, paramType: any) => {
    const value = params[paramName] || '';

    if (paramType._def?.typeName === 'ZodString') {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleParamChange(paramName, e.target.value)}
          placeholder={`Enter ${paramName}`}
          className="w-full bg-cursor-bg border border-cursor-border rounded px-2 py-1 text-sm"
        />
      );
    }

    if (paramType._def?.typeName === 'ZodNumber') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => handleParamChange(paramName, parseInt(e.target.value))}
          placeholder={`Enter ${paramName}`}
          className="w-full bg-cursor-bg border border-cursor-border rounded px-2 py-1 text-sm"
        />
      );
    }

    if (paramType._def?.typeName === 'ZodArray') {
      return (
        <input
          type="text"
          value={Array.isArray(value) ? value.join(',') : value}
          onChange={(e) => handleParamChange(paramName, e.target.value.split(',').map(s => s.trim()))}
          placeholder={`Enter ${paramName} (comma-separated)`}
          className="w-full bg-cursor-bg border border-cursor-border rounded px-2 py-1 text-sm"
        />
      );
    }

    if (paramType._def?.typeName === 'ZodRecord') {
      return (
        <textarea
          value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              handleParamChange(paramName, parsed);
            } catch {
              handleParamChange(paramName, e.target.value);
            }
          }}
          placeholder={`Enter ${paramName} (JSON object)`}
          className="w-full bg-cursor-bg border border-cursor-border rounded px-2 py-1 text-sm h-20"
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleParamChange(paramName, e.target.value)}
        placeholder={`Enter ${paramName}`}
        className="w-full bg-cursor-bg border border-cursor-border rounded px-2 py-1 text-sm"
      />
    );
  };

  const selectedToolData = tools.find(t => t.name === selectedTool);

  return (
    <div className="h-full flex flex-col bg-cursor-sidebar border-l border-cursor-border">
      {/* Header */}
      <div className="p-3 border-b border-cursor-border">
        <h3 className="font-semibold flex items-center">
          <Wrench className="w-5 h-5 mr-2" />
          Tools & Integrations
        </h3>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Tool List */}
        <div className="w-1/2 border-r border-cursor-border overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-400 mb-2 px-2">AVAILABLE TOOLS</div>
            {tools.map((tool) => (
              <button
                key={tool.name}
                onClick={() => handleToolSelect(tool.name)}
                className={`w-full text-left p-2 rounded mb-1 flex items-center space-x-2 ${
                  selectedTool === tool.name
                    ? 'bg-cursor-accent text-white'
                    : 'hover:bg-cursor-hover'
                }`}
              >
                {getToolIcon(tool.name)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{tool.name}</div>
                  <div className="text-xs opacity-70 truncate">{tool.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tool Configuration */}
        <div className="flex-1 flex flex-col">
          {selectedToolData ? (
            <>
              {/* Parameters */}
              <div className="flex-1 p-3 overflow-y-auto">
                <h4 className="font-medium mb-3">{selectedToolData.name}</h4>
                <p className="text-sm text-gray-400 mb-4">{selectedToolData.description}</p>
                
                <div className="space-y-3">
                  {Object.entries(selectedToolData.parameters).map(([paramName, paramType]) => (
                    <div key={paramName}>
                      <label className="block text-sm font-medium mb-1">
                        {paramName}
                        {paramType._def?.typeName === 'ZodOptional' ? (
                          <span className="text-gray-400 ml-1">(optional)</span>
                        ) : (
                          <span className="text-red-400 ml-1">*</span>
                        )}
                      </label>
                      {renderParameterInput(paramName, paramType)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Execute Button */}
              <div className="p-3 border-t border-cursor-border">
                <button
                  onClick={executeTool}
                  disabled={loading}
                  className="w-full bg-cursor-accent text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Execute Tool
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a tool to configure and execute</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="border-t border-cursor-border max-h-40 overflow-y-auto">
          <div className="p-2 text-xs text-gray-400">RECENT RESULTS</div>
          {results.slice(0, 5).map((result) => (
            <div key={result.id} className="p-2 border-b border-cursor-border text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{result.tool}</span>
                <span className="text-gray-400">
                  {result.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className={`text-xs ${
                result.result.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {result.result.success ? 'Success' : 'Failed'}
                {result.result.error && `: ${result.result.error}`}
              </div>
              {result.result.output && (
                <div className="mt-1 text-gray-300 font-mono text-xs max-h-20 overflow-y-auto">
                  {result.result.output}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};