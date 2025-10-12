"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store/useStore";
import { Send } from "lucide-react";
import { sendChatMessageStream } from "@/lib/utils/api-client";
import { mergeItineraryData, parseAIResponse } from "@/lib/ai/prompts";
import { generateId } from "@/lib/utils/id-generator";

export const MessageInput: React.FC = () => {
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
  const setHasReceivedResponse = useStore(
    (state: any) => state.setHasReceivedResponse
  );
  const compressAndSaveChatHistory = useStore((state: any) => state.compressAndSaveChatHistory); // 追加
  const resetChatHistory = useStore((state: any) => state.resetChatHistory); // 追加

  // Message editing state
  const messageDraft = useStore((state: any) => state.messageDraft);
  const setMessageDraft = useStore((state: any) => state.setMessageDraft);
  const editingMessageId = useStore((state: any) => state.editingMessageId);
  const setAbortController = useStore((state: any) => state.setAbortController);

  // Local input state (uses messageDraft from store)
  const [input, setInput] = useState("");

  // Phase 4.5: プランニングフェーズ状態を取得
  const planningPhase = useStore((state: any) => state.planningPhase);
  const currentDetailingDay = useStore(
    (state: any) => state.currentDetailingDay
  );

  // Phase 4.10: 自動進行機能
  const updateChecklist = useStore((state: any) => state.updateChecklist);

  const currency = useStore((state: any) => state.settings.general.currency);

  // Initialize input from messageDraft on mount and when messageDraft changes
  React.useEffect(() => {
    if (messageDraft && !editingMessageId) {
      setInput(messageDraft);
    }
  }, [messageDraft, editingMessageId]);

  // Save draft whenever input changes
  React.useEffect(() => {
    if (!editingMessageId) {
      setMessageDraft(input);
    }
  }, [input, editingMessageId, setMessageDraft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isStreaming || editingMessageId) return;

    const userMessage = {
      id: generateId(),
      role: "user" as const,
      content: input.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput("");
    setMessageDraft(""); // ドラフトをクリア
    setLoading(true);
    setHasReceivedResponse(false);
    setStreamingMessage("");
    setError(null);

    // AbortController を作成してストアに保存
    const abortController = new AbortController();
    setAbortController(abortController);

    try {
      // ✅ 追加: 送信前にチャット履歴を圧縮（必要に応じて）
      if (currentItinerary?.id && messages.length > 20) {
        await compressAndSaveChatHistory(currentItinerary.id);
      }

      // チャット履歴を準備
      const chatHistory = messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      let fullResponse = "";
      let receivedItinerary = false;
      let firstChunk = true;

      // Phase 4.5: フェーズ情報を含めてストリーミングレスポンスを処理
      for await (const chunk of sendChatMessageStream(
        userMessage.content,
        chatHistory,
        currentItinerary || undefined,
        selectedAI,
        claudeApiKey || undefined,
        planningPhase,
        currentDetailingDay,
        currency,
        abortController.signal
      )) {
        if (chunk.type === "message" && chunk.content) {
          // 最初のチャンク受信時にストリーミング開始
          if (firstChunk) {
            setStreaming(true);
            setHasReceivedResponse(true);
            firstChunk = false;
          }
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

    } catch (error: any) {
      // AbortErrorの場合は、エラーメッセージを表示しない（ユーザーが意図的にキャンセルした）
      if (error.name === "AbortError") {
        console.log("AI応答がキャンセルされました");
        const cancelMessage = {
          id: generateId(),
          role: "assistant" as const,
          content: "メッセージの送信がキャンセルされました。",
          timestamp: new Date(),
        };
        addMessage(cancelMessage);
        setStreamingMessage("");
      } else {
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
      }
    } finally {
      setLoading(false);
      setStreaming(false);
      setAbortController(null); // AbortControllerをクリア
    }
  };

  const disabled =
    isLoading || isStreaming || editingMessageId !== null;

  /**
   * キーボードイベントハンドラー
   * - Enterキーのみ: メッセージ送信
   * - Shift + Enterキー: 改行挿入
   * - IME変換中のEnter: 無視（変換確定のみ）
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // IME変換中のEnterキーは無視
    if (e.nativeEvent.isComposing) {
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      // Enterキーのみの場合: メッセージ送信
      e.preventDefault();
      handleSubmit(e as any);
    }
    // Shift + Enterの場合: デフォルトの改行動作を許可（何もしない）
  };

  return (
    <div className="relative w-full"> {/* 親要素をrelativeにする */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        {editingMessageId && (
          <div className="absolute -top-8 left-0 right-0 bg-yellow-100 text-yellow-800 px-4 py-1 text-sm rounded-t-lg">
            メッセージを編集中です。編集を完了してから新しいメッセージを送信してください。
          </div>
        )}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            editingMessageId
              ? "メッセージを編集中..."
              : "メッセージを入力... (Shift + Enterで改行)"
          }
          disabled={disabled}
          rows={1}
          className="flex-1 px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-gray-900 placeholder:text-gray-400 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition-all resize-none overflow-hidden min-h-[42px] max-h-[200px]"
          style={{
            height: "auto",
            minHeight: "42px",
          }}
          onInput={(e) => {
            // 自動で高さを調整
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
          }}
        />
        <button
          type="submit"
          disabled={disabled}
          aria-label="メッセージを送信"
          className="px-3 py-2 md:px-4 md:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
        >
          <Send className="w-5 h-5 md:w-5 md:h-5" />
        </button>
      </form>

      {/* チャット履歴リセットボタンはChatBoxに移動 */}
    </div>
  );
};
