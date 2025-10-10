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
import { ShareButton } from './ShareButton';
import { SaveButton } from './SaveButton';
import { ResetButton } from './ResetButton';
import { PDFExportButton } from './PDFExportButton';
import { ToastContainer } from '@/components/ui/Toast';
import { List, Map as MapIcon } from 'lucide-react';
import { DaySchedule as DayScheduleType } from '@/types/itinerary';
import { MobilePlannerControls } from './MobilePlannerControls';

type ViewMode = 'schedule' | 'map';

export const ItineraryPreview: React.FC = () => {
  const { 
    currentItinerary, 
    planningPhase, 
    isAutoProgressing, 
    autoProgressState
  } = useStore();
  
  const [viewMode, setViewMode] = useState<ViewMode>('schedule');

  // 位置情報を持つスポットがあるかチェック
  const hasLocations = currentItinerary?.schedule.some((day: DayScheduleType) =>
    day.spots.some(spot => spot.location?.lat && spot.location?.lng)
  ) || false;

  // 空状態: しおりがない場合
  if (!currentItinerary) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <div className="hidden md:block">
          {planningPhase !== 'initial' && <PlanningProgress />}
        </div>
        <MobilePlannerControls />

        {/* 空状態 */}
        <EmptyItinerary />

        {/* Phase 4: クイックアクション */}
        {planningPhase !== 'initial' && (
          <div className="hidden md:block">
            <QuickActions />
          </div>
        )}
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
          <div className="hidden md:block">
            <PhaseStatusBar state={autoProgressState} />
          </div>
        )}

        {/* Phase 4: プランニング進捗（自動進行中でない場合のみ表示） */}
        {!isAutoProgressing && (
          <div className="hidden md:block">
            <PlanningProgress />
          </div>
        )}

        <MobilePlannerControls />
        
        {/* メインコンテンツ（スクロール可能） */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {/* Header */}
          <ItineraryHeader itinerary={currentItinerary} editable={true} />

          {/* Content */}
          <div className="p-4 md:p-6 max-w-5xl mx-auto">
            {/* Action Buttons & View Mode Switcher */}
            {currentItinerary.schedule && currentItinerary.schedule.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  {/* View Mode Switcher (only if has locations) */}
                  {hasLocations ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewMode('schedule')}
                        className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg transition-colors ${
                          viewMode === 'schedule'
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <List className="w-4 h-4" />
                        <span className="text-xs md:text-sm font-medium">スケジュール</span>
                      </button>
                      <button
                        onClick={() => setViewMode('map')}
                        className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg transition-colors ${
                          viewMode === 'map'
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <MapIcon className="w-4 h-4" />
                        <span className="text-xs md:text-sm font-medium">地図</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      <ShareButton />
                      <SaveButton />
                      <ResetButton />
                    </div>
                  )}

                  {/* Action Buttons (right side) */}
                  <div className="flex flex-wrap gap-2 md:gap-3 items-center">
                    {hasLocations && (
                      <>
                        <ShareButton />
                        <SaveButton />
                        <ResetButton />
                      </>
                    )}
                    <UndoRedoButtons />
                  </div>
                </div>
              </div>
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
            ) : viewMode === 'schedule' ? (
              <div className="bg-white rounded-lg shadow-sm p-6 md:p-12 text-center">
                <p className="text-gray-600 text-base md:text-lg font-medium mb-2">
                  スケジュールがまだ作成されていません
                </p>
                <p className="text-sm text-gray-500">
                  AIチャットで「〇日目の詳細を教えて」と聞いてみましょう
                </p>
              </div>
            ) : null}

            {/* PDF Export Button */}
            {viewMode === 'schedule' && currentItinerary.schedule.length > 0 && (
              <div className="mt-10 mb-6 flex justify-center">
                <PDFExportButton itinerary={currentItinerary} />
              </div>
            )}
          </div>
        </div>

        {/* Phase 4: クイックアクション（自動進行中でない場合のみ表示） */}
        {!isAutoProgressing && (
          <div className="hidden md:block">
            <QuickActions />
          </div>
        )}
      </div>
    </>
  );
};
