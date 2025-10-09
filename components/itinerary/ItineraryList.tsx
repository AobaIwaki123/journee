"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { ItineraryData } from "@/types/itinerary";
import { ItineraryCard } from "./ItineraryCard";
import { useStore } from "@/lib/store/useStore";
import {
  loadItinerariesFromStorage,
  initializeMockData,
} from "@/lib/mock-data/itineraries";
import { FileText, Loader2 } from "lucide-react";

/**
 * Phase 10.4: しおり一覧コンポーネント（DB統合版）
 * 
 * ログイン時: データベースから取得
 * 未ログイン時: LocalStorageから取得（従来通り）
 */
export const ItineraryList: React.FC = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [itineraries, setItineraries] = useState<ItineraryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { itineraryFilter, itinerarySort } = useStore();

  // しおり一覧を読み込む
  const loadItineraries = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (session?.user) {
        // ログイン時: データベースから取得
        const response = await fetch('/api/itinerary/list');
        if (!response.ok) {
          throw new Error('Failed to load itineraries from database');
        }

        const data = await response.json();
        
        // Date型に変換
        const itinerariesWithDates = (data.itineraries || []).map((item: any) => ({
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          publishedAt: item.publishedAt ? new Date(item.publishedAt) : undefined,
        }));
        
        setItineraries(itinerariesWithDates);
      } else {
        // 未ログイン時: LocalStorageから取得
        initializeMockData();
        const data = loadItinerariesFromStorage();
        setItineraries(data);
      }
    } catch (err) {
      console.error('Failed to load itineraries:', err);
      setError('しおりの読み込みに失敗しました');
      
      // エラー時はLocalStorageにフォールバック
      initializeMockData();
      const data = loadItinerariesFromStorage();
      setItineraries(data);
    } finally {
      setIsLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    if (sessionStatus !== 'loading') {
      loadItineraries();
    }
  }, [session, sessionStatus]);

  const handleDelete = () => {
    loadItineraries();
  };

  // フィルター適用
  const filteredItineraries = useMemo(() => {
    let result = [...itineraries];

    // ステータスフィルター
    if (itineraryFilter.status && itineraryFilter.status !== "all") {
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
        (item) => item.startDate && item.startDate >= itineraryFilter.startDate!
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
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "startDate":
          aValue = a.startDate || "";
          bValue = b.startDate || "";
          break;
        case "createdAt":
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case "updatedAt":
        default:
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
      }

      if (itinerarySort.order === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [filteredItineraries, itinerarySort]);

  // ローディング状態
  if (isLoading) {
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
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <FileText className="w-16 h-16 text-red-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          エラーが発生しました
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6">{error}</p>
        <button
          onClick={() => loadItineraries()}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          再読み込み
        </button>
      </div>
    );
  }

  // 空状態
  if (sortedItineraries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          しおりがありません
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          {itineraryFilter.status !== "all" ||
          itineraryFilter.destination ||
          itineraryFilter.startDate ||
          itineraryFilter.endDate
            ? "フィルター条件に一致するしおりがありません。条件を変更してください。"
            : "AIとチャットして、あなただけの旅のしおりを作成しましょう。"}
        </p>
        {itineraryFilter.status === "all" &&
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
