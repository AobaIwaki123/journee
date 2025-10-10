/**
 * しおりのコア型定義（Phase 4: 型定義の整理）
 * 
 * ItineraryDataを責務ごとに分割し、型の見通しを良くする
 */

import type { DaySchedule, ItineraryPhase } from './itinerary';

/**
 * しおりのコアデータ
 * 旅のしおりの本質的な情報
 */
export interface ItineraryCoreData {
  /** しおりID */
  id: string;
  /** タイトル */
  title: string;
  /** 行き先 */
  destination: string;
  /** 日程スケジュール */
  schedule: DaySchedule[];
}

/**
 * しおりの旅行情報
 * 日程・予算などの旅行に関する情報
 */
export interface ItineraryTravelInfo {
  /** 開始日（YYYY-MM-DD形式） */
  startDate?: string;
  /** 終了日（YYYY-MM-DD形式） */
  endDate?: string;
  /** 旅行日数 */
  duration?: number;
  /** 概要・説明 */
  summary?: string;
  /** 総予算（円） */
  totalBudget?: number;
  /** 通貨（デフォルト: JPY） */
  currency?: string;
}

/**
 * しおりのメタデータ
 * 作成日時、ステータスなどのメタ情報
 */
export interface ItineraryMetadata {
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
  /** ステータス */
  status: "draft" | "completed" | "archived";
  /** ユーザーID（作成者） */
  userId?: string;
}

/**
 * しおりの公開設定
 * 公開・共有に関する設定
 */
export interface ItineraryPublicSettings {
  /** 公開フラグ */
  isPublic?: boolean;
  /** 公開URL用のユニークスラッグ */
  publicSlug?: string;
  /** 公開日時 */
  publishedAt?: Date;
  /** 閲覧数 */
  viewCount?: number;
  /** PDFダウンロード許可フラグ */
  allowPdfDownload?: boolean;
  /** 閲覧者へのカスタムメッセージ */
  customMessage?: string;
}

/**
 * しおりの作成プロセス情報
 * Phase 4の段階的作成システムで使用
 */
export interface ItineraryProgressInfo {
  /** 現在の作成フェーズ */
  phase?: ItineraryPhase;
  /** 現在詳細化中の日（detailingフェーズで使用） */
  currentDay?: number;
}

/**
 * 完全なしおりデータ
 * 全ての型を組み合わせた最終的な型
 */
export type ItineraryData = 
  & ItineraryCoreData 
  & ItineraryTravelInfo 
  & ItineraryMetadata 
  & ItineraryPublicSettings
  & ItineraryProgressInfo;

/**
 * しおり作成時の必須フィールド
 */
export type ItineraryCreateInput = 
  & Required<Pick<ItineraryCoreData, 'title' | 'destination'>>
  & Partial<ItineraryTravelInfo>
  & Pick<ItineraryMetadata, 'status'>;

/**
 * しおり更新時のフィールド
 */
export type ItineraryUpdateInput = 
  & Partial<ItineraryCoreData>
  & Partial<ItineraryTravelInfo>
  & Partial<ItineraryPublicSettings>
  & Partial<ItineraryProgressInfo>;
