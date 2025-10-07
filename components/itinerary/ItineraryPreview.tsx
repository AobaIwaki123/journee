'use client';

import React from 'react';
import { useStore } from '@/lib/store/useStore';
import { DaySchedule } from './DaySchedule';
import { ItineraryHeader } from './ItineraryHeader';
import { ItinerarySummary } from './ItinerarySummary';
import { EmptyItinerary } from './EmptyItinerary';
import { FileDown } from 'lucide-react';

export const ItineraryPreview: React.FC = () => {
  const currentItinerary = useStore((state) => state.currentItinerary);

  // 空状態: しおりがない場合
  if (!currentItinerary) {
    return <EmptyItinerary />;
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <ItineraryHeader itinerary={currentItinerary} />

      {/* Content */}
      <div className="p-6 max-w-5xl mx-auto">
        {/* Summary */}
        {currentItinerary.schedule && currentItinerary.schedule.length > 0 && (
          <ItinerarySummary itinerary={currentItinerary} />
        )}

        {/* Days */}
        {currentItinerary.schedule && currentItinerary.schedule.length > 0 ? (
          <div className="space-y-6">
            {currentItinerary.schedule.map((day) => (
              <DaySchedule key={day.day} day={day} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600 text-lg font-medium mb-2">
              スケジュールがまだ作成されていません
            </p>
            <p className="text-sm text-gray-500">
              AIチャットで「〇日目の詳細を教えて」と聞いてみましょう
            </p>
          </div>
        )}

        {/* PDF Export Button */}
        {currentItinerary.schedule.length > 0 && (
          <div className="mt-10 mb-6 flex justify-center">
            <button
              className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              onClick={() => alert('PDF出力機能はPhase 5.3で実装予定です')}
            >
              <FileDown className="w-6 h-6 group-hover:animate-bounce" />
              <span className="text-lg font-semibold">PDFで保存</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
