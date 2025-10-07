/**
 * PDF出力ボタンコンポーネント
 * 
 * しおりをPDFとして出力する機能
 * - プログレス表示
 * - エラーハンドリング
 * - Toast通知
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FileDown, Loader2, Eye } from 'lucide-react';
import type { ItineraryData } from '@/types/itinerary';
import { generateItineraryPDF, generateFilename } from '@/lib/utils/pdf-generator';
import { ItineraryPDFLayout } from './ItineraryPDFLayout';
import { PDFPreviewModal } from './PDFPreviewModal';
import { showToast } from '@/components/ui/Toast';

interface PDFExportButtonProps {
  itinerary: ItineraryData;
  className?: string;
  /** プレビューボタンを表示するか */
  showPreviewButton?: boolean;
}

export const PDFExportButton: React.FC<PDFExportButtonProps> = ({ 
  itinerary,
  className = '',
  showPreviewButton = true
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // PDF生成処理
  const handleExportPDF = async () => {
    try {
      setIsGenerating(true);
      setProgress(0);
      setShowPreview(true);

      // PDF専用レイアウトを一時的にDOMに追加
      await new Promise(resolve => setTimeout(resolve, 100)); // DOMレンダリング待機

      const filename = generateFilename(itinerary);
      
      const result = await generateItineraryPDF('pdf-export-container', {
        filename,
        quality: 0.95,
        margin: 10,
        onProgress: (p) => setProgress(p),
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
      setIsGenerating(false);
      setProgress(0);
      // プレビューを少し遅延して閉じる
      setTimeout(() => setShowPreview(false), 500);
    }
  };

  // プレビューが表示されるときにスクロール位置を調整
  useEffect(() => {
    if (showPreview && pdfContainerRef.current) {
      pdfContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showPreview]);

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
          ref={pdfContainerRef}
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
};
