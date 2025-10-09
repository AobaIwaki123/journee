"use client";

import React from "react";
import Link from "next/link";
import { Calendar, MapPin, Clock, Trash2, FileText } from "lucide-react";
import { ItineraryData } from "@/types/itinerary";
import { deleteItinerary } from "@/lib/mock-data/itineraries";

interface ItineraryCardProps {
  itinerary: ItineraryData;
  onDelete?: (id: string) => void;
}

/**
 * しおりカードコンポーネント
 * - サムネイル、タイトル、目的地、期間、ステータスバッジを表示
 * - クイックアクション（開く、PDF出力、削除）
 */
export const ItineraryCard: React.FC<ItineraryCardProps> = ({
  itinerary,
  onDelete,
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm(`「${itinerary.title}」を削除しますか？`)) {
      deleteItinerary(itinerary.id);
      onDelete?.(itinerary.id);
    }
  };

  const handlePdfExport = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    alert("PDF出力機能は Phase 5.3 で実装予定です");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "完成";
      case "draft":
        return "下書き";
      case "archived":
        return "アーカイブ";
      default:
        return status;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "未定";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Link href={`/?itineraryId=${itinerary.id}`}>
      <div className="group relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer">
        {/* サムネイル */}
        <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative">
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-white/80" />
          </div>
          {/* ステータスバッジ */}
          <div className="absolute top-3 right-3">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                itinerary.status
              )}`}
            >
              {getStatusLabel(itinerary.status)}
            </span>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-4">
          {/* タイトル */}
          <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {itinerary.title}
          </h3>

          {/* 目的地 */}
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin className="w-4 h-4 mr-1.5" />
            <span>{itinerary.destination}</span>
          </div>

          {/* 期間 */}
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Calendar className="w-4 h-4 mr-1.5" />
            <span>
              {formatDate(itinerary.startDate)} 〜{" "}
              {formatDate(itinerary.endDate)}
            </span>
          </div>

          {/* 日数 */}
          {itinerary.duration && (
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <Clock className="w-4 h-4 mr-1.5" />
              <span>{itinerary.duration}日間</span>
            </div>
          )}

          {/* 概要 */}
          {itinerary.summary && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
              {itinerary.summary}
            </p>
          )}

          {/* クイックアクション */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex gap-2">
              <button
                onClick={handlePdfExport}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                title="PDF出力"
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                PDF
              </button>
            </div>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
              title="削除"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              削除
            </button>
          </div>
        </div>

        {/* 更新日時 */}
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400">
            更新: {itinerary.updatedAt.toLocaleDateString("ja-JP")}
          </p>
        </div>
      </div>
    </Link>
  );
};
