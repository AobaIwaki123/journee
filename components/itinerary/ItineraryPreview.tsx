'use client';

import React from 'react';
import { useStore } from '@/lib/store/useStore';
import { DaySchedule } from './DaySchedule';
import { PlanningProgress } from './PlanningProgress';
import { QuickActions } from './QuickActions';
import { Calendar, MapPin, FileDown } from 'lucide-react';

export const ItineraryPreview: React.FC = () => {
  const { currentItinerary, planningPhase } = useStore();

  if (!currentItinerary) {
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
      {/* Phase 4: プランニング進捗 */}
      <PlanningProgress />
      
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
            </div>
          )}
          {currentItinerary.duration && (
            <div className="flex items-center">
              <span>{currentItinerary.duration}日間</span>
            </div>
          )}
        </div>
        {currentItinerary.summary && (
          <p className="mt-3 text-blue-50 text-sm">{currentItinerary.summary}</p>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Days */}
        {currentItinerary.schedule && currentItinerary.schedule.length > 0 ? (
          <div className="space-y-6">
            {currentItinerary.schedule.map((day) => (
              <DaySchedule key={day.day} day={day} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>スケジュールがまだ作成されていません</p>
            <p className="text-sm mt-2">AIチャットで旅程を作成してみましょう</p>
          </div>
        )}

        {/* Budget Info */}
        {currentItinerary.totalBudget && currentItinerary.schedule.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">総予算</span>
              <span className="text-lg font-bold text-blue-600">
                ¥{currentItinerary.totalBudget.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* PDF Export Button */}
        {currentItinerary.schedule.length > 0 && planningPhase === 'completed' && (
          <div className="mt-8 flex justify-center">
            <button
              className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              onClick={() => alert('PDF出力機能はPhase 5で実装予定です')}
            >
              <FileDown className="w-5 h-5" />
              <span>PDFで保存</span>
            </button>
          </div>
        )}
      </div>
      </div>

      {/* Phase 4: クイックアクション */}
      <QuickActions />
    </div>
  );
};
