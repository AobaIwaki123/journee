'use client';

import React, { useState } from 'react';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import { useItineraryStore } from '@/lib/store/itinerary';
import { useItineraryProgressStore } from '@/lib/store/itinerary';
import { clearCurrentItinerary } from '@/lib/utils/storage';

/**
 * Phase 6.2: しおりリセットボタン
 * useItineraryStoreとuseItineraryProgressStoreに移行
 */
export const ResetButton: React.FC = () => {
  const { currentItinerary, setItinerary } = useItineraryStore();
  const { resetPlanning } = useItineraryProgressStore();
  const clearMessages = useStore((state) => state.clearMessages);
  const addToast = useStore((state) => state.addToast);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = () => {
    // 確認ダイアログを表示
    setShowConfirm(true);
  };

  const confirmReset = () => {
    try {
      // しおりをクリア
      setItinerary(null);
      
      // プランニング状態をリセット
      resetPlanning();
      
      // チャット履歴もクリア（オプション）
      // clearMessages();
      
      // LocalStorageからも削除
      clearCurrentItinerary();
      
      addToast('しおりをリセットしました', 'info');
      setShowConfirm(false);
    } catch (error) {
      console.error('Failed to reset itinerary:', error);
      addToast('リセットに失敗しました', 'error');
    }
  };

  const cancelReset = () => {
    setShowConfirm(false);
  };

  if (!currentItinerary) return null;

  return (
    <>
      <button
        onClick={handleReset}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        title="しおりをリセット"
      >
        <RotateCcw size={20} />
        <span>リセット</span>
      </button>

      {/* 確認ダイアログ */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-500 flex-shrink-0" size={24} />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  しおりをリセットしますか？
                </h3>
                <p className="text-gray-600 mb-4">
                  現在のしおりがクリアされ、新規作成モードに戻ります。この操作は取り消せません。
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={cancelReset}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={confirmReset}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    リセット
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
