/**
 * チャット関連の型定義
 */

/**
 * メッセージの役割
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * チャットメッセージ
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
export type AIModel = 'gemini' | 'claude';

/**
 * AI設定
 */
export interface AISettings {
  model: AIModel;
  temperature?: number;
  maxTokens?: number;
  /** Claude APIキー（ユーザー提供） */
  claudeApiKey?: string;
}

/**
 * しおりデータ（型定義はitinerary.tsから参照）
 */
import type { ItineraryData } from './itinerary';
