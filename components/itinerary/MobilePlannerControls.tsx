'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Clock, ChevronUp, X, ListTodo } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import { PlanningProgress, PLANNING_PHASE_LABELS, calculatePlanningProgress } from './PlanningProgress';
import { QuickActions } from './QuickActions';
import { PhaseStatusBar } from './PhaseStatusBar';
import type { ItineraryPhase } from '@/types/itinerary';

export const MobilePlannerControls: React.FC = () => {
  const {
    planningPhase,
    currentItinerary,
    currentDetailingDay,
    isAutoProgressing,
    autoProgressState,
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);

  const currentPhase = (planningPhase || 'initial') as ItineraryPhase;

  const progress = useMemo(() => {
    return calculatePlanningProgress(
      currentPhase,
      currentItinerary,
      currentDetailingDay
    );
  }, [currentPhase, currentItinerary, currentDetailingDay]);

  const phaseLabel = PLANNING_PHASE_LABELS[currentPhase] || '進捗';

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  // モーダル表示時はスクロールを固定
  useEffect(() => {
    if (!isOpen) return;

    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  // 初期フェーズでも操作ボタンを表示するため常に描画
  return (
    <>
      {/* トリガーボタン */}
      <button
        type="button"
        onClick={handleOpen}
        className="md:hidden fixed bottom-5 right-4 z-30 flex items-center gap-3 rounded-full bg-blue-600 px-4 py-3 text-white shadow-lg shadow-blue-500/40"
        aria-label="プランニングの進捗と操作を開く"
      >
        <Clock className="h-5 w-5" />
        <div className="text-left">
          <p className="text-[11px] uppercase tracking-widest text-white/80">
            プラン進捗
          </p>
          <p className="text-sm font-semibold leading-tight">
            {isAutoProgressing && autoProgressState
              ? autoProgressState.currentStep || phaseLabel
              : phaseLabel}
          </p>
        </div>
        <div className="ml-2 flex items-center gap-1 text-sm font-semibold">
          <span>{Math.round(isAutoProgressing && autoProgressState ? autoProgressState.progress : progress)}%</span>
          <ChevronUp className="h-4 w-4" />
        </div>
      </button>

      {/* 下部シート */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={handleClose}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 flex justify-center">
            <div className="w-full max-w-md rounded-t-3xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">プランニングの状況</p>
                  <p className="text-xs text-gray-500">進捗の確認と次のアクションを選べます</p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                  aria-label="閉じる"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto px-5 pb-6 pt-4">
                {isAutoProgressing && autoProgressState ? (
                  <PhaseStatusBar state={autoProgressState} />
                ) : (
                  <PlanningProgress
                    showBorder={false}
                    className="rounded-2xl border border-gray-100 shadow-sm"
                  />
                )}

                {!isAutoProgressing ? (
                  <div className="mt-5 rounded-2xl border border-gray-100 shadow-sm">
                    <QuickActions showBorder={false} className="rounded-2xl" />
                  </div>
                ) : (
                  <div className="mt-5 flex items-center gap-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    <ListTodo className="h-5 w-5 flex-shrink-0" />
                    <span>自動進行中です。完了までお待ちください。</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
