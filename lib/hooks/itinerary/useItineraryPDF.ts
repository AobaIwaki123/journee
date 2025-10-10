/**
 * useItineraryPDF - PDF生成ロジック
 * 
 * PDF生成処理とプログレス管理をカプセル化するカスタムHook
 * Phase 6.1: 実際のPDF生成ロジックに対応
 */

import { useCallback, useState } from 'react';
import type { ItineraryData } from '@/types/itinerary';
import { generateItineraryPDF, generateFilename } from '@/lib/utils/pdf-generator';
import { showToast } from '@/components/ui/Toast';

export interface UseItineraryPDFOptions {
  quality?: number;
  margin?: number;
}

export interface PDFResult {
  success: boolean;
  filename?: string;
  blob?: Blob;
  error?: string;
}

export interface UseItineraryPDFReturn {
  // State
  isGenerating: boolean;
  progress: number; // 0-100
  error: Error | null;
  
  // Operations
  generatePDF: (itinerary: ItineraryData, elementId: string) => Promise<PDFResult>;
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
  } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // PDF生成処理
  const generatePDFDocument = useCallback(
    async (itinerary: ItineraryData, elementId: string): Promise<PDFResult> => {
      setIsGenerating(true);
      setProgress(0);
      setError(null);
      setShowPreview(true); // プレビュー表示

      try {
        // DOMレンダリング待機
        await new Promise((resolve) => setTimeout(resolve, 100));

        const filename = generateFilename(itinerary);

        // プログレスコールバック
        const onProgress = (progressValue: number) => {
          setProgress(progressValue);
        };

        // PDF生成
        const result = await generateItineraryPDF(elementId, {
          filename,
          quality,
          margin,
          onProgress,
        });

        if (!result.success) {
          throw new Error(result.error || 'PDF generation failed');
        }

        setProgress(100);
        showToast({
          type: 'success',
          message: `PDFを保存しました: ${result.filename}`,
          duration: 4000,
        });

        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
        showToast({
          type: 'error',
          message: 'PDF生成に失敗しました。もう一度お試しください。',
          duration: 4000,
        });

        return {
          success: false,
          filename: '',
          error: errorObj.message,
        };
      } finally {
        setIsGenerating(false);
        setProgress(0);
        // プレビューを少し遅延して閉じる
        setTimeout(() => setShowPreview(false), 500);
      }
    },
    [quality, margin]
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
