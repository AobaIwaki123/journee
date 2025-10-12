"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store/useStore";

/**
 * Phase 7.2: チャット履歴の自動復元コンポーネント
 *
 * しおりが読み込まれたときに、自動的にチャット履歴を復元する
 * リロード時にも最新の履歴をDBから取得する（Zustandとの同期）
 *
 * 使用例:
 * ```tsx
 * <ChatHistoryInitializer itineraryId={itinerary?.id} />
 * ```
 */
interface ChatHistoryInitializerProps {
  itineraryId?: string;
}

export const ChatHistoryInitializer: React.FC<ChatHistoryInitializerProps> = ({
  itineraryId,
}) => {
  const loadChatHistory = useStore((state) => state.loadChatHistory);
  const prevItineraryIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // しおりIDが変更された場合、またはリロード時にチャット履歴を復元
    // リロード時はZustandのpersist機能で履歴が復元されているが、
    // DBの最新状態と同期するために再度取得する
    if (itineraryId) {
      // 前回と異なるIDの場合、または初回ロードの場合は取得
      if (itineraryId !== prevItineraryIdRef.current) {
        console.log(`[ChatHistoryInitializer] Loading chat history for itinerary: ${itineraryId}`);
        loadChatHistory(itineraryId);
        prevItineraryIdRef.current = itineraryId;
      }
    }
  }, [itineraryId, loadChatHistory]);

  // このコンポーネントは何も表示しない（副作用のみ）
  return null;
};
