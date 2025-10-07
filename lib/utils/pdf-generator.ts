/**
 * PDF生成ユーティリティ
 * 
 * しおりのHTMLをPDFに変換する機能を提供
 * - html2canvasでHTML→Canvas変換
 * - jsPDFでCanvas→PDF変換
 * - 日本語フォント対応
 * - A4サイズ最適化
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { ItineraryData } from '@/types/itinerary';

/**
 * PDF生成オプション
 */
export interface PDFGenerationOptions {
  /** ファイル名（拡張子なし） */
  filename?: string;
  /** 画質（0.1 - 1.0） */
  quality?: number;
  /** ページ余白（mm） */
  margin?: number;
  /** プログレスコールバック */
  onProgress?: (progress: number) => void;
}

/**
 * PDF生成結果
 */
export interface PDFGenerationResult {
  success: boolean;
  filename?: string;
  error?: string;
}

/**
 * しおりをPDFとして出力
 * 
 * @param elementId - PDF化するHTML要素のID
 * @param options - PDF生成オプション
 * @returns PDF生成結果
 */
export async function generateItineraryPDF(
  elementId: string,
  options: PDFGenerationOptions = {}
): Promise<PDFGenerationResult> {
  try {
    const {
      filename = 'itinerary',
      quality = 0.95,
      margin = 10,
      onProgress
    } = options;

    // 進捗: 開始
    onProgress?.(0);

    // HTML要素を取得
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`要素が見つかりません: ${elementId}`);
    }

    // 進捗: HTML→Canvas変換開始
    onProgress?.(20);

    // HTML→Canvas変換
    const canvas = await html2canvas(element, {
      useCORS: true, // CORS対応
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    } as any); // 型定義の問題を回避

    // 進捗: Canvas→PDF変換開始
    onProgress?.(60);

    // Canvas→PDF変換
    const imgData = canvas.toDataURL('image/jpeg', quality);
    
    // A4サイズ（210mm x 297mm）
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // ページサイズを計算
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // 余白を考慮した実際の描画領域
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = pdfHeight - (margin * 2);

    // 画像のアスペクト比を維持してサイズを計算
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(contentWidth / imgWidth, contentHeight / imgHeight);
    
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;

    // 複数ページに分割
    let heightLeft = scaledHeight;
    let position = 0;
    let page = 1;

    // 最初のページ
    pdf.addImage(
      imgData,
      'JPEG',
      margin,
      margin,
      scaledWidth,
      scaledHeight,
      undefined,
      'FAST'
    );

    heightLeft -= contentHeight;

    // 追加ページ
    while (heightLeft > 0) {
      position = heightLeft - scaledHeight;
      pdf.addPage();
      pdf.addImage(
        imgData,
        'JPEG',
        margin,
        position + margin,
        scaledWidth,
        scaledHeight,
        undefined,
        'FAST'
      );
      heightLeft -= contentHeight;
      page++;
    }

    // 進捗: 保存開始
    onProgress?.(90);

    // PDF保存
    const finalFilename = `${filename}.pdf`;
    pdf.save(finalFilename);

    // 進捗: 完了
    onProgress?.(100);

    return {
      success: true,
      filename: finalFilename,
    };
  } catch (error) {
    console.error('PDF生成エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラー',
    };
  }
}

/**
 * しおりデータからファイル名を生成
 * 
 * @param itinerary - しおりデータ
 * @returns ファイル名（拡張子なし）
 */
export function generateFilename(itinerary: ItineraryData): string {
  const { destination, startDate, title } = itinerary;
  
  // 日付フォーマット（YYYY-MM-DD → YYYYMMDD）
  const dateStr = startDate ? startDate.replace(/-/g, '') : '';
  
  // ファイル名を生成（スペースを削除、特殊文字を除去）
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9ぁ-んァ-ヶー一-龠]/g, '_');
  const sanitizedDestination = destination.replace(/[^a-zA-Z0-9ぁ-んァ-ヶー一-龠]/g, '_');
  
  return `${sanitizedDestination}_${dateStr}_${sanitizedTitle}`;
}

/**
 * PDF印刷用のスタイルを適用
 * 
 * @param elementId - 対象要素のID
 */
export function applyPrintStyles(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  // 印刷用クラスを追加
  element.classList.add('pdf-print-mode');
}

/**
 * PDF印刷用のスタイルを削除
 * 
 * @param elementId - 対象要素のID
 */
export function removePrintStyles(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  // 印刷用クラスを削除
  element.classList.remove('pdf-print-mode');
}
