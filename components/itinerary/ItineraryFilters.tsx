'use client';

import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useItineraryUIStore } from '@/lib/store/itinerary';

/**
 * Phase 6.2: しおりフィルターコンポーネント
 * useItineraryUIStoreを活用してストアスライスに移行
 * - ステータスフィルター
 * - 目的地検索
 * - 期間フィルター
 */
export const ItineraryFilters: React.FC = () => {
  const { filter, setFilter, resetFilters } = useItineraryUIStore();

  const [searchTerm, setSearchTerm] = useState(filter.destination || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleStatusChange = (status: 'all' | 'draft' | 'completed' | 'archived') => {
    setFilter({
      ...filter,
      status,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setFilter({
      ...filter,
      destination: value,
    });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({
      ...filter,
      startDate: e.target.value,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({
      ...filter,
      endDate: e.target.value,
    });
  };

  const handleReset = () => {
    setSearchTerm('');
    resetFilters();
    setShowAdvanced(false);
  };

  const hasActiveFilters =
    filter.status !== 'all' ||
    filter.destination ||
    filter.startDate ||
    filter.endDate;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      {/* 基本フィルター */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        {/* 検索バー */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="目的地で検索..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* ステータスフィルター */}
        <div className="flex gap-2">
          <button
            onClick={() => handleStatusChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter.status === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => handleStatusChange('draft')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter.status === 'draft'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            下書き
          </button>
          <button
            onClick={() => handleStatusChange('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter.status === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            完成
          </button>
          <button
            onClick={() => handleStatusChange('archived')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter.status === 'archived'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            アーカイブ
          </button>
        </div>

        {/* 詳細フィルタートグル */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          <Filter className="w-4 h-4" />
          <span>詳細</span>
        </button>

        {/* リセットボタン */}
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
          >
            <X className="w-4 h-4" />
            <span>リセット</span>
          </button>
        )}
      </div>

      {/* 詳細フィルター */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                出発日（開始）
              </label>
              <input
                type="date"
                value={filter.startDate || ''}
                onChange={handleStartDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                出発日（終了）
              </label>
              <input
                type="date"
                value={filter.endDate || ''}
                onChange={handleEndDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
