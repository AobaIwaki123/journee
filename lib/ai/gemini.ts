/**
 * Google Gemini API統合
 */

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import type { ChatMessage } from "@/types/chat";
import type { ItineraryData } from "@/types/itinerary";
import {
  SYSTEM_PROMPT,
  createUpdatePrompt,
  parseAIResponse,
  formatChatHistory,
} from "./prompts";

/**
 * Gemini APIクライアント
 */
export class GeminiClient {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = "gemini-2.5-pro") {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    this.client = new GoogleGenerativeAI(key);
    this.modelName = modelName;
    this.model = this.client.getGenerativeModel({ model: this.modelName });
  }

  /**
   * チャットメッセージを送信（非ストリーミング）
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
   */
  private buildPrompt(
    userMessage: string,
    chatHistory: ChatMessage[],
    currentItinerary?: ItineraryData
  ): string {
    let prompt = SYSTEM_PROMPT + "\n\n";

    // チャット履歴がある場合は追加
    if (chatHistory.length > 0) {
      const historyText = formatChatHistory(
        chatHistory.slice(-10).map((msg) => ({
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
    prompt += `上記のメッセージに対して、親切に応答してください。必要に応じて旅のしおりデータをJSON形式で出力してください。`;

    return prompt;
  }
}

/**
 * Geminiクライアントのシングルトンインスタンス
 */
let geminiClientInstance: GeminiClient | null = null;

/**
 * Geminiクライアントを取得
 */
export function getGeminiClient(apiKey?: string, modelName?: string): GeminiClient {
  // モデル名が変わる場合は新しいインスタンスを作成
  if (!geminiClientInstance || (modelName && modelName !== geminiClientInstance['modelName'])) {
    geminiClientInstance = new GeminiClient(apiKey, modelName);
  }
  return geminiClientInstance;
}

/**
 * チャットメッセージを送信（ヘルパー関数）
 */
export async function sendGeminiMessage(
  message: string,
  chatHistory?: ChatMessage[],
  currentItinerary?: ItineraryData,
  apiKey?: string,
  modelName?: string
): Promise<{
  message: string;
  itinerary?: ItineraryData;
}> {
  const client = getGeminiClient(apiKey, modelName);
  return client.chat(message, chatHistory, currentItinerary);
}

/**
 * ストリーミングチャット（ヘルパー関数）
 */
export async function* streamGeminiMessage(
  message: string,
  chatHistory?: ChatMessage[],
  currentItinerary?: ItineraryData,
  apiKey?: string,
  modelName?: string
): AsyncGenerator<string, void, unknown> {
  const client = getGeminiClient(apiKey, modelName);
  yield* client.chatStream(message, chatHistory, currentItinerary);
}
