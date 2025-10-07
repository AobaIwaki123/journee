/**
 * PDF生成ユーティリティ
 * しおりデータからPDFを生成する機能を提供
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ItineraryData, TouristSpot } from "@/types/itinerary";

// jsPDFの型拡張（autoTableプラグイン用）
declare module "jspdf" {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

/**
 * カテゴリーの日本語表示
 */
const CATEGORY_LABELS: Record<string, string> = {
  sightseeing: "観光",
  dining: "食事",
  transportation: "移動",
  accommodation: "宿泊",
  other: "その他",
};

/**
 * 通貨フォーマット
 */
function formatCurrency(amount: number | undefined, currency: string = "JPY"): string {
  if (!amount && amount !== 0) return "-";
  
  if (currency === "JPY") {
    return `¥${amount.toLocaleString()}`;
  }
  return `${amount.toLocaleString()} ${currency}`;
}

/**
 * 日付フォーマット
 */
function formatDate(dateString: string | undefined): string {
  if (!dateString) return "-";
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[date.getDay()];
  
  return `${year}年${month}月${day}日（${weekday}）`;
}

/**
 * テキストを折り返す（日本語対応）
 */
function wrapText(text: string, maxWidth: number, doc: jsPDF): string[] {
  const lines: string[] = [];
  const words = text.split("");
  let currentLine = "";
  
  for (const char of words) {
    const testLine = currentLine + char;
    const width = doc.getTextWidth(testLine);
    
    if (width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * PDFヘッダーを描画
 */
function drawHeader(doc: jsPDF, itinerary: ItineraryData): number {
  let yPos = 20;
  
  // タイトル
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  const titleLines = wrapText(itinerary.title, 180, doc);
  titleLines.forEach((line, index) => {
    doc.text(line, 105, yPos + (index * 10), { align: "center" });
  });
  yPos += titleLines.length * 10 + 5;
  
  // 基本情報
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  
  const destination = `目的地: ${itinerary.destination}`;
  doc.text(destination, 105, yPos, { align: "center" });
  yPos += 7;
  
  if (itinerary.startDate && itinerary.endDate) {
    const period = `期間: ${formatDate(itinerary.startDate)} 〜 ${formatDate(itinerary.endDate)}`;
    doc.text(period, 105, yPos, { align: "center" });
    yPos += 7;
  }
  
  if (itinerary.duration) {
    const duration = `旅行日数: ${itinerary.duration}日間`;
    doc.text(duration, 105, yPos, { align: "center" });
    yPos += 7;
  }
  
  // 概要
  if (itinerary.summary) {
    yPos += 5;
    doc.setFontSize(10);
    const summaryLines = wrapText(itinerary.summary, 180, doc);
    summaryLines.forEach((line, index) => {
      doc.text(line, 105, yPos + (index * 5), { align: "center" });
    });
    yPos += summaryLines.length * 5 + 5;
  }
  
  // 総予算
  if (itinerary.totalBudget) {
    yPos += 3;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const budget = `総予算: ${formatCurrency(itinerary.totalBudget, itinerary.currency)}`;
    doc.text(budget, 105, yPos, { align: "center" });
    yPos += 10;
  }
  
  // 区切り線
  doc.setLineWidth(0.5);
  doc.line(15, yPos, 195, yPos);
  yPos += 10;
  
  return yPos;
}

/**
 * 日程セクションを描画
 */
function drawDaySchedule(
  doc: jsPDF,
  day: number,
  schedule: ItineraryData["schedule"][0],
  startY: number
): number {
  let yPos = startY;
  
  // ページの残りスペースをチェック
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  // 日付ヘッダー
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(59, 130, 246); // blue-500
  doc.rect(15, yPos - 5, 180, 10, "F");
  doc.setTextColor(255, 255, 255);
  
  const dayTitle = `${day}日目${schedule.date ? ` - ${formatDate(schedule.date)}` : ""}`;
  doc.text(dayTitle, 20, yPos + 2);
  doc.setTextColor(0, 0, 0);
  yPos += 12;
  
  // テーマ
  if (schedule.theme) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "italic");
    doc.text(`テーマ: ${schedule.theme}`, 20, yPos);
    yPos += 7;
  }
  
  // 総移動距離・総費用
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const dayInfo: string[] = [];
  if (schedule.totalDistance) {
    dayInfo.push(`総移動距離: ${schedule.totalDistance}km`);
  }
  if (schedule.totalCost) {
    dayInfo.push(`総費用: ${formatCurrency(schedule.totalCost)}`);
  }
  if (dayInfo.length > 0) {
    doc.text(dayInfo.join(" / "), 20, yPos);
    yPos += 8;
  }
  
  // スポット一覧（テーブル形式）
  if (schedule.spots && schedule.spots.length > 0) {
    const tableData = schedule.spots.map((spot: TouristSpot) => {
      const time = spot.scheduledTime || "-";
      const duration = spot.duration ? `${spot.duration}分` : "-";
      const category = spot.category ? CATEGORY_LABELS[spot.category] || spot.category : "-";
      const cost = formatCurrency(spot.estimatedCost);
      const description = spot.description || "";
      const notes = spot.notes || "";
      const details = [description, notes].filter(Boolean).join(" / ");
      
      return [
        time,
        spot.name,
        category,
        duration,
        cost,
        details || "-",
      ];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [["時刻", "スポット名", "種別", "滞在時間", "費用", "詳細"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [229, 231, 235], // gray-200
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 20 },  // 時刻
        1: { cellWidth: 35 },  // スポット名
        2: { cellWidth: 20 },  // 種別
        3: { cellWidth: 25 },  // 滞在時間
        4: { cellWidth: 25 },  // 費用
        5: { cellWidth: 65 },  // 詳細
      },
      margin: { left: 15, right: 15 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text("スポット情報がありません", 20, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
  }
  
  return yPos;
}

/**
 * PDFフッターを描画
 */
function drawFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128); // gray-500
  doc.text(
    `Page ${pageNumber} / ${totalPages}`,
    105,
    pageHeight - 10,
    { align: "center" }
  );
  doc.setTextColor(0, 0, 0);
}

/**
 * しおりデータからPDFを生成
 */
export async function generateItineraryPDF(itinerary: ItineraryData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true, // PDF圧縮を有効化
  });
  
  // 日本語フォント対応（ブラウザ標準フォント使用）
  doc.setFont("helvetica");
  
  // PDFメタデータの設定
  doc.setProperties({
    title: itinerary.title,
    subject: `${itinerary.destination}の旅のしおり`,
    author: "Journee",
    keywords: `旅行, しおり, ${itinerary.destination}`,
    creator: "Journee - AI旅のしおり作成アプリ",
  });
  
  // ヘッダー描画
  let yPos = drawHeader(doc, itinerary);
  
  // 各日程の描画
  if (itinerary.schedule && itinerary.schedule.length > 0) {
    itinerary.schedule.forEach((daySchedule, index) => {
      yPos = drawDaySchedule(doc, daySchedule.day, daySchedule, yPos);
    });
  } else {
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text("日程が登録されていません", 105, yPos, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }
  
  // フッター描画（全ページ）
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages);
  }
  
  // PDFをBlobとして返す
  return doc.output("blob");
}

/**
 * PDFファイル名を生成
 */
export function generatePDFFilename(itinerary: ItineraryData): string {
  const sanitizedTitle = itinerary.title
    .replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, "_")
    .substring(0, 50);
  
  const date = itinerary.startDate
    ? new Date(itinerary.startDate).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  
  return `${sanitizedTitle}_${date}.pdf`;
}

/**
 * PDFをダウンロード
 */
export async function downloadItineraryPDF(itinerary: ItineraryData): Promise<void> {
  try {
    // しおりが空の場合の警告（日程がない場合でもPDFは生成する）
    if (!itinerary.schedule || itinerary.schedule.length === 0) {
      console.warn("しおりに日程が登録されていませんが、PDFを生成します");
    }
    
    const blob = await generateItineraryPDF(itinerary);
    const url = URL.createObjectURL(blob);
    const filename = generatePDFFilename(itinerary);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("PDF generation failed:", error);
    throw new Error("PDFの生成に失敗しました");
  }
}

/**
 * PDFを新しいタブで開く（プレビュー用）
 */
export async function previewItineraryPDF(itinerary: ItineraryData): Promise<void> {
  try {
    // しおりが空の場合の警告（日程がない場合でもPDFは生成する）
    if (!itinerary.schedule || itinerary.schedule.length === 0) {
      console.warn("しおりに日程が登録されていませんが、PDFを生成します");
    }
    
    const blob = await generateItineraryPDF(itinerary);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    
    // メモリリークを防ぐため、少し待ってからURLを解放
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error("PDF preview failed:", error);
    throw new Error("PDFのプレビューに失敗しました");
  }
}
