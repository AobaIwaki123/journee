'use client';

import React, { useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';

/**
 * Phase 7追加: チャット履歴のコントロールボタン
 *
 * - リフレッシュボタン: DBから最新の履歴を取得
 * - リセットボタン: チャット履歴を完全にクリア（確認ダイアログあり）
 */
export const ChatHistoryControls: React.FC = () => {
  const currentItinerary = useStore((state) => state.currentItinerary);
  const loadChatHistory = useStore((state) => state.loadChatHistory);
  const clearMessages = useStore((state) => state.clearMessages);
  const addToast = useStore((state) => state.addToast);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleRefresh = async () => {
    if (!currentItinerary?.id) {
      addToast('しおりが保存されていません', 'error');
      return;
    }

    setIsRefreshing(true);
    try {
      await loadChatHistory(currentItinerary.id);
      addToast('チャット履歴を更新しました', 'success');
    } catch (error) {
      console.error('Failed to refresh chat history:', error);
      addToast('履歴の更新に失敗しました', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReset = () => {
    clearMessages();
    setShowResetConfirm(false);
    addToast('チャット履歴をリセットしました', 'success');
  };

  return (
    <div className="flex items-center gap-2">
      {/* リフレッシュボタン */}
      <button
        onClick={handleRefresh}
        disabled={!currentItinerary?.id || isRefreshing}
        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="チャット履歴を更新"
      >
        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
      </button>

      {/* リセットボタン */}
      <button
        onClick={() => setShowResetConfirm(true)}
        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="チャット履歴をリセット"
      >
        <Trash2 size={18} />
      </button>

      {/* 確認ダイアログ */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              チャット履歴をリセット
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              すべてのチャット履歴が削除されます。この操作は取り消せません。
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors"
              >
                リセット
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
