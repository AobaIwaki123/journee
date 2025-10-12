"use client";

import React, { useState, useEffect, useRef } from "react";
import { ItineraryData } from "@/types/itinerary";
import { Comment } from "@/types/comment";
import { ItineraryHeader } from "./ItineraryHeader";
import { ItinerarySummary } from "./ItinerarySummary";
import { DaySchedule } from "./DaySchedule";
import { MapView } from "./MapView";
import CommentList from "@/components/comments/CommentList";
import { formatDate } from "@/lib/utils/date-utils";
import { ItineraryPDFLayout } from "./ItineraryPDFLayout";
import { PDFPreviewModal } from "./PDFPreviewModal";
import {
  Download,
  Share2,
  Copy,
  Check,
  Loader2,
  Eye,
  EyeOff,
  LogIn,
  Map,
} from "lucide-react";
import {
  generateItineraryPDF,
  generateFilename,
} from "@/lib/utils/pdf-generator";
import { showToast } from "@/components/ui/Toast";

interface PublicItineraryViewProps {
  slug: string;
  itinerary: ItineraryData;
  currentUserId?: string | null;
  initialComments?: Comment[];
  initialCommentCount?: number;
}

/**
 * Phase 8 + Phase 11: 公開しおり閲覧用コンポーネント（Read-only、Database版 + コメント機能）
 */
export default function PublicItineraryView({
  slug,
  itinerary,
  currentUserId = null,
  initialComments = [],
  initialCommentCount = 0,
}: PublicItineraryViewProps) {
  const [copied, setCopied] = useState(false);
  const [publishedDate, setPublishedDate] = useState<string>("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [mapHeight, setMapHeight] = useState<string>("400px");
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // 位置情報を持つスポットが存在するかチェック
  const hasLocationData = itinerary.schedule.some((day) =>
    day.spots.some(
      (spot) =>
        spot.location &&
        typeof spot.location.lat === "number" &&
        typeof spot.location.lng === "number"
    )
  );

  // 位置情報がある場合はデフォルトで地図を表示
  const [showMap, setShowMap] = useState(hasLocationData);

  // レスポンシブな地図の高さを設定
  useEffect(() => {
    const updateMapHeight = () => {
      if (typeof window !== "undefined") {
        const width = window.innerWidth;
        if (width < 640) {
          setMapHeight("300px"); // モバイル
        } else if (width < 1024) {
          setMapHeight("400px"); // タブレット
        } else {
          setMapHeight("500px"); // デスクトップ
        }
      }
    };

    updateMapHeight();
    window.addEventListener("resize", updateMapHeight);
    return () => window.removeEventListener("resize", updateMapHeight);
  }, []);

  // クライアントサイドで日付をフォーマット（ハイドレーションエラー回避）
  useEffect(() => {
    if (itinerary.publishedAt) {
      setPublishedDate(formatDate(itinerary.publishedAt, "short"));
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
      await new Promise((resolve) => setTimeout(resolve, 100)); // DOMレンダリング待機

      const filename = generateFilename(itinerary);

      const result = await generateItineraryPDF("pdf-export-container-public", {
        filename,
        quality: 0.95,
        margin: 10,
        onProgress: (p) => setPdfProgress(p),
      });

      if (result.success) {
        showToast({
          type: "success",
          message: `PDFを保存しました: ${result.filename}`,
          duration: 4000,
        });
      } else {
        throw new Error(result.error || "不明なエラー");
      }
    } catch (error) {
      console.error("PDF生成エラー:", error);
      showToast({
        type: "error",
        message: "PDF生成に失敗しました。もう一度お試しください。",
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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="bg-blue-500 rounded-lg p-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Journee</h1>
              <p className="text-sm text-gray-500">共有されたしおり</p>
            </div>
          </a>
          <div className="flex gap-2 items-center">
            {/* ログインボタン（ログインしていない場合のみ表示） */}
            {!currentUserId && (
              <a
                href={`/login?callbackUrl=/share/${slug}`}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition shadow-sm"
                title="ログイン"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">ログイン</span>
              </a>
            )}
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

        {/* 地図表示セクション */}
        {hasLocationData && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Map className="w-5 h-5" />
                ルートマップ
              </h2>
              <button
                onClick={() => setShowMap(!showMap)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                title={showMap ? "地図を非表示" : "地図を表示"}
              >
                {showMap ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span className="hidden sm:inline">地図を非表示</span>
                  </>
                ) : (
                  <>
                    <Map className="w-4 h-4" />
                    <span className="hidden sm:inline">地図を表示</span>
                  </>
                )}
              </button>
            </div>
            {showMap && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <MapView
                  days={itinerary.schedule}
                  height={mapHeight}
                  showDaySelector={true}
                  numberingMode="perDay"
                />
              </div>
            )}
          </div>
        )}

        {/* コメントセクション（Phase 11） */}
        {itinerary.id ? (
          <div className="mt-12">
            <CommentList
              itineraryId={itinerary.id}
              initialComments={initialComments}
              initialTotal={initialCommentCount}
              currentUserId={currentUserId}
            />
          </div>
        ) : (
          <div className="mt-12 rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              コメント機能は現在利用できません
            </p>
          </div>
        )}

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
