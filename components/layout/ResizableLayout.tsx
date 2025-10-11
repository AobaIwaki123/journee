'use client';

import React from 'react';
import { useLayoutStore } from '@/lib/store/layout';
import { ChatBox } from '@/components/chat/ChatBox';
import { ItineraryPreview } from '@/components/itinerary/ItineraryPreview';
import { ResizablePanel } from '@/components/layout/ResizablePanel';

/**
 * Phase 10.4: ResizableLayout（useLayoutStore使用）
 */
export const ResizableLayout: React.FC = () => {
  const { chatPanelWidth } = useLayoutStore();

  // しおりパネルの幅は残りのパーセンテージ
  const itineraryPanelWidth = 100 - chatPanelWidth;

  return (
    <div className="h-full flex overflow-hidden">
      {/* Chat Box - Left Side (動的幅) */}
      <div
        style={{ width: `${chatPanelWidth}%` }}
        className="border-r border-gray-200 transition-all duration-100"
      >
        <ChatBox />
      </div>

      {/* Resizer - ドラッグ可能なバー */}
      <ResizablePanel />

      {/* Itinerary Preview - Right Side (動的幅) */}
      <div
        style={{ width: `${itineraryPanelWidth}%` }}
        className="transition-all duration-100"
      >
        <ItineraryPreview />
      </div>
    </div>
  );
};

ResizableLayout.displayName = 'ResizableLayout';
