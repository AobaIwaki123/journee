/**
 * PDFプレビューモーダル
 * 
 * PDF出力前にプレビューを表示するモーダル
 */

'use client';

import React from 'react';
import { X, FileDown } from 'lucide-react';
import type { ItineraryData } from '@/types/itinerary';
import { ItineraryPDFLayout } from './ItineraryPDFLayout';

interface PDFPreviewModalProps {
  itinerary: ItineraryData;
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  itinerary,
  isOpen,
  onClose,
  onExport,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* ヘッダー */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">PDFプレビュー</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              PDF出力
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* プレビューコンテンツ */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] bg-gray-100 p-6">
          <div className="bg-white shadow-lg mx-auto" style={{ width: '210mm' }}>
            <ItineraryPDFLayout itinerary={itinerary} />
          </div>
        </div>
      </div>
    </div>
  );
};
