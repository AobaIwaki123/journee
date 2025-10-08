'use client';

import React, { useState } from 'react';
import { DollarSign, Save, CheckCircle } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import type { Currency } from '@/types/settings';

/**
 * 一般設定コンポーネント
 * 通貨設定のみ
 */
export const GeneralSettings: React.FC = () => {
  const settings = useStore((state: any) => state.settings);
  const updateGeneralSettings = useStore((state: any) => state.updateGeneralSettings);
  const [localCurrency, setLocalCurrency] = useState<Currency>(settings.general.currency);
  const [saved, setSaved] = useState(false);

  const hasChanges = localCurrency !== settings.general.currency;

  const handleApply = () => {
    updateGeneralSettings({ currency: localCurrency });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800">一般設定</h2>
        <p className="text-sm text-gray-600 mt-1">
          アプリケーションの基本的な設定を管理します
        </p>
      </div>

      {/* 通貨設定 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start space-x-3">
          <DollarSign className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-gray-800">通貨</h3>
            <p className="text-sm text-gray-600 mt-1">
              予算や費用表示に使用する通貨を選択してください
            </p>
            <select
              value={localCurrency}
              onChange={(e) => setLocalCurrency(e.target.value as Currency)}
              className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="JPY">日本円 (¥)</option>
              <option value="USD">米ドル ($)</option>
              <option value="EUR">ユーロ (€)</option>
              <option value="GBP">英ポンド (£)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 適用ボタン */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          {saved && (
            <>
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-700">設定を保存しました</span>
            </>
          )}
        </div>
        <button
          onClick={handleApply}
          disabled={!hasChanges || saved}
          className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${
            hasChanges && !saved
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>適用</span>
        </button>
      </div>
    </div>
  );
};