'use client';

import React from 'react';
import { useStore } from '@/lib/store/useStore';
import { DaySchedule } from './DaySchedule';
<<<<<<< HEAD
import { PlanningProgress } from './PlanningProgress';
import { QuickActions } from './QuickActions';
import { PhaseStatusBar } from './PhaseStatusBar';
import { Calendar, MapPin, FileDown } from 'lucide-react';

export const ItineraryPreview: React.FC = () => {
  const { currentItinerary, planningPhase, isAutoProgressing, autoProgressState } = useStore();
=======
import { ItineraryHeader } from './ItineraryHeader';
import { ItinerarySummary } from './ItinerarySummary';
import { EmptyItinerary } from './EmptyItinerary';
import { UndoRedoButtons } from './UndoRedoButtons';
import { TemplateSelector } from './TemplateSelector';
import { ToastContainer } from '@/components/ui/Toast';
import { FileDown } from 'lucide-react';
import { TEMPLATES } from '@/types/template';

export const ItineraryPreview: React.FC = () => {
  const currentItinerary = useStore((state) => state.currentItinerary);
  const selectedTemplate = useStore((state) => state.selectedTemplate);
  const template = TEMPLATES[selectedTemplate];
>>>>>>> origin/main

  // 空状態: しおりがない場合
  if (!currentItinerary) {
<<<<<<< HEAD
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Phase 4: プランニング進捗（初期状態でも表示） */}
        {planningPhase !== 'initial' && <PlanningProgress />}

        {/* 空状態 */}
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
          <Calendar className="w-24 h-24 mb-4" />
          <h3 className="text-xl font-semibold mb-2">旅のしおりをプレビュー</h3>
          <p className="text-center text-sm">
            AIチャットで旅行計画を作成すると、
            <br />
            こちらにリアルタイムでしおりが表示されます
          </p>
        </div>

        {/* Phase 4: クイックアクション */}
        {planningPhase !== 'initial' && <QuickActions />}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 relative">
      {/* Phase 4.10.3: 自動進行中の進捗表示 */}
      {isAutoProgressing && autoProgressState && (
        <PhaseStatusBar state={autoProgressState} />
      )}
      
      {/* Phase 4: プランニング進捗（自動進行中でない場合のみ表示） */}
      {!isAutoProgressing && <PlanningProgress />}
      
      {/* メインコンテンツ（スクロール可能） */}
      <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8">
        <h1 className="text-3xl font-bold mb-2">{currentItinerary.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-blue-100">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{currentItinerary.destination}</span>
          </div>
          {currentItinerary.startDate && currentItinerary.endDate && (
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>
                {currentItinerary.startDate} - {currentItinerary.endDate}
              </span>
=======
    return <EmptyItinerary />;
  }

  return (
    <>
      {/* Toast Container */}
      <ToastContainer />

      <div 
        className="h-full overflow-y-auto"
        style={{ 
          background: `linear-gradient(to bottom right, ${template.colors.background}, ${template.colors.background})`
        }}
      >
        {/* Header */}
        <ItineraryHeader itinerary={currentItinerary} editable={true} />

        {/* Content */}
        <div className="p-6 max-w-5xl mx-auto">
          {/* Undo/Redo Buttons */}
          {currentItinerary.schedule && currentItinerary.schedule.length > 0 && (
            <div className="flex justify-end mb-4">
              <UndoRedoButtons />
>>>>>>> origin/main
            </div>
          )}

          {/* Template Selector */}
          {currentItinerary.schedule && currentItinerary.schedule.length > 0 && (
            <TemplateSelector />
          )}

          {/* Summary */}
          {currentItinerary.schedule && currentItinerary.schedule.length > 0 && (
            <ItinerarySummary itinerary={currentItinerary} />
          )}

          {/* Days */}
          {currentItinerary.schedule && currentItinerary.schedule.length > 0 ? (
            <div className="space-y-6">
              {currentItinerary.schedule.map((day, index) => (
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
<<<<<<< HEAD
        {currentItinerary.schedule.length > 0 && planningPhase === 'completed' && (
          <div className="mt-8 flex justify-center">
            <button
              className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              onClick={() => alert('PDF出力機能はPhase 5で実装予定です')}
=======
        {currentItinerary.schedule.length > 0 && (
          <div className="mt-10 mb-6 flex justify-center">
            <button
              className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              onClick={() => alert('PDF出力機能はPhase 5.3で実装予定です')}
>>>>>>> origin/main
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
