'use client';

import React from 'react';
import { useStore } from '@/lib/store/useStore';
import { Undo2, Redo2 } from 'lucide-react';

export const UndoRedoButtons: React.FC = () => {
  const undo = useStore((state: any) => state.undo);
  const redo = useStore((state: any) => state.redo);
  const canUndo = useStore((state: any) => state.canUndo);
  const canRedo = useStore((state: any) => state.canRedo);

  const handleUndo = () => {
    if (canUndo()) {
      undo();
    }
  };

  const handleRedo = () => {
    if (canRedo()) {
      redo();
    }
  };

  // キーボードショートカット
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          // Cmd/Ctrl + Shift + Z = Redo
          handleRedo();
        } else {
          // Cmd/Ctrl + Z = Undo
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        // Cmd/Ctrl + Y = Redo (Windows)
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo]);

  return (
    <div className="flex gap-2">
      <button
        onClick={handleUndo}
        disabled={!canUndo()}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          canUndo()
            ? 'bg-white hover:bg-gray-100 text-gray-700 shadow-sm hover:shadow'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
        title="元に戻す (Cmd/Ctrl + Z)"
      >
        <Undo2 className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">元に戻す</span>
      </button>

      <button
        onClick={handleRedo}
        disabled={!canRedo()}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          canRedo()
            ? 'bg-white hover:bg-gray-100 text-gray-700 shadow-sm hover:shadow'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
        title="やり直す (Cmd/Ctrl + Shift + Z)"
      >
        <Redo2 className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">やり直す</span>
      </button>
    </div>
  );
};