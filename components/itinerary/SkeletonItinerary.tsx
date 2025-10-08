'use client';

import React from 'react';

/**
 * Phase 3.5.3: しおりスケルトンUIコンポーネント
 * 
 * しおり生成中に表示するスケルトンスクリーン
 */

interface SkeletonItineraryProps {
  /** 表示する日程数（デフォルト: 3） */
  dayCount?: number;
  /** 各日のスポット数（デフォルト: 4） */
  spotsPerDay?: number;
}

/**
 * スケルトンバー（パルスアニメーション付き）
 */
const SkeletonBar: React.FC<{ width?: string; height?: string }> = ({
  width = 'w-full',
  height = 'h-4',
}) => (
  <div className={`${width} ${height} bg-gray-200 dark:bg-gray-700 rounded animate-pulse`} />
);

/**
 * ヘッダースケルトン
 */
const SkeletonHeader: React.FC = () => (
  <div className="mb-8 animate-fadeIn">
    {/* タイトル */}
    <SkeletonBar width="w-3/4" height="h-8" />
    <div className="mt-4 space-y-2">
      <SkeletonBar width="w-1/2" height="h-5" />
      <SkeletonBar width="w-2/5" height="h-5" />
    </div>
  </div>
);

/**
 * サマリースケルトン
 */
const SkeletonSummary: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6 animate-fadeIn">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <SkeletonBar width="w-1/2" height="h-4" />
          <div className="mt-2">
            <SkeletonBar width="w-3/4" height="h-6" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * スポットカードスケルトン
 */
const SkeletonSpotCard: React.FC<{ delay?: number }> = ({ delay = 0 }) => (
  <div
    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-fadeIn"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-start space-x-4">
      {/* アイコン */}
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0 animate-pulse" />

      {/* コンテンツ */}
      <div className="flex-1 space-y-3">
        {/* タイトル */}
        <SkeletonBar width="w-3/4" height="h-5" />

        {/* 時刻・所要時間 */}
        <div className="flex items-center space-x-4">
          <SkeletonBar width="w-20" height="h-4" />
          <SkeletonBar width="w-24" height="h-4" />
        </div>

        {/* 説明 */}
        <div className="space-y-2">
          <SkeletonBar width="w-full" height="h-3" />
          <SkeletonBar width="w-5/6" height="h-3" />
        </div>

        {/* 費用 */}
        <SkeletonBar width="w-1/4" height="h-4" />
      </div>
    </div>
  </div>
);

/**
 * 日程スケルトン
 */
const SkeletonDaySchedule: React.FC<{ dayNumber: number; spotsCount: number }> = ({
  dayNumber,
  spotsCount,
}) => (
  <div className="mb-8 animate-fadeIn" style={{ animationDelay: `${dayNumber * 100}ms` }}>
    {/* 日付ヘッダー */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center animate-pulse">
          <span className="text-xl font-bold text-gray-400">
            {dayNumber}
          </span>
        </div>
        <div>
          <SkeletonBar width="w-32" height="h-5" />
          <div className="mt-1">
            <SkeletonBar width="w-24" height="h-4" />
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <SkeletonBar width="w-20" height="h-4" />
        <SkeletonBar width="w-24" height="h-4" />
      </div>
    </div>

    {/* スポットカード */}
    <div className="space-y-3 ml-8">
      {Array.from({ length: spotsCount }).map((_, i) => (
        <SkeletonSpotCard key={i} delay={i * 50} />
      ))}
    </div>
  </div>
);

/**
 * しおりスケルトンUI（メインコンポーネント）
 */
const SkeletonItinerary: React.FC<SkeletonItineraryProps> = ({
  dayCount = 3,
  spotsPerDay = 4,
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6 h-full overflow-y-auto">
      {/* ヘッダースケルトン */}
      <SkeletonHeader />

      {/* サマリースケルトン */}
      <SkeletonSummary />

      {/* 日程スケルトン */}
      <div className="space-y-8">
        {Array.from({ length: dayCount }).map((_, i) => (
          <SkeletonDaySchedule
            key={i}
            dayNumber={i + 1}
            spotsCount={spotsPerDay}
          />
        ))}
      </div>

      {/* ローディングメッセージ */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center space-x-2 text-gray-500 dark:text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm">しおりを作成中...</span>
        </div>
      </div>
    </div>
  );
};

SkeletonItinerary.displayName = 'SkeletonItinerary';

export default SkeletonItinerary;
