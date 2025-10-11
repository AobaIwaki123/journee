/**
 * Phase 9.4: DayScheduleHeader（UI強化版）
 */

'use client';

import React from 'react';
import { ChevronDown, ChevronUp, MapPin, Wallet, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';

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
      draft: { label: '下書き', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: null },
      skeleton: { label: '骨組み', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Sparkles },
      detailed: { label: '詳細化済み', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: MapPin },
      completed: { label: '完成', color: 'bg-green-100 text-green-700 border-green-300', icon: null },
    };

    const badge = badges[status];
    if (!badge) return null;

    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border ${badge.color}`}>
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {badge.label}
      </span>
    );
  };

  return (
    <button
      onClick={onToggleExpand}
      className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all text-left border-b border-gray-100"
    >
      <div className="flex items-center flex-1 gap-4">
        {/* Day Badge - より目立つデザイン */}
        <div className="relative flex-shrink-0">
          <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white rounded-2xl w-12 h-12 md:w-16 md:h-16 flex items-center justify-center font-bold text-base md:text-xl shadow-lg">
            <span className="text-xs md:text-sm absolute -top-1 -right-1 bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center font-bold shadow">
              {day}
            </span>
            <Sparkles className="w-6 h-6 md:w-8 md:h-8" />
          </div>
        </div>

        {/* Day Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="font-bold text-gray-900 text-lg md:text-xl">
              {theme || `${day}日目`}
            </h3>
            {getStatusBadge()}
          </div>
          
          {date && (
            <p className="text-sm md:text-base text-gray-600 mb-2">
              📅 {new Date(date).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })} {dayOfWeek}
            </p>
          )}
          
          {/* 統計情報 - より視覚的に */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="font-medium">{spotCount}</span>
              <span className="text-gray-500">箇所</span>
            </div>
            {totalCost !== undefined && totalCost > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Wallet className="w-4 h-4 text-green-500" />
                  <span className="font-semibold text-green-600">
                    {formatCurrency(totalCost, currency)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expand/Collapse Icon */}
      <div className="ml-4 flex-shrink-0">
        {isExpanded ? (
          <ChevronUp className="w-6 h-6 text-gray-400" />
        ) : (
          <ChevronDown className="w-6 h-6 text-gray-400" />
        )}
      </div>
    </button>
  );
};
