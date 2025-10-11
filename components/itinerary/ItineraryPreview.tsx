/**
 * Phase 8: しおりプレビューコンポーネント（再構成版）
 * 
 * 巨大なreturnブロックを小さなコンポーネントに分割し、
 * 組み合わせることで構成可能にしました
 */

"use client";

import React, { useState } from "react";
import { useItineraryStore, useItineraryProgressStore } from "@/lib/store/itinerary";
import { PhaseStatusBar } from "./PhaseStatusBar";
import { EmptyItinerary } from "./EmptyItinerary";
import { ToastContainer } from "@/components/ui/Toast";
import { ItineraryContentArea } from "./preview";

type ViewMode = "schedule" | "map";

/**
 * Phase 12.1: ItineraryPreview（メモ化版）
 */
export const ItineraryPreview = React.memo(() => {
  const { currentItinerary } = useItineraryStore();
  const { isAutoProgressing, autoProgressState } = useItineraryProgressStore();
  const [viewMode, setViewMode] = useState<ViewMode>("schedule");
  
  // 位置情報を持つスポットがあるかチェック
  const hasLocations =
    currentItinerary?.schedule.some((day) =>
      day.spots.some((spot) => spot.location?.lat && spot.location?.lng)
    ) || false;
  
  // 空状態: しおりがない場合
  if (!currentItinerary) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <EmptyItinerary />
      </div>
    );
  }
  
  return (
    <>
      <ToastContainer />
      
      <div className="h-full flex flex-col bg-gray-50 relative">
        {/* 自動進行中の進捗表示 */}
        {isAutoProgressing && autoProgressState && (
          <div className="hidden md:block">
            <PhaseStatusBar state={autoProgressState} />
          </div>
        )}
        
        {/* メインコンテンツ */}
        <ItineraryContentArea
          itinerary={currentItinerary}
          viewMode={viewMode}
          hasLocations={hasLocations}
          onViewModeChange={setViewMode}
        />
      </div>
    </>
  );
});

ItineraryPreview.displayName = 'ItineraryPreview';
