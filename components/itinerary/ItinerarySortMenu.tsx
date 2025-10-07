'use client';

import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import type { ItinerarySortField } from '@/lib/store/useStore';

/**
 * しおりソートメニューコンポーネント
 * - ソートフィールド選択（更新日、作成日、タイトル、旅行開始日）
 * - 昇順/降順切り替え
 */
export const ItinerarySortMenu: React.FC = () => {
  const { itinerarySort, setItinerarySort } = useStore();

  const sortOptions: { value: ItinerarySortField; label: string }[] = [
    { value: 'updatedAt', label: '更新日' },
    { value: 'createdAt', label: '作成日' },
    { value: 'title', label: 'タイトル' },
    { value: 'startDate', label: '旅行開始日' },
  ];

  const handleFieldChange = (field: ItinerarySortField) => {
    setItinerarySort({
      ...itinerarySort,
      field,
    });
  };

  const handleOrderToggle = () => {
    setItinerarySort({
      ...itinerarySort,
      order: itinerarySort.order === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <ArrowUpDown className="w-5 h-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">並び替え:</span>
      </div>

      {/* ソートフィールド選択 */}
      <div className="flex gap-2">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleFieldChange(option.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              itinerarySort.field === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* 昇順/降順切り替え */}
      <button
        onClick={handleOrderToggle}
        className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        title={itinerarySort.order === 'asc' ? '昇順' : '降順'}
      >
        {itinerarySort.order === 'asc' ? (
          <>
            <ArrowUp className="w-4 h-4 mr-1" />
            昇順
          </>
        ) : (
          <>
            <ArrowDown className="w-4 h-4 mr-1" />
            降順
          </>
        )}
      </button>
    </div>
  );
};