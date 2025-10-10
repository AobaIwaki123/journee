'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useStore } from '@/lib/store/useStore';
import { Check, Save, AlertCircle, Database, HardDrive } from 'lucide-react';

/**
 * Phase 5.2 + Phase 11: 保存状態表示コンポーネント
 * 
 * しおりの自動保存状態を視覚的にフィードバック
 * - 保存場所（ブラウザ/データベース）を明示
 * - ログイン状態に応じたメッセージ表示
 */
export const SaveStatus: React.FC = () => {
  const { data: session } = useSession();
  const isSaving = useStore((state) => state.isSaving);
  const lastSaveTime = useStore((state) => state.lastSaveTime);
  const saveLocation = useStore((state) => state.saveLocation);
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

  // 保存場所に応じたアイコンとテキスト
  const getSaveLocationInfo = () => {
    if (isSaving) {
      return {
        icon: <Save size={16} className="text-blue-500 animate-pulse" />,
        text: '保存中...',
        className: 'text-gray-600',
      };
    }

    if (!lastSaveTime) {
      return {
        icon: <AlertCircle size={16} className="text-gray-400" />,
        text: '未保存',
        className: 'text-gray-400',
      };
    }

    switch (saveLocation) {
      case 'both':
        return {
          icon: <Check size={16} className="text-green-500" />,
          text: `データベースに保存済み ${timeAgo && `(${timeAgo})`}`,
          className: 'text-gray-600',
        };
      case 'database':
        return {
          icon: <Database size={16} className="text-green-500" />,
          text: `データベースに保存済み ${timeAgo && `(${timeAgo})`}`,
          className: 'text-gray-600',
        };
      case 'browser':
        return {
          icon: <HardDrive size={16} className="text-yellow-500" />,
          text: session?.user 
            ? `ブラウザに一時保存 ${timeAgo && `(${timeAgo})`}`
            : `ブラウザに保存済み ${timeAgo && `(${timeAgo})`}`,
          className: 'text-gray-600',
        };
      default:
        return {
          icon: <Check size={16} className="text-green-500" />,
          text: `保存済み ${timeAgo && `(${timeAgo})`}`,
          className: 'text-gray-600',
        };
    }
  };

  const { icon, text, className } = getSaveLocationInfo();

  return (
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span className={className}>{text}</span>
      {saveLocation === 'browser' && !session?.user && (
        <span className="text-xs text-amber-600 ml-2">
          ※ログインすると永続的に保存されます
        </span>
      )}
    </div>
  );
};
