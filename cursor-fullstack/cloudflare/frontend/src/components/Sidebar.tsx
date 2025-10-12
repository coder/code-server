import React, { useState } from 'react';
import { 
  FileText, 
  Folder, 
  FolderOpen, 
  Plus, 
  MessageSquare, 
  Settings, 
  Wrench, 
  Code, 
  ExternalLink,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface File {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: File[];
}

interface SidebarProps {
  files: File[];
  selectedFile: string | null;
  onFileSelect: (filePath: string) => void;
  onShowChat: () => void;
  onShowProviderForm: () => void;
  onShowTools: () => void;
  onOpenCodeServer: () => void;
  showChat: boolean;
  showTools: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  selectedFile,
  onFileSelect,
  onShowChat,
  onShowProviderForm,
  onShowTools,
  onOpenCodeServer,
  showChat,
  showTools
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showNewFileForm, setShowNewFileForm] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const handleNewFile = async () => {
    if (newFileName.trim()) {
      // Create new file logic here
      console.log('Creating new file:', newFileName);
      setNewFileName('');
      setShowNewFileForm(false);
    }
  };

  const renderFile = (file: File, depth = 0) => {
    const isExpanded = expandedFolders.has(file.path);
    const isSelected = selectedFile === file.path;

    if (file.type === 'folder') {
      return (
        <div key={file.path}>
          <div
            className={`flex items-center px-3 py-1 cursor-pointer hover:bg-cursor-hover ${
              isSelected ? 'bg-cursor-accent text-white' : 'text-cursor-text'
            }`}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
            onClick={() => toggleFolder(file.path)}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 mr-1" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-1" />
            )}
            <Folder className="w-4 h-4 mr-2" />
            <span className="text-sm">{file.name}</span>
          </div>
          {isExpanded && file.children && (
            <div>
              {file.children.map(child => renderFile(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={file.path}
        className={`flex items-center px-3 py-1 cursor-pointer hover:bg-cursor-hover ${
          isSelected ? 'bg-cursor-accent text-white' : 'text-cursor-text'
        }`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={() => onFileSelect(file.path)}
      >
        <FileText className="w-4 h-4 mr-2" />
        <span className="text-sm">{file.name}</span>
      </div>
    );
  };

  return (
    <div className="w-64 bg-cursor-sidebar border-r border-cursor-border flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-cursor-border">
        <h2 className="text-lg font-semibold text-cursor-text">Explorer</h2>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="p-3 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files found</p>
            <p className="text-xs">Create a new file to get started</p>
          </div>
        ) : (
          <div>
            {files.map(file => renderFile(file))}
          </div>
        )}
      </div>

      {/* New File Form */}
      {showNewFileForm && (
        <div className="p-3 border-t border-cursor-border">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="File name..."
              className="flex-1 px-2 py-1 bg-cursor-bg border border-cursor-border rounded text-sm text-cursor-text"
              onKeyPress={(e) => e.key === 'Enter' && handleNewFile()}
              autoFocus
            />
            <button
              onClick={handleNewFile}
              className="px-2 py-1 bg-cursor-accent text-white rounded text-sm hover:bg-blue-600"
            >
              Create
            </button>
            <button
              onClick={() => setShowNewFileForm(false)}
              className="px-2 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-3 border-t border-cursor-border space-y-2">
        <button
          onClick={() => setShowNewFileForm(!showNewFileForm)}
          className="w-full flex items-center px-3 py-2 rounded text-sm transition-colors hover:bg-cursor-hover group"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span className="flex-1 text-left">New File</span>
        </button>

        <button
          onClick={onShowChat}
          className={`w-full flex items-center px-3 py-2 rounded text-sm transition-colors hover:bg-cursor-hover group ${
            showChat ? 'bg-cursor-accent text-white' : 'text-cursor-text'
          }`}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          <span className="flex-1 text-left">AI Chat</span>
        </button>

        <button
          onClick={onShowTools}
          className={`w-full flex items-center px-3 py-2 rounded text-sm transition-colors hover:bg-cursor-hover group ${
            showTools ? 'bg-cursor-accent text-white' : 'text-cursor-text'
          }`}
        >
          <Wrench className="w-4 h-4 mr-2" />
          <span className="flex-1 text-left">Tools</span>
        </button>

        <button
          onClick={onShowProviderForm}
          className="w-full flex items-center px-3 py-2 rounded text-sm transition-colors hover:bg-cursor-hover group"
        >
          <Settings className="w-4 h-4 mr-2" />
          <span className="flex-1 text-left">Settings</span>
        </button>

        <button
          onClick={onOpenCodeServer}
          className="w-full flex items-center px-3 py-2 rounded text-sm transition-colors hover:bg-cursor-hover group"
        >
          <Code className="w-4 h-4 mr-2" />
          <span className="flex-1 text-left">VS Code Server</span>
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-cursor-border text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <span>Monaco Editor</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
};