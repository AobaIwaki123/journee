'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useStore } from '@/lib/store/useStore';
import { Check, Save, AlertCircle, Database, HardDrive } from 'lucide-react';

/**
 * Phase 5.2: 保存状態表示コンポーネント
 * 
 * しおりの自動保存状態を視覚的にフィードバック
 * - 保存場所を明確に表示（ブラウザ / データベース / 両方）
 * - ログイン状態によって表示を変更
 */
export const SaveStatus: React.FC = () => {
  const { data: session } = useSession();
  const isSaving = useStore((state) => state.isSaving);
  const lastSaveTime = useStore((state) => state.lastSaveTime);
  const saveLocation = useStore((state) => state.saveLocation);
  const dbSaveSuccess = useStore((state) => state.dbSaveSuccess);
  const currentItinerary = useStore((state) => state.currentItinerary);
  const isStorageInitialized = useStore((state) => state.isStorageInitialized);
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
  if (!currentItinerary || !isStorageInitialized) {
    return null;
  }

  // 保存場所のアイコンとテキストを取得
  const getSaveLocationDisplay = () => {
    if (saveLocation === 'both') {
      return {
        icon: <Database size={16} className="text-green-500" />,
        text: 'クラウドに保存済み',
        detail: 'ブラウザとデータベースに保存',
      };
    } else if (saveLocation === 'database') {
      return {
        icon: <Database size={16} className="text-green-500" />,
        text: 'データベースに保存済み',
        detail: null,
      };
    } else if (saveLocation === 'browser') {
      return {
        icon: <HardDrive size={16} className="text-blue-500" />,
        text: session?.user ? 'ブラウザに保存済み' : 'ブラウザに一時保存',
        detail: session?.user && dbSaveSuccess === false 
          ? 'データベースへの保存に失敗しました' 
          : !session?.user 
            ? 'ログインしてクラウドに保存' 
            : null,
      };
    }
    return null;
  };

  const display = getSaveLocationDisplay();

  return (
    <div className="flex items-center gap-2 text-sm">
      {isSaving ? (
        <>
          <Save size={16} className="text-blue-500 animate-pulse" />
          <span className="text-gray-600">保存中...</span>
        </>
      ) : lastSaveTime && display ? (
        <div className="flex items-center gap-2">
          {display.icon}
          <div className="flex flex-col">
            <span className="text-gray-600">
              {display.text} {timeAgo && `(${timeAgo})`}
            </span>
            {display.detail && (
              <span className="text-xs text-gray-500">
                {display.detail}
              </span>
            )}
          </div>
        </div>
      ) : (
        <>
          <AlertCircle size={16} className="text-gray-400" />
          <span className="text-gray-400">未保存</span>
        </>
      )}
    </div>
  );
};
