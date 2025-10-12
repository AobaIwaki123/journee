"use client";

import React from "react";
import Link from "next/link";
import { Calendar, MapPin, FileText, Clock } from "lucide-react";
import type { ItineraryListItem } from "@/types/itinerary";

interface ItineraryCardProps {
  itinerary: ItineraryListItem;
}

/**
 * しおりカードコンポーネント
 * サムネイル、タイトル、目的地、期間、ステータスバッジを表示
 */
export const ItineraryCard: React.FC<ItineraryCardProps> = ({ itinerary }) => {
  // ステータスバッジのスタイル
  const getStatusBadge = (status: ItineraryListItem["status"]) => {
    const styles = {
      draft: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      archived: "bg-gray-100 text-gray-800",
      published: "bg-blue-100 text-blue-800",
    };
    const labels = {
      draft: "下書き",
      completed: "完成",
      archived: "アーカイブ",
      published: "公開中",
    };
    return { style: styles[status], label: labels[status] };
  };

  const statusBadge = getStatusBadge(itinerary.status);

  // 日付のフォーマット
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  };

  // 更新日の相対表示
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "今日";
    if (days === 1) return "昨日";
    if (days < 7) return `${days}日前`;
    if (days < 30) return `${Math.floor(days / 7)}週間前`;
    return `${Math.floor(days / 30)}ヶ月前`;
  };

  return (
    <Link
      href={`/itineraries/${itinerary.id}`}
      className="group block bg-white rounded-lg shadow-md overflow-hidden transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
    >
      {/* サムネイル画像 */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {itinerary.thumbnailUrl ? (
          <img
            src={itinerary.thumbnailUrl}
            alt={itinerary.title}
            className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
            <FileText className="w-16 h-16 text-gray-400" />
          </div>
        )}
        {/* ステータスバッジ */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.style}`}
          >
            {statusBadge.label}
          </span>
        </div>
      </div>

      {/* カード内容 */}
      <div className="p-4">
        {/* タイトル */}
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {itinerary.title}
        </h3>

        {/* 目的地 */}
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm line-clamp-1">{itinerary.destination}</span>
        </div>

        {/* 期間 */}
        {itinerary.startDate && itinerary.endDate && (
          <div className="flex items-center gap-2 text-gray-600 mb-3">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">
              {formatDate(itinerary.startDate)} -{" "}
              {formatDate(itinerary.endDate)}
            </span>
          </div>
        )}

        {/* 更新日 */}
        <div className="flex items-center gap-2 text-gray-500 text-xs border-t border-gray-100 pt-3">
          <Clock className="w-3 h-3" />
          <span>{getRelativeTime(itinerary.updatedAt)}に更新</span>
        </div>
      </div>
    </Link>
  );
};
