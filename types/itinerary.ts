/**
 * 旅のしおり関連の型定義
 */

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
  day: number;
  date?: string;
  title?: string;
  spots: TouristSpot[];
  /** その日の総移動距離（km） */
  totalDistance?: number;
  /** その日の総予算（円） */
  totalCost?: number;
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
  /** ステータス */
  status: "draft" | "completed" | "archived";
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
  /** 公開設定 */
  isPublic?: boolean;
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
