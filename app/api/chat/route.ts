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

/**
 * デバッグ用モックレスポンス生成関数
 */
function handleMockResponse(stream: boolean) {
  const mockItinerary = {
    title: '京都2日間の旅',
    destination: '京都',
    startDate: '2025-11-01',
    endDate: '2025-11-02',
    duration: 2,
    summary: '古都京都を満喫する2日間の旅程です。歴史的な寺社仏閣を巡り、京都の文化と美食を楽しみます。',
    schedule: [
      {
        day: 1,
        date: '2025-11-01',
        title: '東山エリアを散策',
        spots: [
          {
            id: 'test-spot-1-1',
            name: '清水寺',
            description: '世界遺産に登録されている京都を代表する寺院。清水の舞台からの眺めは絶景です。',
            scheduledTime: '09:00',
            duration: 90,
            category: 'sightseeing',
            estimatedCost: 400,
            notes: '早朝がおすすめです',
            location: {
              lat: 34.9949,
              lng: 135.7850,
              address: '京都府京都市東山区清水1-294'
            }
          },
          {
            id: 'test-spot-1-2',
            name: '二年坂・三年坂',
            description: '清水寺からの帰り道にある風情ある石畳の坂道。お土産屋さんが立ち並びます。',
            scheduledTime: '10:30',
            duration: 60,
            category: 'sightseeing',
            estimatedCost: 0,
            location: {
              lat: 34.9962,
              lng: 135.7804,
              address: '京都府京都市東山区桝屋町清水2丁目'
            }
          },
          {
            id: 'test-spot-1-3',
            name: '祇園ランチ',
            description: '京都らしい雰囲気の中で京料理をいただきます。',
            scheduledTime: '12:00',
            duration: 60,
            category: 'dining',
            estimatedCost: 2000,
            location: {
              lat: 35.0036,
              lng: 135.7756,
              address: '京都府京都市東山区祇園町'
            }
          },
          {
            id: 'test-spot-1-4',
            name: '伏見稲荷大社',
            description: '千本鳥居で有名な神社。朱色の鳥居のトンネルは圧巻です。',
            scheduledTime: '14:00',
            duration: 120,
            category: 'sightseeing',
            estimatedCost: 0,
            notes: '歩きやすい靴がおすすめ',
            location: {
              lat: 34.9671,
              lng: 135.7727,
              address: '京都府京都市伏見区深草藪之内町68'
            }
          }
        ],
        totalDistance: 15,
        totalCost: 2400
      },
      {
        day: 2,
        date: '2025-11-02',
        title: '嵐山・金閣寺エリア',
        spots: [
          {
            id: 'test-spot-2-1',
            name: '金閣寺',
            description: '金箔で覆われた豪華絢爛な寺院。池に映る姿も美しいです。',
            scheduledTime: '09:00',
            duration: 60,
            category: 'sightseeing',
            estimatedCost: 500,
            location: {
              lat: 35.0394,
              lng: 135.7292,
              address: '京都府京都市北区金閣寺町1'
            }
          },
          {
            id: 'test-spot-2-2',
            name: '嵐山竹林の小径',
            description: '幻想的な竹林の道。京都の自然を感じられます。',
            scheduledTime: '11:00',
            duration: 45,
            category: 'sightseeing',
            estimatedCost: 0,
            location: {
              lat: 35.0170,
              lng: 135.6722,
              address: '京都府京都市右京区嵯峨小倉山田淵山町'
            }
          },
          {
            id: 'test-spot-2-3',
            name: '嵐山ランチ',
            description: '渡月橋近くで湯豆腐や京野菜を使った料理を楽しみます。',
            scheduledTime: '12:30',
            duration: 60,
            category: 'dining',
            estimatedCost: 2500,
            location: {
              lat: 35.0147,
              lng: 135.6778,
              address: '京都府京都市右京区嵯峨天龍寺芒ノ馬場町'
            }
          },
          {
            id: 'test-spot-2-4',
            name: '天龍寺',
            description: '世界遺産の寺院。美しい庭園が見どころです。',
            scheduledTime: '14:00',
            duration: 60,
            category: 'sightseeing',
            estimatedCost: 500,
            location: {
              lat: 35.0156,
              lng: 135.6739,
              address: '京都府京都市右京区嵯峨天龍寺芒ノ馬場町68'
            }
          }
        ],
        totalDistance: 12,
        totalCost: 3500
      }
    ],
    totalBudget: 5900,
    status: 'draft' as const
  };

  const mockMessage = 'テストモードです。京都2日間の旅程を作成しました！清水寺や金閣寺などの定番スポットを巡る充実したプランです。';

  if (stream) {
    // ストリーミングレスポンス
    const encoder = new TextEncoder();
    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          // メッセージをチャンクに分割してストリーミング
          const words = mockMessage.split('');
          for (const char of words) {
            const chunk = {
              type: 'message',
              content: char
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            // 少し遅延を入れてストリーミング感を出す
            await new Promise(resolve => setTimeout(resolve, 20));
          }

          // しおりデータを送信
          const itineraryChunk = {
            type: 'itinerary',
            itinerary: mockItinerary
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(itineraryChunk)}\n\n`));

          // 完了通知
          const doneChunk = { type: 'done' };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(doneChunk)}\n\n`));

          controller.close();
        } catch (error) {
          const errorChunk = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } else {
    // 非ストリーミングレスポンス
    return NextResponse.json({
      success: true,
      message: mockMessage,
      itinerary: mockItinerary
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
    if (message.trim().toLowerCase() === 'test') {
      return handleMockResponse(stream);
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
        currentDetailingDay
      );
    }

    // 非ストリーミングレスポンス
    return handleGeminiNonStreamingResponse(
      enhancedMessage,
      chatHistory,
      currentItinerary,
      planningPhase,
      currentDetailingDay
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
  currentDetailingDay: any
) {
  try {
    // Gemini APIにメッセージを送信
    const result = await sendGeminiMessage(
      message,
      chatHistory,
      currentItinerary,
      undefined,
      planningPhase,
      currentDetailingDay
    );

    // しおりデータをマージ
    let updatedItinerary = currentItinerary;
    if (result.itinerary) {
      updatedItinerary = mergeItineraryData(currentItinerary, result.itinerary);
    }

    const response: ChatAPIResponse = {
      message: result.message,
      itinerary: updatedItinerary,
      model: "gemini",
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
  currentDetailingDay: any
) {
  const encoder = new TextEncoder();

  // ReadableStreamを作成
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullResponse = "";

        // Gemini APIからストリーミングレスポンスを取得
        for await (const chunk of streamGeminiMessage(
          message,
          chatHistory,
          currentItinerary,
          undefined,
          planningPhase,
          currentDetailingDay
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
        if (itineraryData) {
          const updatedItinerary = mergeItineraryData(
            currentItinerary,
            itineraryData
          );

          const itineraryChunk: ChatStreamChunk = {
            type: "itinerary",
            itinerary: updatedItinerary,
          };

          const data = `data: ${JSON.stringify(itineraryChunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
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
        if (itineraryData) {
          const updatedItinerary = mergeItineraryData(
            currentItinerary,
            itineraryData
          );

          const itineraryChunk: ChatStreamChunk = {
            type: "itinerary",
            itinerary: updatedItinerary,
          };

          const data = `data: ${JSON.stringify(itineraryChunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
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
