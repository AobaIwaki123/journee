/**
 * 旅のしおり関連の型定義
 */

/**
 * 各日の進捗状態（Phase 4用）
 */
export type DayStatus = "draft" | "skeleton" | "detailed" | "completed";

/**
 * しおり全体の作成フェーズ（Phase 4用）
 */
export type ItineraryPhase =
  | "initial" // 初期状態（まだ何も決まっていない）
  | "collecting" // 基本情報収集中（行き先、期間、興味など）
  | "skeleton" // 骨組み作成中（各日のテーマ・エリアを決定）
  | "detailing" // 日程詳細化中（具体的なスポット・時間を追加）
  | "completed"; // 完成

/**
 * 座標情報
 */

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  placeId?: string;
}

/**
 * 観光スポット（詳細版）
 */
export interface TouristSpot {
  id: string;
  name: string;
  description: string;
  location?: Location;
  /** 予定時刻（HH:mm形式） */
  scheduledTime?: string;
  /** 滞在時間（分） */
  duration?: number;
  /** カテゴリ（観光、食事、移動など） */
  category?:
    | "sightseeing"
    | "dining"
    | "transportation"
    | "accommodation"
    | "other";
  /** 予算（円） */
  estimatedCost?: number;
  /** メモ */
  notes?: string;
  /** 画像URL */
  imageUrl?: string;
}

/**
 * シンプルなスポット型（UI用）
 */
export interface Spot {
  id: string;
  name: string;
  description: string;
  time?: string;
  address?: string;
  imageUrl?: string;
}

/**
 * 1日の日程（詳細版）
 */
export interface DaySchedule {
  id?: string; // Phase 10.4: UUID（DB保存時に必要）
  day: number;
  date?: string;
  title?: string;
  spots: TouristSpot[];
  /** その日の総移動距離（km） */
  totalDistance?: number;
  /** その日の総予算（円） */
  totalCost?: number;
  /** Phase 4: この日の作成状態 */
  status?: DayStatus;
  /** Phase 4: この日のテーマ・コンセプト（骨組み作成時に使用） */
  theme?: string;
  /** Phase 4.9.3: ローディング状態 */
  isLoading?: boolean;
  /** Phase 4.9.3: エラー情報 */
  error?: string;
  /** Phase 4.9.3: 進捗率（0-100） */
  progress?: number;
}

/**
 * 旅のしおりデータ（詳細版）
 */
export interface ItineraryData {
  id: string;
  userId?: string;
  title: string;
  destination: string;
  /** 開始日（YYYY-MM-DD形式） */
  startDate?: string;
  /** 終了日（YYYY-MM-DD形式） */
  endDate?: string;
  /** 旅行日数 */
  duration?: number;
  /** 概要・説明 */
  summary?: string;
  /** 日程詳細 */
  schedule: DaySchedule[];
  /** 総予算（円） */
  totalBudget?: number;
  /** 通貨（デフォルト: JPY） */
  currency?: string;
  /** ステータス */
  status: "draft" | "completed" | "archived";
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
  /** 公開設定 */
  isPublic?: boolean;
  /** Phase 5.5: 公開URL用のユニークスラッグ */
  publicSlug?: string;
  /** Phase 5.5: 公開日時 */
  publishedAt?: Date;
  /** Phase 5.5: 閲覧数 */
  viewCount?: number;
  /** Phase 5.5: PDFダウンロード許可フラグ */
  allowPdfDownload?: boolean;
  /** Phase 5.5: 閲覧者へのカスタムメッセージ（オプション） */
  customMessage?: string;
  /** Phase 4: 段階的作成システムの現在のフェーズ */
  phase?: ItineraryPhase;
  /** Phase 4: 現在詳細化中の日（detailingフェーズで使用） */
  currentDay?: number;
}

/**
 * シンプルなしおり型（UI用）
 */
export interface Itinerary {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: DaySchedule[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * しおり状態（Zustand用）
 */
export interface ItineraryState {
  currentItinerary: Itinerary | null;
  isEditing: boolean;
}

/**
 * しおりの保存リクエスト
 */
export interface SaveItineraryRequest {
  itinerary: ItineraryData;
}

/**
 * しおりの読込レスポンス
 */
export interface LoadItineraryResponse {
  itinerary: ItineraryData;
}

/**
 * しおり一覧のアイテム
 */
export interface ItineraryListItem {
  id: string;
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  status: "draft" | "completed" | "archived";
  createdAt: Date;
  updatedAt: Date;
  thumbnailUrl?: string;
}

/**
 * Phase 5.5: 公開設定の型
 */
export interface PublicItinerarySettings {
  isPublic: boolean;
  allowPdfDownload: boolean;
  customMessage?: string;
}

/**
 * Phase 5.5: 公開しおりのメタデータ
 */
export interface PublicItineraryMetadata {
  slug: string;
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  thumbnailUrl?: string;
  authorName: string;
  viewCount: number;
  publishedAt: Date;
}

/**
 * ユーザー統計情報
 */
export interface UserStats {
  totalItineraries: number;
  totalCountries: number;
  totalDays: number;
  monthlyStats: {
    month: string;
    count: number;
  }[];
  countryDistribution: {
    country: string;
    count: number;
  }[];
}
