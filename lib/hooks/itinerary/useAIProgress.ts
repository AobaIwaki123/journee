/**
 * Phase 7.3: useAIProgress - AI進行管理
 * 
 * AI呼び出しとストリーミング処理をカプセル化
 */

import { useState, useCallback } from 'react';
import { useStore } from '@/lib/store/useStore';
import { useItineraryProgressStore } from '@/lib/store/itinerary';
import { useItineraryStore } from '@/lib/store/itinerary';
import { sendChatMessageStream } from '@/lib/utils/api-client';
import { mergeItineraryData } from '@/lib/ai/prompts';
import { generateId } from '@/lib/utils/id-generator';

export interface UseAIProgressReturn {
  isProcessing: boolean;
  proceedAndSendMessage: () => Promise<void>;
}

/**
 * AI進行管理Hook
 */
export function useAIProgress(): UseAIProgressReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { planningPhase, proceedToNextStep } = useItineraryProgressStore();
  const { currentItinerary, setItinerary } = useItineraryStore();
  
  const {
    messages,
    addMessage,
    setStreamingMessage,
    appendStreamingMessage,
    setLoading,
    setStreaming,
    setError,
    selectedAI,
    claudeApiKey,
  } = useStore();
  
  const proceedAndSendMessage = useCallback(async () => {
    setIsProcessing(true);
    setLoading(true);
    setStreaming(true);
    setStreamingMessage("");
    setError(null);

    try {
      // 現在のフェーズを保存
      const currentPhase = planningPhase;

      // まず、フェーズを進める
      proceedToNextStep();

      // フェーズを進めた後の状態を取得
      const newPhase = useItineraryProgressStore.getState().planningPhase;
      const newDetailingDay = useItineraryProgressStore.getState().currentDetailingDay;

      // 「次へ」メッセージをAIに送信
      const userMessage = {
        id: generateId(),
        role: "user" as const,
        content: "次へ",
        timestamp: new Date(),
      };

      addMessage(userMessage);

      // チャット履歴を準備
      const chatHistory = messages.slice(-10).map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      let fullResponse = "";

      // skeleton → detailing への移行時は並列バッチ処理を使用
      if (currentPhase === "skeleton" && newPhase === "detailing") {
        console.log("🚀 並列バッチ処理開始: 全日程を並列で詳細化");

        // 骨組みメッセージを送信して取得
        for await (const chunk of sendChatMessageStream(
          "骨組みが完成しました。これから各日の詳細を作成します。",
          chatHistory,
          useItineraryStore.getState().currentItinerary || undefined,
          selectedAI,
          claudeApiKey,
          "skeleton",
          null
        )) {
          if (chunk.type === "message" && chunk.content) {
            appendStreamingMessage(chunk.content);
            fullResponse += chunk.content;
          } else if (chunk.type === "itinerary" && chunk.itinerary) {
            const mergedItinerary = mergeItineraryData(
              useItineraryStore.getState().currentItinerary || undefined,
              chunk.itinerary
            );
            setItinerary(mergedItinerary);
          }
        }

        for await (const chunk of sendChatMessageStream(
          "次へ",
          chatHistory,
          useItineraryStore.getState().currentItinerary || undefined,
          selectedAI,
          claudeApiKey,
          newPhase,
          newDetailingDay
        )) {
          if (chunk.type === "message" && chunk.content) {
            appendStreamingMessage(chunk.content);
            fullResponse += chunk.content;
          } else if (chunk.type === "itinerary" && chunk.itinerary) {
            const mergedItinerary = mergeItineraryData(
              useItineraryStore.getState().currentItinerary || undefined,
              chunk.itinerary
            );
            setItinerary(mergedItinerary);
          }
        }
      } else {
        // 通常のストリーミング処理（skeleton作成など）
        for await (const chunk of sendChatMessageStream(
          "次へ",
          chatHistory,
          useItineraryStore.getState().currentItinerary || undefined,
          selectedAI,
          claudeApiKey,
          newPhase,
          newDetailingDay
        )) {
          if (chunk.type === "message" && chunk.content) {
            appendStreamingMessage(chunk.content);
            fullResponse += chunk.content;
          } else if (chunk.type === "itinerary" && chunk.itinerary) {
            const mergedItinerary = mergeItineraryData(
              useItineraryStore.getState().currentItinerary || undefined,
              chunk.itinerary
            );
            setItinerary(mergedItinerary);
          } else if (chunk.type === "error") {
            throw new Error(chunk.error || "Unknown error occurred");
          } else if (chunk.type === "done") {
            break;
          }
        }
      }

      // ストリーミング完了後、アシスタントメッセージを追加
      if (fullResponse) {
        const assistantMessage = {
          id: generateId(),
          role: "assistant" as const,
          content: fullResponse,
          timestamp: new Date(),
        };
        addMessage(assistantMessage);
      }

      setStreamingMessage("");
      setStreaming(false);
      setLoading(false);
    } catch (error: any) {
      console.error("Error in handleNextStep:", error);
      setError(error.message || "次へ進む際にエラーが発生しました");
      setStreaming(false);
      setLoading(false);
    } finally {
      setIsProcessing(false);
    }
  }, [
    planningPhase,
    currentItinerary,
    messages,
    selectedAI,
    claudeApiKey,
    proceedToNextStep,
    setItinerary,
    addMessage,
    setStreamingMessage,
    appendStreamingMessage,
    setLoading,
    setStreaming,
    setError,
  ]);
  
  return {
    isProcessing,
    proceedAndSendMessage,
  };
}
