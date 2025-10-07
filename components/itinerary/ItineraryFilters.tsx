'use client';

import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';

/**
 * しおりフィルターコンポーネント
 * - ステータスフィルター
 * - 目的地検索
 * - 期間フィルター
 */
export const ItineraryFilters: React.FC = () => {
  const { itineraryFilter, setItineraryFilter, resetItineraryFilters } =
    useStore();

  const [searchTerm, setSearchTerm] = useState(
    itineraryFilter.destination || ''
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleStatusChange = (status: 'all' | 'draft' | 'completed' | 'archived') => {
    setItineraryFilter({
      ...itineraryFilter,
      status,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setItineraryFilter({
      ...itineraryFilter,
      destination: value,
    });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItineraryFilter({
      ...itineraryFilter,
      startDate: e.target.value,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItineraryFilter({
      ...itineraryFilter,
      endDate: e.target.value,
    });
  };

  const handleReset = () => {
    setSearchTerm('');
    resetItineraryFilters();
    setShowAdvanced(false);
  };

  const hasActiveFilters =
    itineraryFilter.status !== 'all' ||
    itineraryFilter.destination ||
    itineraryFilter.startDate ||
    itineraryFilter.endDate;

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
              itineraryFilter.status === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => handleStatusChange('draft')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              itineraryFilter.status === 'draft'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            下書き
          </button>
          <button
            onClick={() => handleStatusChange('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              itineraryFilter.status === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            完成
          </button>
          <button
            onClick={() => handleStatusChange('archived')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              itineraryFilter.status === 'archived'
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
          className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Filter className="w-4 h-4 mr-2" />
          詳細
        </button>

        {/* リセットボタン */}
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="inline-flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            リセット
          </button>
        )}
      </div>

      {/* 詳細フィルター */}
      {showAdvanced && (
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 開始日フィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始日（以降）
              </label>
              <input
                type="date"
                value={itineraryFilter.startDate || ''}
                onChange={handleStartDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 終了日フィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了日（以前）
              </label>
              <input
                type="date"
                value={itineraryFilter.endDate || ''}
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