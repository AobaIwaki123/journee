'use client';

import React, { memo, useState } from 'react';
import { Calendar, MapPin, Clock, Download, Eye } from 'lucide-react';
import { ItineraryData } from '@/types/itinerary';
import { EditableTitle } from './EditableTitle';
import { downloadItineraryPDF, previewItineraryPDF } from '@/lib/utils/pdf-generator';

interface ItineraryHeaderProps {
  itinerary: ItineraryData;
  editable?: boolean;
}

export const ItineraryHeader: React.FC<ItineraryHeaderProps> = memo(({ itinerary, editable = true }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      await downloadItineraryPDF(itinerary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDFのダウンロードに失敗しました');
      console.error('PDF download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreviewPDF = async () => {
    setIsPreviewing(true);
    setError(null);
    try {
      await previewItineraryPDF(itinerary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDFのプレビューに失敗しました');
      console.error('PDF preview error:', err);
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white p-8 shadow-lg">
      <div className="max-w-4xl mx-auto">
        {/* タイトル */}
        {editable ? (
          <EditableTitle 
            value={itinerary.title}
            className="text-4xl font-bold mb-4 drop-shadow-lg"
          />
        ) : (
          <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">
            {itinerary.title}
          </h1>
        )}

        {/* 基本情報 */}
        <div className="flex flex-wrap items-center gap-6 text-blue-50 mb-4">
          {/* 目的地 */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
            <MapPin className="w-5 h-5" />
            <span className="font-medium">{itinerary.destination}</span>
          </div>

          {/* 期間 */}
          {itinerary.startDate && itinerary.endDate && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">
                {itinerary.startDate} - {itinerary.endDate}
              </span>
            </div>
          )}

          {/* 日数 */}
          {itinerary.duration && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Clock className="w-5 h-5" />
              <span className="font-medium">{itinerary.duration}日間</span>
            </div>
          )}
        </div>

        {/* サマリー */}
        {itinerary.summary && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
            <p className="text-blue-50 leading-relaxed text-sm md:text-base">
              {itinerary.summary}
            </p>
          </div>
        )}

        {/* ステータスバッジとPDFアクション */}
        <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              itinerary.status === 'completed'
                ? 'bg-green-400 text-green-900'
                : itinerary.status === 'archived'
                ? 'bg-gray-400 text-gray-900'
                : 'bg-yellow-400 text-yellow-900'
            }`}
          >
            {itinerary.status === 'completed'
              ? '完成'
              : itinerary.status === 'archived'
              ? 'アーカイブ'
              : '下書き'}
          </span>

          {/* PDFアクションボタン */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviewPDF}
              disabled={isPreviewing || isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="PDFプレビュー"
            >
              <Eye size={16} />
              <span className="text-sm font-medium">
                {isPreviewing ? 'プレビュー中...' : 'プレビュー'}
              </span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading || isPreviewing}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              aria-label="PDFダウンロード"
            >
              <Download size={16} />
              <span className="text-sm">
                {isDownloading ? 'ダウンロード中...' : 'PDFダウンロード'}
              </span>
            </button>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mt-3 p-3 bg-red-500/20 backdrop-blur-sm rounded-lg border border-red-300/30">
            <p className="text-sm text-red-100">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
});

ItineraryHeader.displayName = 'ItineraryHeader';