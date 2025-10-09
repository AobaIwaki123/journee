'use client';

import React from 'react';
import { useStore } from '@/lib/store/useStore';
import type { ItineraryPhase } from '@/types/itinerary';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

/**
 * Phase 4.4: 段階的旅程構築の進捗インジケーター
 * 現在のフェーズと進捗状況を視覚的に表示
 */
export const PlanningProgress: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { planningPhase, currentItinerary, currentDetailingDay } = useStore();

  // フェーズの表示ラベル
  const phaseLabels: Record<ItineraryPhase, string> = {
    initial: '準備中',
    collecting: '基本情報の収集',
    skeleton: '骨組みの作成',
    detailing: '日程の詳細化',
    completed: '完成',
  };

  // フェーズの順序
  const phases: ItineraryPhase[] = ['collecting', 'skeleton', 'detailing', 'completed'];

  // 現在のフェーズのインデックス
  const currentPhaseIndex = phases.indexOf(planningPhase);

  // 進捗率の計算
  const getProgress = (): number => {
    switch (planningPhase) {
      case 'initial':
        return 0;
      case 'collecting':
        return 15;
      case 'skeleton':
        return 35;
      case 'detailing':
        if (!currentItinerary || !currentDetailingDay) return 50;
        const totalDays = currentItinerary.duration || currentItinerary.schedule.length || 1;
        // detailingフェーズは35%～85%（50%の範囲）
        const progressPerDay = 50 / totalDays;
        return 35 + progressPerDay * currentDetailingDay;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  const progress = getProgress();

  // フェーズの状態を判定
  const getPhaseStatus = (phase: ItineraryPhase): 'completed' | 'current' | 'upcoming' => {
    const phaseIndex = phases.indexOf(phase);
    if (phaseIndex < currentPhaseIndex) return 'completed';
    if (phaseIndex === currentPhaseIndex) return 'current';
    return 'upcoming';
  };

  // detailingフェーズの詳細情報
  const renderDetailingInfo = () => {
    if (planningPhase !== 'detailing' || !currentItinerary) return null;

    const totalDays = currentItinerary.duration || currentItinerary.schedule.length;
    const day = currentDetailingDay || 1;

    return (
      <div className="mt-2 text-xs text-gray-600">
        {day} / {totalDays} 日目を作成中
      </div>
    );
  };

  return (
    <div className={`bg-white border-b border-gray-200 p-4 ${className}`}>
      {/* 現在のフェーズ表示 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-700">
            {phaseLabels[planningPhase as ItineraryPhase]}
          </h3>
        </div>
        <div className="text-xs font-medium text-gray-500">
          {Math.round(progress)}%
        </div>
      </div>

      {/* プログレスバー */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* フェーズステップ */}
      <div className="flex items-center justify-between">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase);
          const isLast = index === phases.length - 1;

          return (
            <React.Fragment key={phase}>
              {/* フェーズアイコンとラベル */}
              <div className="flex flex-col items-center flex-1">
                {/* アイコン */}
                <div className="relative">
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6 text-blue-500" />
                  ) : status === 'current' ? (
                    <div className="w-6 h-6 rounded-full border-2 border-blue-500 bg-blue-100 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    </div>
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300" />
                  )}
                </div>

                {/* ラベル */}
                <div
                  className={`mt-1 text-xs font-medium text-center ${
                    status === 'completed'
                      ? 'text-blue-600'
                      : status === 'current'
                      ? 'text-blue-700 font-semibold'
                      : 'text-gray-400'
                  }`}
                >
                  {phaseLabels[phase]}
                </div>
              </div>

              {/* 接続線 */}
              {!isLast && (
                <div className="flex-1 h-0.5 mx-2 mb-6">
                  <div
                    className={`h-full transition-all duration-500 ${
                      status === 'completed' ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* detailingフェーズの詳細情報 */}
      {renderDetailingInfo()}
    </div>
  );
};