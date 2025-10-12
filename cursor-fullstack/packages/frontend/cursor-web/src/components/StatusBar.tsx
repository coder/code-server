import React from 'react';
import { GitBranch, Circle, Wifi, WifiOff } from 'lucide-react';

interface StatusBarProps {
  isConnected: boolean;
  selectedFile: string | null;
  lineCount: number;
  currentLine: number;
  currentColumn: number;
  language: string;
  gitBranch?: string;
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
    <div className="h-6 bg-cursor-sidebar border-t border-cursor-border flex items-center justify-between px-3 text-xs text-gray-400">
      <div className="flex items-center space-x-4">
        {/* Connection Status */}
        <div className="flex items-center space-x-1">
          {isConnected ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>

        {/* Git Branch */}
        {gitBranch && (
          <div className="flex items-center space-x-1">
            <GitBranch className="w-3 h-3" />
            <span>{gitBranch}</span>
          </div>
        )}

        {/* File Info */}
        {selectedFile && (
          <div className="flex items-center space-x-1">
            <Circle className="w-2 h-2 text-green-500" />
            <span>{selectedFile}</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Language */}
        {language && (
          <span className="uppercase">{language}</span>
        )}

        {/* Cursor Position */}
        <span>
          Ln {currentLine}, Col {currentColumn}
        </span>

        {/* Line Count */}
        <span>
          {lineCount} lines
        </span>
      </div>
    </div>
  );
};