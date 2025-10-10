"use client";

import React from "react";
import { useStore } from "@/lib/store/useStore";
import { usePhaseTransition, useAIProgress } from "@/lib/hooks/itinerary";
import { ArrowRight, RotateCcw, Check, AlertCircle } from "lucide-react";

interface QuickActionsProps {
  className?: string;
  showBorder?: boolean;
}

/**
 * Phase 7.3: 段階的旅程構築のクイックアクション
 * usePhaseTransition と useAIProgress に分割してUIに専念
 */
export const QuickActions: React.FC<QuickActionsProps> = ({
  className = "",
  showBorder = true,
}) => {
  // フェーズ遷移管理
  const {
    planningPhase,
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
  } = usePhaseTransition();
  
  // AI進行管理
  const {
    isProcessing,
    proceedAndSendMessage,
  } = useAIProgress();

  // イベントハンドラ
  const handleNextStep = async () => {
    if (isProcessing || planningPhase === "completed") return;

    // 必須情報が不足している場合は警告を表示
    if (!canProceed()) {
      setShowWarning(true);
      return;
    }

    await proceedAndSendMessage();
  };

  const handleReset = () => {
    if (confirm("旅程作成をリセットしますか？現在の進捗は失われます。")) {
      resetPlanning();
    }
  };

  const handleForceNext = async () => {
    setShowWarning(false);
    await proceedAndSendMessage();
  };

  const containerClassName = `bg-white p-4 ${
    showBorder ? "border-t border-gray-200" : ""
  } ${className}`.trim();

  return (
    <div className={containerClassName}>
      {/* 警告ダイアログ */}
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

      {/* 不足情報のヒント */}
      {buttonReadiness?.missingInfo &&
        buttonReadiness.missingInfo.length > 0 && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            まだ: {buttonReadiness.missingInfo.join("、")} が未設定です
          </div>
        )}
    </div>
  );
};
