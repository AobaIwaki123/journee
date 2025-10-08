'use client';

import React from 'react';
import { MessageSquare, Map } from 'lucide-react';

type MobileTab = 'chat' | 'itinerary';

interface MobileTabSwitcherProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

/**
 * モバイル用タブ切り替えコンポーネント
 * 
 * チャットとしおりの表示を切り替えるタブUI。
 * モバイル画面（768px未満）でのみ表示されます。
 */
export const MobileTabSwitcher: React.FC<MobileTabSwitcherProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs: Array<{ id: MobileTab; label: string; icon: React.ReactNode }> = [
    {
      id: 'itinerary',
      label: 'しおり',
      icon: <Map className="w-5 h-5" />,
    },
    {
      id: 'chat',
      label: 'チャット',
      icon: <MessageSquare className="w-5 h-5" />,
    },
  ];

  return (
    <div className="md:hidden border-b border-gray-200 bg-white">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3
              text-sm font-medium transition-all
              ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }
            `}
            aria-label={`${tab.label}タブに切り替え`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
