'use client';

import React from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { ItineraryData } from '@/types/itinerary';

interface ItineraryHeaderProps {
  itinerary: ItineraryData;
}

export const ItineraryHeader: React.FC<ItineraryHeaderProps> = ({ itinerary }) => {
  return (
    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white p-8 shadow-lg">
      <div className="max-w-4xl mx-auto">
        {/* タイトル */}
        <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">
          {itinerary.title}
        </h1>

        {/* 基本情報 */}
        <div className="flex flex-wrap items-center gap-6 text-blue-50 mb-4">
          {/* 目的地 */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
            <MapPin className="w-5 h-5" />
            <span className="font-medium">{itinerary.destination}</span>
          </div>

          {/* 期間 */}
          {itinerary.startDate && itinerary.endDate && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">
                {itinerary.startDate} - {itinerary.endDate}
              </span>
            </div>
          )}

          {/* 日数 */}
          {itinerary.duration && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Clock className="w-5 h-5" />
              <span className="font-medium">{itinerary.duration}日間</span>
            </div>
          )}
        </div>

        {/* サマリー */}
        {itinerary.summary && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
            <p className="text-blue-50 leading-relaxed text-sm md:text-base">
              {itinerary.summary}
            </p>
          </div>
        )}

        {/* ステータスバッジ */}
        <div className="mt-4">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              itinerary.status === 'completed'
                ? 'bg-green-400 text-green-900'
                : itinerary.status === 'archived'
                ? 'bg-gray-400 text-gray-900'
                : 'bg-yellow-400 text-yellow-900'
            }`}
          >
            {itinerary.status === 'completed'
              ? '完成'
              : itinerary.status === 'archived'
              ? 'アーカイブ'
              : '下書き'}
          </span>
        </div>
      </div>
    </div>
  );
};