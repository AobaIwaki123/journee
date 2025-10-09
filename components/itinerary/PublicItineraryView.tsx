"use client";

import React, { useState, useEffect } from "react";
import { ItineraryData } from "@/types/itinerary";
import { ItineraryHeader } from "./ItineraryHeader";
import { ItinerarySummary } from "./ItinerarySummary";
import { DaySchedule } from "./DaySchedule";
import { Download, Share2, Copy, Check } from "lucide-react";

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

  const handleDownloadPDF = () => {
    alert("PDF出力機能は近日実装予定です");
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
      </div>
    </div>
  );
}
