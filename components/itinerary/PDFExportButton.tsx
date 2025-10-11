/**
 * Phase 6.3: PDF出力ボタンコンポーネント
 * useItineraryPDF Hookを活用してロジックを分離
 */

'use client';

import React, { useState } from 'react';
import { FileDown, Loader2, Eye } from 'lucide-react';
import type { ItineraryData } from '@/types/itinerary';
import { useItineraryPDF } from '@/lib/hooks/itinerary';
import { ItineraryPDFLayout } from './ItineraryPDFLayout';
import { PDFPreviewModal } from './PDFPreviewModal';

interface PDFExportButtonProps {
  itinerary: ItineraryData;
  className?: string;
  /** プレビューボタンを表示するか */
  showPreviewButton?: boolean;
}

/**
 * Phase 12.1: PDFExportButton（メモ化版）
 */
export const PDFExportButton = React.memo<PDFExportButtonProps>(({ 
  itinerary,
  className = '',
  showPreviewButton = true
}) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // useItineraryPDF Hookを活用
  const {
    generatePDF,
    isGenerating,
    progress,
    showPreview,
  } = useItineraryPDF();

  // PDF生成処理
  const handleExportPDF = async () => {
    await generatePDF(itinerary, 'pdf-export-container');
  };

  return (
    <>
      {/* ボタングループ */}
      <div className="flex items-center gap-3">
        {/* プレビューボタン */}
        {showPreviewButton && (
          <button
            onClick={() => setShowPreviewModal(true)}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 text-blue-600 bg-white border-2 border-blue-500 rounded-xl hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
          >
            <Eye className="w-5 h-5" />
            <span className="font-semibold">プレビュー</span>
          </button>
        )}

        {/* PDF出力ボタン */}
        <button
          onClick={handleExportPDF}
          disabled={isGenerating}
          className={`
            group flex items-center gap-3 px-8 py-4 
            bg-gradient-to-r from-blue-500 to-blue-600 
            text-white rounded-xl 
            hover:from-blue-600 hover:to-blue-700 
            focus:outline-none focus:ring-4 focus:ring-blue-300 
            shadow-lg hover:shadow-xl 
            transition-all duration-200 
            disabled:opacity-60 disabled:cursor-not-allowed
            disabled:hover:shadow-lg
            transform hover:scale-105 active:scale-95
            ${className}
          `}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <div className="flex flex-col items-start">
                <span className="text-lg font-semibold">PDF生成中...</span>
                <span className="text-xs text-blue-100">{progress}%</span>
              </div>
            </>
          ) : (
            <>
              <FileDown className="w-6 h-6 group-hover:animate-bounce" />
              <span className="text-lg font-semibold">PDFで保存</span>
            </>
          )}
        </button>
      </div>

      {/* PDFプレビューモーダル */}
      <PDFPreviewModal
        itinerary={itinerary}
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onExport={() => {
          setShowPreviewModal(false);
          handleExportPDF();
        }}
      />

      {/* PDF専用レイアウト（非表示） */}
      {showPreview && (
        <div 
          className="fixed -left-[9999px] -top-[9999px] opacity-0 pointer-events-none"
          aria-hidden="true"
        >
          <div id="pdf-export-container">
            <ItineraryPDFLayout itinerary={itinerary} />
          </div>
        </div>
      )}
    </>
  );
});

PDFExportButton.displayName = 'PDFExportButton';
