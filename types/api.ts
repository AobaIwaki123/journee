/**
 * API関連の型定義
 */

import type { ChatMessage } from "./chat";
import type { AIModelId } from "./ai";
import type { ItineraryData, ItineraryPhase } from "./itinerary";

/**
 * チャットAPIリクエスト
 */
export interface ChatAPIRequest {
  /** ユーザーのメッセージ */
  message: string;
  /** チャット履歴 */
  chatHistory?: ChatMessage[];
  /** 現在のしおりデータ */
  currentItinerary?: ItineraryData;
  /** 使用するAIモデル */
  model?: AIModelId;
  /** Claude APIキー（モデルがclaudeの場合） */
  claudeApiKey?: string;
  /** ストリーミングレスポンスを使用するか */
  stream?: boolean;
  /** Phase 4: 現在のプランニングフェーズ */
  planningPhase?: ItineraryPhase;
  /** Phase 4: 現在詳細化中の日 */
  currentDetailingDay?: number | null;
  /** 通貨設定 */
  currency?: string;
}

/**
 * チャットAPIレスポンス（非ストリーミング）
 */
export interface ChatAPIResponse {
  /** AIの応答メッセージ */
  message: string;
  /** 更新されたしおりデータ */
  itinerary?: ItineraryData;
  /** 使用したモデル */
  model: AIModelId;
  /** トークン使用量 */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * ストリーミングレスポンスのチャンク
 */
export interface ChatStreamChunk {
  type: "message" | "itinerary" | "done" | "error";
  /** メッセージの内容（type: 'message'の場合） */
  content?: string;
  /** しおりデータ（type: 'itinerary'の場合） */
  itinerary?: ItineraryData;
  /** エラーメッセージ（type: 'error'の場合） */
  error?: string;
}

/**
 * 汎用APIエラーレスポンス
 */
export interface APIErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}

/**
 * API成功レスポンス（汎用）
 */
export interface APISuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * API成功レスポンスの基本型
 */
export interface ApiSuccessResponse<T = unknown> {
  data: T;
  message?: string;
}

/**
 * APIエラーレスポンスの基本型
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

/**
 * ページネーション情報
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * ページネーション付きレスポンス
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * HTTPメソッド型
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * APIレスポンスステータス
 */
export type ApiStatus = "success" | "error" | "loading";

/**
 * ユーザー情報レスポンス（/api/user/me）
 */
export interface UserMeResponse {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  googleId?: string;
}

/**
 * Phase 4.9: 並列日程作成の型定義
 */

/**
 * バッチ日程詳細化リクエスト
 */
export interface BatchDayDetailRequest {
  /** 旅程ID */
  itineraryId: string;
  
  /** 詳細化する日のリスト */
  days: DayDetailTask[];
  
  /** チャット履歴 */
  chatHistory: { role: string; content: string }[];
  
  /** 現在のしおり */
  currentItinerary?: Partial<ItineraryData>;
  
  /** 並列数の制限（デフォルト: 3） */
  maxParallel?: number;
  
  /** Phase 4.9.4: タイムアウト時間（ミリ秒、デフォルト: 120000） */
  timeout?: number;
}

/**
 * 各日の詳細化タスク
 */
export interface DayDetailTask {
  /** 日番号 */
  day: number;
  
  /** その日のテーマ */
  theme?: string;
  
  /** 追加情報 */
  additionalInfo?: string;
  
  /** 優先度（オプション） */
  priority?: number;
}

/**
 * バッチ日程詳細化レスポンス
 */
export interface BatchDayDetailResponse {
  /** 成功した日のリスト */
  successDays: number[];
  
  /** 失敗した日のリスト */
  failedDays: number[];
  
  /** 更新されたしおり */
  itinerary: ItineraryData;
  
  /** エラーメッセージ（失敗した日がある場合） */
  errors?: Record<number, string>;
  
  /** 処理時間（ミリ秒） */
  processingTime?: number;
}

/**
 * マルチストリーミングチャンク
 */
export interface MultiStreamChunk {
  /** チャンクタイプ */
  type: 'message' | 'itinerary' | 'progress' | 'day_start' | 'day_complete' | 'day_error' | 'done' | 'error';
  
  /** 日番号（どの日のチャンクか） */
  day?: number;
  
  /** メッセージ内容 */
  content?: string;
  
  /** しおりデータ（部分更新） */
  itinerary?: Partial<ItineraryData>;
  
  /** 進捗情報 */
  progress?: {
    completedDays: number[];
    processingDays: number[];
    errorDays: number[];
    totalDays: number;
    progressRate: number;
  };
  
  /** エラーメッセージ */
  error?: string;
  
  /** タイムスタンプ */
  timestamp?: number;
}
