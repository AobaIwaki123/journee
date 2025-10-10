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
      {/* Header */}
      <ItineraryHeader itinerary={itinerary} editable={true} />
      
      {/* Content */}
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        {/* Toolbar */}
        {hasSchedule && (
          <ItineraryToolbar
            hasLocations={hasLocations}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />
        )}
        
        {/* Summary */}
        {viewMode === 'schedule' && hasSchedule && (
          <ItinerarySummary itinerary={itinerary} />
        )}
        
        {/* Map View */}
        {viewMode === 'map' && hasLocations && (
          <div className="mb-6">
            <MapView
              days={itinerary.schedule}
              showDaySelector={true}
              numberingMode="perDay"
              height="600px"
            />
          </div>
        )}
        
        {/* Schedule View */}
        {viewMode === 'schedule' && (
          hasSchedule ? (
            <ScheduleListView
              schedule={itinerary.schedule}
              editable={true}
            />
          ) : (
            <EmptyScheduleMessage />
          )
        )}
        
        {/* PDF Export Button */}
        {viewMode === 'schedule' && hasSchedule && (
          <div className="mt-10 mb-6 flex justify-center">
            <PDFExportButton itinerary={itinerary} />
          </div>
        )}
      </div>
    </div>
  );
};
