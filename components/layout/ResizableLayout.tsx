'use client';

import React from 'react';
import { useStore } from '@/lib/store/useStore';
import { ChatBox } from '@/components/chat/ChatBox';
import { ItineraryPreview } from '@/components/itinerary/ItineraryPreview';
import { ResizablePanel } from '@/components/layout/ResizablePanel';

/**
 * ResizableLayout コンポーネント
 * 
 * チャットボックスとしおりプレビューを動的にリサイズ可能なレイアウトで配置します。
 * ユーザーは中央のリサイザーバーをドラッグして、レイアウトを自由に調整できます。
 * 
 * 機能:
 * - 動的な幅調整（Zustand状態管理）
 * - LocalStorageによる幅の永続化
 * - レスポンシブデザイン対応
 */
export const ResizableLayout: React.FC = () => {
  const { chatPanelWidth } = useStore();

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
