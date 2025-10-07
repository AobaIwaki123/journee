'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import type { ItineraryPhase } from '@/types/itinerary';
import { ArrowRight, RotateCcw, Check } from 'lucide-react';
import { sendChatMessageStream } from '@/lib/utils/api-client';
import { mergeItineraryData } from '@/lib/ai/prompts';

/**
 * Phase 4.4 & 4.5: 段階的旅程構築のクイックアクション
 * 「次へ」ボタンやリセットボタンなどを提供
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
  } = useStore();
  
  const [isProcessing, setIsProcessing] = useState(false);

  // フェーズごとのボタンラベル
  const getButtonLabel = (): string => {
    switch (planningPhase) {
      case 'initial':
        return '情報収集を開始';
      case 'collecting':
        return '骨組みを作成';
      case 'skeleton':
        return '詳細化を開始';
      case 'detailing':
        if (!currentItinerary) return '次へ';
        const currentDay = currentItinerary.currentDay || 1;
        const totalDays = currentItinerary.duration || currentItinerary.schedule.length;
        if (currentDay < totalDays) {
          return `${currentDay + 1}日目へ`;
        }
        return '完成へ';
      case 'completed':
        return '完成';
      default:
        return '次へ';
    }
  };

  // ボタンの無効化判定
  const isDisabled = (): boolean => {
    // 完成フェーズでは無効化
    if (planningPhase === 'collecting') {
      // 基本情報が不足している場合は無効化
      return !currentItinerary?.destination || !currentItinerary?.duration;
    }
    return false;
  };

  // ボタンのツールチップ
  const getTooltip = (): string | undefined => {
    if (planningPhase === 'collecting' && isDisabled()) {
      return '行き先と期間を入力してください';
    }
    return undefined;
  };

  // フェーズごとのヘルプテキスト
  const getHelpText = (): string | null => {
    switch (planningPhase) {
      case 'initial':
      case 'collecting':
        return 'AIに行き先、期間、興味を伝えてください';
      case 'skeleton':
        return '各日の大まかなテーマが決まったら次へ進みましょう';
      case 'detailing':
        if (!currentItinerary) return null;
        const currentDay = currentItinerary.currentDay || 1;
        return `${currentDay}日目の詳細を作成したら次へ進みましょう`;
      case 'completed':
        return '旅のしおりが完成しました！';
      default:
        return null;
    }
  };

  // Phase 4.5: 「次へ」ボタンでAIにメッセージ送信
  const handleNextStep = async () => {
    if (isDisabled() || isProcessing) return;
    
    setIsProcessing(true);
    setLoading(true);
    setStreaming(true);
    setStreamingMessage('');
    setError(null);

    try {
      // まず、フェーズを進める
      proceedToNextStep();
      
      // フェーズを進めた後の状態を取得
      const newPhase = useStore.getState().planningPhase;
      const newDetailingDay = useStore.getState().currentDetailingDay;
      
      // 「次へ」メッセージをAIに送信
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        content: '次へ',
        timestamp: new Date(),
      };
      
      addMessage(userMessage);
      
      // チャット履歴を準備
      const chatHistory = messages.slice(-10).map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));
      
      let fullResponse = '';
      
      // ストリーミングレスポンスを処理
      for await (const chunk of sendChatMessageStream(
        '次へ',
        chatHistory,
        useStore.getState().currentItinerary || undefined,
        newPhase,
        newDetailingDay
      )) {
        if (chunk.type === 'message' && chunk.content) {
          appendStreamingMessage(chunk.content);
          fullResponse += chunk.content;
        } else if (chunk.type === 'itinerary' && chunk.itinerary) {
          const mergedItinerary = mergeItineraryData(
            useStore.getState().currentItinerary || undefined,
            chunk.itinerary
          );
          setItinerary(mergedItinerary);
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Unknown error occurred');
        } else if (chunk.type === 'done') {
          break;
        }
      }
      
      // ストリーミング完了後、アシスタントメッセージを追加
      if (fullResponse) {
        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant' as const,
          content: fullResponse,
          timestamp: new Date(),
        };
        addMessage(assistantMessage);
      }
      
      setStreamingMessage('');
      setStreaming(false);
      setLoading(false);
      
    } catch (error: any) {
      console.error('Error in handleNextStep:', error);
      setError(error.message || '次へ進む際にエラーが発生しました');
      setStreaming(false);
      setLoading(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (confirm('旅程作成をリセットしますか？現在の進捗は失われます。')) {
      resetPlanning();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* ヘルプテキスト */}
      {getHelpText() && (
        <div className="mb-3 text-xs text-gray-600 text-center">
          {getHelpText()}
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex items-center space-x-2">
        {/* 次へボタン */}
        <button
          onClick={handleNextStep}
          disabled={isDisabled() || planningPhase === 'completed' || isProcessing}
          title={getTooltip()}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
            planningPhase === 'completed'
              ? 'bg-green-500 text-white cursor-default'
              : isDisabled() || isProcessing
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95 shadow-sm hover:shadow'
          }`}
        >
          {planningPhase === 'completed' ? (
            <>
              <Check className="w-5 h-5" />
              <span>{getButtonLabel()}</span>
            </>
          ) : (
            <>
              <span>{getButtonLabel()}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {/* リセットボタン */}
        {planningPhase !== 'initial' && (
          <button
            onClick={handleReset}
            title="最初からやり直す"
            className="p-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 補足情報 */}
      {planningPhase === 'detailing' && currentItinerary && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          チャットで「次へ」と入力しても進められます
        </div>
      )}
    </div>
  );
};