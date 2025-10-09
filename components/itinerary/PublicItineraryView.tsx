"use client";

import React, { useState, useEffect, useRef } from "react";
import { ItineraryData } from "@/types/itinerary";
import { ItineraryHeader } from "./ItineraryHeader";
import { ItinerarySummary } from "./ItinerarySummary";
import { DaySchedule } from "./DaySchedule";
import { ItineraryPDFLayout } from "./ItineraryPDFLayout";
import { PDFPreviewModal } from "./PDFPreviewModal";
import { Download, Share2, Copy, Check, Loader2, Eye } from "lucide-react";
import { generateItineraryPDF, generateFilename } from "@/lib/utils/pdf-generator";
import { showToast } from "@/components/ui/Toast";

interface PublicItineraryViewProps {
  slug: string;
  itinerary: ItineraryData;
}

/**
 * Phase 8: 公開しおり閲覧用コンポーネント（Read-only、Database版）
 */
export default function PublicItineraryView({
  slug,
  itinerary,
}: PublicItineraryViewProps) {
  const [copied, setCopied] = useState(false);
  const [publishedDate, setPublishedDate] = useState<string>("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // クライアントサイドで日付をフォーマット（ハイドレーションエラー回避）
  useEffect(() => {
    if (itinerary.publishedAt) {
      setPublishedDate(
        new Date(itinerary.publishedAt).toLocaleDateString("ja-JP")
      );
    }
  }, [itinerary.publishedAt]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = itinerary
      ? `${itinerary.destination}への旅行計画を見てください！`
      : "旅のしおりを共有します";

    if (navigator.share) {
      try {
        await navigator.share({
          title: itinerary?.title || "旅のしおり",
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // ユーザーがキャンセルした場合は何もしない
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
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
      console.error("Error copying URL:", error);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      setPdfProgress(0);
      setShowPreview(true);

      // PDF専用レイアウトを一時的にDOMに追加
      await new Promise(resolve => setTimeout(resolve, 100)); // DOMレンダリング待機

      const filename = generateFilename(itinerary);
      
      const result = await generateItineraryPDF('pdf-export-container-public', {
        filename,
        quality: 0.95,
        margin: 10,
        onProgress: (p) => setPdfProgress(p),
      });

      if (result.success) {
        showToast({
          type: 'success',
          message: `PDFを保存しました: ${result.filename}`,
          duration: 4000,
        });
      } else {
        throw new Error(result.error || '不明なエラー');
      }
    } catch (error) {
      console.error('PDF生成エラー:', error);
      showToast({
        type: 'error',
        message: 'PDF生成に失敗しました。もう一度お試しください。',
        duration: 4000,
      });
    } finally {
      setIsGeneratingPDF(false);
      setPdfProgress(0);
      // プレビューを少し遅延して閉じる
      setTimeout(() => setShowPreview(false), 500);
    }
  };

  const handlePreviewPDF = () => {
    setShowPreviewModal(true);
  };

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
                  <span className="hidden sm:inline text-green-600">
                    コピー済み
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">URLコピー</span>
                </>
              )}
            </button>

            {/* PDFボタン */}
            {itinerary.allowPdfDownload && (
              <>
                {/* プレビューボタン */}
                <button
                  onClick={handlePreviewPDF}
                  disabled={isGeneratingPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  title="PDFプレビュー"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">プレビュー</span>
                </button>

                {/* PDFダウンロードボタン */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  title="PDFダウンロード"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">{pdfProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">PDF</span>
                    </>
                  )}
                </button>
              </>
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
            このしおりは{" "}
            <a href="/" className="text-blue-600 hover:underline font-medium">
              Journee
            </a>{" "}
            で作成されました
          </p>
          {itinerary.viewCount !== undefined && (
            <p className="mt-2 text-sm text-gray-400">
              閲覧数: {itinerary.viewCount.toLocaleString()}
            </p>
          )}
          {publishedDate && (
            <p className="mt-1 text-xs text-gray-400">
              公開日: {publishedDate}
            </p>
          )}
        </div>

        {/* PDFプレビューモーダル */}
        <PDFPreviewModal
          itinerary={itinerary}
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          onExport={() => {
            setShowPreviewModal(false);
            handleDownloadPDF();
          }}
        />

        {/* PDF専用レイアウト（非表示） */}
        {showPreview && (
          <div 
            ref={pdfContainerRef}
            className="fixed -left-[9999px] -top-[9999px] opacity-0 pointer-events-none"
            aria-hidden="true"
          >
            <div id="pdf-export-container-public">
              <ItineraryPDFLayout itinerary={itinerary} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
