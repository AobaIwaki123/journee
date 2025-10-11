'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUIStore } from '@/lib/store/ui';
import { useItineraryStore } from '@/lib/store/itinerary';
import { saveCurrentItinerary } from '@/lib/utils/storage';
import { updateItinerary } from '@/lib/mock-data/itineraries';

/**
 * Phase 5.2: しおりの自動保存コンポーネント
 * 
 * - 変更から2秒後にデバウンス保存
 * - 5分ごとに定期保存
 * - LocalStorageとしおり一覧の両方を更新
 * 
 * Phase 9 Bug Fix: useItineraryStoreのcurrentItineraryを使用するように修正
 */
export const AutoSave: React.FC = () => {
  // Phase 10.3: useUIStoreとuseItineraryStore使用
  const { currentItinerary } = useItineraryStore();
  const { setSaving, setLastSaveTime } = useUIStore();
  const isInitialMount = useRef(true);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const periodicTimer = useRef<NodeJS.Timeout | null>(null);

  // 保存処理
  const performSave = useCallback((itinerary: typeof currentItinerary) => {
    if (!itinerary) return;

    setSaving(true);

    try {
      // LocalStorageに保存
      const success = saveCurrentItinerary(itinerary);
      
      // しおり一覧も更新（既存のしおりの場合）
      if (success && itinerary.id) {
        updateItinerary(itinerary.id, itinerary);
      }

      if (success) {
        setLastSaveTime(new Date());
        console.debug('Auto-saved itinerary:', itinerary.id);
      }
    } catch (error) {
      console.error('Failed to auto-save:', error);
    } finally {
      setSaving(false);
    }
  }, [setSaving, setLastSaveTime]);

  // デバウンス保存（変更から2秒後）
  useEffect(() => {
    // 初回マウント時はスキップ
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // 既存のタイマーをクリア
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // しおりがある場合、2秒後に保存
    if (currentItinerary) {
      debounceTimer.current = setTimeout(() => {
        performSave(currentItinerary);
      }, 2000);
    }

    // クリーンアップ
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [currentItinerary, performSave]);

  // 定期保存（5分ごと）
  useEffect(() => {
    // 5分ごとに保存
    periodicTimer.current = setInterval(() => {
      if (currentItinerary) {
        performSave(currentItinerary);
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
