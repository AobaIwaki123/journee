'use client';

import React, { useState, useEffect } from 'react';
import { Share2, Link2, Copy, Check, Globe, Lock, Download, X } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import { useItineraryStore } from '@/lib/store/itinerary';
import { useItineraryPublish } from '@/lib/hooks/itinerary';
import type { PublicItinerarySettings } from '@/types/itinerary';

/**
 * Phase 6.1: しおり公開・共有ボタンコンポーネント
 * useItineraryPublish Hookを活用してロジックを分離
 */
export const ShareButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Phase 9 Bug Fix: useItineraryStoreからcurrentItineraryを取得
  const { currentItinerary } = useItineraryStore();
  
  // useItineraryPublish Hookを活用
  const {
    isPublic,
    publicUrl,
    isPublishing,
    allowPdfDownload,
    customMessage,
    publish,
    unpublish,
    updateSettings,
    copyPublicUrl: copyUrl,
    shareViaWebApi,
  } = useItineraryPublish(currentItinerary?.id || '');

  // ローカル設定状態（フォーム用）
  const [localSettings, setLocalSettings] = useState<PublicItinerarySettings>({
    isPublic: isPublic,
    allowPdfDownload: allowPdfDownload,
    customMessage: customMessage,
  });

  // currentItineraryが変更されたらローカル設定を同期
  useEffect(() => {
    setLocalSettings({
      isPublic: isPublic,
      allowPdfDownload: allowPdfDownload,
      customMessage: customMessage,
    });
  }, [isPublic, allowPdfDownload, customMessage]);

  if (!currentItinerary) {
    return null;
  }

  const handlePublish = async () => {
    const result = await publish(localSettings);
    if (result.success) {
      // 公開成功時に設定を同期
      setLocalSettings({ ...localSettings, isPublic: true });
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('しおりを非公開にしますか？公開URLは無効になります。')) {
      return;
    }
    
    try {
      await unpublish();
      setLocalSettings({ ...localSettings, isPublic: false });
    } catch (error) {
      console.error('Error unpublishing:', error);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      await updateSettings({
        allowPdfDownload: localSettings.allowPdfDownload,
        customMessage: localSettings.customMessage,
      });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await copyUrl();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying URL:', error);
    }
  };

  const handleShare = async () => {
    try {
      await shareViaWebApi();
    } catch (error) {
      // Web Share APIが利用できない場合はURLコピーにフォールバック
      await handleCopyUrl();
    }
  };

  return (
    <div className="relative">
      {/* 共有ボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        title="共有設定"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">共有</span>
      </button>

      {/* 共有設定パネル */}
      {isOpen && (
        <>
          {/* 背景オーバーレイ */}
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-25"
            onClick={() => setIsOpen(false)}
          />

          {/* パネル - 画面中央に配置 */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                しおりを共有
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isPublic ? (
              <>
                {/* 公開中 */}
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                    <Globe className="w-4 h-4" />
                    公開中
                  </div>
                  <p className="text-sm text-green-600">
                    このしおりは誰でも閲覧できます
                  </p>
                </div>

                {/* 公開URL */}
                {publicUrl && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      公開URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={publicUrl}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleCopyUrl}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        title="URLをコピー"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                      <button
                        onClick={handleShare}
                        className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                        title="共有"
                      >
                        <Share2 className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 公開設定 */}
                <div className="space-y-3 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localSettings.allowPdfDownload}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, allowPdfDownload: e.target.checked })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">PDFダウンロードを許可</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      カスタムメッセージ（オプション）
                    </label>
                    <textarea
                      value={localSettings.customMessage}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, customMessage: e.target.value })
                      }
                      placeholder="閲覧者へのメッセージを入力..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      公開ページの上部に表示されます
                    </p>
                  </div>
                </div>

                {/* 設定更新ボタン */}
                {(localSettings.allowPdfDownload !== allowPdfDownload ||
                  localSettings.customMessage !== customMessage) && (
                  <button
                    onClick={handleUpdateSettings}
                    className="w-full mb-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    設定を更新
                  </button>
                )}

                {/* 非公開ボタン */}
                <button
                  onClick={handleUnpublish}
                  disabled={isPublishing}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700" />
                      処理中...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" />
                      公開を停止
                    </span>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* 非公開 */}
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                    <Lock className="w-4 h-4" />
                    非公開
                  </div>
                  <p className="text-sm text-gray-600">
                    このしおりは自分だけが閲覧できます
                  </p>
                </div>

                {/* 公開設定 */}
                <div className="space-y-3 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localSettings.isPublic}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, isPublic: e.target.checked })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 font-medium">公開する</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localSettings.allowPdfDownload}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, allowPdfDownload: e.target.checked })
                      }
                      disabled={!localSettings.isPublic}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-700">PDFダウンロードを許可</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      カスタムメッセージ（オプション）
                    </label>
                    <textarea
                      value={localSettings.customMessage}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, customMessage: e.target.value })
                      }
                      disabled={!localSettings.isPublic}
                      placeholder="閲覧者へのメッセージを入力..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50 disabled:bg-gray-50"
                      rows={3}
                    />
                  </div>
                </div>

                {/* 公開ボタン */}
                <button
                  onClick={handlePublish}
                  disabled={!localSettings.isPublic || isPublishing}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      公開中...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Globe className="w-4 h-4" />
                      公開URLを発行
                    </span>
                  )}
                </button>

                {!localSettings.isPublic && (
                  <p className="mt-3 text-xs text-gray-500 text-center">
                    「公開する」にチェックを入れてください
                  </p>
                )}
              </>
            )}

            {/* ヘルプテキスト */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                <strong>公開URL:</strong> 誰でもアクセス可能なリンクが発行されます
              </p>
              <p className="text-xs text-gray-500 mt-1">
                <strong>注意:</strong> 公開したしおりは他のユーザーと共有できます
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
