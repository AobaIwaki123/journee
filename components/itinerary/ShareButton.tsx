'use client';

import React, { useState } from 'react';
import { Share2, Link2, Copy, Check, Globe, Lock, Download, X } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import { PublicItinerarySettings } from '@/types/itinerary';

/**
 * Phase 5.5: しおり公開・共有ボタンコンポーネント
 */
export const ShareButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const currentItinerary = useStore((state: any) => state.currentItinerary);
  const publishItinerary = useStore((state: any) => state.publishItinerary);
  const unpublishItinerary = useStore((state: any) => state.unpublishItinerary);
  const updatePublicSettings = useStore((state: any) => state.updatePublicSettings);
  const addToast = useStore((state: any) => state.addToast);
  
  const [settings, setSettings] = useState<PublicItinerarySettings>({
    isPublic: currentItinerary?.isPublic || false,
    allowPdfDownload: currentItinerary?.allowPdfDownload ?? true,
    customMessage: currentItinerary?.customMessage || '',
  });

  if (!currentItinerary) {
    return null;
  }

  const publicUrl = currentItinerary.publicSlug
    ? `${window.location.origin}/share/${currentItinerary.publicSlug}`
    : '';

  const handlePublish = async () => {
    setIsPublishing(true);
    
    try {
      const result = await publishItinerary(settings);
      
      if (result.success) {
        addToast('しおりを公開しました！', 'success');
        setSettings({ ...settings, isPublic: true });
      } else {
        addToast(result.error || '公開に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error publishing:', error);
      addToast('公開に失敗しました', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('しおりを非公開にしますか？公開URLは無効になります。')) {
      return;
    }

    setIsPublishing(true);
    
    try {
      const result = await unpublishItinerary();
      
      if (result.success) {
        addToast('しおりを非公開にしました', 'success');
        setSettings({ ...settings, isPublic: false });
      } else {
        addToast(result.error || '非公開化に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error unpublishing:', error);
      addToast('非公開化に失敗しました', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUpdateSettings = () => {
    updatePublicSettings({
      allowPdfDownload: settings.allowPdfDownload,
      customMessage: settings.customMessage,
    });
    addToast('設定を更新しました', 'success');
  };

  const copyPublicUrl = async () => {
    if (!publicUrl) return;

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      addToast('URLをコピーしました', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying URL:', error);
      addToast('URLのコピーに失敗しました', 'error');
    }
  };

  const handleShare = async () => {
    if (!publicUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: currentItinerary.title,
          text: `${currentItinerary.destination}への旅行計画を見てください！`,
          url: publicUrl,
        });
      } catch (error) {
        // ユーザーがキャンセルした場合は何もしない
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // フォールバック: URLコピー
      await copyPublicUrl();
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
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* パネル */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-20">
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

            {currentItinerary.isPublic ? (
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
                      onClick={copyPublicUrl}
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

                {/* 公開設定 */}
                <div className="space-y-3 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.allowPdfDownload}
                      onChange={(e) =>
                        setSettings({ ...settings, allowPdfDownload: e.target.checked })
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
                      value={settings.customMessage}
                      onChange={(e) =>
                        setSettings({ ...settings, customMessage: e.target.value })
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
                {(settings.allowPdfDownload !== currentItinerary.allowPdfDownload ||
                  settings.customMessage !== currentItinerary.customMessage) && (
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
                      checked={settings.isPublic}
                      onChange={(e) =>
                        setSettings({ ...settings, isPublic: e.target.checked })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 font-medium">公開する</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.allowPdfDownload}
                      onChange={(e) =>
                        setSettings({ ...settings, allowPdfDownload: e.target.checked })
                      }
                      disabled={!settings.isPublic}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-700">PDFダウンロードを許可</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      カスタムメッセージ（オプション）
                    </label>
                    <textarea
                      value={settings.customMessage}
                      onChange={(e) =>
                        setSettings({ ...settings, customMessage: e.target.value })
                      }
                      disabled={!settings.isPublic}
                      placeholder="閲覧者へのメッセージを入力..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50 disabled:bg-gray-50"
                      rows={3}
                    />
                  </div>
                </div>

                {/* 公開ボタン */}
                <button
                  onClick={handlePublish}
                  disabled={!settings.isPublic || isPublishing}
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

                {!settings.isPublic && (
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
                <strong>注意:</strong> Phase 8以降で他ユーザーとの共有が可能になります
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
