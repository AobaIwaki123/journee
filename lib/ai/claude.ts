/**
 * Claude API統合
 * Anthropic Claude APIとの通信を管理
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "@/types/chat";
import type { ItineraryData } from "@/types/itinerary";
import { getModelName, getModelConfig } from "./models";
import {
  SYSTEM_PROMPT,
  createUpdatePrompt,
  parseAIResponse,
  formatChatHistory,
} from "./prompts";
import { limitChatHistoryByTokens } from "./token-manager";

/**
 * Claude APIクライアント
 */
export class ClaudeClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Claude API key is required");
    }

    this.client = new Anthropic({
      apiKey: apiKey,
    });

    // モデル設定から取得
    this.model = getModelName('claude');
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
      const { systemPrompt, userPrompt } = this.buildPrompt(
        userMessage,
        chatHistory,
        currentItinerary
      );

      // Claude APIに送信
      const config = getModelConfig('claude');
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: config.maxTokens || 4096,
        system: systemPrompt,
        messages: this.convertToClaudeMessages(chatHistory, userPrompt),
      });

      // レスポンスからテキストを取得
      const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => (block as any).text)
        .join("");

      // レスポンスをパース
      const { message, itineraryData } = parseAIResponse(text);

      return {
        message,
        itinerary: itineraryData as ItineraryData | undefined,
      };
    } catch (error: any) {
      console.error("Claude API Error:", error);

      // エラーメッセージを詳細化
      if (error.status === 401) {
        throw new Error("Claude APIキーが無効です。設定を確認してください。");
      } else if (error.status === 429) {
        throw new Error(
          "API利用制限に達しました。しばらく待ってから再試行してください。"
        );
      } else if (error.status === 500) {
        throw new Error("Claude APIサーバーでエラーが発生しました。");
      }

      throw new Error(`Claude API error: ${error.message}`);
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
      const { systemPrompt, userPrompt } = this.buildPrompt(
        userMessage,
        chatHistory,
        currentItinerary
      );

      // Claude APIにストリーミングリクエスト
      const config = getModelConfig('claude');
      const stream = await this.client.messages.stream({
        model: this.model,
        max_tokens: config.maxTokens || 4096,
        system: systemPrompt,
        messages: this.convertToClaudeMessages(chatHistory, userPrompt),
      });

      // ストリーミングレスポンスを処理
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          yield event.delta.text;
        }
      }
    } catch (error: any) {
      console.error("Claude API Streaming Error:", error);

      // エラーメッセージを詳細化
      if (error.status === 401) {
        throw new Error("Claude APIキーが無効です。設定を確認してください。");
      } else if (error.status === 429) {
        throw new Error(
          "API利用制限に達しました。しばらく待ってから再試行してください。"
        );
      } else if (error.status === 500) {
        throw new Error("Claude APIサーバーでエラーが発生しました。");
      }

      throw new Error(`Claude API streaming error: ${error.message}`);
    }
  }

  /**
   * プロンプトを構築
   */
  private buildPrompt(
    userMessage: string,
    chatHistory: ChatMessage[],
    currentItinerary?: ItineraryData
  ): { systemPrompt: string; userPrompt: string } {
    // システムプロンプトは固定
    let systemPrompt = SYSTEM_PROMPT;

    // ユーザープロンプトを構築
    let userPrompt = "";

    // チャット履歴がある場合は追加（トークン制限内の全履歴）
    if (chatHistory.length > 0) {
      // Claude: 5万トークンまで送信可能
      const limitedHistory = limitChatHistoryByTokens(
        chatHistory
          .filter((msg) => msg.role !== "system")
          .map((msg) => ({
            id: msg.id || `msg-${Date.now()}`,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            timestamp: msg.timestamp || new Date(),
          })),
        50000
      );
      const historyText = formatChatHistory(
        limitedHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
      );
      userPrompt += `## 会話履歴\n${historyText}\n\n`;
    }

    // 現在のしおりデータがある場合は追加
    if (currentItinerary) {
      const itineraryContext = createUpdatePrompt(currentItinerary);
      userPrompt += `## ${itineraryContext}\n\n`;
    }

    // ユーザーの新しいメッセージを追加
    userPrompt += `## ユーザーの新しいメッセージ\n${userMessage}\n\n`;
    userPrompt += `上記のメッセージに対して、親切に応答してください。必要に応じて旅のしおりデータをJSON形式で出力してください。`;

    return { systemPrompt, userPrompt };
  }

  /**
   * チャット履歴をClaude APIの形式に変換
   */
  private convertToClaudeMessages(
    chatHistory: ChatMessage[],
    userPrompt: string
  ): Anthropic.MessageParam[] {
    const messages: Anthropic.MessageParam[] = [];

    // トークン制限内のチャット履歴を追加（システムメッセージは除外）
    // Claude: 5万トークンまで送信可能
    const limitedHistory = limitChatHistoryByTokens(
      chatHistory
        .filter((msg) => msg.role !== "system")
        .map((msg) => ({
          id: msg.id || `msg-${Date.now()}`,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          timestamp: msg.timestamp || new Date(),
        })),
      50000
    );
    const recentHistory = limitedHistory;

    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }

    // 新しいユーザーメッセージを追加
    messages.push({
      role: "user",
      content: userPrompt,
    });

    return messages;
  }
}

/**
 * Claude APIキーを検証（実際のAPI呼び出し）
 */
export async function validateClaudeApiKey(apiKey: string): Promise<{
  isValid: boolean;
  error?: string;
}> {
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      isValid: false,
      error: "APIキーが空です",
    };
  }

  // APIキーの形式を簡易的にチェック
  if (!apiKey.startsWith("sk-ant-")) {
    return {
      isValid: false,
      error: 'Claude APIキーは "sk-ant-" で始まる必要があります',
    };
  }

  // 長さチェック
  if (apiKey.length < 50) {
    return {
      isValid: false,
      error: "APIキーが短すぎます",
    };
  }

  // 実際のAPI呼び出しで検証
  try {
    const client = new Anthropic({ apiKey });
    const modelName = getModelName('claude');

    // 最小限のリクエストを送信して検証
    await client.messages.create({
      model: modelName,
      max_tokens: 10,
      messages: [{ role: "user", content: "test" }],
    });

    return {
      isValid: true,
    };
  } catch (error: any) {
    // エラー内容に応じてメッセージを返す
    if (error.status === 401) {
      return {
        isValid: false,
        error: "APIキーが無効です",
      };
    } else if (error.status === 429) {
      // レート制限の場合は形式的にはOKとする
      return {
        isValid: true,
      };
    }

    return {
      isValid: false,
      error: "APIキーの検証に失敗しました",
    };
  }
}

/**
 * Claudeクライアントのインスタンスを取得
 */
export function getClaudeClient(apiKey: string): ClaudeClient {
  return new ClaudeClient(apiKey);
}

/**
 * チャットメッセージを送信（ヘルパー関数）
 */
export async function sendClaudeMessage(
  apiKey: string,
  message: string,
  chatHistory?: ChatMessage[],
  currentItinerary?: ItineraryData
): Promise<{
  message: string;
  itinerary?: ItineraryData;
}> {
  const client = getClaudeClient(apiKey);
  return client.chat(message, chatHistory, currentItinerary);
}

/**
 * ストリーミングチャット（ヘルパー関数）
 */
export async function* streamClaudeMessage(
  apiKey: string,
  message: string,
  chatHistory?: ChatMessage[],
  currentItinerary?: ItineraryData
): AsyncGenerator<string, void, unknown> {
  const client = getClaudeClient(apiKey);
  yield* client.chatStream(message, chatHistory, currentItinerary);
}
