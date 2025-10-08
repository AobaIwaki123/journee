'use client';

import React from 'react';
import { ChatBox } from '@/components/chat/ChatBox';
import { ItineraryPreview } from '@/components/itinerary/ItineraryPreview';

/**
 * デスクトップ用レイアウト（≥768px）
 * 
 * 左側にチャットボックス（40%）、右側にしおりプレビュー（60%）の横並びレイアウト。
 */
export const DesktopLayout: React.FC = () => {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Chat Box - Left Side (40%) */}
      <div className="w-2/5 border-r border-gray-200">
        <ChatBox />
      </div>

      {/* Itinerary Preview - Right Side (60%) */}
      <div className="w-3/5">
        <ItineraryPreview />
      </div>
    </div>
  );
};
