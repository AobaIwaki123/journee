/**
 * Phase 9.5: PublicItineraryHeader
 * 
 * 公開しおりのヘッダー（タイトル・共有・PDF）
 */

'use client';

import React, { useState } from 'react';
import { ItineraryData } from '@/types/itinerary';
import { Share2, Copy, Check, Download, Loader2 } from 'lucide-react';

interface PublicItineraryHeaderProps {
  itinerary: ItineraryData;
  publishedDate: string;
  onShare: () => Promise<void>;
  onCopyUrl: () => Promise<void>;
  onDownloadPDF: () => Promise<void>;
  copied: boolean;
  isGeneratingPDF: boolean;
  pdfProgress: number;
}

export const PublicItineraryHeader: React.FC<PublicItineraryHeaderProps> = ({
  itinerary,
  publishedDate,
  onShare,
  onCopyUrl,
  onDownloadPDF,
  copied,
  isGeneratingPDF,
  pdfProgress,
}) => {
  return (
    <div className="bg-white border-b">
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {itinerary.title || '旅のしおり'}
            </h1>
            <p className="text-sm text-gray-500">公開日: {publishedDate}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onShare}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">共有</span>
            </button>

            <button
              onClick={onCopyUrl}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="URLをコピー"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {itinerary.allowPdfDownload && (
              <button
                onClick={onDownloadPDF}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">{Math.round(pdfProgress)}%</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
