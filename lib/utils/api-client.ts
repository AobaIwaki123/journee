/**
 * フロントエンド用のAPIクライアントユーティリティ
 * Phase 1,2のUI実装で使用
 */

import type { 
  ChatAPIRequest, 
  ChatAPIResponse, 
  ChatStreamChunk 
} from '@/types/api';
import type { ChatMessage } from '@/types/chat';
import type { ItineraryData } from '@/types/itinerary';
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
   */
  async sendMessage(
    message: string,
    options?: {
      chatHistory?: ChatMessage[];
      currentItinerary?: ItineraryData;
      model?: AIModelId;
      claudeApiKey?: string;
    }
  ): Promise<ChatAPIResponse> {
    // バリデーション
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('メッセージは必須です');
    }

    const request: ChatAPIRequest = {
      message,
      chatHistory: options?.chatHistory,
      currentItinerary: options?.currentItinerary,
      model: options?.model || 'gemini',
      claudeApiKey: options?.claudeApiKey,
      stream: false,
    };

    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTPエラー: ${response.status}`,
      }));
      
      throw new Error(errorData.message || 'API request failed');
    }

    return response.json();
  }

  /**
   * メッセージを送信（ストリーミング）
   */
  async *sendMessageStream(
    message: string,
    options?: {
      chatHistory?: ChatMessage[];
      currentItinerary?: ItineraryData;
      model?: 'gemini' | 'claude';
      claudeApiKey?: string;
    }
  ): AsyncGenerator<ChatStreamChunk, void, unknown> {
    // バリデーション
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('メッセージは必須です');
    }

    const request: ChatAPIRequest = {
      message,
      chatHistory: options?.chatHistory,
      currentItinerary: options?.currentItinerary,
      model: options?.model || DEFAULT_AI_MODEL,
      claudeApiKey: options?.claudeApiKey,
      stream: true,
    };

    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTPエラー: ${response.status}`,
      }));
      
      throw new Error(errorData.message || 'API request failed');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ストリーミングがサポートされていません');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
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
              } catch (parseError) {
                console.error('Failed to parse chunk:', parseError);
                // パースエラーは無視してストリーミングを継続
              }
            }
          }
        }
      }
    } finally {
      // リーダーを確実にクローズ
      reader.releaseLock();
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
 * 
 * 使用例:
 * ```typescript
 * for await (const chunk of sendChatMessageStream(message, history, itinerary, 'gemini')) {
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
  claudeApiKey?: string
): AsyncGenerator<ChatStreamChunk, void, unknown> {
  yield* chatApiClient.sendMessageStream(message, {
    chatHistory,
    currentItinerary,
    model,
    claudeApiKey,
  });
}
