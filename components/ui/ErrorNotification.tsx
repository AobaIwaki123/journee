'use client';

import React, { useEffect } from 'react';
import { useUIStore } from '@/lib/store/ui';
import { AlertCircle, X } from 'lucide-react';

/**
 * Phase 10.3: エラー通知（useUIStore使用）
 */
export const ErrorNotification: React.FC = () => {
  const { error, setError, clearError } = useUIStore();

  useEffect(() => {
    if (error) {
      // 5秒後に自動的にエラーをクリア
      const timer = setTimeout(() => {
        clearError();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in">
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-red-800">エラーが発生しました</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => clearError()}
            className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
