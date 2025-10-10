/**
 * Phase 9.4: DaySchedule（再構成版）
 * 
 * ヘッダー、スポットリスト、空メッセージを分離
 */

'use client';

import React, { useState, memo } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { DaySchedule as DayScheduleType } from '@/types/itinerary';
import { AddSpotForm } from './AddSpotForm';
import { useStore } from '@/lib/store/useStore';
import { useSpotStore, useItineraryStore } from '@/lib/store/itinerary';
import { DayScheduleHeader, SpotList, EmptyDayMessage } from './day-schedule';
import { Loader2, AlertCircle, RotateCcw } from 'lucide-react';

interface DayScheduleProps {
  day: DayScheduleType;
  dayIndex: number;
  editable?: boolean;
  onRetry?: (dayNumber: number) => void;
}

// 日付から曜日を取得
const getDayOfWeek = (dateString?: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
    return `(${daysOfWeek[date.getDay()]})`;
  } catch {
    return '';
  }
};

export const DaySchedule: React.FC<DayScheduleProps> = memo(({ 
  day, 
  dayIndex, 
  editable = true, 
  onRetry 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const { reorderSpots } = useSpotStore();
  const { currentItinerary } = useItineraryStore();
  const addToast = useStore((state: any) => state.addToast);

  const dayOfWeek = getDayOfWeek(day.date);
  const currency = currentItinerary?.currency;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    reorderSpots(dayIndex, sourceIndex, destinationIndex);
    addToast('スポットの順序を変更し、時刻を自動調整しました', 'info');
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Header */}
      <DayScheduleHeader
        day={day.day}
        theme={day.theme}
        date={day.date}
        dayOfWeek={dayOfWeek}
        status={day.status}
        spotCount={day.spots.length}
        totalCost={day.totalCost}
        currency={currency}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
      />

      {/* Content - アコーディオン */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {/* ローディング状態 */}
          {day.isLoading && (
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 mt-4">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-blue-700 font-medium">詳細を作成中...</span>
              </div>
            </div>
          )}

          {/* エラー表示 */}
          {day.error && (
            <div className="p-6 bg-red-50 rounded-lg border border-red-200 mt-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-700 font-medium mb-1">エラーが発生しました</p>
                  <p className="text-sm text-red-600 mb-3">{day.error}</p>
                  {onRetry && (
                    <button
                      onClick={() => onRetry(day.day)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      再試行
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* スポットリスト */}
          {!day.isLoading && !day.error && day.spots.length > 0 && (
            <div className="mt-4">
              <SpotList
                spots={day.spots}
                dayIndex={dayIndex}
                editable={editable}
                onDragEnd={handleDragEnd}
              />
            </div>
          )}

          {/* 空状態 */}
          {!day.isLoading && !day.error && day.spots.length === 0 && (
            <div className="mt-4">
              <EmptyDayMessage dayNumber={day.day} onRetry={onRetry} />
            </div>
          )}

          {/* スポット追加フォーム */}
          {editable && !day.isLoading && !day.error && (
            <div className="mt-4">
              <AddSpotForm dayIndex={dayIndex} />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

DaySchedule.displayName = 'DaySchedule';
