/**
 * Google Maps表示コンポーネント（リファクタリング版）
 */

"use client";

import React, { useRef, useState } from "react";
import { DaySchedule } from "@/types/itinerary";
import { MapPin, AlertCircle } from "lucide-react";
import { useGoogleMapsLoader } from "@/lib/hooks/useGoogleMapsLoader";
import { useMapInstance } from "@/lib/hooks/useMapInstance";
import { useMapMarkers } from "@/lib/hooks/useMapMarkers";
import { useMapRoute } from "@/lib/hooks/useMapRoute";
import { MapDaySelector } from "./map/MapDaySelector";
import { prepareMarkerData, calculateMapCenter } from "@/lib/utils/map-utils";

// Google Maps API型定義
declare global {
  interface Window {
    google: typeof google;
  }
}

interface MapViewProps {
  days: DaySchedule[];
  selectedDay?: number;
  height?: string;
  showDaySelector?: boolean; // 日程選択UIを表示するか
  numberingMode?: "global" | "perDay"; // 番号付けモード
}

/**
 * Phase 12.1: MapView（メモ化版）
 */
export const MapView = React.memo<MapViewProps>(({
  days,
  selectedDay: initialSelectedDay,
  height = "400px",
  showDaySelector = true,
  numberingMode = "perDay",
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedDay, setSelectedDay] = useState(initialSelectedDay);

  // Google Maps API読み込み
  const { isLoaded, error } = useGoogleMapsLoader();

  // マーカーデータ準備
  const markerData = prepareMarkerData(days, selectedDay, numberingMode);
  const spots = markerData.map((m) => m.spot);

  // 地図の中心とズーム計算
  const center = calculateMapCenter(spots);
  const zoom = spots.length > 1 ? 12 : 14;

  // 地図インスタンス作成
  const map = useMapInstance(mapRef, isLoaded, center, zoom);

  // マーカー表示
  useMapMarkers({
    map,
    markerData,
    numberingMode,
    showDay: selectedDay === undefined, // 全日程表示時のみ日程を表示
  });

  // ルート描画（単一日程選択時のみ）
  useMapRoute(map, spots, selectedDay !== undefined);

  // エラー表示
  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-gray-100 rounded-lg border border-gray-300"
        style={{ height }}
      >
        <AlertCircle className="w-12 h-12 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">{error}</p>
        <p className="text-xs text-gray-500 mt-1">
          環境変数に NEXT_PUBLIC_GOOGLE_MAPS_API_KEY を設定してください
        </p>
      </div>
    );
  }

  // スポットなし表示
  if (spots.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-gray-100 rounded-lg border border-gray-300"
        style={{ height }}
      >
        <MapPin className="w-12 h-12 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          位置情報が設定されたスポットがありません
        </p>
        <p className="text-xs text-gray-500 mt-1">
          AIチャットで「地図に表示したい」と伝えて位置情報を追加してみましょう
        </p>
      </div>
    );
  }

  // ローディング表示
  if (!isLoaded) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300"
        style={{ height }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {showDaySelector && days.length > 1 && (
        <MapDaySelector
          days={days}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      )}
      <div className="relative rounded-lg overflow-hidden border border-gray-300 shadow-md">
        <div ref={mapRef} style={{ height }} />
        {selectedDay !== undefined && (
          <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md">
            <p className="text-sm font-semibold text-gray-700">
              Day {selectedDay}
            </p>
            <p className="text-xs text-gray-500">{spots.length} スポット</p>
          </div>
        )}
      </div>
    </div>
  );
};
