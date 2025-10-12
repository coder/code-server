import React from 'react';
import { Wifi, WifiOff, GitBranch, Circle } from 'lucide-react';

interface StatusBarProps {
  isConnected: boolean;
  selectedFile: string | null;
  lineCount: number;
  currentLine: number;
  currentColumn: number;
  language: string;
  gitBranch: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isConnected,
  selectedFile,
  lineCount,
  currentLine,
  currentColumn,
  language,
  gitBranch
}) => {
  return (
    <div className="flex items-center justify-between px-3 py-1 bg-cursor-sidebar border-t border-cursor-border text-xs text-cursor-text">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        {/* Connection status */}
        <div className="flex items-center space-x-1">
          {isConnected ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>

        {/* File info */}
        {selectedFile && (
          <div className="flex items-center space-x-2">
            <span>{selectedFile}</span>
            <span>•</span>
            <span>{language}</span>
          </div>
        )}

        {/* Git branch */}
        {gitBranch && (
          <div className="flex items-center space-x-1">
            <GitBranch className="w-3 h-3" />
            <span>{gitBranch}</span>
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Line info */}
        <div className="flex items-center space-x-2">
          <span>Ln {currentLine}, Col {currentColumn}</span>
          {lineCount > 0 && (
            <>
              <span>•</span>
              <span>{lineCount} lines</span>
            </>
          )}
        </div>

        {/* Status indicators */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Circle className="w-2 h-2 text-green-500" />
            <span>Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};