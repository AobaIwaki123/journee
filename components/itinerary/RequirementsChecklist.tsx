"use client";

import React from "react";
import { Check, Circle, AlertCircle } from "lucide-react";
import type {
  RequirementChecklistItem,
  ChecklistStatus,
} from "@/types/requirements";

interface RequirementsChecklistProps {
  items: RequirementChecklistItem[];
  completionStatus: ChecklistStatus | null;
  phase: string;
}

/**
 * Phase 4.8改善: 要件チェックリスト
 * 情報収集の進捗をリアルタイムで表示
 */
export const RequirementsChecklist: React.FC<RequirementsChecklistProps> = ({
  items,
  completionStatus,
  phase,
}) => {
  if (!completionStatus || items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">情報収集の進捗</h3>
        <div className="text-xs text-gray-500">
          {Math.round(completionStatus.completionRate)}%
        </div>
      </div>

      {/* プログレスバー */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${completionStatus.completionRate}%` }}
        />
      </div>

      {/* チェックリスト */}
      <div className="space-y-2">
        {items.map((item) => {
          const isFilled = item.status === "filled";
          const isRequired = item.required;

          return (
            <div
              key={item.id}
              className={`flex items-start space-x-2 p-2 rounded-lg transition-colors ${
                isFilled ? "bg-green-50" : "bg-gray-50"
              }`}
            >
              {/* アイコン */}
              <div className="flex-shrink-0 mt-0.5">
                {isFilled ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : isRequired ? (
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400" />
                )}
              </div>

              {/* テキスト */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <span
                    className={`text-sm font-medium ${
                      isFilled ? "text-green-700" : "text-gray-700"
                    }`}
                  >
                    {item.label}
                  </span>
                  {isRequired && !isFilled && (
                    <span className="text-xs text-orange-600 font-medium">
                      (必須)
                    </span>
                  )}
                </div>

                {/* 説明 */}
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.description}
                </p>

                {/* 取得した値を表示 */}
                {isFilled && item.value && (
                  <div className="mt-1">
                    <span className="text-xs font-medium text-green-600">
                      {typeof item.value === "object"
                        ? JSON.stringify(item.value)
                        : String(item.value)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* フッター：不足情報の表示 */}
      {completionStatus.missingRequired.length > 0 && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-orange-800">
                以下の必須情報が不足しています：
              </p>
              <p className="text-xs text-orange-700 mt-1">
                {completionStatus.missingRequired.join("、")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* フッター：任意情報の推奨 */}
      {completionStatus.missingRequired.length === 0 &&
        completionStatus.missingOptional.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Circle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-800">
                  さらに詳しい情報を追加すると、より良いプランが作成できます：
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {completionStatus.missingOptional.join("、")}
                </p>
              </div>
            </div>
          </div>
        )}

      {/* フッター：完了メッセージ */}
      {completionStatus.allRequiredFilled &&
        completionStatus.missingOptional.length === 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-600" />
              <p className="text-xs font-medium text-green-800">
                全ての情報が揃いました！次のステップへ進めます。
              </p>
            </div>
          </div>
        )}
    </div>
  );
};
