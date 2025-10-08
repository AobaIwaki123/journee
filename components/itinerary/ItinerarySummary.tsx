"use client";

import React, { memo, useMemo, useState, useEffect } from "react";
import { Wallet, Calendar, TrendingUp } from "lucide-react";
import { ItineraryData } from "@/types/itinerary";
import { formatCurrency } from "@/lib/utils/currency";

interface ItinerarySummaryProps {
  itinerary: ItineraryData;
}

export const ItinerarySummary: React.FC<ItinerarySummaryProps> = memo(
  ({ itinerary }) => {
    const [createdDate, setCreatedDate] = useState<string>("");
    const [updatedDate, setUpdatedDate] = useState<string>("");

    // クライアントサイドで日付をフォーマット（ハイドレーションエラー回避）
    useEffect(() => {
      if (itinerary.createdAt) {
        setCreatedDate(
          new Date(itinerary.createdAt).toLocaleDateString("ja-JP")
        );
      }
      if (itinerary.updatedAt) {
        setUpdatedDate(
          new Date(itinerary.updatedAt).toLocaleDateString("ja-JP")
        );
      }
    }, [itinerary.createdAt, itinerary.updatedAt]);

    // 総移動距離を計算
    const totalDistance = useMemo(
      () =>
        itinerary.schedule.reduce(
          (sum, day) => sum + (day.totalDistance || 0),
          0
        ),
      [itinerary.schedule]
    );

    // 総費用を計算（各スポットのestimatedCostから直接計算）
    const totalCost = useMemo(
      () =>
        itinerary.schedule.reduce((sum, day) => {
          const dayCost = day.spots.reduce(
            (daySum, spot) => daySum + (spot.estimatedCost || 0),
            0
          );
          return sum + dayCost;
        }, 0),
      [itinerary.schedule]
    );

    // スポット総数を計算
    const totalSpots = useMemo(
      () => itinerary.schedule.reduce((sum, day) => sum + day.spots.length, 0),
      [itinerary.schedule]
    );

    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          旅程サマリー
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 総予算 */}
          {(itinerary.totalBudget || totalCost > 0) && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  総予算
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(
                  itinerary.totalBudget || totalCost,
                  itinerary.currency
                )}
              </div>
              {itinerary.totalBudget &&
                totalCost > 0 &&
                totalCost !== itinerary.totalBudget && (
                  <div className="text-xs text-blue-600 mt-1">
                    使用予定: {formatCurrency(totalCost, itinerary.currency)}
                  </div>
                )}
            </div>
          )}

          {/* 訪問スポット数 */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">
                訪問スポット
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {totalSpots}箇所
            </div>
            <div className="text-xs text-purple-600 mt-1">
              {itinerary.schedule.length}日間の旅程
            </div>
          </div>

          {/* 総移動距離 */}
          {totalDistance > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  総移動距離
                </span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {totalDistance.toFixed(1)}km
              </div>
              <div className="text-xs text-green-600 mt-1">
                1日平均:{" "}
                {(totalDistance / itinerary.schedule.length).toFixed(1)}km
              </div>
            </div>
          )}
        </div>

        {/* ステータス情報 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
            {createdDate && <div>作成日: {createdDate}</div>}
            {updatedDate && <div>最終更新: {updatedDate}</div>}
          </div>
        </div>
      </div>
    );
  }
);

ItinerarySummary.displayName = "ItinerarySummary";
