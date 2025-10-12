"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useStore } from "@/lib/store/useStore";

/**
 * ストレージ初期化コンポーネント（認証必須版）
 *
 * middlewareで認証保護されているため、このコンポーネントはログイン済みユーザーのみが使用。
 * データベースから最新のしおりを読み込む。
 */
export const StorageInitializer: React.FC = () => {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const initializeFromStorage = useStore(
    (state) => state.initializeFromStorage
  );
  const setItinerary = useStore((state) => state.setItinerary);
  const setStorageInitialized = useStore(
    (state) => state.setStorageInitialized
  );
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 既に初期化済みなら何もしない
    if (isInitialized) {
      return;
    }

    // セッションがまだロードされていない場合は待機
    if (!session?.user) {
      return;
    }

    const initialize = async () => {
      // LocalStorageからAPIキーと選択AIを復元
      await initializeFromStorage();

      // URLパラメータからしおりIDを取得
      const itineraryId = searchParams.get("itineraryId");

      if (itineraryId) {
        // URLパラメータで指定されたしおりをデータベースから読み込む
        try {
          const response = await fetch(
            `/api/itinerary/load?id=${itineraryId}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.itinerary) {
              setItinerary(data.itinerary);
            }
          } else {
            console.error("Failed to load itinerary from database");
          }
        } catch (error) {
          console.error("Failed to load itinerary from database:", error);
        }
      } else {
        // URLパラメータがない場合、最後に編集したしおりをDBから読み込む
        // TODO: 将来的にDBから「最後に編集したしおり」を取得する機能を実装
        // 現時点では何も読み込まない（空の状態から開始）
      }

      // 初期化完了を通知
      setStorageInitialized(true);
      setIsInitialized(true);
    };

    initialize();
  }, [
    session,
    isInitialized,
    initializeFromStorage,
    setItinerary,
    setStorageInitialized,
    searchParams,
  ]);

  // このコンポーネントは何も表示しない
  return null;
};
