/**
 * useItineraryEditor - しおり編集ロジック
 * 
 * しおりの基本的な編集操作をカプセル化するカスタムHook
 */

import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store/useStore';
import type { ItineraryData } from '@/types/itinerary';
import { generateId } from '@/lib/utils/id-generator';

export interface UseItineraryEditorOptions {
  itineraryId?: string;
  autoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
}

export interface UseItineraryEditorReturn {
  // State
  itinerary: ItineraryData | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSaveTime: Date | null;
  hasUnsavedChanges: boolean;
  
  // Basic operations
  updateTitle: (title: string) => void;
  updateDestination: (destination: string) => void;
  updateDates: (startDate: string, endDate: string) => void;
  updateSummary: (summary: string) => void;
  
  // Save operations
  save: () => Promise<void>;
  saveAs: (newTitle: string) => Promise<string>; // returns new ID
  
  // History operations
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * しおり編集用カスタムHook
 */
export function useItineraryEditor(
  options: UseItineraryEditorOptions = {}
): UseItineraryEditorReturn {
  const {
    autoSave = false,
    autoSaveInterval = 30000, // デフォルト30秒
  } = options;

  // Zustand storeから必要な状態とアクションを取得
  const currentItinerary = useStore((state) => state.currentItinerary);
  const isSaving = useStore((state) => state.isSaving);
  const lastSaveTime = useStore((state) => state.lastSaveTime);
  const updateItineraryTitle = useStore((state) => state.updateItineraryTitle);
  const updateItineraryDestination = useStore((state) => state.updateItineraryDestination);
  const updateItinerary = useStore((state) => state.updateItinerary);
  const setItinerary = useStore((state) => state.setItinerary);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const canUndoFn = useStore((state) => state.canUndo);
  const canRedoFn = useStore((state) => state.canRedo);
  const setSaving = useStore((state) => state.setSaving);
  const setLastSaveTime = useStore((state) => state.setLastSaveTime);

  // 未保存変更の追跡
  const initialItineraryRef = useRef<ItineraryData | null>(null);
  const hasUnsavedChanges = currentItinerary !== initialItineraryRef.current;

  // タイトル更新
  const updateTitle = useCallback(
    (title: string) => {
      updateItineraryTitle(title);
    },
    [updateItineraryTitle]
  );

  // 行き先更新
  const updateDestination = useCallback(
    (destination: string) => {
      updateItineraryDestination(destination);
    },
    [updateItineraryDestination]
  );

  // 日程更新
  const updateDates = useCallback(
    (startDate: string, endDate: string) => {
      if (!currentItinerary) return;

      // 日数を計算
      const start = new Date(startDate);
      const end = new Date(endDate);
      const duration = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      updateItinerary({
        startDate,
        endDate,
        duration,
      });
    },
    [currentItinerary, updateItinerary]
  );

  // 概要更新
  const updateSummary = useCallback(
    (summary: string) => {
      updateItinerary({ summary });
    },
    [updateItinerary]
  );

  // 保存処理
  const save = useCallback(async () => {
    if (!currentItinerary) return;

    setSaving(true);
    try {
      // LocalStorageに保存
      const storageKey = `itinerary_${currentItinerary.id}`;
      localStorage.setItem(storageKey, JSON.stringify(currentItinerary));

      // 最終保存時刻を更新
      setLastSaveTime(new Date());
      initialItineraryRef.current = currentItinerary;
    } catch (error) {
      console.error('Failed to save itinerary:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [currentItinerary, setSaving, setLastSaveTime]);

  // 別名で保存（新しいIDで保存）
  const saveAs = useCallback(
    async (newTitle: string): Promise<string> => {
      if (!currentItinerary) throw new Error('No itinerary to save');

      const newId = generateId();
      const newItinerary: ItineraryData = {
        ...currentItinerary,
        id: newId,
        title: newTitle,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setSaving(true);
      try {
        // LocalStorageに新規保存
        const storageKey = `itinerary_${newId}`;
        localStorage.setItem(storageKey, JSON.stringify(newItinerary));

        // 現在のしおりを新しいものに切り替え
        setItinerary(newItinerary);
        setLastSaveTime(new Date());
        initialItineraryRef.current = newItinerary;

        return newId;
      } catch (error) {
        console.error('Failed to save itinerary as new:', error);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [currentItinerary, setSaving, setItinerary, setLastSaveTime]
  );

  // 自動保存の設定
  useEffect(() => {
    if (!autoSave || !currentItinerary || !hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      save();
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [autoSave, autoSaveInterval, currentItinerary, hasUnsavedChanges, save]);

  return {
    // State
    itinerary: currentItinerary,
    isLoading: false, // TODO: 読み込みロジックを追加する場合はここを実装
    isSaving,
    lastSaveTime,
    hasUnsavedChanges,

    // Basic operations
    updateTitle,
    updateDestination,
    updateDates,
    updateSummary,

    // Save operations
    save,
    saveAs,

    // History operations
    undo,
    redo,
    canUndo: canUndoFn(),
    canRedo: canRedoFn(),
  };
}
