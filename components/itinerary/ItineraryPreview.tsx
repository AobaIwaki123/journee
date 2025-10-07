'use client';

import React from 'react';
import { useStore } from '@/lib/store/useStore';
import { DaySchedule } from './DaySchedule';
import { PlanningProgress } from './PlanningProgress';
import { QuickActions } from './QuickActions';
import { PhaseStatusBar } from './PhaseStatusBar';
import { ItineraryHeader } from './ItineraryHeader';
import { ItinerarySummary } from './ItinerarySummary';
import { EmptyItinerary } from './EmptyItinerary';
import { UndoRedoButtons } from './UndoRedoButtons';
import { SaveButton } from './SaveButton';
import { ResetButton } from './ResetButton';
import { ToastContainer } from '@/components/ui/Toast';
import { PDFExportButton } from './PDFExportButton';
import { Calendar, MapPin } from 'lucide-react';

export const ItineraryPreview: React.FC = () => {
  const { 
    currentItinerary, 
    planningPhase, 
    isAutoProgressing, 
    autoProgressState
  } = useStore();

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
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {/* Header */}
          <ItineraryHeader itinerary={currentItinerary} editable={true} />

          {/* Content */}
          <div className="p-6 max-w-5xl mx-auto">
            {/* Action Buttons */}
            {currentItinerary.schedule && currentItinerary.schedule.length > 0 && (
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-3">
                  <SaveButton />
                  <ResetButton />
                </div>
                <UndoRedoButtons />
              </div>
            )}

            {/* Summary */}
            {currentItinerary.schedule && currentItinerary.schedule.length > 0 && (
              <ItinerarySummary itinerary={currentItinerary} />
            )}

            {/* Days */}
            {currentItinerary.schedule && currentItinerary.schedule.length > 0 ? (
              <div className="space-y-6">
                {currentItinerary.schedule.map((day: any, index: number) => (
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
            {currentItinerary.schedule.length > 0 && planningPhase === 'completed' && (
              <div className="mt-10 mb-6 flex justify-center">
                <PDFExportButton itinerary={currentItinerary} />
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