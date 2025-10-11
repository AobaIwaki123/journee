'use client';

import React, { useState } from 'react';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { useUIStore } from '@/lib/store/ui';
import { useChatStore } from '@/lib/store/chat';
import { useItineraryStore, useItineraryProgressStore } from '@/lib/store/itinerary';
import { clearCurrentItinerary } from '@/lib/utils/storage';

/**
 * Phase 10.3: しおりリセットボタン（useUIStore, useChatStore使用）
 */
export const ResetButton: React.FC = () => {
  const { currentItinerary, setItinerary } = useItineraryStore();
  const { resetPlanning } = useItineraryProgressStore();
  const { clearMessages } = useChatStore();
  const { addToast } = useUIStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = () => {
    setShowConfirm(true);
  };

  const handleConfirmReset = () => {
    try {
      setItinerary(null);
      resetPlanning();
      
      // チャット履歴もクリア（オプション）
      // clearMessages();
      
      clearCurrentItinerary();
      
      addToast('しおりをリセットしました', 'info');
      setShowConfirm(false);
    } catch (error) {
      console.error('Failed to reset itinerary:', error);
      addToast('リセットに失敗しました', 'error');
    }
  };

  if (!currentItinerary) return null;

  return (
    <>
      <button
        onClick={handleReset}
        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        title="しおりをリセット"
      >
        <RotateCcw className="w-4 h-4" />
        <span className="hidden md:inline">リセット</span>
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md mx-4 p-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  しおりをリセットしますか？
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  現在のしおりとチャット履歴がすべて削除されます。この操作は元に戻せません。
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleConfirmReset}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
