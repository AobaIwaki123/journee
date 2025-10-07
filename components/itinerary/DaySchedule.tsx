'use client';

import React from 'react';
import { DaySchedule as DayScheduleType } from '@/types/itinerary';
import { SpotCard } from './SpotCard';

interface DayScheduleProps {
  day: DayScheduleType;
}

export const DaySchedule: React.FC<DayScheduleProps> = ({ day }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mr-4">
            Day{day.day}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {day.title || `${day.day}日目`}
            </h3>
            {day.date && (
              <p className="text-sm text-gray-500">{day.date}</p>
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
        <div className="ml-8 p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">
          この日のスケジュールはまだ設定されていません
        </div>
      )}
    </div>
  );
};
