import React from 'react';
import { 
  MessageSquare, 
  Settings, 
  File, 
  Folder, 
  FolderOpen,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface SidebarProps {
  files: any[];
  selectedFile: string | null;
  onFileSelect: (filePath: string) => void;
  onShowChat: () => void;
  onShowProviderForm: () => void;
  showChat: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  selectedFile,
  onFileSelect,
  onShowChat,
  onShowProviderForm,
  showChat
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (files: any[], level = 0) => {
    const groupedFiles = files.reduce((acc, file) => {
      const pathParts = file.path.split('/');
      const folder = pathParts.slice(0, -1).join('/');
      
      if (!acc[folder]) {
        acc[folder] = [];
      }
      acc[folder].push(file);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(groupedFiles).map(([folder, folderFiles]) => {
      const isExpanded = expandedFolders.has(folder);
      const hasSubfolders = folderFiles.some(f => f.type === 'directory');
      
      return (
        <div key={folder} className="select-none">
          {folder && (
            <div
              className="flex items-center py-1 px-2 hover:bg-cursor-hover cursor-pointer"
              style={{ paddingLeft: `${level * 12 + 8}px` }}
              onClick={() => toggleFolder(folder)}
            >
              {hasSubfolders && (
                <div className="w-4 h-4 flex items-center justify-center">
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </div>
              )}
              {!hasSubfolders && <div className="w-4" />}
              <Folder className="w-4 h-4 mr-2" />
              <span className="text-sm">{folder.split('/').pop() || 'Root'}</span>
            </div>
          )}
          
          {isExpanded && (
            <div>
              {folderFiles.map((file) => (
                <div
                  key={file.path}
                  className={`flex items-center py-1 px-2 hover:bg-cursor-hover cursor-pointer ${
                    selectedFile === file.path ? 'bg-cursor-accent' : ''
                  }`}
                  style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
                  onClick={() => onFileSelect(file.path)}
                >
                  <File className="w-4 h-4 mr-2" />
                  <span className="text-sm">{file.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-64 bg-cursor-sidebar border-r border-cursor-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-cursor-border">
        <h1 className="text-lg font-semibold text-white">Cursor IDE</h1>
      </div>

      {/* Navigation */}
      <div className="p-2 border-b border-cursor-border">
        <button
          onClick={onShowChat}
          className={`w-full flex items-center px-3 py-2 rounded text-sm transition-colors ${
            showChat ? 'bg-cursor-accent text-white' : 'hover:bg-cursor-hover'
          }`}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          AI Chat
        </button>
      </div>

      {/* File Explorer */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="text-xs text-gray-400 mb-2 px-2">EXPLORER</div>
          {renderFileTree(files)}
        </div>
      </div>

      {/* Settings */}
      <div className="p-2 border-t border-cursor-border">
        <button
          onClick={onShowProviderForm}
          className="w-full flex items-center px-3 py-2 rounded text-sm hover:bg-cursor-hover transition-colors"
        >
          <Settings className="w-4 h-4 mr-2" />
          AI Settings
        </button>
      </div>
    </div>
  );
};