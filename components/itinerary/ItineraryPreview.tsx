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
import { ShareButton } from './ShareButton';
import { SaveButton } from './SaveButton';
import { ResetButton } from './ResetButton';
import { ToastContainer } from '@/components/ui/Toast';
import { PDFExportButton } from './PDFExportButton';
import { RequirementChecklist } from './RequirementChecklist';
import { Calendar, MapPin } from 'lucide-react';

export const ItineraryPreview: React.FC = () => {
  const { 
    currentItinerary, 
    planningPhase, 
    isAutoProgressing, 
    autoProgressState,
    requirementChecklistVisible
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
        <div className="flex-1 overflow-y-auto bg-gray-50 relative">
          {/* Header */}
          <ItineraryHeader itinerary={currentItinerary} editable={true} />

          {/* Content */}
          <div className="p-6 max-w-5xl mx-auto">
            {/* Action Buttons */}
            {currentItinerary.schedule && currentItinerary.schedule.length > 0 && (
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-3">
                  <ShareButton />
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
            {currentItinerary.schedule.length > 0 && (
              <div className="mt-10 mb-6 flex justify-center">
                <PDFExportButton itinerary={currentItinerary} />
              </div>
            )}
          </div>
          
          {/* Phase 4.8: 必要情報チェックリスト（オーバーレイ） */}
          {requirementChecklistVisible && planningPhase === 'collecting' && (
            <div 
              className="
                absolute
                
                // デスクトップ: 右上、幅50% x 高さ50%
                hidden lg:block
                lg:top-0 lg:right-0
                lg:w-1/2 lg:h-1/2
                lg:p-4
                
                // タブレット: 上部、幅100% x 高さ40%
                md:block md:hidden
                md:top-0 md:left-0 md:right-0
                md:w-full md:h-[40%]
                md:p-3
                
                // モバイル: ボトムシート風（全幅）
                block sm:hidden
                bottom-0 left-0 right-0
                w-full
                max-h-[60vh]
                p-0
                
                animate-fadeIn
                z-50
              "
            >
              <RequirementChecklist 
                className="
                  h-full
                  bg-white/90 backdrop-blur-md
                  border border-gray-200/50
                  
                  // デスクトップ・タブレット: 角丸
                  lg:rounded-lg md:rounded-lg
                  
                  // モバイル: 上部のみ角丸
                  rounded-t-xl
                  
                  shadow-xl
                  overflow-hidden
                  flex flex-col
                "
              />
            </div>
          )}
        </div>

        {/* Phase 4: クイックアクション（自動進行中でない場合のみ表示） */}
        {!isAutoProgressing && <QuickActions />}
      </div>
    </>
  );
};
