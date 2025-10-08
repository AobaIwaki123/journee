'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import { getRandomTip, type TravelTip } from '@/lib/tips/travel-tips';
import { Lightbulb } from 'lucide-react';

/**
 * Phase 3.5.3: 待機中のTips表示コンポーネント
 * 
 * LLM応答待ち時間中に旅行の豆知識やアプリの使い方を表示
 */

interface WaitingTipsProps {
  /** ローテーション間隔（ミリ秒、デフォルト: 5000ms = 5秒） */
  rotationInterval?: number;
  /** 最初に表示するTip（指定がない場合はランダム） */
  initialTip?: TravelTip;
}

const WaitingTips: React.FC<WaitingTipsProps> = ({
  rotationInterval = 5000,
  initialTip,
}) => {
  const { loadingState, setCurrentTip } = useStore();
  const [currentDisplayTip, setCurrentDisplayTip] = useState<TravelTip>(
    initialTip || getRandomTip()
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Tipsのローテーション
  useEffect(() => {
    const interval = setInterval(() => {
      // フェードアウトアニメーション開始
      setIsTransitioning(true);

      // アニメーション完了後に新しいTipを表示
      setTimeout(() => {
        const newTip = getRandomTip();
        setCurrentDisplayTip(newTip);
        setCurrentTip(newTip.content);
        setIsTransitioning(false);
      }, 300); // フェードアウト時間
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [rotationInterval, setCurrentTip]);

  // Zustand storeにも現在のTipを保存
  useEffect(() => {
    setCurrentTip(currentDisplayTip.content);
  }, [currentDisplayTip, setCurrentTip]);

  // カテゴリー別のアイコン色
  const getCategoryColor = (category: TravelTip['category']) => {
    switch (category) {
      case 'travel':
        return 'text-blue-500 bg-blue-100 dark:bg-blue-900';
      case 'planning':
        return 'text-green-500 bg-green-100 dark:bg-green-900';
      case 'app':
        return 'text-purple-500 bg-purple-100 dark:bg-purple-900';
      case 'fun':
        return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-900';
    }
  };

  // カテゴリー別のラベル
  const getCategoryLabel = (category: TravelTip['category']) => {
    switch (category) {
      case 'travel':
        return '旅行の豆知識';
      case 'planning':
        return '計画のコツ';
      case 'app':
        return 'アプリの使い方';
      case 'fun':
        return '楽しい豆知識';
      default:
        return 'Tips';
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-5 border border-blue-100 dark:border-gray-600">
      <div className="flex items-start space-x-3">
        {/* アイコン */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getCategoryColor(
            currentDisplayTip.category
          )}`}
        >
          <Lightbulb className="w-5 h-5" />
        </div>

        {/* コンテンツ */}
        <div className="flex-1">
          {/* カテゴリーラベル */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              {getCategoryLabel(currentDisplayTip.category)}
            </span>
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"
                />
              ))}
            </div>
          </div>

          {/* Tipコンテンツ */}
          <p
            className={`text-sm text-gray-700 dark:text-gray-200 transition-opacity duration-300 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {currentDisplayTip.content}
          </p>

          {/* プログレスバー */}
          <div className="mt-3 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              style={{
                animation: `progress ${rotationInterval}ms linear infinite`,
              }}
            />
          </div>
        </div>
      </div>

      {/* プログレスバーアニメーション */}
      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

WaitingTips.displayName = 'WaitingTips';

export default WaitingTips;
