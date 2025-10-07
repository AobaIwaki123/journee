'use client';

import React from 'react';
import { useStore } from '@/lib/store/useStore';
import type { ItineraryPhase } from '@/types/itinerary';
import { ArrowRight, RotateCcw, Check } from 'lucide-react';

/**
 * Phase 4.4: 段階的旅程構築のクイックアクション
 * 「次へ」ボタンやリセットボタンなどを提供
 */
export const QuickActions: React.FC = () => {
  const { planningPhase, currentItinerary, proceedToNextStep, resetPlanning } = useStore();

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

  const handleNextStep = () => {
    if (!isDisabled()) {
      proceedToNextStep();
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
          disabled={isDisabled() || planningPhase === 'completed'}
          title={getTooltip()}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
            planningPhase === 'completed'
              ? 'bg-green-500 text-white cursor-default'
              : isDisabled()
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