"use client";

import React, { useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store/useStore";

/**
 * Phase 7追加: チャット履歴のコントロールボタン
 *
 * - リフレッシュボタン: DBから最新の履歴を再読み込み（同期）
 * - クリアボタン: 表示中のチャット履歴をクリア（新しい会話を開始）
 *   ※ DBに保存された履歴は削除されません
 */
export const ChatHistoryControls: React.FC = () => {
  // Refresh logic removed
  const clearMessages = useStore((state) => state.clearMessages);
  const addToast = useStore((state) => state.addToast);
  // Refresh state removed
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Refresh handler removed

  const handleClear = () => {
    clearMessages();
    setShowClearConfirm(false);
    addToast(
      "チャット履歴をクリアしました（新しい会話を開始できます）",
      "success"
    );
  };

  return (
    <div className="flex items-center gap-2">
      {/* クリアボタン */}
      <button
        onClick={() => setShowClearConfirm(true)}
        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="表示中のチャット履歴をクリア（新しい会話を開始）"
      >
        <Trash2 size={18} />
      </button>

      {/* 確認ダイアログ */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              チャット履歴をクリア
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              表示中のチャット履歴をクリアして、新しい会話を開始します。
            </p>
            <p className="text-sm text-gray-500 mb-4">
              ※ データベースに保存された履歴は削除されません。
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors"
              >
                クリア
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
