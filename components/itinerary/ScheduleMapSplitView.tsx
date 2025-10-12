"use client";

import React from "react";
import { DaySchedule as DayScheduleType } from "@/types/itinerary";
import { DaySchedule } from "./DaySchedule";
import { MapView } from "./MapView";

interface ScheduleMapSplitViewProps {
  days: DayScheduleType[];
  editable?: boolean;
  mapHeight?: string;
}

/**
 * スケジュールと地図を同時に表示するPC版レイアウト
 * - 左側: スケジュール（スクロール可能）
 * - 右側: 地図（固定表示）
 */
export const ScheduleMapSplitView: React.FC<ScheduleMapSplitViewProps> = ({
  days,
  editable = false,
  mapHeight = "calc(100vh - 250px)", // デフォルトの高さ
}) => {
  // 位置情報を持つスポットがあるかチェック
  const hasLocations = days.some((day) =>
    day.spots.some((spot) => spot.location?.lat && spot.location?.lng)
  );

  // 地図表示できない場合は通常のスケジュール表示
  if (!hasLocations) {
    return (
      <div className="space-y-6">
        {days.map((day, index) => (
          <DaySchedule
            key={day.day}
            day={day}
            dayIndex={index}
            editable={editable}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 左側: スケジュール */}
      <div className="space-y-6 overflow-y-auto" style={{ maxHeight: mapHeight }}>
        {days.map((day, index) => (
          <DaySchedule
            key={day.day}
            day={day}
            dayIndex={index}
            editable={editable}
          />
        ))}
      </div>

      {/* 右側: 地図（PC版のみ表示） */}
      <div className="hidden md:block sticky top-6" style={{ height: mapHeight }}>
        <MapView
          days={days}
          showDaySelector={true}
          numberingMode="perDay"
          height="100%"
        />
      </div>
    </div>
  );
};
