/**
 * API関連の型定義
 */

import type { ChatMessage, AIModel } from './chat';
import type { ItineraryData } from './itinerary';

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
  type: 'message' | 'itinerary' | 'done' | 'error';
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
 * API成功レスポンス
 */
export interface APISuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}
