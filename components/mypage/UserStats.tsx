"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FileText } from "lucide-react";
import type { UserStats as UserStatsType } from "@/types/itinerary";
import { toSafeDate } from "@/lib/utils/date-utils";

interface UserStatsProps {
  stats: UserStatsType;
}

/**
 * ユーザー統計コンポーネント
 * しおり総数、月別しおり作成数グラフを表示
 */
export const UserStats: React.FC<UserStatsProps> = ({ stats }) => {
  // 月別データの整形（月名を表示用に変換）
  const monthlyData = stats.monthlyStats.map(
    (item: { month: string; count: number }) => ({
      ...item,
      monthLabel:
        toSafeDate(item.month + "-01")?.toLocaleDateString("ja-JP", {
          month: "short",
        }) || item.month,
    })
  );

  return (
    <div className="space-y-6">
      {/* 統計サマリー */}
      <div className="grid grid-cols-1 gap-4">
        {/* しおり総数 */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">
                しおり総数
              </p>
              <p className="text-3xl font-bold">{stats.totalItineraries}</p>
            </div>
            <FileText className="w-12 h-12 text-blue-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* グラフエリア */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          月別しおり作成数
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="monthLabel"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 12 }}
              stroke="#9ca3af"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              labelStyle={{ color: "#374151", fontWeight: 600 }}
              cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
