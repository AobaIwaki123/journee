'use client';

import React, { useState } from 'react';
import { ArrowUpDown, Check } from 'lucide-react';
import { useItineraryUIStore } from '@/lib/store/itinerary';
import type { ItinerarySortField, ItinerarySortOrder } from '@/lib/store/useStore';

/**
 * Phase 6.2: しおりソートメニュー
 * useItineraryUIStoreに移行済み
 */
export const ItinerarySortMenu: React.FC = () => {
  const { sort, setSort } = useItineraryUIStore();
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions: { field: ItinerarySortField; label: string }[] = [
    { field: 'updatedAt', label: '更新日時' },
    { field: 'createdAt', label: '作成日時' },
    { field: 'title', label: 'タイトル' },
    { field: 'startDate', label: '開始日' },
  ];

  const handleSort = (field: ItinerarySortField) => {
    const newOrder: ItinerarySortOrder = 
      sort.field === field && sort.order === 'desc' ? 'asc' : 'desc';
    
    setSort({ field, order: newOrder });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <ArrowUpDown className="w-4 h-4" />
        <span className="text-sm">並び替え</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-2 space-y-1">
              {sortOptions.map(({ field, label }) => (
                <button
                  key={field}
                  onClick={() => handleSort(field)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="text-sm text-gray-700">{label}</span>
                  <div className="flex items-center gap-1">
                    {sort.field === field && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                    {sort.field === field && (
                      <span className="text-xs text-gray-500">
                        {sort.order === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
