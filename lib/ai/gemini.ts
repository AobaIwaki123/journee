/**
 * Google Gemini API統合
 * Phase 4.5: フェーズ別プロンプトの統合
 */

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import type { ChatMessage } from "@/types/chat";
import type { ItineraryData, ItineraryPhase } from "@/types/itinerary";
import { getModelName } from "./models";
import {
  SYSTEM_PROMPT,
  createUpdatePrompt,
  parseAIResponse,
  formatChatHistory,
  getSystemPromptForPhase,
  createSkeletonPrompt,
  createDayDetailPrompt,
  createNextStepPrompt,
} from "./prompts";

/**
 * Gemini APIクライアント
 */
export class GeminiClient {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    this.client = new GoogleGenerativeAI(key);
    // モデル設定から取得
    const modelName = getModelName('gemini');
    this.model = this.client.getGenerativeModel({ model: modelName });
  }

  /**
   * チャットメッセージを送信（非ストリーミング）
   * Phase 4.5: フェーズ情報を追加
   */
  async chat(
    userMessage: string,
    chatHistory: ChatMessage[] = [],
    currentItinerary?: ItineraryData,
    planningPhase?: ItineraryPhase,
    currentDetailingDay?: number | null
  ): Promise<{
    message: string;
    itinerary?: ItineraryData;
  }> {
    try {
      // プロンプトの構築
      const prompt = this.buildPrompt(
        userMessage,
        chatHistory,
        currentItinerary,
        planningPhase,
        currentDetailingDay
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
    currentItinerary?: ItineraryData,
    planningPhase?: ItineraryPhase,
    currentDetailingDay?: number | null
  ): AsyncGenerator<string, void, unknown> {
    try {
      // プロンプトの構築
      const prompt = this.buildPrompt(
        userMessage,
        chatHistory,
        currentItinerary,
        planningPhase,
        currentDetailingDay
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
    currentItinerary?: ItineraryData,
    planningPhase: ItineraryPhase = 'initial',
    currentDetailingDay?: number | null
  ): string {
    // Phase 4: フェーズに応じたシステムプロンプトを選択
    let prompt = getSystemPromptForPhase(planningPhase) + "\n\n";

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

    // Phase 4: フェーズ別の追加プロンプト
    let phaseSpecificPrompt = '';
    
    switch (planningPhase) {
      case 'skeleton':
        // 骨組み作成フェーズ
        if (currentItinerary) {
          phaseSpecificPrompt = createSkeletonPrompt(currentItinerary);
        }
        break;
        
      case 'detailing':
        // 日程詳細化フェーズ
        if (currentItinerary && currentDetailingDay) {
          phaseSpecificPrompt = createDayDetailPrompt(currentItinerary, currentDetailingDay);
        }
        break;
        
      case 'collecting':
      case 'completed':
        // 他のフェーズでは特別なプロンプトなし
        break;
    }
    
    if (phaseSpecificPrompt) {
      prompt += `## ${phaseSpecificPrompt}\n\n`;
    }

    // ユーザーのメッセージを追加
    prompt += `## ユーザーの新しいメッセージ\n${userMessage}\n\n`;
    
    // Phase 4: フェーズに応じた応答指示
    if (planningPhase === 'skeleton') {
      prompt += `上記のメッセージに対して応答してください。骨組み作成フェーズでは、各日のテーマ・エリアを決定し、JSON形式で出力してください。具体的な観光スポット名はまだ出さないでください。`;
    } else if (planningPhase === 'detailing') {
      prompt += `上記のメッセージに対して応答してください。${currentDetailingDay}日目の詳細なスケジュールを作成し、実在する観光スポット、時間、費用を含めてJSON形式で出力してください。`;
    } else {
      prompt += `上記のメッセージに対して、親切に応答してください。必要に応じて旅のしおりデータをJSON形式で出力してください。`;
    }

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
export function getGeminiClient(apiKey?: string): GeminiClient {
  if (!geminiClientInstance) {
    geminiClientInstance = new GeminiClient(apiKey);
  }
  return geminiClientInstance;
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
  planningPhase?: ItineraryPhase,
  currentDetailingDay?: number | null
): Promise<{
  message: string;
  itinerary?: ItineraryData;
}> {
  const client = getGeminiClient(apiKey);
  return client.chat(message, chatHistory, currentItinerary, planningPhase, currentDetailingDay);
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
  planningPhase?: ItineraryPhase,
  currentDetailingDay?: number | null
): AsyncGenerator<string, void, unknown> {
  const client = getGeminiClient(apiKey);
  yield* client.chatStream(message, chatHistory, currentItinerary, planningPhase, currentDetailingDay);
}
