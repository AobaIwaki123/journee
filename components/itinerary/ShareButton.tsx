'use client';

import React, { useState, useEffect } from 'react';
import { Share2, Link2, Copy, Check, Globe, Lock, Download, X } from 'lucide-react';
import { useItineraryStore } from '@/lib/store/itinerary';
import { useItineraryPublish } from '@/lib/hooks/itinerary';
import type { PublicItinerarySettings } from '@/types/itinerary';

/**
 * Phase 10: しおり公開・共有ボタン（useItineraryPublish使用）
 */
export const ShareButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Phase 10: useItineraryStoreを使用
  const { currentItinerary } = useItineraryStore();
  
  // useItineraryPublish Hookを活用
  const {
    isPublic,
    publicUrl,
    isPublishing,
    publish,
    unpublish,
    updateSettings,
    copyPublicUrl: copyUrl,
    shareViaWebApi,
  } = useItineraryPublish();

  // ローカル設定状態（フォーム用）
  const [localSettings, setLocalSettings] = useState<PublicItinerarySettings>({
    isPublic: currentItinerary?.isPublic || false,
    allowPdfDownload: currentItinerary?.allowPdfDownload || false,
    customMessage: currentItinerary?.customMessage || '',
  });

  // currentItineraryが変更されたらローカル設定を同期
  useEffect(() => {
    setLocalSettings({
      isPublic: currentItinerary?.isPublic || false,
      allowPdfDownload: currentItinerary?.allowPdfDownload || false,
      customMessage: currentItinerary?.customMessage || '',
    });
  }, [currentItinerary]);

  const handlePublish = async () => {
    const result = await publish(localSettings);
    if (result.success) {
      setIsOpen(false);
    }
  };

  const handleUnpublish = async () => {
    if (confirm('しおりを非公開にしますか？')) {
      await unpublish();
      setIsOpen(false);
    }
  };

  const handleCopyUrl = async () => {
    const success = await copyUrl();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    await shareViaWebApi();
  };

  if (!currentItinerary) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isPublic
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
        title={isPublic ? '公開中' : '公開設定'}
      >
        {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        <span className="hidden md:inline">
          {isPublic ? '公開中' : '公開'}
        </span>
      </button>

      {/* 設定モーダル */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">公開設定</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* コンテンツ */}
            <div className="p-6 space-y-6">
              {/* 公開状態トグル */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">しおりを公開する</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    URLを知っている人なら誰でも閲覧できるようになります
                  </p>
                </div>
                <button
                  onClick={() => setLocalSettings({ ...localSettings, isPublic: !localSettings.isPublic })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localSettings.isPublic ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localSettings.isPublic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* PDF ダウンロード許可 */}
              {localSettings.isPublic && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-gray-600" />
                      <h3 className="font-medium text-gray-900">PDFダウンロードを許可</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      閲覧者がしおりをPDFとしてダウンロードできます
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        allowPdfDownload: !localSettings.allowPdfDownload,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      localSettings.allowPdfDownload ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        localSettings.allowPdfDownload ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* カスタムメッセージ */}
              {localSettings.isPublic && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    閲覧者へのメッセージ（任意）
                  </label>
                  <textarea
                    value={localSettings.customMessage || ''}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        customMessage: e.target.value,
                      })
                    }
                    placeholder="例: この旅行計画を参考にしてください！質問があればコメントしてくださいね。"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* 公開URL表示 */}
              {isPublic && publicUrl && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">公開URL</span>
                    <button
                      onClick={handleCopyUrl}
                      className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          コピー済み
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          コピー
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded border border-blue-200">
                    <Link2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate flex-1">
                      {publicUrl}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* フッター */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div>
                {isPublic && (
                  <button
                    onClick={handleUnpublish}
                    disabled={isPublishing}
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    非公開にする
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {isPublic && (
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    共有
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  閉じる
                </button>
                {!isPublic && (
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isPublishing ? '公開中...' : '公開する'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
