import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { itineraryRepository } from "@/lib/db/itinerary-repository";
import type { UserStatsResponse } from "@/types/auth";

/**
 * GET /api/user/stats
 *
 * 現在ログインしているユーザーの統計情報を取得するAPI
 * - しおり総数
 * - 月別しおり作成推移（直近6ヶ月）
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

    // レスポンスを構築
    const stats: UserStatsResponse = {
      totalItineraries,
      monthlyStats,
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
