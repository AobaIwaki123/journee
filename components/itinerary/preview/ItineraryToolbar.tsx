/**
 * Phase 8: ItineraryToolbar
 * 
 * ViewModeSwitcherとActionButtonsの配置管理コンポーネント
 */

'use client';

import React from 'react';
import { ViewModeSwitcher } from './ViewModeSwitcher';
import { ItineraryActionButtons } from './ItineraryActionButtons';

type ViewMode = 'schedule' | 'map';

interface ItineraryToolbarProps {
  hasLocations: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ItineraryToolbar: React.FC<ItineraryToolbarProps> = ({
  hasLocations,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        {/* 左側: ViewModeSwitcher または ActionButtons */}
        {hasLocations ? (
          <ViewModeSwitcher
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />
        ) : (
          <ItineraryActionButtons />
        )}
        
        {/* 右側: ActionButtons (hasLocationsの場合のみ) */}
        {hasLocations && (
          <div className="flex flex-wrap gap-2 md:gap-3 items-center">
            <ItineraryActionButtons />
          </div>
        )}
      </div>
    </div>
  );
};
