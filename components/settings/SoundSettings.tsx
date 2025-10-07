'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Play, Save, CheckCircle } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';

/**
 * 効果音設定コンポーネント
 * Phase 3.6で実装される効果音システムとの連携を想定
 */
export const SoundSettings: React.FC = () => {
  const settings = useStore((state) => state.settings);
  const updateSoundSettings = useStore((state) => state.updateSoundSettings);
  
  const [localEnabled, setLocalEnabled] = useState(settings.sound.enabled);
  const [localVolume, setLocalVolume] = useState(settings.sound.volume);
  const [saved, setSaved] = useState(false);

  const hasChanges = 
    localEnabled !== settings.sound.enabled || 
    localVolume !== settings.sound.volume;

  const handleApply = () => {
    updateSoundSettings({ enabled: localEnabled, volume: localVolume });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePreview = () => {
    // Phase 3.6で効果音再生機能を実装
    // 現在はアラートで代用
    alert(`効果音プレビュー（音量: ${Math.round(localVolume * 100)}%）\nPhase 3.6で実装予定です。`);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800">効果音設定</h2>
        <p className="text-sm text-gray-600 mt-1">
          アプリケーションの効果音を管理します（Phase 3.6で実装予定）
        </p>
      </div>

      {/* 効果音ON/OFF */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {localEnabled ? (
              <Volume2 className="w-5 h-5 text-blue-500" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <h3 className="font-medium text-gray-800">効果音を有効にする</h3>
              <p className="text-sm text-gray-600 mt-1">
                メッセージ送信やAI返信時に効果音を再生します
              </p>
            </div>
          </div>
          <button
            onClick={() => setLocalEnabled(!localEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              localEnabled ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 音量調整 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">音量</h3>
              <p className="text-sm text-gray-600 mt-1">
                効果音の音量を調整します（0% - 100%）
              </p>
            </div>
            <span className="text-lg font-semibold text-blue-500">
              {Math.round(localVolume * 100)}%
            </span>
          </div>
          
          {/* スライダー */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              value={localVolume * 100}
              onChange={(e) => setLocalVolume(Number(e.target.value) / 100)}
              disabled={!localEnabled}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer
                ${localEnabled 
                  ? 'bg-gray-200' 
                  : 'bg-gray-100 cursor-not-allowed'
                }
              `}
              style={{
                background: localEnabled
                  ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${localVolume * 100}%, #e5e7eb ${localVolume * 100}%, #e5e7eb 100%)`
                  : '#f3f4f6',
              }}
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>小</span>
              <span>大</span>
            </div>
          </div>

          {/* プレビューボタン */}
          <button
            onClick={handlePreview}
            disabled={!localEnabled}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              localEnabled
                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>効果音をプレビュー</span>
          </button>
        </div>
      </div>

      {/* 効果音の種類説明 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-medium text-gray-800 mb-4">効果音の種類</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                <span className="font-medium">メッセージ送信音</span>
                <span className="text-gray-600"> - ユーザーがメッセージを送信した時</span>
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                <span className="font-medium">AI返信通知音</span>
                <span className="text-gray-600"> - AIからの返信が完了した時</span>
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                <span className="font-medium">しおり更新音</span>
                <span className="text-gray-600"> - しおりが更新された時</span>
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                <span className="font-medium">エラー通知音</span>
                <span className="text-gray-600"> - エラーが発生した時</span>
              </p>
            </div>
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

      {/* Phase 3.6について */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 効果音機能はPhase 3.6で実装予定です。現在は設定の保存のみが行われます。
        </p>
      </div>
    </div>
  );
};