'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { getItineraryById } from '@/lib/mock-data/itineraries';

/**
 * LocalStorageからデータを復元するコンポーネント
 * アプリ起動時に一度だけ実行される
 */
export const StorageInitializer: React.FC = () => {
  const searchParams = useSearchParams();
  const initializeFromStorage = useStore((state) => state.initializeFromStorage);
  const setItinerary = useStore((state) => state.setItinerary);

  useEffect(() => {
    // LocalStorageからAPIキーと選択AIを復元
    initializeFromStorage();

    // URLパラメータからしおりIDを取得
    const itineraryId = searchParams.get('itineraryId');
    if (itineraryId) {
      const itinerary = getItineraryById(itineraryId);
      if (itinerary) {
        setItinerary(itinerary);
      }
    }
  }, [initializeFromStorage, setItinerary, searchParams]);

  // このコンポーネントは何も表示しない
  return null;
};