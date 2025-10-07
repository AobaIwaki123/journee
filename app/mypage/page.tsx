import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { UserProfile } from "@/components/mypage/UserProfile";
import { UserStats } from "@/components/mypage/UserStats";
import { QuickActions } from "@/components/mypage/QuickActions";
import { ItineraryCard } from "@/components/mypage/ItineraryCard";
import { getMockUserStats } from "@/lib/mock-data/user-stats";
import { getMockRecentItineraries } from "@/lib/mock-data/recent-itineraries";

/**
 * マイページ
 * ユーザープロフィール、統計、クイックアクション、最近のしおりを表示
 */
export default async function MyPage() {
  // 認証チェック
  const user = await getCurrentUser();

  if (!user) {
    // 未認証の場合はログインページへリダイレクト
    redirect("/login");
  }

  // セッション情報の取得（UserProfileコンポーネント用）
  const session = {
    user,
    expires: "", // 必要に応じて実際の有効期限を設定
  };

  // モックデータの取得
  const userStats = getMockUserStats();
  const recentItineraries = getMockRecentItineraries();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">マイページ</h1>
              <p className="mt-2 text-gray-600">
                あなたの旅行記録とアクティビティ
              </p>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>しおり作成に戻る</span>
            </Link>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* プロフィールセクション */}
          <UserProfile session={session} />

          {/* 統計セクション */}
          <UserStats stats={userStats} />

          {/* クイックアクション */}
          <QuickActions />

          {/* 最近のしおりセクション */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                最近のしおり
              </h2>
              <a
                href="/itineraries"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
              >
                すべて見る →
              </a>
            </div>

            {recentItineraries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentItineraries.map((itinerary) => (
                  <ItineraryCard key={itinerary.id} itinerary={itinerary} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">まだしおりがありません</p>
                <a
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  新しいしおりを作成
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
