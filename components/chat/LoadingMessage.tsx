'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/useStore';

/**
 * Phase 3.5.3: ローディングメッセージコンポーネント
 * 
 * AIからの応答を待っている間に表示するタイピングアニメーション
 */

interface LoadingMessageProps {
  /** カスタムメッセージ（指定がない場合はstageに応じた自動メッセージ） */
  message?: string;
  /** アニメーションの速度（ミリ秒） */
  speed?: number;
}

const LoadingMessage: React.FC<LoadingMessageProps> = ({
  message,
  speed = 500,
}) => {
  const { loadingState } = useStore();
  const [dots, setDots] = useState('');

  // ドットアニメーション（...）
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, speed);

    return () => clearInterval(interval);
  }, [speed]);

  // ステージに応じたデフォルトメッセージ
  const getDefaultMessage = () => {
    switch (loadingState.stage) {
      case 'thinking':
        return '🤔 AIが考えています';
      case 'streaming':
        return '✍️ しおりを作成中';
      case 'finalizing':
        return '✨ 最終調整中';
      default:
        return '⏳ 処理中';
    }
  };

  const displayMessage = message || getDefaultMessage();

  return (
    <div className="flex items-start space-x-3 animate-fadeIn">
      {/* AIアバター */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
        <span className="text-white text-sm">AI</span>
      </div>

      {/* メッセージカード */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-700 p-4 max-w-2xl">
        <div className="flex items-center space-x-2">
          {/* タイピングインジケーター */}
          <div className="flex space-x-1">
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>

          {/* メッセージテキスト */}
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            {displayMessage}
            <span className="inline-block w-6 text-left">{dots}</span>
          </span>
        </div>

        {/* 予想待ち時間 */}
        {loadingState.estimatedWaitTime > 0 && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            あと約 {loadingState.estimatedWaitTime} 秒で完了します
          </div>
        )}

        {/* プログレスバー（ストリーミング中のみ） */}
        {loadingState.stage === 'streaming' && loadingState.streamProgress > 0 && (
          <div className="mt-3">
            <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-300 ease-out"
                style={{ width: `${loadingState.streamProgress}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
              {Math.round(loadingState.streamProgress)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

LoadingMessage.displayName = 'LoadingMessage';

export default LoadingMessage;
