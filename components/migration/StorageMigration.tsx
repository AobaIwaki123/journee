'use client';

import { useEffect, useState } from 'react';
import {
  migrateLocalStorageToIndexedDB,
  checkMigrationStatus,
} from '@/lib/utils/storage-migration';

/**
 * localStorage → IndexedDB マイグレーション
 * 
 * 初回訪問時に自動実行
 */
export function StorageMigration() {
  const [migrationStatus, setMigrationStatus] = useState<
    'idle' | 'checking' | 'running' | 'completed' | 'error'
  >('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function migrate() {
      setMigrationStatus('checking');

      try {
        // マイグレーション済みかチェック
        const status = await checkMigrationStatus();
        if (status.isCompleted) {
          setMigrationStatus('completed');
          return;
        }

        setMigrationStatus('running');
        setProgress(10);

        // マイグレーション実行
        const result = await migrateLocalStorageToIndexedDB();
        
        setProgress(80);

        if (result.success) {
          setMigrationStatus('completed');
          setProgress(100);
          
          console.log('✅ Migration completed successfully');
          console.log('Migrated keys:', result.migratedKeys);
          
          if (result.skippedKeys.length > 0) {
            console.log('Skipped keys:', result.skippedKeys);
          }
        } else {
          setMigrationStatus('error');
          console.error('❌ Migration failed');
          console.error('Errors:', result.errors);
        }
      } catch (error) {
        setMigrationStatus('error');
        console.error('❌ Migration exception:', error);
      }
    }

    migrate();
  }, []);

  // マイグレーション中のUI（オプション）
  if (migrationStatus === 'running') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="animate-spin h-12 w-12 mx-auto text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              データを移行中...
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              ストレージをアップグレードしています
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {progress}% 完了
            </p>
          </div>
        </div>
      </div>
    );
  }

  // エラー時のUI（オプション）
  if (migrationStatus === 'error') {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded z-50 max-w-md">
        <div className="flex items-start">
          <svg
            className="h-5 w-5 mr-2 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="font-bold">データ移行に失敗しました</p>
            <p className="text-sm">
              アプリケーションは引き続き使用できますが、一部の設定が保存されない可能性があります。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // マイグレーション完了または実行中以外は何も表示しない
  return null;
}
