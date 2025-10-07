/**
 * フロントエンド用のAPIクライアントユーティリティ
 * Phase 1,2,3,4のUI実装で使用
 * Phase 4.5: フェーズ情報の送信をサポート
 */

import type { 
  ChatAPIRequest, 
  ChatAPIResponse, 
  ChatStreamChunk 
} from '@/types/api';
import type { ChatMessage } from '@/types/chat';
import type { ItineraryData, ItineraryPhase } from '@/types/itinerary';
import type { AIModelId } from '@/types/ai';
import { DEFAULT_AI_MODEL } from '@/lib/ai/models';

/**
 * チャットAPIクライアント
 */
export class ChatAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * メッセージを送信（非ストリーミング）
   * Phase 4.5: フェーズ情報を追加
   */
  async sendMessage(
    message: string,
    options?: {
      chatHistory?: ChatMessage[];
      currentItinerary?: ItineraryData;
      model?: AIModelId;
      claudeApiKey?: string;
      planningPhase?: ItineraryPhase;
      currentDetailingDay?: number | null;
    }
  ): Promise<ChatAPIResponse> {
    const request: ChatAPIRequest = {
      message,
      chatHistory: options?.chatHistory,
      currentItinerary: options?.currentItinerary,
      model: options?.model || 'gemini',
      claudeApiKey: options?.claudeApiKey,
      stream: false,
      planningPhase: options?.planningPhase,
      currentDetailingDay: options?.currentDetailingDay,
    };

    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  /**
   * メッセージを送信（ストリーミング）
   * Phase 4.5: フェーズ情報を追加
   */
  async *sendMessageStream(
    message: string,
    options?: {
      chatHistory?: ChatMessage[];
      currentItinerary?: ItineraryData;
      model?: AIModelId;
      claudeApiKey?: string;
      planningPhase?: ItineraryPhase;
      currentDetailingDay?: number | null;
    }
  ): AsyncGenerator<ChatStreamChunk, void, unknown> {
    const request: ChatAPIRequest = {
      message,
      chatHistory: options?.chatHistory,
      currentItinerary: options?.currentItinerary,
      model: options?.model || DEFAULT_AI_MODEL,
      claudeApiKey: options?.claudeApiKey,
      stream: true,
      planningPhase: options?.planningPhase,
      currentDetailingDay: options?.currentDetailingDay,
    };

    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream not supported');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // 最後の不完全な行はバッファに残す
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data.trim()) {
            try {
              const chunk = JSON.parse(data) as ChatStreamChunk;
              yield chunk;
            } catch (error) {
              console.error('Failed to parse chunk:', error);
            }
          }
        }
      }
    }
  }
}

/**
 * デフォルトのAPIクライアントインスタンス
 */
export const chatApiClient = new ChatAPIClient();

/**
 * React hooks用のヘルパー関数
 * フロントエンド実装で使用
 */

/**
 * 非ストリーミングメッセージ送信
 */
export async function sendChatMessage(
  message: string,
  chatHistory?: ChatMessage[],
  currentItinerary?: ItineraryData
): Promise<ChatAPIResponse> {
  return chatApiClient.sendMessage(message, {
    chatHistory,
    currentItinerary,
  });
}

/**
 * ストリーミングメッセージ送信
 * Phase 4.5: フェーズ情報を追加
 * 
 * 使用例:
 * ```typescript
 * for await (const chunk of sendChatMessageStream(message, history, itinerary, 'gemini', apiKey, phase, day)) {
 *   if (chunk.type === 'message') {
 *     setStreamingMessage(prev => prev + chunk.content);
 *   } else if (chunk.type === 'itinerary') {
 *     setItinerary(chunk.itinerary);
 *   }
 * }
 * ```
 */
export async function* sendChatMessageStream(
  message: string,
  chatHistory?: ChatMessage[],
  currentItinerary?: ItineraryData,
  model?: AIModelId,
  claudeApiKey?: string,
  planningPhase?: ItineraryPhase,
  currentDetailingDay?: number | null
): AsyncGenerator<ChatStreamChunk, void, unknown> {
  yield* chatApiClient.sendMessageStream(message, {
    chatHistory,
    currentItinerary,
    model,
    claudeApiKey,
    planningPhase,
    currentDetailingDay,
  });
}
