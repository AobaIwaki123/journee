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
      <div className="flex items-center mb-4">
        <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mr-4">
          Day{day.day}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {day.day}日目
          </h3>
          <p className="text-sm text-gray-500">{day.date}</p>
        </div>
      </div>

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
    </div>
  );
};
