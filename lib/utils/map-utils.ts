/**
 * Google Maps関連のユーティリティ関数
 */

import { TouristSpot, DaySchedule } from "@/types/itinerary";

/**
 * スポットを時系列順にソート
 */
export function sortSpotsByTime(spots: TouristSpot[]): TouristSpot[] {
  return spots.slice().sort((a, b) => {
    if (!a.scheduledTime || !b.scheduledTime) return 0;
    return a.scheduledTime.localeCompare(b.scheduledTime);
  });
}

/**
 * 日程ごとの色を取得（5色パレット）
 */
const DAY_COLORS = [
  "#3b82f6", // blue-500 (Day 1)
  "#10b981", // green-500 (Day 2)
  "#f59e0b", // amber-500 (Day 3)
  "#ef4444", // red-500 (Day 4)
  "#8b5cf6", // violet-500 (Day 5)
];

export function getDayColor(dayNumber: number): string {
  return DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
}

/**
 * マーカーデータ準備用の型
 */
export interface PreparedMarkerData {
  spot: TouristSpot;
  dayNumber: number;
  globalIndex: number; // 全体通しの番号
  dayIndex: number; // 日ごとの番号
  color: string;
}

/**
 * マーカーデータを準備
 * @param days 日程配列
 * @param selectedDay 選択中の日（undefined = 全日程表示）
 * @param numberingMode 番号付けモード（'global' | 'perDay'）
 */
export function prepareMarkerData(
  days: DaySchedule[],
  selectedDay?: number,
  numberingMode: "global" | "perDay" = "perDay"
): PreparedMarkerData[] {
  const result: PreparedMarkerData[] = [];
  let globalIndex = 1;

  const daysToShow =
    selectedDay !== undefined
      ? days.filter((day) => day.day === selectedDay)
      : days;

  daysToShow.forEach((day) => {
    const sortedSpots = sortSpotsByTime(day.spots);
    const spotsWithLocation = sortedSpots.filter(
      (spot) => spot.location?.lat && spot.location?.lng
    );

    spotsWithLocation.forEach((spot, dayIndex) => {
      result.push({
        spot,
        dayNumber: day.day,
        globalIndex: globalIndex++,
        dayIndex: dayIndex + 1,
        color: getDayColor(day.day),
      });
    });
  });

  return result;
}

/**
 * マップの中心座標を計算
 */
export function calculateMapCenter(spots: TouristSpot[]): {
  lat: number;
  lng: number;
} {
  if (spots.length === 0) {
    return { lat: 35.6762, lng: 139.6503 }; // Tokyo
  }

  const validSpots = spots.filter((s) => s.location?.lat && s.location?.lng);
  if (validSpots.length === 0) {
    return { lat: 35.6762, lng: 139.6503 };
  }

  return {
    lat:
      validSpots.reduce((sum, s) => sum + s.location!.lat, 0) /
      validSpots.length,
    lng:
      validSpots.reduce((sum, s) => sum + s.location!.lng, 0) /
      validSpots.length,
  };
}
