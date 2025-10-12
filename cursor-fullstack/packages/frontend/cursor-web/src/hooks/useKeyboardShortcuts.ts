import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find(shortcut => {
        return (
          shortcut.key.toLowerCase() === event.key.toLowerCase() &&
          !!shortcut.ctrlKey === event.ctrlKey &&
          !!shortcut.shiftKey === event.shiftKey &&
          !!shortcut.altKey === event.altKey
        );
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export const defaultShortcuts: KeyboardShortcut[] = [
  {
    key: 's',
    ctrlKey: true,
    action: () => {
      // Save file - will be handled by parent component
      const saveEvent = new CustomEvent('save-file');
      document.dispatchEvent(saveEvent);
    },
    description: 'Save file'
  },
  {
    key: 'n',
    ctrlKey: true,
    action: () => {
      const newFileEvent = new CustomEvent('new-file');
      document.dispatchEvent(newFileEvent);
    },
    description: 'New file'
  },
  {
    key: 'o',
    ctrlKey: true,
    action: () => {
      const openFileEvent = new CustomEvent('open-file');
      document.dispatchEvent(openFileEvent);
    },
    description: 'Open file'
  },
  {
    key: 'f',
    ctrlKey: true,
    action: () => {
      const findEvent = new CustomEvent('find-in-file');
      document.dispatchEvent(findEvent);
    },
    description: 'Find in file'
  },
  {
    key: 'h',
    ctrlKey: true,
    action: () => {
      const replaceEvent = new CustomEvent('replace-in-file');
      document.dispatchEvent(replaceEvent);
    },
    description: 'Find and replace'
  },
  {
    key: 'g',
    ctrlKey: true,
    action: () => {
      const gotoEvent = new CustomEvent('goto-line');
      document.dispatchEvent(gotoEvent);
    },
    description: 'Go to line'
  },
  {
    key: 'd',
    ctrlKey: true,
    action: () => {
      const duplicateEvent = new CustomEvent('duplicate-line');
      document.dispatchEvent(duplicateEvent);
    },
    description: 'Duplicate line'
  },
  {
    key: 'k',
    ctrlKey: true,
    action: () => {
      const deleteLineEvent = new CustomEvent('delete-line');
      document.dispatchEvent(deleteLineEvent);
    },
    description: 'Delete line'
  },
  {
    key: '/',
    ctrlKey: true,
    action: () => {
      const commentEvent = new CustomEvent('toggle-comment');
      document.dispatchEvent(commentEvent);
    },
    description: 'Toggle comment'
  },
  {
    key: 'Enter',
    ctrlKey: true,
    action: () => {
      const runEvent = new CustomEvent('run-code');
      document.dispatchEvent(runEvent);
    },
    description: 'Run code'
  }
];