/**
 * Google Gemini API統合
 * Phase 4.5: フェーズ別プロンプトの統合
 */

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import type { ChatMessage } from "@/types/chat";
import type { ItineraryData } from "@/types/itinerary";
import { getModelName } from "./models";
import { limitChatHistoryByTokens } from './token-manager'; // 追加
import {
  SYSTEM_PROMPT,
  createUpdatePrompt,
  parseAIResponse,
  formatChatHistory,
  getSystemPromptForPhase,
  createSkeletonPrompt,
  createDayDetailPrompt,
} from "./prompts";

/**
 * Gemini APIクライアント
 */
export class GeminiClient {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private modelId: 'gemini' | 'gemini-flash';

  constructor(modelId: 'gemini' | 'gemini-flash' = 'gemini', apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    this.client = new GoogleGenerativeAI(key);
    this.modelId = modelId;
    // モデル設定から取得
    const modelName = getModelName(modelId);
    this.model = this.client.getGenerativeModel({ model: modelName });
  }

  /**
   * チャットメッセージを送信（非ストリーミング）
   * Phase 4.5: フェーズ情報を追加
   */
  async chat(
    userMessage: string,
    chatHistory: ChatMessage[] = [],
    currentItinerary?: ItineraryData
  ): Promise<{
    message: string;
    itinerary?: ItineraryData;
  }> {
    try {
      // プロンプトの構築
      const prompt = this.buildPrompt(
        userMessage,
        chatHistory,
        currentItinerary
      );

      // Gemini APIに送信
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // レスポンスをパース
      const { message, itineraryData } = parseAIResponse(text);

      return {
        message,
        itinerary: itineraryData as ItineraryData | undefined,
      };
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  /**
   * チャットメッセージを送信（ストリーミング）
   * Phase 4.5: フェーズ情報を追加
   */
  async *chatStream(
    userMessage: string,
    chatHistory: ChatMessage[] = [],
    currentItinerary?: ItineraryData
  ): AsyncGenerator<string, void, unknown> {
    try {
      // プロンプトの構築
      const prompt = this.buildPrompt(
        userMessage,
        chatHistory,
        currentItinerary
      );

      // Gemini APIにストリーミングリクエスト
      const result = await this.model.generateContentStream(prompt);

      // ストリーミングレスポンスを処理
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }
    } catch (error: any) {
      console.error("Gemini API Streaming Error:", error);
      throw new Error(`Gemini API streaming error: ${error.message}`);
    }
  }

  /**
   * プロンプトを構築
   * Phase 4.5: フェーズに応じたプロンプトを生成
   */
  private buildPrompt(
    userMessage: string,
    chatHistory: ChatMessage[],
    currentItinerary?: ItineraryData
  ): string {
    // Phase 4: フェーズに応じたシステムプロンプトを選択
    // planningPhaseが削除されたため、getSystemPromptForPhaseの引数を調整する必要がある
    // 一旦、引数なしで呼び出すが、後でprompts.tsを確認して修正する
    let prompt = getSystemPromptForPhase() + "\n\n";

    // チャット履歴がある場合は追加
    if (chatHistory.length > 0) {
      const filteredChatHistory = chatHistory.filter(msg => msg.role !== 'system');
      const mappedHistory = filteredChatHistory.map(msg => ({
        id: msg.id,
        role: msg.role as "user" | "assistant", // 'system' messages are already filtered out
        content: msg.content,
        timestamp: msg.timestamp,
      }));
      const limitedHistory = limitChatHistoryByTokens(mappedHistory, 100000); // Gemini: 10万トークン
      const historyText = formatChatHistory(
        limitedHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
      );
      prompt += `## 会話履歴\n${historyText}\n\n`;
    }

    // 現在のしおりデータがある場合は追加
    if (currentItinerary) {
      const itineraryContext = createUpdatePrompt(currentItinerary);
      prompt += `## ${itineraryContext}\n\n`;
    }

    // ユーザーのメッセージを追加
    prompt += `## ユーザーの新しいメッセージ\n${userMessage}\n\n`;
    
    // フェーズ固有のプロンプトロジックを削除したため、汎用的な応答指示のみ残す
    prompt += `上記のメッセージに対して、親切に応答してください。必要に応じて旅のしおりデータをJSON形式で出力してください。`;

    return prompt;
  }
}

/**
 * Geminiクライアントのキャッシュ（モデルIDごと）
 */
const geminiClientCache: Map<string, GeminiClient> = new Map();

/**
 * Geminiクライアントを取得
 */
export function getGeminiClient(modelId: 'gemini' | 'gemini-flash' = 'gemini', apiKey?: string): GeminiClient {
  const cacheKey = `${modelId}-${apiKey || 'default'}`;
  
  if (!geminiClientCache.has(cacheKey)) {
    geminiClientCache.set(cacheKey, new GeminiClient(modelId, apiKey));
  }
  
  return geminiClientCache.get(cacheKey)!;
}

/**
 * チャットメッセージを送信（ヘルパー関数）
 * Phase 4.5: フェーズ情報を追加
 */
export async function sendGeminiMessage(
  message: string,
  chatHistory?: ChatMessage[],
  currentItinerary?: ItineraryData,
  apiKey?: string,
  modelId: 'gemini' | 'gemini-flash' = 'gemini'
): Promise<{
  message: string;
  itinerary?: ItineraryData;
}> {
  const client = getGeminiClient(modelId, apiKey);
  return client.chat(message, chatHistory, currentItinerary);
}

/**
 * ストリーミングチャット（ヘルパー関数）
 * Phase 4.5: フェーズ情報を追加
 */
export async function* streamGeminiMessage(
  message: string,
  chatHistory?: ChatMessage[],
  currentItinerary?: ItineraryData,
  apiKey?: string,
  modelId: 'gemini' | 'gemini-flash' = 'gemini'
): AsyncGenerator<string, void, unknown> {
  const client = getGeminiClient(modelId, apiKey);
  yield* client.chatStream(message, chatHistory, currentItinerary);
}
