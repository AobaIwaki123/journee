/**
 * Phase 9.5: 公開しおり閲覧用コンポーネント（再構成版）
 * 
 * ヘッダー、スケジュール、コメントを分離
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { ItineraryData } from "@/types/itinerary";
import { Comment } from "@/types/comment";
import CommentList from "@/components/comments/CommentList";
import { formatDate } from "@/lib/utils/date-utils";
import { ItineraryPDFLayout } from "./ItineraryPDFLayout";
import { PDFPreviewModal } from "./PDFPreviewModal";
import { useItineraryPDF } from "@/lib/hooks/itinerary";
import { PublicItineraryHeader, PublicScheduleView } from "./public";
import { LogIn } from "lucide-react";

interface PublicItineraryViewProps {
  slug: string;
  itinerary: ItineraryData;
  currentUserId?: string | null;
  initialComments?: Comment[];
  initialCommentCount?: number;
}

export default function PublicItineraryView({
  slug,
  itinerary,
  currentUserId = null,
  initialComments = [],
  initialCommentCount = 0,
}: PublicItineraryViewProps) {
  const [copied, setCopied] = useState(false);
  const [publishedDate, setPublishedDate] = useState<string>("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const {
    isGenerating: isGeneratingPDF,
    progress: pdfProgress,
    showPreview,
    generatePDF,
  } = useItineraryPDF({ quality: 0.95, margin: 10 });

  // クライアントサイドで日付をフォーマット
  useEffect(() => {
    if (itinerary.publishedAt) {
      setPublishedDate(formatDate(itinerary.publishedAt, "short"));
    }
  }, [itinerary.publishedAt]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `${itinerary.destination}への旅行計画を見てください！`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: itinerary?.title || "旅のしおり",
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
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
    await generatePDF(itinerary, "pdf-export-container-public");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <PublicItineraryHeader
        itinerary={itinerary}
        publishedDate={publishedDate}
        onShare={handleShare}
        onCopyUrl={handleCopyUrl}
        onDownloadPDF={handleDownloadPDF}
        copied={copied}
        isGeneratingPDF={isGeneratingPDF}
        pdfProgress={pdfProgress}
      />

      {/* Schedule View */}
      <PublicScheduleView itinerary={itinerary} />

      {/* PDF Export Container (hidden) */}
      <div className="hidden">
        <div id="pdf-export-container-public" ref={pdfContainerRef}>
          <ItineraryPDFLayout itinerary={itinerary} />
        </div>
      </div>

      {/* Comments Section */}
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            コメント ({initialCommentCount})
          </h2>
          
          {currentUserId ? (
            <CommentList
              itineraryId={itinerary.id || slug}
              currentUserId={currentUserId}
              initialComments={initialComments}
            />
          ) : (
            <div className="text-center py-8">
              <LogIn className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">
                コメントを投稿するにはログインが必要です
              </p>
              <a
                href="/login"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ログイン
              </a>
            </div>
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && (
        <PDFPreviewModal
          itinerary={itinerary}
          isOpen={showPreview}
          onClose={() => {}}
          onExport={handleDownloadPDF}
        />
      )}
    </div>
  );
}
