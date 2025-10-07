'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ItineraryData } from '@/types/itinerary';
import { ItineraryHeader } from './ItineraryHeader';
import { ItinerarySummary } from './ItinerarySummary';
import { DaySchedule } from './DaySchedule';
import { Download, Share2, Copy, Check } from 'lucide-react';

interface PublicItineraryViewProps {
  slug: string;
}

/**
 * Phase 5.5: 公開しおり閲覧用コンポーネント（Read-only）
 */
export default function PublicItineraryView({ slug }: PublicItineraryViewProps) {
  const router = useRouter();
  const [itinerary, setItinerary] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Phase 5-7: LocalStorageから公開しおりを取得
    const loadPublicItinerary = () => {
      try {
        // 正しいLocalStorageキーを使用
        const publicItineraries = localStorage.getItem('journee_public_itineraries');
        console.log('[PublicItineraryView] Loading public itinerary for slug:', slug);
        console.log('[PublicItineraryView] LocalStorage data:', publicItineraries);
        
        if (publicItineraries) {
          const itineraries = JSON.parse(publicItineraries);
          const foundItinerary = itineraries[slug];
          
          console.log('[PublicItineraryView] Found itinerary:', foundItinerary);
          
          if (foundItinerary && foundItinerary.isPublic) {
            setItinerary(foundItinerary);
            setLoading(false);
          } else {
            // しおりが見つからないか非公開
            console.warn('[PublicItineraryView] Itinerary not found or not public');
            setLoading(false);
            setItinerary(null);
          }
        } else {
          console.warn('[PublicItineraryView] No public itineraries in LocalStorage');
          setLoading(false);
          setItinerary(null);
        }
      } catch (error) {
        console.error('[PublicItineraryView] Error loading public itinerary:', error);
        setLoading(false);
        setItinerary(null);
      }
    };

    loadPublicItinerary();
  }, [slug, router]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = itinerary 
      ? `${itinerary.destination}への旅行計画を見てください！` 
      : '旅のしおりを共有します';

    if (navigator.share) {
      try {
        await navigator.share({
          title: itinerary?.title || '旅のしおり',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // ユーザーがキャンセルした場合は何もしない
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // フォールバック: URLをコピー
      await handleCopyUrl();
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying URL:', error);
    }
  };

  const handleDownloadPDF = () => {
    // Phase 5.3: PDF出力機能と連携
    // TODO: PDF生成機能の実装後に有効化
    console.log('PDF ダウンロード（Phase 5.3で実装予定）');
    alert('PDF出力機能は近日実装予定です');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    // しおりが見つからない場合の表示
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 2l6 6" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            しおりが見つかりません
          </h1>
          
          <p className="text-gray-600 mb-8">
            指定されたしおりは存在しないか、非公開に設定されています。
          </p>
          
          <div className="space-y-4">
            <a
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              トップページへ戻る
            </a>
            
            <p className="text-sm text-gray-500 mt-4">
              自分の旅のしおりを作成したい場合は、<br />
              トップページから新規作成できます。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Journee</h1>
            <p className="text-sm text-gray-500">共有されたしおり</p>
          </div>
          <div className="flex gap-2">
            {/* 共有ボタン */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              title="共有"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">共有</span>
            </button>

            {/* URLコピーボタン */}
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              title="URLをコピー"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="hidden sm:inline text-green-600">コピー済み</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">URLコピー</span>
                </>
              )}
            </button>

            {/* PDFダウンロードボタン */}
            {itinerary.allowPdfDownload && (
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                title="PDFダウンロード"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* しおり本体 */}
      <div className="max-w-4xl mx-auto p-6">
        {/* カスタムメッセージ */}
        {itinerary.customMessage && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-gray-700">{itinerary.customMessage}</p>
          </div>
        )}

        {/* しおりヘッダー */}
        <ItineraryHeader itinerary={itinerary} editable={false} />
        
        {/* しおりサマリー */}
        <ItinerarySummary itinerary={itinerary} />
        
        {/* 日程表 */}
        <div className="mt-8 space-y-6">
          {itinerary.schedule.map((day, index) => (
            <DaySchedule
              key={day.date || `day-${index}`}
              day={day}
              dayIndex={index}
              editable={false} // Read-onlyモード
            />
          ))}
        </div>

        {/* フッター */}
        <div className="mt-12 pt-6 border-t text-center">
          <p className="text-sm text-gray-500">
            このしおりは{' '}
            <a
              href="/"
              className="text-blue-600 hover:underline font-medium"
            >
              Journee
            </a>{' '}
            で作成されました
          </p>
          {itinerary.viewCount !== undefined && (
            <p className="mt-2 text-sm text-gray-400">
              閲覧数: {itinerary.viewCount.toLocaleString()}
            </p>
          )}
          {itinerary.publishedAt && (
            <p className="mt-1 text-xs text-gray-400">
              公開日: {new Date(itinerary.publishedAt).toLocaleDateString('ja-JP')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
