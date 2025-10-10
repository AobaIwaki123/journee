/**
 * useItinerarySave - 保存ロジック
 * 
 * DB/LocalStorageへの保存処理をカプセル化するカスタムHook
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useStore } from '@/lib/store/useStore';
import type { ItineraryData } from '@/types/itinerary';
import {
  saveItinerary as saveToDatabase,
  loadItinerary as loadFromDatabase,
  deleteItinerary as deleteFromDatabase,
} from '@/lib/db/itinerary-repository';

export interface UseItinerarySaveOptions {
  autoSave?: boolean;
  autoSaveInterval?: number;
  storage?: 'database' | 'localStorage' | 'auto'; // auto = DB if logged in
}

export interface SaveResult {
  success: boolean;
  itineraryId: string;
  message?: string;
  error?: string;
}

export interface UseItinerarySaveReturn {
  // State
  isSaving: boolean;
  lastSaveTime: Date | null;
  saveError: Error | null;
  
  // Operations
  save: (mode?: 'overwrite' | 'new') => Promise<SaveResult>;
  load: (id: string) => Promise<ItineraryData>;
  delete: (id: string) => Promise<void>;
  
  // Auto-save control
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  triggerAutoSave: () => Promise<void>;
}

/**
 * しおり保存用カスタムHook
 */
export function useItinerarySave(
  options: UseItinerarySaveOptions = {}
): UseItinerarySaveReturn {
  const {
    autoSave: initialAutoSave = false,
    autoSaveInterval = 30000, // デフォルト30秒
    storage = 'auto',
  } = options;

  const { data: session } = useSession();
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(initialAutoSave);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Zustand storeから必要な状態とアクションを取得
  const currentItinerary = useStore((state) => state.currentItinerary);
  const setItinerary = useStore((state) => state.setItinerary);
  const isSaving = useStore((state) => state.isSaving);
  const setSaving = useStore((state) => state.setSaving);
  const lastSaveTime = useStore((state) => state.lastSaveTime);
  const setLastSaveTime = useStore((state) => state.setLastSaveTime);
  const addToast = useStore((state) => state.addToast);

  // ストレージタイプを決定
  const getStorageType = useCallback((): 'database' | 'localStorage' => {
    if (storage === 'auto') {
      return session ? 'database' : 'localStorage';
    }
    return storage;
  }, [storage, session]);

  // LocalStorageへの保存
  const saveToLocalStorage = useCallback(
    async (itinerary: ItineraryData): Promise<void> => {
      const storageKey = `itinerary_${itinerary.id}`;
      localStorage.setItem(storageKey, JSON.stringify(itinerary));
    },
    []
  );

  // LocalStorageからの読み込み
  const loadFromLocalStorage = useCallback(
    async (id: string): Promise<ItineraryData> => {
      const storageKey = `itinerary_${id}`;
      const data = localStorage.getItem(storageKey);
      if (!data) {
        throw new Error('Itinerary not found in localStorage');
      }
      return JSON.parse(data);
    },
    []
  );

  // LocalStorageからの削除
  const deleteFromLocalStorage = useCallback(async (id: string): Promise<void> => {
    const storageKey = `itinerary_${id}`;
    localStorage.removeItem(storageKey);
  }, []);

  // 保存処理
  const save = useCallback(
    async (mode: 'overwrite' | 'new' = 'overwrite'): Promise<SaveResult> => {
      if (!currentItinerary) {
        return {
          success: false,
          itineraryId: '',
          error: 'No itinerary to save',
        };
      }

      setSaving(true);
      setSaveError(null);

      try {
        const storageType = getStorageType();
        const itineraryToSave = {
          ...currentItinerary,
          updatedAt: new Date(),
        };

        if (storageType === 'database') {
          // データベースに保存
          await saveToDatabase(itineraryToSave);
        } else {
          // LocalStorageに保存
          await saveToLocalStorage(itineraryToSave);
        }

        setLastSaveTime(new Date());
        addToast('しおりを保存しました', 'success');

        return {
          success: true,
          itineraryId: currentItinerary.id,
          message: 'Successfully saved',
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setSaveError(error instanceof Error ? error : new Error(errorMessage));
        addToast('保存に失敗しました', 'error');

        return {
          success: false,
          itineraryId: currentItinerary.id,
          error: errorMessage,
        };
      } finally {
        setSaving(false);
      }
    },
    [
      currentItinerary,
      setSaving,
      getStorageType,
      saveToLocalStorage,
      setLastSaveTime,
      addToast,
    ]
  );

  // 読み込み処理
  const load = useCallback(
    async (id: string): Promise<ItineraryData> => {
      setSaveError(null);

      try {
        const storageType = getStorageType();
        let itinerary: ItineraryData;

        if (storageType === 'database') {
          // データベースから読み込み
          itinerary = await loadFromDatabase(id);
        } else {
          // LocalStorageから読み込み
          itinerary = await loadFromLocalStorage(id);
        }

        setItinerary(itinerary);
        addToast('しおりを読み込みました', 'success');

        return itinerary;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setSaveError(error instanceof Error ? error : new Error(errorMessage));
        addToast('読み込みに失敗しました', 'error');
        throw error;
      }
    },
    [getStorageType, loadFromLocalStorage, setItinerary, addToast]
  );

  // 削除処理
  const deleteItinerary = useCallback(
    async (id: string): Promise<void> => {
      setSaveError(null);

      try {
        const storageType = getStorageType();

        if (storageType === 'database') {
          // データベースから削除
          await deleteFromDatabase(id);
        } else {
          // LocalStorageから削除
          await deleteFromLocalStorage(id);
        }

        // 現在のしおりが削除されたものと同じ場合はクリア
        if (currentItinerary?.id === id) {
          setItinerary(null);
        }

        addToast('しおりを削除しました', 'success');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setSaveError(error instanceof Error ? error : new Error(errorMessage));
        addToast('削除に失敗しました', 'error');
        throw error;
      }
    },
    [getStorageType, deleteFromLocalStorage, currentItinerary, setItinerary, addToast]
  );

  // 自動保存を有効化
  const enableAutoSave = useCallback(() => {
    setAutoSaveEnabled(true);
  }, []);

  // 自動保存を無効化
  const disableAutoSave = useCallback(() => {
    setAutoSaveEnabled(false);
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  // 自動保存をトリガー
  const triggerAutoSave = useCallback(async (): Promise<void> => {
    await save('overwrite');
  }, [save]);

  // 自動保存タイマー
  useEffect(() => {
    if (!autoSaveEnabled || !currentItinerary) {
      return;
    }

    // 既存のタイマーをクリア
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // 新しいタイマーを設定
    autoSaveTimerRef.current = setTimeout(() => {
      triggerAutoSave();
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSaveEnabled, currentItinerary, autoSaveInterval, triggerAutoSave]);

  return {
    // State
    isSaving,
    lastSaveTime,
    saveError,

    // Operations
    save,
    load,
    delete: deleteItinerary,

    // Auto-save control
    enableAutoSave,
    disableAutoSave,
    triggerAutoSave,
  };
}
