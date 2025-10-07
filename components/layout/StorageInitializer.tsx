'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store/useStore';

/**
 * LocalStorageからデータを復元するコンポーネント
 * アプリ起動時に一度だけ実行される
 */
export const StorageInitializer: React.FC = () => {
  const initializeFromStorage = useStore((state) => state.initializeFromStorage);

  useEffect(() => {
    // LocalStorageからAPIキーと選択AIを復元
    initializeFromStorage();
  }, [initializeFromStorage]);

  // このコンポーネントは何も表示しない
  return null;
};