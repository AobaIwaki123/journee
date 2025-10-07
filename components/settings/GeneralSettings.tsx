'use client';

import React from 'react';
import { Globe, Clock, Calendar, DollarSign } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import type { Language, Timezone, DateFormat, Currency } from '@/types/settings';

/**
 * 一般設定コンポーネント
 * 言語、タイムゾーン、日付フォーマット、通貨の設定
 */
export const GeneralSettings: React.FC = () => {
  const settings = useStore((state) => state.settings);
  const updateGeneralSettings = useStore((state) => state.updateGeneralSettings);

  const handleLanguageChange = (language: Language) => {
    updateGeneralSettings({ language });
  };

  const handleTimezoneChange = (timezone: Timezone) => {
    updateGeneralSettings({ timezone });
  };

  const handleDateFormatChange = (dateFormat: DateFormat) => {
    updateGeneralSettings({ dateFormat });
  };

  const handleCurrencyChange = (currency: Currency) => {
    updateGeneralSettings({ currency });
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

      {/* 言語設定 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start space-x-3">
          <Globe className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-gray-800">言語</h3>
            <p className="text-sm text-gray-600 mt-1">
              表示言語を選択してください
            </p>
            <div className="mt-4 space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="language"
                  value="ja"
                  checked={settings.general.language === 'ja'}
                  onChange={() => handleLanguageChange('ja')}
                  className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-gray-700">日本語</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="language"
                  value="en"
                  checked={settings.general.language === 'en'}
                  onChange={() => handleLanguageChange('en')}
                  className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-gray-700">English</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* タイムゾーン設定 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-gray-800">タイムゾーン</h3>
            <p className="text-sm text-gray-600 mt-1">
              時刻表示に使用するタイムゾーンを選択してください
            </p>
            <select
              value={settings.general.timezone}
              onChange={(e) => handleTimezoneChange(e.target.value as Timezone)}
              className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Asia/Tokyo">日本標準時 (JST)</option>
              <option value="UTC">協定世界時 (UTC)</option>
              <option value="America/New_York">東部標準時 (EST)</option>
              <option value="Europe/London">グリニッジ標準時 (GMT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 日付フォーマット設定 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start space-x-3">
          <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-gray-800">日付フォーマット</h3>
            <p className="text-sm text-gray-600 mt-1">
              日付の表示形式を選択してください
            </p>
            <div className="mt-4 space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="dateFormat"
                  value="YYYY/MM/DD"
                  checked={settings.general.dateFormat === 'YYYY/MM/DD'}
                  onChange={() => handleDateFormatChange('YYYY/MM/DD')}
                  className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-gray-700">YYYY/MM/DD (2024/03/15)</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="dateFormat"
                  value="MM/DD/YYYY"
                  checked={settings.general.dateFormat === 'MM/DD/YYYY'}
                  onChange={() => handleDateFormatChange('MM/DD/YYYY')}
                  className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-gray-700">MM/DD/YYYY (03/15/2024)</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="dateFormat"
                  value="DD/MM/YYYY"
                  checked={settings.general.dateFormat === 'DD/MM/YYYY'}
                  onChange={() => handleDateFormatChange('DD/MM/YYYY')}
                  className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-gray-700">DD/MM/YYYY (15/03/2024)</span>
              </label>
            </div>
          </div>
        </div>
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
              value={settings.general.currency}
              onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
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

      {/* 保存確認メッセージ */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          ℹ️ 設定は自動的に保存されます
        </p>
      </div>
    </div>
  );
};