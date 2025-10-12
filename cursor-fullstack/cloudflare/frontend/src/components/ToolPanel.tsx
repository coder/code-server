import React, { useState, useEffect } from 'react';
import { Wrench, Play, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

interface ToolPanelProps {
  onToolExecute: (toolName: string, params: any) => void;
  onResult: (result: any) => void;
  backendUrl: string;
}

export const ToolPanel: React.FC<ToolPanelProps> = ({
  onToolExecute,
  onResult,
  backendUrl
}) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [params, setParams] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/tools`);
      const data = await response.json();
      setTools(data.tools || []);
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setIsLoading(false);
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
    setParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const executeTool = async () => {
    if (!selectedTool) return;

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      const response = await fetch(`${backendUrl}/api/tools/execute`, {
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
      const executionTime = Date.now() - startTime;

      const toolResult = {
        id: Date.now().toString(),
        toolName: selectedTool,
        params: params,
        result: result,
        executionTime: executionTime,
        timestamp: new Date().toISOString(),
        success: result.success !== false
      };

      setResults(prev => [toolResult, ...prev]);
      onResult(toolResult);
    } catch (error) {
      const toolResult = {
        id: Date.now().toString(),
        toolName: selectedTool,
        params: params,
        result: { error: error.message },
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        success: false
      };

      setResults(prev => [toolResult, ...prev]);
    } finally {
      setIsExecuting(false);
    }
  };

  const selectedToolInfo = tools.find(t => t.name === selectedTool);

  if (isLoading) {
    return (
      <div className="w-80 bg-cursor-sidebar border-l border-cursor-border flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cursor-accent mx-auto mb-2" />
          <p className="text-cursor-text">Loading tools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-cursor-sidebar border-l border-cursor-border flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-cursor-border">
        <div className="flex items-center space-x-2">
          <Wrench className="w-5 h-5 text-cursor-accent" />
          <h2 className="text-lg font-semibold text-cursor-text">Tools</h2>
        </div>
      </div>

      {/* Tool Selection */}
      <div className="p-3 border-b border-cursor-border">
        <label className="block text-sm font-medium text-cursor-text mb-2">
          Select Tool
        </label>
        <select
          value={selectedTool}
          onChange={(e) => handleToolSelect(e.target.value)}
          className="w-full bg-cursor-bg border border-cursor-border rounded px-3 py-2 text-cursor-text"
        >
          <option value="">Choose a tool...</option>
          {tools.map(tool => (
            <option key={tool.name} value={tool.name}>
              {tool.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tool Description */}
      {selectedToolInfo && (
        <div className="p-3 border-b border-cursor-border">
          <h3 className="font-medium text-cursor-text mb-1">{selectedToolInfo.name}</h3>
          <p className="text-sm text-gray-400">{selectedToolInfo.description}</p>
        </div>
      )}

      {/* Parameters */}
      {selectedToolInfo && selectedToolInfo.parameters && (
        <div className="p-3 border-b border-cursor-border">
          <h4 className="text-sm font-medium text-cursor-text mb-2">Parameters</h4>
          <div className="space-y-2">
            {Object.entries(selectedToolInfo.parameters).map(([paramName, paramInfo]) => (
              <div key={paramName}>
                <label className="block text-xs text-gray-400 mb-1">
                  {paramName} ({paramInfo.type || 'string'})
                </label>
                <input
                  type={paramInfo.type === 'number' ? 'number' : 'text'}
                  value={params[paramName] || ''}
                  onChange={(e) => handleParamChange(paramName, e.target.value)}
                  placeholder={`Enter ${paramName}...`}
                  className="w-full bg-cursor-bg border border-cursor-border rounded px-2 py-1 text-sm text-cursor-text"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execute Button */}
      {selectedTool && (
        <div className="p-3 border-b border-cursor-border">
          <button
            onClick={executeTool}
            disabled={isExecuting}
            className="w-full flex items-center justify-center px-4 py-2 bg-cursor-accent text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isExecuting ? 'Executing...' : 'Execute Tool'}
          </button>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-3">
        <h4 className="text-sm font-medium text-cursor-text mb-2">Results</h4>
        {results.length === 0 ? (
          <p className="text-sm text-gray-400">No results yet</p>
        ) : (
          <div className="space-y-2">
            {results.map(result => (
              <div
                key={result.id}
                className="bg-cursor-bg rounded p-2 border border-cursor-border"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-cursor-text">
                    {result.toolName}
                  </span>
                  <div className="flex items-center space-x-2">
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-xs text-gray-400">
                      {result.executionTime}ms
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-1">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </div>
                <pre className="text-xs text-cursor-text bg-cursor-sidebar rounded p-2 overflow-x-auto">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};