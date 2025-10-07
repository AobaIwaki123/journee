/**
 * API関連の型定義
 */

import type { ChatMessage, AIModel } from "./chat";
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
  model?: AIModel;
  /** Claude APIキー（モデルがclaudeの場合） */
  claudeApiKey?: string;
  /** ストリーミングレスポンスを使用するか */
  stream?: boolean;
  /** Phase 4: 現在のプランニングフェーズ */
  planningPhase?: ItineraryPhase;
  /** Phase 4: 現在詳細化中の日 */
  currentDetailingDay?: number | null;
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
  model: AIModel;
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
