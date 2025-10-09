/**
 * PDF出力専用レイアウトコンポーネント
 *
 * 印刷・PDF出力に最適化されたしおりレイアウト
 * - A4サイズに最適化
 * - 印刷用カラースキーム
 * - ページ分割を考慮したレイアウト
 */

"use client";

import React from "react";
import type { ItineraryData } from "@/types/itinerary";
import {
  Calendar,
  MapPin,
  Wallet,
  Users,
  Camera,
  Utensils,
  Car,
  Hotel,
  Sparkles,
} from "lucide-react";
import { formatDate as formatDateUtil } from "@/lib/utils/date-utils";

interface ItineraryPDFLayoutProps {
  itinerary: ItineraryData;
}

export const ItineraryPDFLayout: React.FC<ItineraryPDFLayoutProps> = ({
  itinerary,
}) => {
  // カテゴリー別アイコン
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "sightseeing":
        return <Camera className="w-5 h-5" />;
      case "dining":
        return <Utensils className="w-5 h-5" />;
      case "transportation":
        return <Car className="w-5 h-5" />;
      case "accommodation":
        return <Hotel className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  // 日付フォーマット
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div
      className="pdf-layout bg-white text-gray-900 font-sans"
      style={{ width: "210mm", minHeight: "297mm", padding: "15mm" }}
    >
      {/* ヘッダー */}
      <header className="mb-8 border-b-2 border-gray-800 pb-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {itinerary.title}
        </h1>
        <div className="flex items-center gap-6 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">{itinerary.destination}</span>
          </div>
          {itinerary.startDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {formatDate(itinerary.startDate)}
                {itinerary.endDate && ` - ${formatDate(itinerary.endDate)}`}
              </span>
            </div>
          )}
          {itinerary.duration && (
            <div className="flex items-center gap-2">
              <span>{itinerary.duration}日間</span>
            </div>
          )}
        </div>
      </header>

      {/* サマリー */}
      {itinerary.summary && (
        <section className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">旅行概要</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            {itinerary.summary}
          </p>
        </section>
      )}

      {/* 予算情報 */}
      {itinerary.totalBudget && (
        <section className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-5 h-5 text-blue-700" />
            <h2 className="text-lg font-semibold text-blue-900">総予算</h2>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            ¥{itinerary.totalBudget.toLocaleString()}
          </p>
        </section>
      )}

      {/* 日程表 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
          日程表
        </h2>
        {itinerary.schedule.map((day) => (
          <div key={day.day} className="break-inside-avoid">
            {/* 日付ヘッダー */}
            <div className="bg-gray-800 text-white px-4 py-3 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  {day.day}日目
                  {day.date && ` - ${formatDate(day.date)}`}
                </h3>
                {day.theme && (
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    {day.theme}
                  </span>
                )}
              </div>
            </div>

            {/* スポット一覧 */}
            <div className="border border-gray-300 border-t-0 rounded-b-lg p-4 space-y-3">
              {day.spots.map((spot) => (
                <div
                  key={spot.id}
                  className="flex gap-3 pb-3 border-b border-gray-200 last:border-b-0 last:pb-0"
                >
                  {/* アイコン */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-700">
                    {getCategoryIcon(spot.category || "other")}
                  </div>

                  {/* 詳細 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-base font-semibold text-gray-900">
                        {spot.name}
                      </h4>
                      {spot.scheduledTime && (
                        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          {spot.scheduledTime}
                        </span>
                      )}
                    </div>
                    {spot.description && (
                      <p className="text-sm text-gray-600 mb-1">
                        {spot.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {spot.duration && <span>滞在: {spot.duration}分</span>}
                      {spot.estimatedCost && (
                        <span className="font-medium text-blue-700">
                          ¥{spot.estimatedCost.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {spot.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        {spot.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* 日別サマリー */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-300 text-sm">
                {day.totalDistance && (
                  <span className="text-gray-600">
                    総移動距離:{" "}
                    <span className="font-semibold">{day.totalDistance}km</span>
                  </span>
                )}
                {day.totalCost && (
                  <span className="text-blue-700 font-semibold">
                    1日の予算: ¥{day.totalCost.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* フッター */}
      <footer className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>Journee - AIとともに旅のしおりを作成</p>
        <p className="mt-1">
          作成日: {formatDateUtil(itinerary.createdAt, "short")}
        </p>
      </footer>
    </div>
  );
};
