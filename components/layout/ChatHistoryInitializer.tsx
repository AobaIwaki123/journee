"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store/useStore";

/**
 * Phase 7.2: チャット履歴の自動復元コンポーネント
 *
 * しおりが読み込まれたときに、自動的にチャット履歴を復元する
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

  useEffect(() => {
    if (itineraryId) {
      // しおりが読み込まれたらチャット履歴も復元
      loadChatHistory(itineraryId);
    }
  }, [itineraryId, loadChatHistory]);

  // このコンポーネントは何も表示しない（副作用のみ）
  return null;
};
