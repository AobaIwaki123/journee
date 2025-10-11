'use client';

import React, { useEffect, useState } from 'react';
import { useUIStore } from '@/lib/store/ui';
import { useItineraryStore } from '@/lib/store/itinerary';
import { Check, Save, AlertCircle } from 'lucide-react';

/**
 * Phase 10.3: 保存状態表示（useUIStore使用）
 */
export const SaveStatus: React.FC = () => {
  const { isSaving, lastSaveTime, storageInitialized } = useUIStore();
  const { currentItinerary } = useItineraryStore();
  const [timeAgo, setTimeAgo] = useState<string>('');

  // 最後の保存からの経過時間を更新
  useEffect(() => {
    if (!lastSaveTime) {
      setTimeAgo('');
      return;
    }

    const updateTimeAgo = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastSaveTime.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);

      if (diffSec < 10) {
        setTimeAgo('たった今');
      } else if (diffSec < 60) {
        setTimeAgo(`${diffSec}秒前`);
      } else if (diffMin < 60) {
        setTimeAgo(`${diffMin}分前`);
      } else {
        setTimeAgo(`${diffHour}時間前`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000); // 10秒ごとに更新

    return () => clearInterval(interval);
  }, [lastSaveTime]);

  // しおりがない場合、または初期化前は表示しない
  if (!currentItinerary || !storageInitialized) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {isSaving ? (
        <>
          <Save size={16} className="text-blue-500 animate-pulse" />
          <span className="text-gray-600">保存中...</span>
        </>
      ) : lastSaveTime ? (
        <>
          <Check size={16} className="text-green-500" />
          <span className="text-gray-600">
            保存済み {timeAgo && `(${timeAgo})`}
          </span>
        </>
      ) : (
        <>
          <AlertCircle size={16} className="text-gray-400" />
          <span className="text-gray-400">未保存</span>
        </>
      )}
    </div>
  );
};
