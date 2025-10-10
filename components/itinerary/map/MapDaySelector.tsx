/**
 * マップの日程選択UIコンポーネント
 */

"use client";

import React from "react";
import { DaySchedule } from "@/types/itinerary";
import { getDayColor } from "@/lib/utils/map-utils";

interface MapDaySelectorProps {
  days: DaySchedule[];
  selectedDay: number | undefined;
  onSelectDay: (day: number | undefined) => void;
}

export const MapDaySelector: React.FC<MapDaySelectorProps> = ({
  days,
  selectedDay,
  onSelectDay,
}) => {
  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      <button
        onClick={() => onSelectDay(undefined)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          selectedDay === undefined
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
        }`}
      >
        全日程
      </button>
      {days.map((day) => {
        const color = getDayColor(day.day);
        const isSelected = selectedDay === day.day;

        return (
          <button
            key={day.day}
            onClick={() => onSelectDay(day.day)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isSelected
                ? "text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
            style={
              isSelected
                ? {
                    backgroundColor: color,
                    borderColor: color,
                  }
                : undefined
            }
          >
            Day {day.day}
          </button>
        );
      })}
    </div>
  );
};
