/**
 * Phase 8: ViewModeSwitcher
 * 
 * スケジュール/地図の表示モード切り替えコンポーネント
 */

'use client';

import React from 'react';
import { List, Map as MapIcon } from 'lucide-react';

type ViewMode = 'schedule' | 'map';

interface ViewModeSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewModeSwitcher: React.FC<ViewModeSwitcherProps> = ({
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onViewModeChange('schedule')}
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
        onClick={() => onViewModeChange('map')}
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
  );
};
