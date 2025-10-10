"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store/useStore";
import { Send, Loader2 } from "lucide-react";
import { sendChatMessageStream } from "@/lib/utils/api-client";
import { mergeItineraryData, parseAIResponse } from "@/lib/ai/prompts";
import { executeSequentialItineraryCreation } from "@/lib/execution/sequential-itinerary-builder";
import type { Message } from "@/types/chat";
import { generateId } from "@/lib/utils/id-generator";

export const MessageInput: React.FC = () => {
  const [input, setInput] = useState("");

  // Store state
  const messages = useStore((state: any) => state.messages);
  const addMessage = useStore((state: any) => state.addMessage);
  const isLoading = useStore((state: any) => state.isLoading);
  const isStreaming = useStore((state: any) => state.isStreaming);
  const setLoading = useStore((state: any) => state.setLoading);
  const setStreaming = useStore((state: any) => state.setStreaming);
  const setStreamingMessage = useStore(
    (state: any) => state.setStreamingMessage
  );
  const appendStreamingMessage = useStore(
    (state: any) => state.appendStreamingMessage
  );
  const currentItinerary = useStore((state: any) => state.currentItinerary);
  const setItinerary = useStore((state: any) => state.setItinerary);
  const selectedAI = useStore((state: any) => state.selectedAI);
  const claudeApiKey = useStore((state: any) => state.claudeApiKey);
  const setError = useStore((state: any) => state.setError);

  // Phase 4.5: プランニングフェーズ状態を取得
  const planningPhase = useStore((state: any) => state.planningPhase);
  const currentDetailingDay = useStore(
    (state: any) => state.currentDetailingDay
  );

  // Phase 4.10: 自動進行機能
  const updateChecklist = useStore((state: any) => state.updateChecklist);
  const shouldTriggerAutoProgress = useStore(
    (state: any) => state.shouldTriggerAutoProgress
  );
  const isAutoProgressing = useStore((state: any) => state.isAutoProgressing);
  const setIsAutoProgressing = useStore(
    (state: any) => state.setIsAutoProgressing
  );
  const setAutoProgressState = useStore(
    (state: any) => state.setAutoProgressState
  );
  const currency = useStore((state: any) => state.settings.general.currency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isStreaming) return;

    const userMessage = {
      id: generateId(),
      role: "user" as const,
      content: input.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput("");
    setLoading(true);
    setStreaming(true);
    setStreamingMessage("");
    setError(null);

    try {
      // チャット履歴を準備（最新10件）
      const chatHistory = messages.slice(-10).map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      let fullResponse = "";
      let receivedItinerary = false;

      // Phase 4.5: フェーズ情報を含めてストリーミングレスポンスを処理
      for await (const chunk of sendChatMessageStream(
        userMessage.content,
        chatHistory,
        currentItinerary || undefined,
        selectedAI,
        claudeApiKey || undefined,
        planningPhase,
        currentDetailingDay,
        currency
      )) {
        if (chunk.type === "message" && chunk.content) {
          // メッセージチャンクを追加
          appendStreamingMessage(chunk.content);
          fullResponse += chunk.content;
        } else if (chunk.type === "itinerary" && chunk.itinerary) {
          // しおりデータを受信
          receivedItinerary = true;
          const mergedItinerary = mergeItineraryData(
            currentItinerary || undefined,
            chunk.itinerary
          );
          setItinerary(mergedItinerary);
        } else if (chunk.type === "error") {
          // エラーを受信
          throw new Error(chunk.error || "Unknown error occurred");
        } else if (chunk.type === "done") {
          // 完了
          break;
        }
      }

      // ストリーミング完了後、JSONブロックを削除してAIメッセージを追加
      const { message: cleanMessage } = parseAIResponse(fullResponse);

      const aiMessage = {
        id: generateId(),
        role: "assistant" as const,
        content: cleanMessage,
        timestamp: new Date(),
      };
      addMessage(aiMessage);
      setStreamingMessage("");

      // Phase 4.10.2: 自動進行トリガーチェック
      updateChecklist();

      // 自動進行モードが有効で、トリガー条件を満たしている場合
      if (shouldTriggerAutoProgress() && !isAutoProgressing) {
        console.log("🚀 Auto progress triggered");
        setIsAutoProgressing(true);

        // 少し待ってから自動進行を開始
        setTimeout(() => {
          executeAutoProgress();
        }, 500);
      }
    } catch (error: any) {
      console.error("Chat error:", error);

      // エラーメッセージを表示
      const errorMessage = {
        id: generateId(),
        role: "assistant" as const,
        content: `申し訳ございません。エラーが発生しました: ${error.message}`,
        timestamp: new Date(),
      };
      addMessage(errorMessage);
      setError(error.message);
      setStreamingMessage("");
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  /**
   * Phase 4.10.2: 自動進行実行
   */
  const executeAutoProgress = async () => {
    try {
      await executeSequentialItineraryCreation(
        messages,
        currentItinerary || undefined,
        selectedAI,
        claudeApiKey || "",
        {
          onStateChange: (state) => {
            console.log("Auto progress state:", state);
            setAutoProgressState(state);
          },
          onMessage: (message: Message) => {
            addMessage(message);
          },
          onItineraryUpdate: (itinerary) => {
            setItinerary(itinerary);
          },
          onComplete: () => {
            console.log("✅ Auto progress completed");
            setIsAutoProgressing(false);
          },
          onError: (error) => {
            console.error("❌ Auto progress error:", error);
            setError(error);
            setIsAutoProgressing(false);
          },
        }
      );
    } catch (error: any) {
      console.error("Auto progress execution error:", error);
      setError(error.message);
      setIsAutoProgressing(false);
    }
  };

  const disabled = isLoading || isStreaming || isAutoProgressing;

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="メッセージを入力..."
        disabled={disabled}
        className="flex-1 px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-gray-900 placeholder:text-gray-400 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition-all"
      />
      <button
        type="submit"
        disabled={disabled}
        aria-label="メッセージを送信"
        className="px-3 py-2 md:px-4 md:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center min-w-[44px]"
      >
        {disabled ? (
          <Loader2 className="w-5 h-5 md:w-5 md:h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5 md:w-5 md:h-5" />
        )}
      </button>
    </form>
  );
};
