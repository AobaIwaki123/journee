import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/db/supabase";
import type { UserStats, MonthlyStats, CountryDistribution } from "@/types/auth";

/**
 * GET /api/user/stats
 *
 * 現在のユーザーの統計情報を取得するAPI
 * - しおり総数
 * - 訪問国数
 * - 総旅行日数
 * - 月別しおり作成数
 * - 訪問国分布
 *
 * @returns ユーザー統計情報またはエラーレスポンス
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/user/stats')
 * if (response.ok) {
 *   const stats = await response.json()
 *   console.log(stats.totalItineraries) // しおり総数
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

    // Supabase Admin接続チェック
    if (!supabaseAdmin) {
      console.error("Supabase admin client is not available");
      return NextResponse.json(
        {
          error: "Service Unavailable",
          message: "データベース接続が利用できません",
        },
        { status: 503 }
      );
    }

    // ユーザーのすべてのしおりを取得
    const { data: itineraries, error: itinerariesError } = await supabaseAdmin
      .from("itineraries")
      .select("id, destination, start_date, end_date, duration, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (itinerariesError) {
      console.error("Error fetching itineraries:", itinerariesError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "しおりデータの取得に失敗しました",
        },
        { status: 500 }
      );
    }

    // 統計情報を計算
    const stats = calculateUserStats(itineraries || []);

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

/**
 * しおりデータから統計情報を計算
 */
function calculateUserStats(
  itineraries: Array<{
    id: string;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
    duration: number | null;
    created_at: string;
  }>
): UserStats {
  // しおり総数
  const totalItineraries = itineraries.length;

  // 訪問国の抽出（重複除去）
  const countries = new Set<string>();
  const countryCount: Record<string, number> = {};

  itineraries.forEach((itinerary) => {
    if (itinerary.destination) {
      // 「東京、日本」のような形式から国名のみ抽出
      const parts = itinerary.destination.split(/[,、]/);
      const country = parts.length > 1 ? parts[parts.length - 1].trim() : itinerary.destination;
      countries.add(country);
      countryCount[country] = (countryCount[country] || 0) + 1;
    }
  });

  const totalCountries = countries.size;

  // 総旅行日数
  const totalDays = itineraries.reduce((sum, itinerary) => {
    return sum + (itinerary.duration || 0);
  }, 0);

  // 月別しおり作成数
  const monthlyCount: Record<string, number> = {};
  itineraries.forEach((itinerary) => {
    const date = new Date(itinerary.created_at);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyCount[month] = (monthlyCount[month] || 0) + 1;
  });

  const monthlyStats: MonthlyStats[] = Object.entries(monthlyCount)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  // 訪問国分布
  const countryDistribution: CountryDistribution[] = Object.entries(countryCount)
    .sort(([, a], [, b]) => b - a) // 件数の多い順
    .map(([country, count]) => ({
      country,
      count,
      percent: totalItineraries > 0 ? count / totalItineraries : 0,
    }));

  return {
    totalItineraries,
    totalCountries,
    totalDays,
    monthlyStats,
    countryDistribution,
  };
}
