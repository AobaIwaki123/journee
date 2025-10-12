'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useStore } from '@/lib/store/useStore';
import { saveCurrentItinerary } from '@/lib/utils/storage';
import { updateItinerary } from '@/lib/mock-data/itineraries';
import type { ItineraryData } from '@/types/itinerary';

/**
 * Phase 5.2: しおりの自動保存コンポーネント
 * 
 * - ログイン時: LocalStorage（2秒デバウンス）+ DB（5秒デバウンス）
 * - 未ログイン時: LocalStorageのみ（2秒デバウンス）
 * - 5分ごとに定期保存（両方）
 */
export const AutoSave: React.FC = () => {
  const { data: session } = useSession();
  const currentItinerary = useStore((state) => state.currentItinerary);
  const setSaving = useStore((state) => state.setSaving);
  const setLastSaveTime = useStore((state) => state.setLastSaveTime);
  const setSaveLocation = useStore((state) => state.setSaveLocation);
  const setDbSaveSuccess = useStore((state) => state.setDbSaveSuccess);
  const isInitialMount = useRef(true);
  const localStorageDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const dbDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const periodicTimer = useRef<NodeJS.Timeout | null>(null);

  // LocalStorage保存処理
  const saveToLocalStorage = useCallback((itinerary: ItineraryData) => {
    try {
      const success = saveCurrentItinerary(itinerary);
      
      // しおり一覧も更新（既存のしおりの場合）
      if (success && itinerary.id) {
        updateItinerary(itinerary.id, itinerary);
      }

      if (success) {
        console.debug('Saved to LocalStorage:', itinerary.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save to LocalStorage:', error);
      return false;
    }
  }, []);

  // データベース保存処理
  const saveToDatabase = useCallback(async (itinerary: ItineraryData) => {
    if (!session?.user) {
      return false;
    }

    try {
      const response = await fetch('/api/itinerary/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itinerary,
          saveMode: 'overwrite',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save to database');
      }

      const data = await response.json();
      console.debug('Saved to database:', data.itinerary?.id);
      return true;
    } catch (error) {
      console.error('Failed to save to database:', error);
      return false;
    }
  }, [session]);

  // LocalStorageデバウンス保存（変更から2秒後）
  useEffect(() => {
    // 初回マウント時はスキップ
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // 既存のタイマーをクリア
    if (localStorageDebounceTimer.current) {
      clearTimeout(localStorageDebounceTimer.current);
    }

    // しおりがある場合、2秒後にLocalStorageに保存
    if (currentItinerary) {
      localStorageDebounceTimer.current = setTimeout(async () => {
        setSaving(true);
        const localSuccess = saveToLocalStorage(currentItinerary);
        
        if (localSuccess) {
          setLastSaveTime(new Date());
          setSaveLocation(session?.user ? 'browser' : 'browser');
        }
        
        setSaving(false);
      }, 2000);
    }

    // クリーンアップ
    return () => {
      if (localStorageDebounceTimer.current) {
        clearTimeout(localStorageDebounceTimer.current);
      }
    };
  }, [currentItinerary, saveToLocalStorage, session, setSaving, setLastSaveTime, setSaveLocation]);

  // データベースデバウンス保存（変更から5秒後、ログイン時のみ）
  useEffect(() => {
    // 未ログインの場合はスキップ
    if (!session?.user) {
      return;
    }

    // 初回マウント時はスキップ
    if (isInitialMount.current) {
      return;
    }

    // 既存のタイマーをクリア
    if (dbDebounceTimer.current) {
      clearTimeout(dbDebounceTimer.current);
    }

    // しおりがある場合、5秒後にデータベースに保存
    if (currentItinerary) {
      dbDebounceTimer.current = setTimeout(async () => {
        const dbSuccess = await saveToDatabase(currentItinerary);
        
        if (dbSuccess) {
          setDbSaveSuccess(true);
          setSaveLocation('both');
        } else {
          setDbSaveSuccess(false);
        }
      }, 5000);
    }

    // クリーンアップ
    return () => {
      if (dbDebounceTimer.current) {
        clearTimeout(dbDebounceTimer.current);
      }
    };
  }, [currentItinerary, saveToDatabase, session, setDbSaveSuccess, setSaveLocation]);

  // 定期保存（5分ごと）
  useEffect(() => {
    // 5分ごとに保存
    periodicTimer.current = setInterval(async () => {
      if (!currentItinerary) return;

      // LocalStorageに保存
      const localSuccess = saveToLocalStorage(currentItinerary);

      // ログインしている場合はデータベースにも保存
      if (session?.user) {
        const dbSuccess = await saveToDatabase(currentItinerary);
        
        if (localSuccess && dbSuccess) {
          setLastSaveTime(new Date());
          setSaveLocation('both');
          setDbSaveSuccess(true);
        } else if (localSuccess) {
          setLastSaveTime(new Date());
          setSaveLocation('browser');
          setDbSaveSuccess(false);
        }
      } else if (localSuccess) {
        setLastSaveTime(new Date());
        setSaveLocation('browser');
      }
    }, 5 * 60 * 1000); // 5分 = 300,000ms

    // クリーンアップ
    return () => {
      if (periodicTimer.current) {
        clearInterval(periodicTimer.current);
      }
    };
  }, [currentItinerary, saveToLocalStorage, saveToDatabase, session, setLastSaveTime, setSaveLocation, setDbSaveSuccess]);

  // このコンポーネントは何も表示しない
  return null;
};
