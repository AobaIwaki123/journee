'use client';

import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';

/**
 * Phase 4.9.3: 全体進捗表示コンポーネント
 * バッチ処理の進捗状況を視覚化
 */

export interface BatchProgressData {
  completedDays: number[];
  processingDays: number[];
  errorDays: number[];
  totalDays: number;
  progressRate: number;
  estimatedTimeRemaining?: number; // 秒
}

interface BatchProgressProps {
  progress: BatchProgressData;
  onClose?: () => void;
}

export const BatchProgress: React.FC<BatchProgressProps> = ({ progress, onClose }) => {
  const { completedDays, processingDays, errorDays, totalDays, progressRate, estimatedTimeRemaining } = progress;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `約${seconds}秒`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `約${minutes}分`;
    }
    return `約${minutes}分${remainingSeconds}秒`;
  };

  const isComplete = progressRate === 100;
  const hasErrors = errorDays.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {isComplete ? '詳細化完了' : '日程詳細化中'}
        </h3>
        {isComplete && onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="閉じる"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* プログレスバー */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {completedDays.length} / {totalDays} 日完了
          </span>
          <span className="text-sm font-medium text-gray-900">{progressRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              hasErrors ? 'bg-yellow-500' : isComplete ? 'bg-green-500' : 'bg-blue-600'
            }`}
            style={{ width: `${progressRate}%` }}
          />
        </div>
        {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
          <div className="flex items-center mt-2 text-xs text-gray-600">
            <Clock className="w-3 h-3 mr-1" />
            <span>残り時間: {formatTime(estimatedTimeRemaining)}</span>
          </div>
        )}
      </div>

      {/* ステータス表示 */}
      <div className="space-y-3">
        {/* 完了した日 */}
        {completedDays.length > 0 && (
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">完了</p>
              <p className="text-xs text-gray-600">
                {completedDays.sort((a, b) => a - b).map(d => `${d}日目`).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* 処理中の日 */}
        {processingDays.length > 0 && (
          <div className="flex items-start space-x-2">
            <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">処理中</p>
              <p className="text-xs text-gray-600">
                {processingDays.sort((a, b) => a - b).map(d => `${d}日目`).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* エラーが発生した日 */}
        {errorDays.length > 0 && (
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">エラー</p>
              <p className="text-xs text-gray-600">
                {errorDays.sort((a, b) => a - b).map(d => `${d}日目`).join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 完了メッセージ */}
      {isComplete && (
        <div className={`mt-4 p-3 rounded-lg ${
          hasErrors ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'
        }`}>
          <p className={`text-sm font-medium ${
            hasErrors ? 'text-yellow-900' : 'text-green-900'
          }`}>
            {hasErrors 
              ? `${completedDays.length}日の詳細化が完了しました。${errorDays.length}日でエラーが発生しました。`
              : 'すべての日程の詳細化が完了しました！'
            }
          </p>
        </div>
      )}
    </div>
  );
};