'use client';

import React from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { usePullToRefresh, PullToRefreshOptions } from '@/lib/hooks/usePullToRefresh';

interface PullToRefreshProps extends PullToRefreshOptions {
  children: React.ReactNode;
}

/**
 * プルトゥリフレッシュコンポーネント
 * 
 * モバイルデバイスで下に引っ張ることでコンテンツを再読み込みできる機能を提供します。
 * 
 * @example
 * ```tsx
 * <PullToRefresh onRefresh={async () => { await loadData(); }}>
 *   <YourContent />
 * </PullToRefresh>
 * ```
 */
export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  pullDownThreshold = 80,
  disabled = false,
  maxPullDistance = 150,
}) => {
  const { pullDistance, isRefreshing, canRelease } = usePullToRefresh({
    onRefresh,
    pullDownThreshold,
    disabled,
    maxPullDistance,
  });

  // プルダウンインジケーターの高さとopacityを計算
  const indicatorHeight = isRefreshing ? 60 : Math.min(pullDistance, maxPullDistance);
  const indicatorOpacity = Math.min(indicatorHeight / pullDownThreshold, 1);

  // アイコンの回転角度（プル距離に応じて回転）
  const iconRotation = canRelease ? 180 : (pullDistance / pullDownThreshold) * 180;

  return (
    <div className="relative">
      {/* プルダウンインジケーター */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-gradient-to-b from-blue-50 to-transparent transition-all duration-200"
        style={{
          height: `${indicatorHeight}px`,
          opacity: indicatorOpacity,
          pointerEvents: 'none',
        }}
      >
        <div
          className="flex flex-col items-center justify-center gap-2 transition-transform duration-200"
          style={{
            transform: `translateY(${Math.max(0, indicatorHeight - 60)}px)`,
          }}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <p className="text-sm text-blue-600 font-medium">更新中...</p>
            </>
          ) : (
            <>
              <div
                className="transition-transform duration-200"
                style={{ transform: `rotate(${iconRotation}deg)` }}
              >
                <ArrowDown
                  className={`w-6 h-6 ${
                    canRelease ? 'text-blue-600' : 'text-gray-400'
                  }`}
                />
              </div>
              <p
                className={`text-sm font-medium transition-colors duration-200 ${
                  canRelease ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {canRelease ? '離して更新' : '引っ張って更新'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* コンテンツ */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: isRefreshing
            ? 'translateY(60px)'
            : `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
