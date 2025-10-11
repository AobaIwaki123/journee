"use client";

import React from "react";
import { ItineraryCard } from "./ItineraryCard";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useItineraryList } from "@/lib/hooks/itinerary";
import { FileText, Loader2 } from "lucide-react";

/**
 * Phase 6.1: しおり一覧コンポーネント
 * useItineraryList Hookを活用してロジックを分離
 */
export const ItineraryList: React.FC = () => {
  const {
    itineraries,
    isLoading,
    error,
    filter,
    refresh,
    deleteItinerary,
  } = useItineraryList();

  // ローディング状態
  if (isLoading && itineraries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">しおりを読み込み中...</p>
      </div>
    );
  }

  // エラー状態
  if (error && itineraries.length === 0) {
    return (
      <PullToRefresh onRefresh={refresh}>
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <FileText className="w-16 h-16 text-red-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            エラーが発生しました
          </h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            {error}
          </p>
          <button
            onClick={() => refresh()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            再読み込み
          </button>
        </div>
      </PullToRefresh>
    );
  }

  // 空状態
  if (itineraries.length === 0) {
    return (
      <PullToRefresh onRefresh={refresh}>
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <FileText className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            しおりがありません
          </h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            {filter.status !== "all" ||
            filter.destination ||
            filter.startDate ||
            filter.endDate
              ? "フィルター条件に一致するしおりがありません。条件を変更してください。"
              : "AIとチャットして、あなただけの旅のしおりを作成しましょう。"}
          </p>
          {filter.status === "all" &&
            !filter.destination &&
            !filter.startDate &&
            !filter.endDate && (
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                しおりを作成する
              </a>
            )}
        </div>
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={refresh}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {itineraries.map((itinerary) => (
          <ItineraryCard
            key={itinerary.id}
            itinerary={itinerary}
            onDelete={deleteItinerary}
          />
        ))}
      </div>
    </PullToRefresh>
  );
};
