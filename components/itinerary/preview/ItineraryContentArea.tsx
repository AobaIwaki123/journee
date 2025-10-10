/**
 * Phase 8: ItineraryContentArea
 * 
 * メインコンテンツエリアの構成コンポーネント
 * Toolbar, Summary, Map/Schedule, PDF Export を統合
 */

'use client';

import React from 'react';
import { ItineraryData } from '@/types/itinerary';
import { ItineraryHeader } from '../ItineraryHeader';
import { ItinerarySummary } from '../ItinerarySummary';
import { MapView } from '../MapView';
import { PDFExportButton } from '../PDFExportButton';
import { ItineraryToolbar } from './ItineraryToolbar';
import { ScheduleListView } from './ScheduleListView';
import { EmptyScheduleMessage } from './EmptyScheduleMessage';

type ViewMode = 'schedule' | 'map';

interface ItineraryContentAreaProps {
  itinerary: ItineraryData;
  viewMode: ViewMode;
  hasLocations: boolean;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ItineraryContentArea: React.FC<ItineraryContentAreaProps> = ({
  itinerary,
  viewMode,
  hasLocations,
  onViewModeChange,
}) => {
  const hasSchedule = itinerary.schedule && itinerary.schedule.length > 0;
  
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header - 常に表示 */}
      <ItineraryHeader itinerary={itinerary} editable={true} />
      
      {/* Content */}
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        {/* Toolbar - scheduleがある場合のみ表示 */}
        {hasSchedule && (
          <ItineraryToolbar
            hasLocations={hasLocations}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />
        )}
        
        {/* Summary - scheduleがある場合のみ表示 */}
        {viewMode === 'schedule' && hasSchedule && (
          <ItinerarySummary itinerary={itinerary} />
        )}
        
        {/* Map View - 地図モード かつ 位置情報がある場合のみ */}
        {viewMode === 'map' && hasLocations && hasSchedule && (
          <div className="mb-6">
            <MapView
              days={itinerary.schedule}
              showDaySelector={true}
              numberingMode="perDay"
              height="600px"
            />
          </div>
        )}
        
        {/* Schedule View - スケジュールモードの場合 */}
        {viewMode === 'schedule' && hasSchedule && (
          <ScheduleListView
            schedule={itinerary.schedule}
            editable={true}
          />
        )}
        
        {/* Empty Schedule Message - スケジュールモード かつ scheduleが空の場合のみ */}
        {viewMode === 'schedule' && !hasSchedule && (
          <EmptyScheduleMessage />
        )}
        
        {/* PDF Export Button - スケジュールモード かつ scheduleがある場合のみ */}
        {viewMode === 'schedule' && hasSchedule && (
          <div className="mt-10 mb-6 flex justify-center">
            <PDFExportButton itinerary={itinerary} />
          </div>
        )}
      </div>
    </div>
  );
};
