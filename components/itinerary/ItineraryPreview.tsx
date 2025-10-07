'use client';

import React from 'react';
import { useStore } from '@/lib/store/useStore';
import { DaySchedule } from './DaySchedule';
import { Calendar, MapPin, FileDown } from 'lucide-react';

export const ItineraryPreview: React.FC = () => {
  const currentItinerary = useStore((state) => state.currentItinerary);

  if (!currentItinerary) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
        <Calendar className="w-24 h-24 mb-4" />
        <h3 className="text-xl font-semibold mb-2">旅のしおりをプレビュー</h3>
        <p className="text-center text-sm">
          AIチャットで旅行計画を作成すると、
          <br />
          こちらにリアルタイムでしおりが表示されます
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8">
        <h1 className="text-3xl font-bold mb-2">{currentItinerary.title}</h1>
        <div className="flex items-center space-x-4 text-blue-100">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{currentItinerary.destination}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>
              {currentItinerary.startDate} - {currentItinerary.endDate}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Days */}
        <div className="space-y-6">
          {currentItinerary.days.map((day) => (
            <DaySchedule key={day.day} day={day} />
          ))}
        </div>

        {/* PDF Export Button */}
        <div className="mt-8 flex justify-center">
          <button
            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => alert('PDF出力機能はPhase 6で実装予定です')}
          >
            <FileDown className="w-5 h-5" />
            <span>PDFで保存</span>
          </button>
        </div>
      </div>
    </div>
  );
};
