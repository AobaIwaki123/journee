"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Calendar, MapPin, Clock, Trash2, FileText } from "lucide-react";
import { ItineraryData, ItineraryListItem } from "@/types/itinerary";

interface ItineraryCardProps {
  itinerary: ItineraryData | ItineraryListItem;
  variant?: 'default' | 'compact';
  showActions?: boolean;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
}

/**
 * 統合されたしおりカードコンポーネント
 * - サムネイル、タイトル、目的地、期間、ステータスバッジを表示
 * - variantで表示スタイルを切り替え
 * - showActionsでアクションボタンの表示/非表示を制御
 */
export const ItineraryCard: React.FC<ItineraryCardProps> = ({
  itinerary,
  variant = 'default',
  showActions = true,
  onDelete,
  onClick,
}) => {
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);

  // ItineraryDataとItineraryListItemの両方に対応
  const thumbnailUrl = 'thumbnailUrl' in itinerary ? itinerary.thumbnailUrl : undefined;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`「${itinerary.title}」を削除しますか？`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/itinerary/delete?id=${itinerary.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete itinerary");
      }

      onDelete?.(itinerary.id);
    } catch (error) {
      console.error("Failed to delete itinerary:", error);
      alert(error instanceof Error ? error.message : "削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePdfExport = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    alert("PDF出力機能は Phase 5.3 で実装予定です");
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(itinerary.id);
    }
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
      if (variant === 'compact') {
        return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
      }
      return date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // 相対時間表示（compactバリアント用）
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今日';
    if (days === 1) return '昨日';
    if (days < 7) return `${days}日前`;
    if (days < 30) return `${Math.floor(days / 7)}週間前`;
    return `${Math.floor(days / 30)}ヶ月前`;
  };

  const linkHref = variant === 'compact' 
    ? `/itineraries/${itinerary.id}` 
    : `/?itineraryId=${itinerary.id}`;

  // Compactバリアント
  if (variant === 'compact') {
    return (
      <Link
        href={linkHref}
        onClick={handleClick}
        className="group block bg-white rounded-lg shadow-md overflow-hidden transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
      >
        {/* サムネイル画像 */}
        <div className="relative h-48 bg-gray-200 overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
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
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(itinerary.status)}`}>
              {getStatusLabel(itinerary.status)}
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
                {formatDate(itinerary.startDate)} - {formatDate(itinerary.endDate)}
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
  }

  // Defaultバリアント
  return (
    <Link href={linkHref} onClick={handleClick}>
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
          {'duration' in itinerary && itinerary.duration && (
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <Clock className="w-4 h-4 mr-1.5" />
              <span>{itinerary.duration}日間</span>
            </div>
          )}

          {/* 概要 */}
          {'summary' in itinerary && itinerary.summary && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
              {itinerary.summary}
            </p>
          )}

          {/* クイックアクション */}
          {showActions && (
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
              {session?.user && onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="削除"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  {isDeleting ? "削除中..." : "削除"}
                </button>
              )}
            </div>
          )}
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
