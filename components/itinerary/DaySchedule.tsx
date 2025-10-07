"use client";

import React, { useState, memo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { DaySchedule as DayScheduleType } from "@/types/itinerary";
import { SpotCard } from "./SpotCard";
import { EditableSpotCard } from "./EditableSpotCard";
import { AddSpotForm } from "./AddSpotForm";
import { useStore } from "@/lib/store/useStore";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Wallet,
  Sparkles,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

interface DayScheduleProps {
  day: DayScheduleType;
  dayIndex: number;
  editable?: boolean;
  /** Phase 4.9.4: 再試行コールバック */
  onRetry?: (dayNumber: number) => void;
}

// 日付から曜日を取得
const getDayOfWeek = (dateString?: string): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    const daysOfWeek = ["日", "月", "火", "水", "木", "金", "土"];
    return `(${daysOfWeek[date.getDay()]})`;
  } catch {
    return "";
  }
};

export const DaySchedule: React.FC<DayScheduleProps> = memo(
  ({ day, dayIndex, editable = true, onRetry }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const reorderSpots = useStore((state) => state.reorderSpots);
    const addToast = useStore((state) => state.addToast);

    const dayOfWeek = getDayOfWeek(day.date);

    // Phase 4: ステータスに応じたバッジ表示
    const getStatusBadge = () => {
      if (!day.status) return null;

      const badges = {
        draft: { label: "下書き", color: "bg-gray-100 text-gray-600" },
        skeleton: { label: "骨組み", color: "bg-yellow-100 text-yellow-700" },
        detailed: { label: "詳細化済み", color: "bg-blue-100 text-blue-700" },
        completed: { label: "完成", color: "bg-green-100 text-green-700" },
      };

      const badge = badges[day.status];
      if (!badge) return null;

      return (
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}
        >
          {badge.label}
        </span>
      );
    };

    const handleDragEnd = (result: DropResult) => {
      if (!result.destination) return;

      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;

      if (sourceIndex === destinationIndex) return;

      reorderSpots(dayIndex, sourceIndex, destinationIndex);
      addToast("スポットの順序を変更し、時刻を自動調整しました", "info");
    };

    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
        {/* Header - クリックで展開/折りたたみ */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center flex-1">
            {/* Day Badge */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center font-bold text-lg mr-4 shadow-md flex-shrink-0">
              Day{day.day}
            </div>

            {/* Day Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-gray-800">
                  {day.title || `${day.day}日目`}
                </h3>
                {getStatusBadge()}
              </div>
              {day.date && (
                <p className="text-sm text-gray-500 mt-1">
                  {day.date} {dayOfWeek}
                </p>
              )}
              {/* Phase 4: テーマ表示 */}
              {day.theme && (
                <p className="text-sm text-blue-600 mt-1 flex items-center">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {day.theme}
                </p>
              )}
            </div>
          </div>

          {/* Day Summary */}
          <div className="flex items-center gap-4 mr-4">
            {day.totalCost !== undefined && day.totalCost > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                <Wallet className="w-4 h-4 text-blue-600" />
                <div className="text-right">
                  <p className="text-xs text-gray-500">予算</p>
                  <p className="font-semibold text-blue-600 text-sm">
                    ¥{day.totalCost.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            {day.totalDistance !== undefined && day.totalDistance > 0 && (
              <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <div className="text-right">
                  <p className="text-xs text-gray-500">移動</p>
                  <p className="font-semibold text-green-600 text-sm">
                    {day.totalDistance}km
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Expand/Collapse Icon */}
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-6 h-6 text-gray-400" />
            ) : (
              <ChevronDown className="w-6 h-6 text-gray-400" />
            )}
          </div>
        </button>

        {/* Content - アコーディオン */}
        {isExpanded && (
          <div className="px-6 pb-6 border-t border-gray-100">
            {/* Phase 4.9.3: ローディング状態・エラー表示 */}
            {day.isLoading && (
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 mt-4">
                <div className="flex items-center justify-center space-x-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">
                      詳細化中...
                    </p>
                    {day.progress !== undefined && day.progress > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${day.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-blue-700 mt-1">
                          {day.progress}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {day.error && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200 mt-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">
                      エラーが発生しました
                    </p>
                    <p className="text-xs text-red-700 mt-1">{day.error}</p>
                  </div>
                  {onRetry && (
                    <button
                      onClick={() => onRetry(day.day)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>再試行</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Spots with Timeline */}
            {!day.isLoading && !day.error && day.spots.length > 0 ? (
              <div className="relative pl-8 pt-4">
                {/* Timeline Line */}
                <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-transparent" />

                {/* Spots - with Drag & Drop */}
                {editable ? (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId={`day-${dayIndex}`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`space-y-6 ${
                            snapshot.isDraggingOver
                              ? "bg-blue-50/50 rounded-lg p-2"
                              : ""
                          }`}
                        >
                          {day.spots.map((spot, index) => (
                            <Draggable
                              key={spot.id}
                              draggableId={spot.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="relative"
                                  style={{
                                    ...provided.draggableProps.style,
                                    opacity: snapshot.isDragging ? 0.8 : 1,
                                  }}
                                >
                                  {/* Timeline Dot */}
                                  <div className="absolute -left-8 top-5 w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-md flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                  </div>

                                  {/* Drag Handle & Spot Card */}
                                  <div {...provided.dragHandleProps}>
                                    <EditableSpotCard
                                      spot={spot}
                                      dayIndex={dayIndex}
                                      spotIndex={index}
                                    />
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                ) : (
                  <div className="space-y-6">
                    {day.spots.map((spot, index) => (
                      <div key={spot.id} className="relative">
                        {/* Timeline Dot */}
                        <div className="absolute -left-8 top-5 w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-md flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>

                        {/* Spot Card */}
                        <SpotCard spot={spot} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Spot Form */}
                {editable && (
                  <div className="mt-6">
                    <AddSpotForm dayIndex={dayIndex} />
                  </div>
                )}
              </div>
            ) : !day.isLoading && !day.error ? (
              <div className="p-8 bg-gray-50 rounded-lg text-center text-gray-500 text-sm mt-4">
                {day.status === "skeleton" ? (
                  <div className="text-gray-600 text-sm">
                    <Sparkles className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                    <p className="font-medium">骨組みが決まりました</p>
                    <p className="text-xs text-gray-500 mt-1">
                      次のステップで具体的なスケジュールを作成します
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">
                      この日のスケジュールはまだ設定されていません
                    </p>
                    <p className="text-xs mt-1">
                      AIチャットで詳細を追加できます
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);

DaySchedule.displayName = "DaySchedule";
