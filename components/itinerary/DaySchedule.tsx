'use client';

import React from 'react';
import { DaySchedule as DayScheduleType } from '@/types/itinerary';
import { SpotCard } from './SpotCard';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface DayScheduleProps {
  day: DayScheduleType;
}

export const DaySchedule: React.FC<DayScheduleProps> = ({ day }) => {
  // Phase 4: ステータスに応じたバッジ表示
  const getStatusBadge = () => {
    if (!day.status) return null;

    const badges = {
      draft: { label: '下書き', color: 'bg-gray-100 text-gray-600' },
      skeleton: { label: '骨組み', color: 'bg-yellow-100 text-yellow-700' },
      detailed: { label: '詳細化済み', color: 'bg-blue-100 text-blue-700' },
      completed: { label: '完成', color: 'bg-green-100 text-green-700' },
    };

    const badge = badges[day.status];
    if (!badge) return null;

    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center flex-1">
          <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mr-4 flex-shrink-0">
            Day{day.day}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-gray-800">
                {day.title || `${day.day}日目`}
              </h3>
              {getStatusBadge()}
            </div>
            {day.date && (
              <p className="text-sm text-gray-500">{day.date}</p>
            )}
            {/* Phase 4: テーマ表示 */}
            {day.theme && (
              <p className="text-sm text-blue-600 mt-1 flex items-center">
                <Sparkles className="w-3 h-3 mr-1" />
                {day.theme}
              </p>
            )}
          </div>
        </div>

        {/* Day summary */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          {day.totalCost !== undefined && day.totalCost > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500">予算</p>
              <p className="font-semibold text-blue-600">
                ¥{day.totalCost.toLocaleString()}
              </p>
            </div>
          )}
          {day.totalDistance !== undefined && day.totalDistance > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500">移動距離</p>
              <p className="font-semibold">{day.totalDistance}km</p>
            </div>
          )}
        </div>
      </div>

      {/* Spots */}
      {day.spots.length > 0 ? (
        <div className="space-y-4 ml-8">
          {day.spots.map((spot, index) => (
            <React.Fragment key={spot.id}>
              <SpotCard spot={spot} />
              {index < day.spots.length - 1 && (
                <div className="flex items-center my-2">
                  <div className="w-px h-8 bg-gray-300 ml-6"></div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div className="ml-8 p-4 bg-gray-50 rounded-lg text-center">
          {day.status === 'skeleton' ? (
            <div className="text-gray-600 text-sm">
              <Sparkles className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
              <p className="font-medium">骨組みが決まりました</p>
              <p className="text-xs text-gray-500 mt-1">
                次のステップで具体的なスケジュールを作成します
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              この日のスケジュールはまだ設定されていません
            </p>
          )}
        </div>
      )}
    </div>
  );
};
