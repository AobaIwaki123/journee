/**
 * Phase 8: ScheduleListView
 * 
 * 日程リストの表示コンポーネント
 */

'use client';

import React from 'react';
import { DaySchedule } from '../DaySchedule';
import { DaySchedule as DayScheduleType } from '@/types/itinerary';

interface ScheduleListViewProps {
  schedule: DayScheduleType[];
  editable: boolean;
}

export const ScheduleListView: React.FC<ScheduleListViewProps> = ({
  schedule,
  editable,
}) => {
  return (
    <div className="space-y-6">
      {schedule.map((day: DayScheduleType, index: number) => (
        <DaySchedule
          key={day.day}
          day={day}
          dayIndex={index}
          editable={editable}
        />
      ))}
    </div>
  );
};
