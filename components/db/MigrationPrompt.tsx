'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Database, X, CheckCircle, Loader2 } from 'lucide-react';
import { needsMigration, saveMigrationStatus, getMigrationStatus } from '@/lib/db/migration';

/**
 * Phase 8.3: データマイグレーションプロンプト
 * 
 * LocalStorageにデータがある場合、データベースへの移行を促すUIを表示します。
 */
export const MigrationPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    migratedCount: number;
    message: string;
  } | null>(null);

  useEffect(() => {
    // マイグレーションが必要かチェック
    const migrationStatus = getMigrationStatus();
    
    if (migrationStatus?.status === 'completed') {
      // 既に完了済み
      return;
    }

    if (needsMigration()) {
      setShowPrompt(true);
    }
  }, []);

  const handleMigrate = async () => {
    setIsMigrating(true);

    try {
      const response = await fetch('/api/migration/start', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMigrationResult({
          success: true,
          migratedCount: data.migratedCount,
          message: data.message,
        });
        saveMigrationStatus('completed');
        
        // 3秒後に自動的に閉じる
        setTimeout(() => {
          setShowPrompt(false);
        }, 3000);
      } else {
        setMigrationResult({
          success: false,
          migratedCount: data.migratedCount || 0,
          message: data.message || 'マイグレーションに失敗しました',
        });
        saveMigrationStatus('failed');
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationResult({
        success: false,
        migratedCount: 0,
        message: 'マイグレーション中にエラーが発生しました',
      });
      saveMigrationStatus('failed');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSkip = () => {
    saveMigrationStatus('pending');
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 relative">
        {/* 閉じるボタン */}
        {!isMigrating && !migrationResult && (
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* マイグレーション結果表示 */}
        {migrationResult ? (
          <div className="text-center">
            {migrationResult.success ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  マイグレーション完了
                </h3>
                <p className="text-gray-600">
                  {migrationResult.message}
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  マイグレーション失敗
                </h3>
                <p className="text-gray-600 mb-4">
                  {migrationResult.message}
                </p>
                <button
                  onClick={() => {
                    setMigrationResult(null);
                    setShowPrompt(false);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  閉じる
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* アイコン */}
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-10 h-10 text-blue-600" />
            </div>

            {/* タイトル */}
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              データベースへの移行
            </h3>

            {/* 説明 */}
            <p className="text-gray-600 mb-6 text-center">
              ローカルに保存されているしおりデータをクラウドデータベースに移行します。
              これにより、複数のデバイスでデータを同期できるようになります。
            </p>

            {/* 注意事項 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">注意事項</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>移行は1回のみ実行されます</li>
                    <li>移行後、ローカルデータは削除されます</li>
                    <li>移行中は他の操作を行わないでください</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* ボタン */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                disabled={isMigrating}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                後で移行
              </button>
              <button
                onClick={handleMigrate}
                disabled={isMigrating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isMigrating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>移行中...</span>
                  </>
                ) : (
                  <span>今すぐ移行</span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
