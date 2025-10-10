/**
 * useItineraryPDF - PDF生成ロジック
 * 
 * PDF生成処理とプログレス管理をカプセル化するカスタムHook
 */

import { useCallback, useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import type { ItineraryData } from '@/types/itinerary';
import { generateItineraryPDF } from '@/lib/utils/pdf-generator';

export interface UseItineraryPDFOptions {
  quality?: number;
  margin?: number;
  format?: 'a4' | 'letter';
}

export interface PDFResult {
  success: boolean;
  filename: string;
  blob?: Blob;
  error?: string;
}

export interface UseItineraryPDFReturn {
  // State
  isGenerating: boolean;
  progress: number; // 0-100
  error: Error | null;
  
  // Operations
  generatePDF: (itinerary: ItineraryData) => Promise<PDFResult>;
  openPreview: () => void;
  closePreview: () => void;
  
  // Preview state
  showPreview: boolean;
  previewUrl: string | null;
}

/**
 * PDF生成用カスタムHook
 */
export function useItineraryPDF(
  options: UseItineraryPDFOptions = {}
): UseItineraryPDFReturn {
  const {
    quality = 0.95,
    margin = 10,
    format = 'a4',
  } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Zustand storeからトースト機能を取得
  const addToast = useStore((state) => state.addToast);

  // PDF生成処理
  const generatePDFDocument = useCallback(
    async (itinerary: ItineraryData): Promise<PDFResult> => {
      setIsGenerating(true);
      setProgress(0);
      setError(null);

      try {
        // プログレスコールバック
        const onProgress = (progressValue: number) => {
          setProgress(progressValue);
        };

        // PDF生成
        // TODO: generateItineraryPDFは要素IDを受け取るので、使い方を調整する必要がある
        // ここでは一旦モックの実装として成功を返す
        const result: PDFResult = {
          success: true,
          filename: `${itinerary.title}.pdf`,
        };

        if (!result.success) {
          throw new Error(result.error || 'PDF generation failed');
        }

        setProgress(100);
        addToast('PDFを生成しました', 'success');

        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
        addToast('PDF生成に失敗しました', 'error');

        return {
          success: false,
          filename: '',
          error: errorObj.message,
        };
      } finally {
        setIsGenerating(false);
      }
    },
    [quality, margin, format, addToast]
  );

  // プレビューを開く
  const openPreview = useCallback(() => {
    setShowPreview(true);
  }, []);

  // プレビューを閉じる
  const closePreview = useCallback(() => {
    setShowPreview(false);
    // プレビューURLをクリーンアップ
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  return {
    // State
    isGenerating,
    progress,
    error,

    // Operations
    generatePDF: generatePDFDocument,
    openPreview,
    closePreview,

    // Preview state
    showPreview,
    previewUrl,
  };
}
