/**
 * 日程スケジュールの型定義（Phase 4: 型定義の整理）
 * 
 * DayScheduleを責務ごとに分割し、必須/オプショナルを明確化
 */

import type { TouristSpot, DayStatus } from './itinerary';

/**
 * 日程の基本情報（必須フィールド）
 */
export interface DayScheduleCore {
  /** 日目（1日目、2日目、...） */
  day: number;
  /** その日のスポットリスト */
  spots: TouristSpot[];
}

/**
 * 日程の詳細情報（オプショナル）
 */
export interface DayScheduleDetails {
  /** UUID（DB保存時に必要） */
  id?: string;
  /** 日付（YYYY-MM-DD形式） */
  date?: string;
  /** その日のタイトル */
  title?: string;
  /** その日のテーマ・コンセプト（骨組み作成時に使用） */
  theme?: string;
}

/**
 * 日程の集計情報（オプショナル・自動計算）
 */
export interface DayScheduleStats {
  /** その日の総移動距離（km） */
  totalDistance?: number;
  /** その日の総予算（円） */
  totalCost?: number;
}

/**
 * 日程の状態情報（Phase 4の段階的作成で使用）
 */
export interface DayScheduleStatus {
  /** この日の作成状態 */
  status?: DayStatus;
  /** ローディング状態 */
  isLoading?: boolean;
  /** エラー情報 */
  error?: string;
  /** 進捗率（0-100） */
  progress?: number;
}

/**
 * 完全な日程スケジュール
 * 全ての型を組み合わせた最終的な型
 */
export type DaySchedule = 
  & DayScheduleCore 
  & DayScheduleDetails 
  & DayScheduleStats 
  & DayScheduleStatus;

/**
 * 日程作成時の必須フィールド
 */
export type DayScheduleCreateInput = 
  & Required<Pick<DayScheduleCore, 'day'>>
  & Partial<DayScheduleDetails>;

/**
 * 日程更新時のフィールド
 */
export type DayScheduleUpdateInput = 
  & Partial<DayScheduleDetails>
  & Partial<DayScheduleStatus>;
