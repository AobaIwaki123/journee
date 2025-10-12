/**
 * チャットAPIルート
 * POST /api/chat
 * Phase 4.5: フェーズ判定ロジックと「次へ」キーワード検出を追加
 */

import { NextRequest, NextResponse } from "next/server";
import type {
  ChatAPIRequest,
  ChatAPIResponse,
  ChatStreamChunk,
} from "@/types/api";
import type { AIModelId } from "@/types/ai";
import { sendGeminiMessage, streamGeminiMessage } from "@/lib/ai/gemini";
import { sendClaudeMessage, streamClaudeMessage } from "@/lib/ai/claude";
import {
  parseAIResponse,
  mergeItineraryData,
  generateErrorMessage,
  createNextStepPrompt,
} from "@/lib/ai/prompts";
import { isValidModelId } from "@/lib/ai/models";
import { mockItineraries } from "@/lib/mock-data/itineraries";
import { saveMessage } from "@/lib/db/chat-repository";

/**
 * デバッグ用モックレスポンス生成関数
 */
function handleMockResponse(stream: boolean, currency: string = "JPY") {
  // モックデータから最初のしおり（東京3日間の旅）を取得
  const baseMockItinerary = mockItineraries[0];

  // 通貨設定を追加してコピー
  const mockItinerary = {
    ...baseMockItinerary,
    currency: currency,
    status: "draft" as const,
    // createdAt, updatedAtは削除（API response に含める必要がない）
    createdAt: undefined,
    updatedAt: undefined,
    isPublic: undefined,
  };

  const mockMessage = `テストモードです。${mockItinerary.title}の旅程を作成しました！${mockItinerary.destination}の主要観光スポットを巡る充実したプランです。（通貨: ${currency}）`;

  if (stream) {
    // ストリーミングレスポンス
    const encoder = new TextEncoder();
    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          // メッセージをチャンクに分割してストリーミング
          const words = mockMessage.split("");
          for (const char of words) {
            const chunk = {
              type: "message",
              content: char,
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
            );
            // 少し遅延を入れてストリーミング感を出す
            await new Promise((resolve) => setTimeout(resolve, 20));
          }

          // しおりデータを送信
          const itineraryChunk = {
            type: "itinerary",
            itinerary: mockItinerary,
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(itineraryChunk)}\n\n`)
          );

          // 完了通知
          const doneChunk = { type: "done" };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(doneChunk)}\n\n`)
          );

          controller.close();
        } catch (error) {
          const errorChunk = {
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } else {
    // 非ストリーミングレスポンス
    return NextResponse.json({
      success: true,
      message: mockMessage,
      itinerary: mockItinerary,
    });
  }
}

/**
 * POST /api/chat
 * チャットメッセージを送信してAIの応答を取得
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディをパース
    const body = (await request.json()) as ChatAPIRequest;
    const {
      message,
      chatHistory = [],
      currentItinerary,
      model,
      claudeApiKey,
      stream = false,
      planningPhase = "initial",
      currentDetailingDay,
    } = body;

    // モデルIDの検証
    if (model && !isValidModelId(model)) {
      return NextResponse.json(
        { error: "Invalid model", message: `Unsupported AI model: ${model}` },
        { status: 400 }
      );
    }

    const selectedModel: AIModelId = model || "gemini";

    // バリデーション
    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Invalid request", message: "Message is required" },
        { status: 400 }
      );
    }

    // デバッグモード: "test"と入力したらモックレスポンスを返す
    if (message.trim().toLowerCase() === "test") {
      const requestCurrency = body.currency || "JPY";
      return handleMockResponse(stream, requestCurrency);
    }

    // Phase 4.5: 「次へ」キーワードの検出
    const isNextStepTrigger = detectNextStepKeyword(message);
    let enhancedMessage = message;

    if (isNextStepTrigger) {
      // 「次へ」が検出された場合、次のステップ誘導プロンプトを追加
      const nextStepPrompt = createNextStepPrompt(
        planningPhase,
        currentItinerary
      );
      if (nextStepPrompt) {
        enhancedMessage = `${message}\n\n【システムからの補足】\n${nextStepPrompt}`;
      }
    }

    // モデルがClaudeの場合はAPIキーが必要
    if (selectedModel === "claude") {
      if (!claudeApiKey) {
        return NextResponse.json(
          {
            error: "API key required",
            message: "Claude API key is required for using Claude model",
          },
          { status: 400 }
        );
      }

      // Claudeのストリーミング/非ストリーミングレスポンス
      if (stream) {
        return handleClaudeStreamingResponse(
          message,
          chatHistory,
          currentItinerary,
          claudeApiKey
        );
      }
      return handleClaudeNonStreamingResponse(
        message,
        chatHistory,
        currentItinerary,
        claudeApiKey
      );
    }

    // Geminiのストリーミング/非ストリーミングレスポンス
    if (stream) {
      return handleGeminiStreamingResponse(
        enhancedMessage,
        chatHistory,
        currentItinerary,
        planningPhase,
        currentDetailingDay,
        selectedModel
      );
    }

    // 非ストリーミングレスポンス
    return handleGeminiNonStreamingResponse(
      enhancedMessage,
      chatHistory,
      currentItinerary,
      planningPhase,
      currentDetailingDay,
      selectedModel
    );
  } catch (error: any) {
    console.error("Chat API Error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: generateErrorMessage(error),
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Gemini: 非ストリーミングレスポンスを処理
 * Phase 4.5: フェーズ情報を追加
 */
async function handleGeminiNonStreamingResponse(
  message: string,
  chatHistory: any[],
  currentItinerary: any,
  planningPhase: any,
  currentDetailingDay: any,
  modelId: AIModelId
) {
  try {
    // GeminiモデルIDを抽出
    const geminiModelId = (modelId === "gemini-flash" ? "gemini-flash" : "gemini") as 'gemini' | 'gemini-flash';

    // Gemini APIにメッセージを送信
    const result = await sendGeminiMessage(
      message,
      chatHistory,
      currentItinerary,
      undefined,
      planningPhase,
      currentDetailingDay,
      geminiModelId
    );

    // しおりデータをマージ
    let updatedItinerary = currentItinerary;
    if (result.itinerary) {
      updatedItinerary = mergeItineraryData(currentItinerary, result.itinerary);
    }

    // チャット履歴をDBに自動保存（しおりIDがある場合のみ）
    if (updatedItinerary?.id) {
      const saveUserMessageResult = await saveMessage(updatedItinerary.id, {
        role: 'user',
        content: message,
        timestamp: new Date(),
      });
      if (!saveUserMessageResult.success) {
        console.error('Failed to save user message:', saveUserMessageResult.error);
      }

      const saveAIMessageResult = await saveMessage(updatedItinerary.id, {
        role: 'assistant',
        content: result.message,
        timestamp: new Date(),
      });
      if (!saveAIMessageResult.success) {
        console.error('Failed to save AI message:', saveAIMessageResult.error);
      }
    } else {
      console.warn('Itinerary ID not found for non-streaming response. Chat history will be saved on itinerary save.');
    }

    const response: ChatAPIResponse = {
      message: result.message,
      itinerary: updatedItinerary,
      model: modelId,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    throw error;
  }
}

/**
 * Claude: 非ストリーミングレスポンスを処理
 */
async function handleClaudeNonStreamingResponse(
  message: string,
  chatHistory: any[],
  currentItinerary: any,
  apiKey: string
) {
  try {
    // Claude APIにメッセージを送信
    const result = await sendClaudeMessage(
      apiKey,
      message,
      chatHistory,
      currentItinerary
    );

    // しおりデータをマージ
    let updatedItinerary = currentItinerary;
    if (result.itinerary) {
      updatedItinerary = mergeItineraryData(currentItinerary, result.itinerary);
    }

    // チャット履歴をDBに自動保存（しおりIDがある場合のみ）
    if (updatedItinerary?.id) {
      const saveUserMessageResult = await saveMessage(updatedItinerary.id, {
        role: 'user',
        content: message,
        timestamp: new Date(),
      });
      if (!saveUserMessageResult.success) {
        console.error('Failed to save user message:', saveUserMessageResult.error);
      }

      const saveAIMessageResult = await saveMessage(updatedItinerary.id, {
        role: 'assistant',
        content: result.message,
        timestamp: new Date(),
      });
      if (!saveAIMessageResult.success) {
        console.error('Failed to save AI message:', saveAIMessageResult.error);
      }
    } else {
      console.warn('Itinerary ID not found for non-streaming response. Chat history will be saved on itinerary save.');
    }

    const response: ChatAPIResponse = {
      message: result.message,
      itinerary: updatedItinerary,
      model: "claude",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    throw error;
  }
}

/**
 * Gemini: ストリーミングレスポンスを処理
 */
async function handleGeminiStreamingResponse(
  message: string,
  chatHistory: any[],
  currentItinerary: any,
  planningPhase: any,
  currentDetailingDay: any,
  modelId: AIModelId
) {
  const encoder = new TextEncoder();

  // ReadableStreamを作成
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullResponse = "";

        // GeminiモデルIDを抽出
        const geminiModelId = (modelId === "gemini-flash" ? "gemini-flash" : "gemini") as 'gemini' | 'gemini-flash';

        // Gemini APIからストリーミングレスポンスを取得
        for await (const chunk of streamGeminiMessage(
          message,
          chatHistory,
          currentItinerary,
          undefined,
          planningPhase,
          currentDetailingDay,
          geminiModelId
        )) {
          fullResponse += chunk;

          // チャンクを送信
          const streamChunk: ChatStreamChunk = {
            type: "message",
            content: chunk,
          };

          const data = `data: ${JSON.stringify(streamChunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        // 完全なレスポンスからしおりデータを抽出
        const { message: finalMessage, itineraryData } =
          parseAIResponse(fullResponse);

        // しおりデータがある場合は送信
        let finalItinerary = currentItinerary;
        if (itineraryData) {
          const updatedItinerary = mergeItineraryData(
            currentItinerary,
            itineraryData
          );
          finalItinerary = updatedItinerary;

          const itineraryChunk: ChatStreamChunk = {
            type: "itinerary",
            itinerary: updatedItinerary,
          };

          const data = `data: ${JSON.stringify(itineraryChunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        // チャット履歴をDBに自動保存（しおりIDがある場合のみ）
        if (finalItinerary?.id) {
          const saveUserMessageResult = await saveMessage(finalItinerary.id, {
            role: 'user',
            content: message,
            timestamp: new Date(),
          });
          if (!saveUserMessageResult.success) {
            console.error('Failed to save user message (streaming):', saveUserMessageResult.error);
          }

          const saveAIMessageResult = await saveMessage(finalItinerary.id, {
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date(),
          });
          if (!saveAIMessageResult.success) {
            console.error('Failed to save AI message (streaming):', saveAIMessageResult.error);
          }
        } else {
          console.warn('Itinerary ID not found for streaming response. Chat history will be saved on itinerary save.');
        }

        // 完了を通知
        const doneChunk: ChatStreamChunk = {
          type: "done",
        };

        const data = `data: ${JSON.stringify(doneChunk)}\n\n`;
        controller.enqueue(encoder.encode(data));

        controller.close();
      } catch (error: any) {
        console.error("Gemini Streaming error:", error);

        // エラーを送信
        const errorChunk: ChatStreamChunk = {
          type: "error",
          error: generateErrorMessage(error),
        };

        const data = `data: ${JSON.stringify(errorChunk)}\n\n`;
        controller.enqueue(encoder.encode(data));

        controller.close();
      }
    },
  });

  // Server-Sent Events (SSE)形式でレスポンスを返す
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * Claude: ストリーミングレスポンスを処理
 */
async function handleClaudeStreamingResponse(
  message: string,
  chatHistory: any[],
  currentItinerary: any,
  apiKey: string
) {
  const encoder = new TextEncoder();

  // ReadableStreamを作成
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullResponse = "";

        // Claude APIからストリーミングレスポンスを取得
        for await (const chunk of streamClaudeMessage(
          apiKey,
          message,
          chatHistory,
          currentItinerary
        )) {
          fullResponse += chunk;

          // チャンクを送信
          const streamChunk: ChatStreamChunk = {
            type: "message",
            content: chunk,
          };

          const data = `data: ${JSON.stringify(streamChunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        // 完全なレスポンスからしおりデータを抽出
        const { message: finalMessage, itineraryData } =
          parseAIResponse(fullResponse);

        // しおりデータがある場合は送信
        let finalItinerary = currentItinerary;
        if (itineraryData) {
          const updatedItinerary = mergeItineraryData(
            currentItinerary,
            itineraryData
          );
          finalItinerary = updatedItinerary;

          const itineraryChunk: ChatStreamChunk = {
            type: "itinerary",
            itinerary: updatedItinerary,
          };

          const data = `data: ${JSON.stringify(itineraryChunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        // チャット履歴をDBに自動保存（しおりIDがある場合のみ）
        if (finalItinerary?.id) {
          const saveUserMessageResult = await saveMessage(finalItinerary.id, {
            role: 'user',
            content: message,
            timestamp: new Date(),
          });
          if (!saveUserMessageResult.success) {
            console.error('Failed to save user message (streaming):', saveUserMessageResult.error);
          }

          const saveAIMessageResult = await saveMessage(finalItinerary.id, {
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date(),
          });
          if (!saveAIMessageResult.success) {
            console.error('Failed to save AI message (streaming):', saveAIMessageResult.error);
          }
        } else {
          console.warn('Itinerary ID not found for streaming response. Chat history will be saved on itinerary save.');
        }

        // 完了を通知
        const doneChunk: ChatStreamChunk = {
          type: "done",
        };

        const data = `data: ${JSON.stringify(doneChunk)}\n\n`;
        controller.enqueue(encoder.encode(data));

        controller.close();
      } catch (error: any) {
        console.error("Claude Streaming error:", error);

        // エラーを送信
        const errorChunk: ChatStreamChunk = {
          type: "error",
          error: generateErrorMessage(error),
        };

        const data = `data: ${JSON.stringify(errorChunk)}\n\n`;
        controller.enqueue(encoder.encode(data));

        controller.close();
      }
    },
  });

  // Server-Sent Events (SSE)形式でレスポンスを返す
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * Phase 4.5: 「次へ」キーワードを検出
 */
function detectNextStepKeyword(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  const nextKeywords = [
    "次へ",
    "次に",
    "次",
    "つぎ",
    "進む",
    "進んで",
    "次のステップ",
    "次の段階",
    "next",
  ];

  return nextKeywords.some((keyword) => lowerMessage.includes(keyword));
}

/**
 * OPTIONS /api/chat
 * CORS対応
 */
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
