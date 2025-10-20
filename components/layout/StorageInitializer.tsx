"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useStore } from "@/lib/store/useStore";
import { getItineraryById } from "@/lib/mock-data/itineraries";
import { loadCurrentItinerary, getLastSaveTime } from "@/lib/utils/storage";

/**
 * Phase 10.4: ストレージ初期化コンポーネント（DB統合版）
 *
 * ログイン時: データベースから最新のしおりを読み込む
 * 未ログイン時: LocalStorageから読み込む（従来通り）
 */
export const StorageInitializer: React.FC = () => {
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const initializeFromStorage = useStore(
    (state) => state.initializeFromStorage
  );
  const setItinerary = useStore((state) => state.setItinerary);
  const setLastSaveTime = useStore((state) => state.setLastSaveTime);
  const setStorageInitialized = useStore(
    (state) => state.setStorageInitialized
  );
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // セッション読み込み中は待機
    if (sessionStatus === "loading") {
      return;
    }

    // 既に初期化済みなら何もしない
    if (isInitialized) {
      return;
    }

    const initialize = async () => {
      // LocalStorageからAPIキーと選択AIを復元
      await initializeFromStorage();

      // URLパラメータからしおりIDを取得
      const itineraryId = searchParams.get("itineraryId");

      if (itineraryId) {
        // URLパラメータで指定されたしおりを読み込む
        if (session?.user) {
          // ログイン時: データベースから読み込む
          try {
            const response = await fetch(
              `/api/itinerary/load?id=${itineraryId}`
            );
            if (response.ok) {
              const data = await response.json();
              console.log("[StorageInitializer] API response:", data);
              if (data.itinerary) {
                console.log(
                  "[StorageInitializer] Setting itinerary with schedule length:",
                  data.itinerary.schedule?.length
                );
                setItinerary(data.itinerary);
              } else {
                console.warn(
                  "[StorageInitializer] API response missing itinerary"
                );
              }
            } else {
              console.error(
                "[StorageInitializer] API response not ok:",
                response.status
              );
              // DB読み込み失敗時はLocalStorageにフォールバック
              const itinerary = getItineraryById(itineraryId);
              if (itinerary) {
                setItinerary(itinerary);
              }
            }
          } catch (error) {
            console.error("Failed to load itinerary from database:", error);
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
    initializeFromStorage,
    setItinerary,
    setLastSaveTime,
    setStorageInitialized,
    searchParams,
  ]);

  // このコンポーネントは何も表示しない
  return null;
};
