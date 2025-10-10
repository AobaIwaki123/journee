'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useStore } from '@/lib/store/useStore';
import { saveCurrentItinerary } from '@/lib/utils/storage';
import { updateItinerary } from '@/lib/mock-data/itineraries';

/**
 * Phase 5.2 + Phase 11: しおりの自動保存コンポーネント
 * 
 * - ログインユーザー: 変更から5秒後にDB保存 + 2秒後にLocalStorage保存
 * - 未ログインユーザー: 変更から2秒後にLocalStorage保存のみ
 * - 5分ごとに定期保存
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
  const databaseDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const periodicTimer = useRef<NodeJS.Timeout | null>(null);

  // LocalStorage保存処理
  const performLocalStorageSave = useCallback((itinerary: typeof currentItinerary) => {
    if (!itinerary) return false;

    try {
      // LocalStorageに保存
      const success = saveCurrentItinerary(itinerary);
      
      // しおり一覧も更新（既存のしおりの場合）
      if (success && itinerary.id) {
        updateItinerary(itinerary.id, itinerary);
      }

      if (success) {
        console.debug('[AutoSave] LocalStorage save successful:', itinerary.id);
      }
      return success;
    } catch (error) {
      console.error('[AutoSave] Failed to save to LocalStorage:', error);
      return false;
    }
  }, []);

  // データベース保存処理
  const performDatabaseSave = useCallback(async (itinerary: typeof currentItinerary) => {
    if (!itinerary || !session?.user) return false;

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

      const success = response.ok;
      if (success) {
        console.debug('[AutoSave] Database save successful:', itinerary.id);
      } else {
        console.error('[AutoSave] Database save failed:', await response.text());
      }
      return success;
    } catch (error) {
      console.error('[AutoSave] Failed to save to database:', error);
      return false;
    }
  }, [session]);

  // 統合保存処理
  const performSave = useCallback(async (itinerary: typeof currentItinerary, includeDatabase = true) => {
    if (!itinerary) return;

    setSaving(true);

    try {
      const localStorageSuccess = performLocalStorageSave(itinerary);
      let databaseSuccess = false;

      // ログインユーザーの場合はデータベースにも保存
      if (includeDatabase && session?.user) {
        databaseSuccess = await performDatabaseSave(itinerary);
        setDbSaveSuccess(databaseSuccess);
      }

      // 保存場所を記録
      if (session?.user) {
        if (localStorageSuccess && databaseSuccess) {
          setSaveLocation('both');
        } else if (databaseSuccess) {
          setSaveLocation('database');
        } else if (localStorageSuccess) {
          setSaveLocation('browser');
        }
      } else {
        setSaveLocation(localStorageSuccess ? 'browser' : null);
      }

      // いずれかの保存が成功したら最終保存時刻を更新
      if (localStorageSuccess || databaseSuccess) {
        setLastSaveTime(new Date());
      }
    } catch (error) {
      console.error('[AutoSave] Failed to auto-save:', error);
    } finally {
      setSaving(false);
    }
  }, [setSaving, setLastSaveTime, setSaveLocation, setDbSaveSuccess, performLocalStorageSave, performDatabaseSave, session]);

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

    // しおりがある場合、2秒後にLocalStorage保存
    if (currentItinerary) {
      localStorageDebounceTimer.current = setTimeout(() => {
        performLocalStorageSave(currentItinerary);
      }, 2000);
    }

    // クリーンアップ
    return () => {
      if (localStorageDebounceTimer.current) {
        clearTimeout(localStorageDebounceTimer.current);
      }
    };
  }, [currentItinerary, performLocalStorageSave]);

  // データベースデバウンス保存（変更から5秒後、ログインユーザーのみ）
  useEffect(() => {
    // 初回マウント時はスキップ
    if (isInitialMount.current) {
      return;
    }

    // 未ログインユーザーはスキップ
    if (!session?.user) {
      return;
    }

    // 既存のタイマーをクリア
    if (databaseDebounceTimer.current) {
      clearTimeout(databaseDebounceTimer.current);
    }

    // しおりがある場合、5秒後にデータベース保存
    if (currentItinerary) {
      databaseDebounceTimer.current = setTimeout(() => {
        performSave(currentItinerary, true);
      }, 5000);
    }

    // クリーンアップ
    return () => {
      if (databaseDebounceTimer.current) {
        clearTimeout(databaseDebounceTimer.current);
      }
    };
  }, [currentItinerary, performSave, session]);

  // 定期保存（5分ごと）
  useEffect(() => {
    // 5分ごとに保存
    periodicTimer.current = setInterval(() => {
      if (currentItinerary) {
        performSave(currentItinerary, true);
      }
    }, 5 * 60 * 1000); // 5分 = 300,000ms

    // クリーンアップ
    return () => {
      if (periodicTimer.current) {
        clearInterval(periodicTimer.current);
      }
    };
  }, [currentItinerary, performSave]);

  // このコンポーネントは何も表示しない
  return null;
};
