'use client';

import React from 'react';

/**
 * Phase 3.5.3: 汎用プログレスバーコンポーネント
 * 
 * リニア・円形の2種類のプログレスバーを提供
 */

interface LinearProgressProps {
  /** 進捗率（0-100） */
  progress: number;
  /** 高さ */
  height?: 'sm' | 'md' | 'lg';
  /** カラー */
  color?: 'blue' | 'green' | 'purple' | 'gradient';
  /** ラベル表示 */
  showLabel?: boolean;
  /** アニメーション有効化 */
  animated?: boolean;
}

interface CircularProgressProps {
  /** 進捗率（0-100） */
  progress: number;
  /** サイズ（px） */
  size?: number;
  /** 線の太さ（px） */
  strokeWidth?: number;
  /** カラー */
  color?: 'blue' | 'green' | 'purple' | 'gradient';
  /** 中央ラベル */
  label?: string;
}

/**
 * リニアプログレスバー
 */
export const LinearProgress: React.FC<LinearProgressProps> = ({
  progress,
  height = 'md',
  color = 'gradient',
  showLabel = false,
  animated = true,
}) => {
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    gradient: 'bg-gradient-to-r from-blue-500 to-purple-500',
  };

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      <div
        className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${heightClasses[height]}`}
      >
        <div
          className={`${heightClasses[height]} ${colorClasses[color]} rounded-full ${
            animated ? 'transition-all duration-300 ease-out' : ''
          }`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
};

LinearProgress.displayName = 'LinearProgress';

/**
 * 円形プログレスバー
 */
export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 80,
  strokeWidth = 6,
  color = 'gradient',
  label,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedProgress / 100) * circumference;

  const colorMap = {
    blue: '#3B82F6',
    green: '#10B981',
    purple: '#8B5CF6',
    gradient: 'url(#gradient)',
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* グラデーション定義 */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>

        {/* 背景円 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />

        {/* 進捗円 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorMap[color]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>

      {/* 中央ラベル */}
      <div className="absolute inset-0 flex items-center justify-center">
        {label ? (
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {label}
          </span>
        ) : (
          <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>
    </div>
  );
};

CircularProgress.displayName = 'CircularProgress';
