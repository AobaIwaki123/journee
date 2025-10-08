'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { getItineraryById } from '@/lib/mock-data/itineraries';
import { loadCurrentItinerary, getLastSaveTime } from '@/lib/utils/storage';

/**
 * LocalStorageからデータを復元するコンポーネント
 * アプリ起動時に一度だけ実行される
 */
export const StorageInitializer: React.FC = () => {
  const searchParams = useSearchParams();
  const initializeFromStorage = useStore((state) => state.initializeFromStorage);
  const setItinerary = useStore((state) => state.setItinerary);
  const setLastSaveTime = useStore((state) => state.setLastSaveTime);
  const setStorageInitialized = useStore((state) => state.setStorageInitialized);

  useEffect(() => {
    // LocalStorageからAPIキーと選択AIを復元
    initializeFromStorage();

    // URLパラメータからしおりIDを取得
    const itineraryId = searchParams.get('itineraryId');
    if (itineraryId) {
      // URLパラメータで指定されたしおりを読み込む
      const itinerary = getItineraryById(itineraryId);
      if (itinerary) {
        setItinerary(itinerary);
      }
    } else {
      // URLパラメータがない場合、LocalStorageから現在のしおりを復元
      const savedItinerary = loadCurrentItinerary();
      if (savedItinerary) {
        setItinerary(savedItinerary);
        
        // 最終保存時刻も復元
        const lastSaveTime = getLastSaveTime();
        if (lastSaveTime) {
          setLastSaveTime(lastSaveTime);
        }
      }
    }
    
    // 初期化完了を通知
    setStorageInitialized(true);
  }, [initializeFromStorage, setItinerary, setLastSaveTime, setStorageInitialized, searchParams]);

  // このコンポーネントは何も表示しない
  return null;
};
