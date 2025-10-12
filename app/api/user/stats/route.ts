import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/db/supabase";
import type { UserStatsResponse, MonthlyStats, CountryDistribution } from "@/types/auth";

/**
 * GET /api/user/stats
 *
 * ユーザーのしおり統計情報を取得するAPI
 * Phase 10.4: マイページAPI統合
 *
 * @returns ユーザー統計情報
 *
 * レスポンス内容:
 * - totalItineraries: しおり総数
 * - totalCountries: 訪問国数（重複なし）
 * - totalDays: 総旅行日数
 * - monthlyStats: 月別しおり作成数（直近6ヶ月）
 * - countryDistribution: 訪問国分布
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/user/stats')
 * if (response.ok) {
 *   const stats = await response.json()
 *   console.log(stats.totalItineraries)
 * }
 * ```
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // 1. しおり総数を取得
    const { count: totalItineraries } = await supabase
      .from('itineraries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // 2. 全しおりデータを取得（統計計算用）
    const { data: itineraries, error } = await supabase
      .from('itineraries')
      .select('destination, duration, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching itineraries for stats:", error);
      throw error;
    }

    // 3. 訪問国数を計算（重複削除）
    const countries = new Set(
      (itineraries || [])
        .map(i => i.destination)
        .filter((d): d is string => d !== null && d !== '')
    );
    const totalCountries = countries.size;

    // 4. 総旅行日数を計算
    const totalDays = (itineraries || []).reduce(
      (sum, i) => sum + (i.duration || 0),
      0
    );

    // 5. 月別しおり作成数を計算
    const monthlyMap = new Map<string, number>();
    (itineraries || []).forEach(itinerary => {
      if (itinerary.created_at) {
        const month = itinerary.created_at.substring(0, 7); // YYYY-MM
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
      }
    });

    // 直近6ヶ月分のデータを生成（データがない月は0）
    const monthlyStats: MonthlyStats[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toISOString().substring(0, 7);
      monthlyStats.push({
        month,
        count: monthlyMap.get(month) || 0,
      });
    }

    // 6. 訪問国分布を計算
    const countryMap = new Map<string, number>();
    (itineraries || []).forEach(itinerary => {
      if (itinerary.destination) {
        countryMap.set(
          itinerary.destination,
          (countryMap.get(itinerary.destination) || 0) + 1
        );
      }
    });

    const countryDistribution: CountryDistribution[] = Array.from(
      countryMap.entries()
    )
      .map(([country, count]) => ({
        country,
        count,
        percent: totalItineraries ? count / totalItineraries : 0,
      }))
      .sort((a, b) => b.count - a.count); // 降順ソート

    // レスポンス返却
    const response: UserStatsResponse = {
      totalItineraries: totalItineraries || 0,
      totalCountries,
      totalDays,
      monthlyStats,
      countryDistribution,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
