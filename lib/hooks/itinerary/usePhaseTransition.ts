/**
 * Phase 7.3: usePhaseTransition - フェーズ遷移管理
 * 
 * フェーズ遷移とUI表示ロジックをカプセル化
 */

import { useState, useCallback } from 'react';
import { useItineraryProgressStore } from '@/lib/store/itinerary';
import { useItineraryStore } from '@/lib/store/itinerary';
import type { ItineraryPhase } from '@/types/itinerary';
import type { ButtonReadiness, ChecklistStatus } from '@/types/requirements';

export interface UsePhaseTransitionReturn {
  // State
  planningPhase: ItineraryPhase;
  currentDetailingDay: number | null;
  buttonReadiness: ButtonReadiness | null;
  checklistStatus: ChecklistStatus | null;
  
  // UI helpers
  getButtonLabel: () => string;
  getTooltip: () => string;
  getHelpText: () => string | null;
  getButtonStyles: () => string;
  
  // Actions
  canProceed: () => boolean;
  showWarning: boolean;
  setShowWarning: (value: boolean) => void;
  
  // Progress
  resetPlanning: () => void;
}

/**
 * フェーズ遷移管理Hook
 */
export function usePhaseTransition(): UsePhaseTransitionReturn {
  const {
    planningPhase,
    currentDetailingDay,
    buttonReadiness,
    checklistStatus,
    resetPlanning,
  } = useItineraryProgressStore();
  
  const { currentItinerary } = useItineraryStore();
  const [showWarning, setShowWarning] = useState(false);
  
  // フェーズごとのボタンラベル
  const getButtonLabel = useCallback((): string => {
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
  }, [planningPhase, currentItinerary]);
  
  // ツールチップテキスト
  const getTooltip = useCallback((): string => {
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
  }, [planningPhase]);
  
  // ヘルプテキスト
  const getHelpText = useCallback((): string | null => {
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
  }, [planningPhase, currentItinerary]);
  
  // ボタンのスタイルを取得
  const getButtonStyles = useCallback((): string => {
    if (planningPhase === "completed") {
      return "bg-green-500 text-white cursor-default";
    }

    // 動的スタイリング
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
  }, [planningPhase, buttonReadiness]);
  
  // 進行可能かどうか
  const canProceed = useCallback((): boolean => {
    if (planningPhase === "completed") return false;
    
    // 必須情報不足の場合は警告を表示
    if (
      buttonReadiness &&
      buttonReadiness.level === "not_ready" &&
      checklistStatus
    ) {
      return false;
    }
    
    return true;
  }, [planningPhase, buttonReadiness, checklistStatus]);
  
  return {
    planningPhase,
    currentDetailingDay,
    buttonReadiness,
    checklistStatus,
    getButtonLabel,
    getTooltip,
    getHelpText,
    getButtonStyles,
    canProceed,
    showWarning,
    setShowWarning,
    resetPlanning,
  };
}
