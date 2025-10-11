'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useUIStore } from '@/lib/store/ui';
import { useItineraryStore } from '@/lib/store/itinerary';
import { useAIStore } from '@/lib/store/ai';
import { useSettingsStore } from '@/lib/store/settings';
import { useLayoutStore } from '@/lib/store/layout';
import { getItineraryById } from '@/lib/mock-data/itineraries';
import { loadCurrentItinerary, getLastSaveTime } from '@/lib/utils/storage';

/**
 * Phase 10.4: ストレージ初期化コンポーネント（DB統合版）
 * 
 * ログイン時: データベースから最新のしおりを読み込む
 * 未ログイン時: LocalStorageから読み込む（従来通り）
 * 
 * Phase 9 Bug Fix: useItineraryStoreのsetItineraryを使用するように修正
 */
export const StorageInitializer: React.FC = () => {
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  // Phase 10: 分割されたStoreを使用
  const { setItinerary } = useItineraryStore();
  const { setLastSaveTime, setStorageInitialized } = useUIStore();
  const initializeAI = useAIStore((state) => state.initializeFromStorage);
  const initializeSettings = useSettingsStore((state) => state.initializeFromStorage);
  const initializeLayout = useLayoutStore((state) => state.initializeFromStorage);
  
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // セッション読み込み中は待機
    if (sessionStatus === 'loading') {
      return;
    }

    // 既に初期化済みなら何もしない
    if (isInitialized) {
      return;
    }

    const initialize = async () => {
      // LocalStorageから各Storeを初期化
      initializeAI();
      initializeSettings();
      initializeLayout();

      // URLパラメータからしおりIDを取得
      const itineraryId = searchParams.get('itineraryId');
      
      if (itineraryId) {
        // URLパラメータで指定されたしおりを読み込む
        if (session?.user) {
          // ログイン時: データベースから読み込む
          try {
            const response = await fetch(`/api/itinerary/load?id=${itineraryId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.itinerary) {
                setItinerary(data.itinerary);
              }
            } else {
              // DB読み込み失敗時はLocalStorageにフォールバック
              const itinerary = getItineraryById(itineraryId);
              if (itinerary) {
                setItinerary(itinerary);
              }
            }
          } catch (error) {
            console.error('Failed to load itinerary from database:', error);
            // エラー時はLocalStorageにフォールバック
            const itinerary = getItineraryById(itineraryId);
            if (itinerary) {
              setItinerary(itinerary);
            }
          }
        } else {
          // 未ログイン時: LocalStorageから読み込む
          const itinerary = getItineraryById(itineraryId);
          if (itinerary) {
            setItinerary(itinerary);
          }
        }
      } else {
        // URLパラメータがない場合
        if (session?.user) {
          // ログイン時: 最後に編集したしおりをDBから読み込む試み
          // 注: この機能は現時点ではLocalStorageフォールバックのみ
          // TODO: 将来的にDBから「最後に編集したしおり」を取得する機能を実装
          const savedItinerary = loadCurrentItinerary();
          if (savedItinerary) {
            setItinerary(savedItinerary);
            
            const lastSaveTime = getLastSaveTime();
            if (lastSaveTime) {
              setLastSaveTime(lastSaveTime);
            }
          }
        } else {
          // 未ログイン時: LocalStorageから現在のしおりを復元
          const savedItinerary = loadCurrentItinerary();
          if (savedItinerary) {
            setItinerary(savedItinerary);
            
            const lastSaveTime = getLastSaveTime();
            if (lastSaveTime) {
              setLastSaveTime(lastSaveTime);
            }
          }
        }
      }
      
      // 初期化完了を通知
      setStorageInitialized(true);
      setIsInitialized(true);
    };

    initialize();
  }, [
    session,
    sessionStatus,
    isInitialized,
    initializeAI,
    initializeSettings,
    initializeLayout,
    setItinerary,
    setLastSaveTime,
    setStorageInitialized,
    searchParams,
  ]);

  // このコンポーネントは何も表示しない
  return null;
};
