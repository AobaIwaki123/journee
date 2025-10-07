'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import { DaySchedule } from './DaySchedule';
import { MapView } from './MapView';
import { PlanningProgress } from './PlanningProgress';
import { QuickActions } from './QuickActions';
import { PhaseStatusBar } from './PhaseStatusBar';
import { ItineraryHeader } from './ItineraryHeader';
import { ItinerarySummary } from './ItinerarySummary';
import { EmptyItinerary } from './EmptyItinerary';
import { UndoRedoButtons } from './UndoRedoButtons';
import { TemplateSelector } from './TemplateSelector';
import { ToastContainer } from '@/components/ui/Toast';
import { Calendar, MapPin, FileDown, List, Map as MapIcon } from 'lucide-react';
import { TEMPLATES } from '@/types/template';
import { DaySchedule as DayScheduleType } from '@/types/itinerary';

type ViewMode = 'schedule' | 'map';

export const ItineraryPreview: React.FC = () => {
  const { 
    currentItinerary, 
    planningPhase, 
    isAutoProgressing, 
    autoProgressState,
    selectedTemplate 
  } = useStore();
  
  const template = TEMPLATES[selectedTemplate as keyof typeof TEMPLATES];
  const [viewMode, setViewMode] = useState<ViewMode>('schedule');

  // 位置情報を持つスポットがあるかチェック
  const hasLocations = currentItinerary?.schedule.some((day: DayScheduleType) =>
    day.spots.some(spot => spot.location?.lat && spot.location?.lng)
  ) || false;

  // 空状態: しおりがない場合
  if (!currentItinerary) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Phase 4: プランニング進捗（初期状態でも表示） */}
        {planningPhase !== 'initial' && <PlanningProgress />}

        {/* 空状態 */}
        <EmptyItinerary />

        {/* Phase 4: クイックアクション */}
        {planningPhase !== 'initial' && <QuickActions />}
      </div>
    );
  }

  return (
    <>
      {/* Toast Container */}
      <ToastContainer />

      <div className="h-full flex flex-col bg-gray-50 relative">
        {/* Phase 4.10.3: 自動進行中の進捗表示 */}
        {isAutoProgressing && autoProgressState && (
          <PhaseStatusBar state={autoProgressState} />
        )}
        
        {/* Phase 4: プランニング進捗（自動進行中でない場合のみ表示） */}
        {!isAutoProgressing && <PlanningProgress />}
        
        {/* メインコンテンツ（スクロール可能） */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{ 
            background: `linear-gradient(to bottom right, ${template.colors.background}, ${template.colors.background})`
          }}
        >
          {/* Header */}
          <ItineraryHeader itinerary={currentItinerary} editable={true} />

          {/* Content */}
          <div className="p-6 max-w-5xl mx-auto">
            {/* View Mode Switcher */}
            {hasLocations && currentItinerary.schedule && currentItinerary.schedule.length > 0 && (
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('schedule')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      viewMode === 'schedule'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span className="text-sm font-medium">スケジュール</span>
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      viewMode === 'map'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <MapIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">地図</span>
                  </button>
                </div>

                {/* Undo/Redo Buttons */}
                {viewMode === 'schedule' && <UndoRedoButtons />}
              </div>
            )}

            {/* Undo/Redo Buttons (when no map mode available) */}
            {!hasLocations && currentItinerary.schedule && currentItinerary.schedule.length > 0 && (
              <div className="flex justify-end mb-4">
                <UndoRedoButtons />
              </div>
            )}

            {/* Template Selector */}
            {viewMode === 'schedule' && currentItinerary.schedule && currentItinerary.schedule.length > 0 && (
              <TemplateSelector />
            )}

            {/* Summary */}
            {viewMode === 'schedule' && currentItinerary.schedule && currentItinerary.schedule.length > 0 && (
              <ItinerarySummary itinerary={currentItinerary} />
            )}

            {/* Map View */}
            {viewMode === 'map' && hasLocations && (
              <div className="mb-6">
                <MapView 
                  days={currentItinerary.schedule} 
                  height="600px"
                />
              </div>
            )}

            {/* Days (Schedule View) */}
            {viewMode === 'schedule' && currentItinerary.schedule && currentItinerary.schedule.length > 0 ? (
              <div className="space-y-6">
                {currentItinerary.schedule.map((day: DayScheduleType, index: number) => (
                  <DaySchedule 
                    key={day.day} 
                    day={day} 
                    dayIndex={index}
                    editable={true}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-600 text-lg font-medium mb-2">
                  スケジュールがまだ作成されていません
                </p>
                <p className="text-sm text-gray-500">
                  AIチャットで「〇日目の詳細を教えて」と聞いてみましょう
                </p>
              </div>
            )}

            {/* PDF Export Button */}
            {viewMode === 'schedule' && currentItinerary.schedule.length > 0 && planningPhase === 'completed' && (
              <div className="mt-10 mb-6 flex justify-center">
                <button
                  className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  onClick={() => alert('PDF出力機能はPhase 5.3で実装予定です')}
                >
                  <FileDown className="w-6 h-6 group-hover:animate-bounce" />
                  <span className="text-lg font-semibold">PDFで保存</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Phase 4: クイックアクション（自動進行中でない場合のみ表示） */}
        {!isAutoProgressing && <QuickActions />}
      </div>
    </>
  );
};