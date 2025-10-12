import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { itineraryRepository } from "@/lib/db/itinerary-repository";
import type { UserStatsResponse } from "@/types/auth";

/**
 * GET /api/user/stats
 *
 * 現在ログインしているユーザーの統計情報を取得するAPI
 * - しおり総数
 * - 訪問国数（重複なし）
 * - 総旅行日数
 * - 月別しおり作成推移（直近6ヶ月）
 * - 訪問国分布
 *
 * @returns 統計情報またはエラーレスポンス
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/user/stats')
 * if (response.ok) {
 *   const stats = await response.json()
 * }
 * ```
 */
export async function GET() {
  try {
    // 現在のユーザーを取得
    const user = await getCurrentUser();

    // 未認証の場合
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "ログインが必要です" },
        { status: 401 }
      );
    }

    // 全しおりを取得（ページネーションなし）
    const result = await itineraryRepository.listItineraries(
      user.id,
      {},
      "created_at",
      "desc",
      { page: 1, pageSize: 10000 } // 十分大きな数
    );

    const itineraries = result.data;

    // しおり総数
    const totalItineraries = itineraries.length;

    // 訪問国数（重複なし）
    const countries = new Set<string>();
    itineraries.forEach((itinerary) => {
      if (itinerary.destination) {
        countries.add(itinerary.destination);
      }
    });
    const totalCountries = countries.size;

    // 総旅行日数
    const totalDays = itineraries.reduce((sum, itinerary) => {
      return sum + (itinerary.duration || 0);
    }, 0);

    // 月別しおり作成推移（直近6ヶ月）
    const now = new Date();
    const monthlyStats: { month: string; count: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      
      const count = itineraries.filter((itinerary) => {
        const createdAt = itinerary.createdAt;
        const createdYearMonth = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
        return createdYearMonth === yearMonth;
      }).length;

      monthlyStats.push({
        month: yearMonth,
        count,
      });
    }

    // 訪問国分布（降順でソート、パーセント計算）
    const countryCount = new Map<string, number>();
    itineraries.forEach((itinerary) => {
      if (itinerary.destination) {
        const count = countryCount.get(itinerary.destination) || 0;
        countryCount.set(itinerary.destination, count + 1);
      }
    });

    const countryDistribution = Array.from(countryCount.entries())
      .map(([country, count]) => ({
        country,
        count,
        percent: totalItineraries > 0 ? Math.round((count / totalItineraries) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // レスポンスを構築
    const stats: UserStatsResponse = {
      totalItineraries,
      totalCountries,
      totalDays,
      monthlyStats,
      countryDistribution,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "統計情報の取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
