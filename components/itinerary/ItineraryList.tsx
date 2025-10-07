'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ItineraryData } from '@/types/itinerary';
import { ItineraryCard } from './ItineraryCard';
import { useStore } from '@/lib/store/useStore';
import { loadItinerariesFromStorage, initializeMockData } from '@/lib/mock-data/itineraries';
import { FileText } from 'lucide-react';

/**
 * しおり一覧コンポーネント
 * - グリッドレイアウト（レスポンシブ）
 * - フィルター・ソート適用
 * - 空状態の表示
 */
export const ItineraryList: React.FC = () => {
  const [itineraries, setItineraries] = useState<ItineraryData[]>([]);
  const { itineraryFilter, itinerarySort } = useStore();

  // 初回読み込み
  useEffect(() => {
    initializeMockData();
    loadItineraries();
  }, []);

  const loadItineraries = () => {
    const data = loadItinerariesFromStorage();
    setItineraries(data);
  };

  // 削除時のコールバック
  const handleDelete = () => {
    loadItineraries(); // 再読み込み
  };

  // フィルター適用
  const filteredItineraries = useMemo(() => {
    let result = [...itineraries];

    // ステータスフィルター
    if (itineraryFilter.status && itineraryFilter.status !== 'all') {
      result = result.filter((item) => item.status === itineraryFilter.status);
    }

    // 目的地フィルター
    if (itineraryFilter.destination) {
      const searchTerm = itineraryFilter.destination.toLowerCase();
      result = result.filter((item) =>
        item.destination.toLowerCase().includes(searchTerm)
      );
    }

    // 開始日フィルター
    if (itineraryFilter.startDate) {
      result = result.filter(
        (item) =>
          item.startDate && item.startDate >= itineraryFilter.startDate!
      );
    }

    // 終了日フィルター
    if (itineraryFilter.endDate) {
      result = result.filter(
        (item) => item.endDate && item.endDate <= itineraryFilter.endDate!
      );
    }

    return result;
  }, [itineraries, itineraryFilter]);

  // ソート適用
  const sortedItineraries = useMemo(() => {
    const result = [...filteredItineraries];

    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (itinerarySort.field) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'startDate':
          aValue = a.startDate || '';
          bValue = b.startDate || '';
          break;
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'updatedAt':
        default:
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
      }

      if (itinerarySort.order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [filteredItineraries, itinerarySort]);

  // 空状態
  if (sortedItineraries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          しおりがありません
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          {itineraryFilter.status !== 'all' ||
          itineraryFilter.destination ||
          itineraryFilter.startDate ||
          itineraryFilter.endDate
            ? 'フィルター条件に一致するしおりがありません。条件を変更してください。'
            : 'AIとチャットして、あなただけの旅のしおりを作成しましょう。'}
        </p>
        {itineraryFilter.status === 'all' &&
          !itineraryFilter.destination &&
          !itineraryFilter.startDate &&
          !itineraryFilter.endDate && (
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              しおりを作成する
            </a>
          )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {sortedItineraries.map((itinerary) => (
        <ItineraryCard
          key={itinerary.id}
          itinerary={itinerary}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};