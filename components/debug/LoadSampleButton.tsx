'use client';

import React from 'react';
import { useStore } from '@/lib/store/useStore';
import { loadSampleItinerary } from '@/lib/mock-data/sample-itinerary';
import { MapPin, Sparkles } from 'lucide-react';

/**
 * Phase 5.1 新機能確認用のデバッグボタン
 * 開発環境でのみ表示される
 */
export const LoadSampleButton: React.FC = () => {
  const setItinerary = useStore((state) => state.setItinerary);
  const currentItinerary = useStore((state) => state.currentItinerary);

  // 本番環境では非表示
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleLoadKyoto = () => {
    const kyotoData = loadSampleItinerary('kyoto');
    setItinerary(kyotoData);
  };

  const handleLoadTokyo = () => {
    const tokyoData = loadSampleItinerary('tokyo');
    setItinerary(tokyoData);
  };

  const handleClear = () => {
    setItinerary(null);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <div className="bg-white border-2 border-yellow-400 rounded-lg shadow-lg p-3">
        <p className="text-xs font-semibold text-yellow-700 mb-2">
          🔧 開発モード - Phase 5.1 確認用
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleLoadKyoto}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            京都サンプル読込
          </button>
          <button
            onClick={handleLoadTokyo}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            東京サンプル読込
          </button>
          {currentItinerary && (
            <button
              onClick={handleClear}
              className="px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
            >
              クリア
            </button>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-2">
          ※地図機能を確認するには<br />
          Google Maps APIキーが必要です
        </p>
      </div>
    </div>
  );
};