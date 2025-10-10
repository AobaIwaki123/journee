'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserProfile } from '@/components/mypage/UserProfile';
import { UserStats } from '@/components/mypage/UserStats';
import { ItineraryCard } from '@/components/mypage/ItineraryCard';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { getMockUserStats } from '@/lib/mock-data/user-stats';
import { getMockRecentItineraries } from '@/lib/mock-data/recent-itineraries';
import { itineraryRepository } from '@/lib/db/itinerary-repository';
import type { ItineraryListItem } from '@/types/itinerary';
import { Loader2 } from 'lucide-react';

/**
 * マイページのメインコンテンツ（クライアントコンポーネント）
 * プルトゥリフレッシュ機能を含む
 */
export const MyPageContent: React.FC = () => {
  const { data: session, status } = useSession();
  const [recentItineraries, setRecentItineraries] = useState<ItineraryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState(getMockUserStats());

  // データを読み込む関数
  const loadData = async () => {
    if (!session?.user) {
      // 未ログイン時はモックデータを使用
      setRecentItineraries(getMockRecentItineraries());
      setUserStats(getMockUserStats());
      setIsLoading(false);
      return;
    }

    try {
      const result = await itineraryRepository.listItineraries(
        session.user.id,
        {},
        'updated_at',
        'desc',
        { page: 1, pageSize: 6 }
      );
      setRecentItineraries(result.data);
      
      // TODO: 将来的にDBから統計情報を計算する
      setUserStats(getMockUserStats());
    } catch (error) {
      console.error('Failed to load recent itineraries:', error);
      // エラー時はモックデータにフォールバック
      setRecentItineraries(getMockRecentItineraries());
    } finally {
      setIsLoading(false);
    }
  };

  // リフレッシュ処理
  const handleRefresh = async () => {
    await loadData();
  };

  // 初回読み込み
  useEffect(() => {
    if (status !== 'loading') {
      loadData();
    }
  }, [session, status]);

  // ローディング状態
  if (status === 'loading' || (isLoading && !recentItineraries.length)) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-8">
        {/* プロフィールセクション */}
        {session && <UserProfile session={session} />}

        {/* 統計セクション */}
        <UserStats stats={userStats} />

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
    </PullToRefresh>
  );
};
