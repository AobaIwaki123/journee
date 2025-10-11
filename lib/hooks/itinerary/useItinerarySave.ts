/**
 * Phase 2: しおり保存用カスタムHook
 * Phase 10: useItineraryStore, useUIStoreに移行
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUIStore } from '@/lib/store/ui';
import { useItineraryStore } from '@/lib/store/itinerary';
import type { ItineraryData } from '@/types/itinerary';
import {
  saveCurrentItinerary,
  loadCurrentItinerary,
  clearCurrentItinerary,
} from '@/lib/utils/storage';
import {
  updateItinerary as updateItineraryInList,
  deleteItinerary as deleteItineraryFromList,
} from '@/lib/mock-data/itineraries';

export interface UseItinerarySaveOptions {
  /**
   * 保存先: 'auto' (ログイン状態により自動選択) | 'database' | 'localStorage'
   */
  storage?: 'auto' | 'database' | 'localStorage';
  
  /**
   * 自動保存を有効にする
   */
  autoSave?: boolean;
  
  /**
   * 自動保存間隔（ミリ秒）
   */
  autoSaveInterval?: number;
}

export interface UseItinerarySaveReturn {
  save: (itinerary?: ItineraryData | null, mode?: 'overwrite' | 'new') => Promise<{ success: boolean; id?: string; error?: string }>;
  load: (id: string) => Promise<ItineraryData | null>;
  deleteItinerary: (id: string) => Promise<boolean>;
  isSaving: boolean;
  lastSaveTime: Date | null;
  saveError: Error | null;
}

export function useItinerarySave(
  options: UseItinerarySaveOptions = {}
): UseItinerarySaveReturn {
  const {
    storage = 'auto',
    autoSave: initialAutoSave = false,
    autoSaveInterval = 30000,
  } = options;

  const { data: session } = useSession();
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(initialAutoSave);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Phase 10: 分割されたStoreを使用
  const { currentItinerary, setItinerary } = useItineraryStore();
  const { isSaving, lastSaveTime, setSaving, setLastSaveTime, addToast } = useUIStore();

  const getStorageType = useCallback((): 'database' | 'localStorage' => {
    if (storage === 'auto') {
      return session ? 'database' : 'localStorage';
    }
    return storage;
  }, [storage, session]);

  const save = useCallback(
    async (
      itinerary?: ItineraryData | null,
      mode: 'overwrite' | 'new' = 'overwrite'
    ): Promise<{ success: boolean; id?: string; error?: string }> => {
      const targetItinerary = itinerary ?? currentItinerary;
      
      if (!targetItinerary) {
        return { success: false, error: 'しおりが存在しません' };
      }

      try {
        setSaving(true);
        setSaveError(null);

        const storageType = getStorageType();

        if (storageType === 'database' && session?.user?.id) {
          const response = await fetch('/api/itinerary/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: session.user.id,
              itinerary: targetItinerary,
              mode,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || '保存に失敗しました');
          }

          if (data.itinerary) {
            setItinerary(data.itinerary);
          }

          setLastSaveTime(new Date());
          addToast('しおりを保存しました', 'success');

          return { success: true, id: data.itinerary.id };
        } else {
          const success = saveCurrentItinerary(targetItinerary);
          
          if (success && targetItinerary.id) {
            updateItineraryInList(targetItinerary.id, targetItinerary);
          }

          if (success) {
            setLastSaveTime(new Date());
            addToast('しおりを保存しました', 'success');
            return { success: true, id: targetItinerary.id };
          }

          return { success: false, error: 'LocalStorageへの保存に失敗しました' };
        }
      } catch (error) {
        console.error('Failed to save itinerary:', error);
        const errorMessage = error instanceof Error ? error.message : '保存に失敗しました';
        setSaveError(error instanceof Error ? error : new Error(errorMessage));
        addToast(errorMessage, 'error');
        return { success: false, error: errorMessage };
      } finally {
        setSaving(false);
      }
    },
    [currentItinerary, session, getStorageType, setItinerary, setSaving, setLastSaveTime, addToast]
  );

  const load = useCallback(
    async (id: string): Promise<ItineraryData | null> => {
      try {
        const storageType = getStorageType();

        if (storageType === 'database') {
          const response = await fetch(`/api/itinerary/load?id=${id}`);
          
          if (!response.ok) {
            throw new Error('読み込みに失敗しました');
          }

          const data = await response.json();
          
          if (data.itinerary) {
            setItinerary(data.itinerary);
            return data.itinerary;
          }

          return null;
        } else {
          const loaded = loadCurrentItinerary();
          if (loaded) {
            setItinerary(loaded);
          }
          return loaded;
        }
      } catch (error) {
        console.error('Failed to load itinerary:', error);
        addToast('読み込みに失敗しました', 'error');
        return null;
      }
    },
    [getStorageType, setItinerary, addToast]
  );

  const deleteItinerary = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const storageType = getStorageType();

        if (storageType === 'database' && session) {
          const response = await fetch(`/api/itinerary/delete?id=${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('削除に失敗しました');
          }

          if (currentItinerary?.id === id) {
            setItinerary(null);
          }

          addToast('しおりを削除しました', 'success');
          return true;
        } else {
          deleteItineraryFromList(id);
          
          if (currentItinerary?.id === id) {
            clearCurrentItinerary();
            setItinerary(null);
          }

          addToast('しおりを削除しました', 'success');
          return true;
        }
      } catch (error) {
        console.error('Failed to delete itinerary:', error);
        addToast('削除に失敗しました', 'error');
        return false;
      }
    },
    [currentItinerary, session, getStorageType, setItinerary, addToast]
  );

  useEffect(() => {
    if (!autoSaveEnabled || !currentItinerary) return;

    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setInterval(() => {
      save();
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [autoSaveEnabled, autoSaveInterval, currentItinerary, save]);

  return {
    save,
    load,
    deleteItinerary,
    isSaving,
    lastSaveTime,
    saveError,
  };
}
