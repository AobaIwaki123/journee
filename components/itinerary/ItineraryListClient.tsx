'use client';

import React from 'react';
import { ItineraryList } from '@/components/itinerary/ItineraryList';
import { ItineraryFilters } from '@/components/itinerary/ItineraryFilters';
import { ItinerarySortMenu } from '@/components/itinerary/ItinerarySortMenu';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';

/**
 * しおり一覧ページ（クライアント側コンポーネント）
 * Phase 10.1: サーバーコンポーネント化に伴い、クライアント側ロジックを分離
 * 
 * - フィルター機能
 * - ソート機能
 * - グリッドレイアウト（レスポンシブ）
 */
export const ItineraryListClient: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                ホームへ戻る
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">
                しおり一覧
              </h1>
            </div>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              新規作成
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* フィルター */}
        <ItineraryFilters />

        {/* ソートメニュー */}
        <ItinerarySortMenu />

        {/* しおり一覧 */}
        <ItineraryList />
      </main>
    </div>
  );
};
