"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store/useStore";
import type { ItineraryPhase } from "@/types/itinerary";
import { ArrowRight, RotateCcw, Check, AlertCircle } from "lucide-react";
import { sendChatMessageStream } from "@/lib/utils/api-client";
import { mergeItineraryData } from "@/lib/ai/prompts";

/**
 * Phase 4.4, 4.5, 4.8: 段階的旅程構築のクイックアクション
 * 「次へ」ボタンやリセットボタンなどを提供
 * Phase 4.8: 動的スタイリングと情報充足度判定を追加
 */
export const QuickActions: React.FC = () => {
  const {
    planningPhase,
    currentItinerary,
    proceedToNextStep,
    resetPlanning,
    messages,
    addMessage,
    setStreamingMessage,
    appendStreamingMessage,
    setItinerary,
    setLoading,
    setStreaming,
    setError,
    currentDetailingDay,
    // Phase 4.8
    buttonReadiness,
    checklistStatus,
    updateChecklist,
    // Phase 6: AI model selection
    selectedAI,
    claudeApiKey,
  } = useStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Phase 4.8: メッセージやしおりが更新されたらチェックリストを更新
  useEffect(() => {
    updateChecklist();
  }, [messages, currentItinerary, planningPhase, updateChecklist]);

  // フェーズごとのボタンラベル
  const getButtonLabel = (): string => {
    switch (planningPhase) {
      case "initial":
        return "情報収集を開始";
      case "collecting":
        return "骨組みを作成";
      case "skeleton":
        return "日程の詳細化";
      case "detailing":
        if (!currentItinerary) return "次の日へ";
        const currentDay = currentItinerary.currentDay || 1;
        const totalDays =
          currentItinerary.duration || currentItinerary.schedule.length;
        return currentDay < totalDays ? "次の日へ" : "完成";
      case "completed":
        return "完成";
      default:
        return "次へ";
    }
  };

  // ツールチップテキスト
  const getTooltip = (): string => {
    switch (planningPhase) {
      case "collecting":
        return "基本情報が揃ったら、骨組み作成フェーズへ進みます";
      case "skeleton":
        return "各日のテーマが決まったら、詳細化フェーズへ進みます";
      case "detailing":
        return "現在の日の詳細が完成したら、次の日へ進みます";
      default:
        return "次のフェーズへ進む";
    }
  };

  // ヘルプテキスト
  const getHelpText = (): string | null => {
    switch (planningPhase) {
      case "collecting":
        return "AIに行き先、期間、興味を伝えてください";
      case "skeleton":
        return "各日の大まかなテーマが決まったら次へ進みましょう";
      case "detailing":
        if (!currentItinerary) return null;
        const currentDay = currentItinerary.currentDay || 1;
        return `${currentDay}日目の詳細を作成したら次へ進みましょう`;
      case "completed":
        return "旅のしおりが完成しました！";
      default:
        return null;
    }
  };

  // ボタンが無効かどうか
  const isDisabled = (): boolean => {
    return false; // 常に進める（情報不足でも警告を出すのみ）
  };

  // Phase 4.5 & 4.8: 「次へ」ボタンでAIにメッセージ送信
  const handleNextStep = async () => {
    if (isProcessing || planningPhase === "completed") return;

    // Phase 4.8: 必須情報が不足している場合は警告を表示
    if (
      buttonReadiness &&
      buttonReadiness.level === "not_ready" &&
      checklistStatus
    ) {
      setShowWarning(true);
      return;
    }

    await proceedAndSendMessage();
  };

  // 実際にフェーズを進めてメッセージを送信
  const proceedAndSendMessage = async () => {
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
      const newPhase = useStore.getState().planningPhase;
      const newDetailingDay = useStore.getState().currentDetailingDay;

      // 「次へ」メッセージをAIに送信
      const userMessage = {
        id: `user-${Date.now()}`,
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

      // Phase 4.9: skeleton → detailing への移行時は並列バッチ処理を使用
      if (currentPhase === "skeleton" && newPhase === "detailing") {
        console.log("🚀 並列バッチ処理開始: 全日程を並列で詳細化");

        // 骨組みメッセージを送信して取得
        for await (const chunk of sendChatMessageStream(
          "骨組みが完成しました。これから各日の詳細を作成します。",
          chatHistory,
          useStore.getState().currentItinerary || undefined,
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
              useStore.getState().currentItinerary || undefined,
              chunk.itinerary
            );
            setItinerary(mergedItinerary);
          }
        }

        for await (const chunk of sendChatMessageStream(
          "次へ",
          chatHistory,
          useStore.getState().currentItinerary || undefined,
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
              useStore.getState().currentItinerary || undefined,
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
          useStore.getState().currentItinerary || undefined,
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
              useStore.getState().currentItinerary || undefined,
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
          id: `assistant-${Date.now()}`,
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
  };

  const handleReset = () => {
    if (confirm("旅程作成をリセットしますか？現在の進捗は失われます。")) {
      resetPlanning();
    }
  };

  // Phase 4.8: 情報不足でも強制的に進む
  const handleForceNext = async () => {
    setShowWarning(false);
    await proceedAndSendMessage();
  };

  // Phase 4.8: ボタンのスタイルを取得
  const getButtonStyles = () => {
    if (planningPhase === "completed") {
      return "bg-green-500 text-white cursor-default";
    }

    if (isProcessing) {
      return "bg-gray-200 text-gray-400 cursor-not-allowed";
    }

    // Phase 4.8: 動的スタイリング
    if (buttonReadiness) {
      switch (buttonReadiness.level) {
        case "ready":
          return (
            "bg-green-500 text-white hover:bg-green-600 active:scale-95 shadow-sm hover:shadow " +
            (buttonReadiness.animate ? "animate-pulse" : "")
          );
        case "partial":
          return "bg-blue-500 text-white hover:bg-blue-600 active:scale-95 shadow-sm hover:shadow";
        case "not_ready":
          return "bg-gray-400 text-white hover:bg-gray-500 active:scale-95 shadow-sm hover:shadow";
      }
    }

    return "bg-blue-500 text-white hover:bg-blue-600 active:scale-95 shadow-sm hover:shadow";
  };

  return (
    <div className="border-t bg-white p-4">
      {/* Phase 4.8: 警告ダイアログ */}
      {showWarning && checklistStatus && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-900 mb-2">
                以下の情報が不足しています
              </h4>
              <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                {checklistStatus.missingRequired.map((item: string) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => setShowWarning(false)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                >
                  情報を追加する
                </button>
                <button
                  onClick={handleForceNext}
                  className="px-4 py-2 border border-yellow-600 text-yellow-700 rounded-lg hover:bg-yellow-50 text-sm"
                >
                  このまま進む
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ヘルプテキスト */}
      {getHelpText() && (
        <div className="mb-3 text-sm text-gray-600">{getHelpText()}</div>
      )}

      {/* アクションボタン */}
      <div className="flex items-center space-x-2">
        {/* 次へボタン */}
        <button
          onClick={handleNextStep}
          disabled={planningPhase === "completed" || isProcessing}
          title={buttonReadiness?.tooltip || getTooltip()}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${getButtonStyles()}`}
        >
          {planningPhase === "completed" ? (
            <>
              <Check className="w-5 h-5" />
              <span>{buttonReadiness?.label || getButtonLabel()}</span>
            </>
          ) : buttonReadiness?.level === "ready" ? (
            <>
              <Check className="w-5 h-5" />
              <span>{buttonReadiness.label}</span>
            </>
          ) : buttonReadiness?.level === "not_ready" ? (
            <>
              <AlertCircle className="w-5 h-5" />
              <span>{buttonReadiness.label}</span>
            </>
          ) : (
            <>
              <ArrowRight className="w-5 h-5" />
              <span>{buttonReadiness?.label || getButtonLabel()}</span>
            </>
          )}
        </button>

        {/* リセットボタン */}
        {planningPhase !== "initial" && planningPhase !== "completed" && (
          <button
            onClick={handleReset}
            className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            title="プランニングをリセット"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Phase 4.8: 不足情報のヒント */}
      {buttonReadiness?.missingInfo &&
        buttonReadiness.missingInfo.length > 0 && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            まだ: {buttonReadiness.missingInfo.join("、")} が未設定です
          </div>
        )}
    </div>
  );
};
