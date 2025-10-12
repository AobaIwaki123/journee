import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { MyPageContent } from "@/components/mypage/MyPageContent";

/**
 * Phase 10.4: マイページ（DB統合版）
 * ユーザープロフィール、統計、クイックアクション、最近のしおりを表示
 * プルトゥリフレッシュ機能付き
 */

/**
 * マイページのメタデータを動的生成
 */
export async function generateMetadata(): Promise<Metadata> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      title: 'マイページ | Journee',
      description: 'ログインして旅のしおりを管理しましょう。',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${user.name}のマイページ | Journee`,
    description: `${user.name}の旅行記録とアクティビティ。作成したしおり、統計情報を確認できます。`,
    openGraph: {
      title: `${user.name}のマイページ | Journee`,
      description: `${user.name}の旅行記録`,
      type: 'profile',
      images: ['/api/og/default'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${user.name}のマイページ | Journee`,
      description: `${user.name}の旅行記録`,
      images: ['/api/og/default'],
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}
export default async function MyPage() {
  // 認証チェック（サーバーサイド）
  const user = await getCurrentUser();

  if (!user) {
    // 未認証の場合はログインページへリダイレクト
    redirect("/login");
  }

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

      {/* メインコンテンツ（プルトゥリフレッシュ付き） */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MyPageContent />
      </div>
    </div>
  );
}
