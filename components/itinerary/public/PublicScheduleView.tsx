/**
 * Phase 9.5: PublicScheduleView
 * 
 * 公開しおりのスケジュール表示（読み取り専用）
 */

'use client';

import React from 'react';
import { ItineraryData } from '@/types/itinerary';
import { ItinerarySummary } from '../ItinerarySummary';
import { DaySchedule } from '../DaySchedule';

interface PublicScheduleViewProps {
  itinerary: ItineraryData;
}

export const PublicScheduleView: React.FC<PublicScheduleViewProps> = ({
  itinerary,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:px-6">
      {/* カスタムメッセージ */}
      {itinerary.customMessage && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {itinerary.customMessage}
          </p>
        </div>
      )}

      {/* Summary */}
      {itinerary.schedule && itinerary.schedule.length > 0 && (
        <ItinerarySummary itinerary={itinerary} />
      )}

      {/* Schedule */}
      <div className="space-y-6 mt-6">
        {itinerary.schedule?.map((day, index) => (
          <DaySchedule
            key={day.day}
            day={day}
            dayIndex={index}
            editable={false}
          />
        ))}
      </div>
    </div>
  );
};
