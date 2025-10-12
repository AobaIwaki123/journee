/**
 * ユーザー統計のモックデータ
 */

import type { UserStats } from "@/types/itinerary";

export interface MonthlyStats {
  month: string; // YYYY-MM形式
  count: number;
}

export interface CountryDistribution {
  country: string;
  count: number;
  [key: string]: any; // recharts互換性のため
}

/**
 * モックユーザー統計データを生成
 */
export function getMockUserStats(): UserStats {
  return {
    totalItineraries: 12,
    totalCountries: 8,
    totalDays: 87,
    monthlyStats: [
      { month: "2025-04", count: 1 },
      { month: "2025-05", count: 2 },
      { month: "2025-06", count: 3 },
      { month: "2025-07", count: 2 },
      { month: "2025-08", count: 1 },
      { month: "2025-09", count: 2 },
      { month: "2025-10", count: 1 },
    ],
    countryDistribution: [
      { country: "日本", count: 4 },
      { country: "フランス", count: 2 },
      { country: "イタリア", count: 2 },
      { country: "タイ", count: 1 },
      { country: "アメリカ", count: 1 },
      { country: "スペイン", count: 1 },
      { country: "韓国", count: 1 },
    ],
  };
}
