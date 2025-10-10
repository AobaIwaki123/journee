/**
 * Phase 9.4: DayScheduleHeader
 * 
 * 日程ヘッダー（日付・テーマ・統計・折りたたみボタン）
 */

'use client';

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DayScheduleHeaderProps {
  day: number;
  theme?: string;
  date?: string;
  dayOfWeek: string;
  status?: 'draft' | 'skeleton' | 'detailed' | 'completed';
  spotCount: number;
  totalCost?: number;
  currency?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const DayScheduleHeader: React.FC<DayScheduleHeaderProps> = ({
  day,
  theme,
  date,
  dayOfWeek,
  status,
  spotCount,
  totalCost,
  currency,
  isExpanded,
  onToggleExpand,
}) => {
  // ステータスバッジ
  const getStatusBadge = () => {
    if (!status) return null;

    const badges = {
      draft: { label: '下書き', color: 'bg-gray-100 text-gray-600' },
      skeleton: { label: '骨組み', color: 'bg-yellow-100 text-yellow-700' },
      detailed: { label: '詳細化済み', color: 'bg-blue-100 text-blue-700' },
      completed: { label: '完成', color: 'bg-green-100 text-green-700' },
    };

    const badge = badges[status];
    if (!badge) return null;

    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <button
      onClick={onToggleExpand}
      className="w-full flex items-center justify-between p-4 md:p-6 hover:bg-gray-50 transition-colors text-left"
    >
      <div className="flex items-center flex-1">
        {/* Day Badge */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-10 h-10 md:w-14 md:h-14 flex items-center justify-center font-bold text-sm md:text-lg mr-3 md:mr-4 shadow-md flex-shrink-0">
          Day{day}
        </div>

        {/* Day Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-gray-900 text-base md:text-lg truncate">
              {theme || `${day}日目`}
            </h3>
            {getStatusBadge()}
          </div>
          
          {date && (
            <p className="text-xs md:text-sm text-gray-600">
              {new Date(date).toLocaleDateString('ja-JP', {
                month: 'long',
                day: 'numeric',
              })} {dayOfWeek}
            </p>
          )}
          
          <div className="text-xs text-gray-500 mt-1">
            {spotCount}箇所
            {totalCost !== undefined && totalCost > 0 && (
              <> · 予算 {totalCost.toLocaleString()}{currency || '円'}</>
            )}
          </div>
        </div>
      </div>

      {/* Expand/Collapse Icon */}
      {isExpanded ? (
        <ChevronUp className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
      )}
    </button>
  );
};
