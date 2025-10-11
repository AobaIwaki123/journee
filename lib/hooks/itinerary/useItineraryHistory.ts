/**
 * Phase 4: しおり履歴操作用カスタムHook
 * Phase 10: useItineraryHistoryStoreに移行
 */

import { useCallback } from 'react';
import { useItineraryHistoryStore } from '@/lib/store/itinerary';
import type { ItineraryData } from '@/types/itinerary';

export interface UseItineraryHistoryReturn {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

export function useItineraryHistory(): UseItineraryHistoryReturn {
  // Phase 10: useItineraryHistoryStoreを使用
  const {
    undo: undoFn,
    redo: redoFn,
    canUndo: canUndoFn,
    canRedo: canRedoFn,
    clearHistory,
  } = useItineraryHistoryStore();

  const undo = useCallback(() => {
    undoFn();
  }, [undoFn]);

  const redo = useCallback(() => {
    redoFn();
  }, [redoFn]);

  return {
    undo,
    redo,
    canUndo: canUndoFn(),
    canRedo: canRedoFn(),
    clearHistory,
  };
}
