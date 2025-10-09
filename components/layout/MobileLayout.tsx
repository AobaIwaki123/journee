'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import { MobileTabSwitcher } from './MobileTabSwitcher';
import { ChatBox } from '@/components/chat/ChatBox';
import { ItineraryPreview } from '@/components/itinerary/ItineraryPreview';

/**
 * モバイル用レイアウト（<768px）
 * 
 * タブ切り替えで「しおり」または「チャット」を表示。
 * デフォルトは「しおり」タブ。
 * 
 * **機能**:
 * - タブ切り替え
 * - スワイプジェスチャー対応（左右スワイプでタブ切り替え）
 * 
 * **レイアウト**:
 * - しおりタブ: 全画面表示
 * - チャットタブ: 全画面表示
 */
export const MobileLayout: React.FC = () => {
  const { mobileActiveTab, setMobileActiveTab } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // スワイプの最小距離（ピクセル）
  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // 左スワイプ: しおり → チャット
      if (mobileActiveTab === 'itinerary') {
        setMobileActiveTab('chat');
      }
    }

    if (isRightSwipe) {
      // 右スワイプ: チャット → しおり
      if (mobileActiveTab === 'chat') {
        setMobileActiveTab('itinerary');
      }
    }
  };

  // スワイプジェスチャーのイベントリスナー登録
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', onTouchStart);
    container.addEventListener('touchmove', onTouchMove);
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [touchStart, touchEnd, mobileActiveTab, setMobileActiveTab]);

  return (
    <div className="flex flex-col h-full">
      {/* タブ切り替えUI */}
      <MobileTabSwitcher
        activeTab={mobileActiveTab}
        onTabChange={setMobileActiveTab}
      />

      {/* コンテンツ表示（スワイプ対応） */}
      <div ref={containerRef} className="flex-1 overflow-y-auto touch-pan-y">
        {mobileActiveTab === 'chat' ? (
          <ChatBox />
        ) : (
          <ItineraryPreview />
        )}
      </div>
    </div>
  );
};
