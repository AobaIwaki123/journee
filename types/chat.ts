/**
 * チャット関連の型定義
 */

import type { ItineraryData } from "./itinerary";

/**
 * メッセージの役割
 */
export type MessageRole = "user" | "assistant" | "system";

/**
 * チャットメッセージ（詳細版）
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  /** メッセージに関連するしおりデータ（AIが生成した場合） */
  itineraryData?: Partial<ItineraryData>;
}

/**
 * シンプルなメッセージ型（UI用）
 */
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/**
 * チャットセッション
 */
export interface ChatSession {
  id: string;
  userId?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  /** 現在作成中のしおりID */
  currentItineraryId?: string;
}

/**
 * AI モデルの種類
 */
export type AIModel = "gemini" | "claude";

/**
 * Gemini モデルの種類
 */
export type GeminiModelType = "gemini-2.5-pro" | "gemini-2.5-flash";

/**
 * AI設定
 */
export interface AISettings {
  model: AIModel;
  geminiModel?: GeminiModelType;
  temperature?: number;
  maxTokens?: number;
  /** Claude APIキー（ユーザー提供） */
  claudeApiKey?: string;
}

/**
 * チャット状態（Zustand用）
 */
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}
