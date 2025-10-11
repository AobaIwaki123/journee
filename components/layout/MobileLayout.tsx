'use client';

import React from 'react';
import { useLayoutStore } from '@/lib/store/layout';
import { ChatBox } from '@/components/chat/ChatBox';
import { ItineraryPreview } from '@/components/itinerary/ItineraryPreview';
import { MobileTabSwitcher } from './MobileTabSwitcher';

/**
 * Phase 10.4: MobileLayout（useLayoutStore使用）
 */
export const MobileLayout: React.FC = () => {
  const { mobileActiveTab, setMobileActiveTab } = useLayoutStore();

  return (
    <div className="h-full flex flex-col">
      {/* タブスイッチャー */}
      <MobileTabSwitcher
        activeTab={mobileActiveTab}
        onTabChange={setMobileActiveTab}
      />

      {/* コンテンツエリア */}
      <div className="flex-1 overflow-hidden">
        {mobileActiveTab === 'chat' ? <ChatBox /> : <ItineraryPreview />}
      </div>
    </div>
  );
};
