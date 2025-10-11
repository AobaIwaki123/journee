/**
 * Phase 1: しおり編集用カスタムHook
 * Phase 10: Store分割対応
 */

import { useCallback, useRef } from 'react';
import { useUIStore } from '@/lib/store/ui';
import { useItineraryStore, useItineraryHistoryStore } from '@/lib/store/itinerary';
import type { ItineraryData } from '@/types/itinerary';

export interface ItineraryEditorOptions {
  autoSave?: boolean;
  autoSaveInterval?: number;
}

export interface ItineraryEditorReturn {
  currentItinerary: ItineraryData | null;
  updateTitle: (title: string) => void;
  updateDestination: (destination: string) => void;
  updateField: (field: keyof ItineraryData, value: any) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isSaving: boolean;
  lastSaveTime: Date | null;
  hasUnsavedChanges: boolean;
}

export function useItineraryEditor(
  options: ItineraryEditorOptions = {}
): ItineraryEditorReturn {
  const {
    autoSave = false,
    autoSaveInterval = 30000,
  } = options;

  // Phase 10: 分割されたStoreを使用
  const { currentItinerary, updateItinerary } = useItineraryStore();
  const { undo: undoFn, redo: redoFn, canUndo: canUndoFn, canRedo: canRedoFn } = useItineraryHistoryStore();
  const { isSaving, lastSaveTime, setSaving, setLastSaveTime } = useUIStore();
  
  const canUndo = canUndoFn();
  const canRedo = canRedoFn();

  const initialItineraryRef = useRef<ItineraryData | null>(null);
  const hasUnsavedChanges = currentItinerary !== initialItineraryRef.current;

  const updateTitle = useCallback(
    (title: string) => {
      updateItinerary({ title, updatedAt: new Date() });
    },
    [updateItinerary]
  );

  const updateDestination = useCallback(
    (destination: string) => {
      updateItinerary({ destination, updatedAt: new Date() });
    },
    [updateItinerary]
  );

  const updateField = useCallback(
    (field: keyof ItineraryData, value: any) => {
      updateItinerary({ [field]: value, updatedAt: new Date() });
    },
    [updateItinerary]
  );

  return {
    currentItinerary,
    updateTitle,
    updateDestination,
    updateField,
    undo: undoFn,
    redo: redoFn,
    canUndo,
    canRedo,
    isSaving,
    lastSaveTime,
    hasUnsavedChanges,
  };
}
