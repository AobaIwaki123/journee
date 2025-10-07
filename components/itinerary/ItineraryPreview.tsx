'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/useStore';
import { ItineraryHeader } from './ItineraryHeader';
import { DaySchedule } from './DaySchedule';
import { MapView } from './MapView';
import { Calendar, FileDown, Map as MapIcon, List } from 'lucide-react';
import { DaySchedule as DayScheduleType } from '@/types/itinerary';

type ViewMode = 'schedule' | 'map';

export const ItineraryPreview: React.FC = () => {
  const currentItinerary = useStore((state) => state.currentItinerary);
  const updateItinerary = useStore((state) => state.updateItinerary);
  const [viewMode, setViewMode] = useState<ViewMode>('schedule');
  const [isEditable, setIsEditable] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined);

  // Reset view mode when itinerary changes
  useEffect(() => {
    if (currentItinerary) {
      setViewMode('schedule');
    }
  }, [currentItinerary?.id]);

  if (!currentItinerary) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
        <Calendar className="w-24 h-24 mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2 text-gray-600">旅のしおりをプレビュー</h3>
        <p className="text-center text-sm text-gray-500">
          AIチャットで旅行計画を作成すると、
          <br />
          こちらにリアルタイムでしおりが表示されます
        </p>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-md">
          <p className="text-xs text-blue-700">
            💡 <strong>ヒント:</strong> 「京都に3日間の旅行を計画したい」のように話しかけてみましょう
          </p>
        </div>
      </div>
    );
  }

  const handleEditMode = () => {
    setIsEditable(!isEditable);
  };

  const handleDayEdit = (updatedDay: DayScheduleType) => {
    if (!currentItinerary) return;
    
    const updatedSchedule = currentItinerary.schedule.map(day =>
      day.day === updatedDay.day ? updatedDay : day
    );
    
    updateItinerary({ schedule: updatedSchedule });
  };

  const hasLocations = currentItinerary.schedule.some(day =>
    day.spots.some(spot => spot.location?.lat && spot.location?.lng)
  );

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <ItineraryHeader 
        itinerary={currentItinerary} 
        onEdit={handleEditMode}
        isEditing={isEditable}
      />

      {/* View Mode Switcher */}
      {hasLocations && (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
          <div className="flex items-center justify-between">
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

            {viewMode === 'map' && currentItinerary.schedule.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">表示:</span>
                <select
                  value={selectedDay || 'all'}
                  onChange={(e) => setSelectedDay(e.target.value === 'all' ? undefined : Number(e.target.value))}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全日程</option>
                  {currentItinerary.schedule.map(day => (
                    <option key={day.day} value={day.day}>
                      Day {day.day}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {viewMode === 'schedule' ? (
          <>
            {/* Days */}
            {currentItinerary.schedule && currentItinerary.schedule.length > 0 ? (
              <div className="space-y-6">
                {currentItinerary.schedule.map((day) => (
                  <DaySchedule 
                    key={day.day} 
                    day={day} 
                    isEditable={isEditable}
                    onEdit={handleDayEdit}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <p className="font-medium">スケジュールがまだ作成されていません</p>
                <p className="text-sm mt-2">AIチャットで旅程を作成してみましょう</p>
              </div>
            )}

            {/* Budget Info */}
            {currentItinerary.totalBudget && currentItinerary.schedule.length > 0 && (
              <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">総予算</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ¥{currentItinerary.totalBudget.toLocaleString()}
                    </p>
                  </div>
                  {currentItinerary.schedule.length > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">1日あたり平均</p>
                      <p className="text-lg font-semibold text-indigo-600">
                        ¥{Math.round(currentItinerary.totalBudget / currentItinerary.schedule.length).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <MapView 
              days={currentItinerary.schedule} 
              selectedDay={selectedDay}
              height="600px"
            />
            {selectedDay !== undefined && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h4 className="font-semibold text-gray-800 mb-2">
                  Day {selectedDay} の詳細
                </h4>
                <DaySchedule 
                  day={currentItinerary.schedule.find(d => d.day === selectedDay)!}
                  isEditable={isEditable}
                  onEdit={handleDayEdit}
                />
              </div>
            )}
          </div>
        )}

        {/* PDF Export Button */}
        {currentItinerary.schedule.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg"
              onClick={() => alert('PDF出力機能はPhase 5.3で実装予定です')}
            >
              <FileDown className="w-5 h-5" />
              <span className="font-medium">PDFで保存</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
