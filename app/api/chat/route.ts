/**
 * チャットAPIルート
 * POST /api/chat
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ChatAPIRequest, ChatAPIResponse, ChatStreamChunk } from '@/types/api';
import { sendGeminiMessage, streamGeminiMessage } from '@/lib/ai/gemini';
import { parseAIResponse, mergeItineraryData, generateErrorMessage } from '@/lib/ai/prompts';

/**
 * POST /api/chat
 * チャットメッセージを送信してAIの応答を取得
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディをパース
    const body = await request.json() as ChatAPIRequest;
    const {
      message,
      chatHistory = [],
      currentItinerary,
      model = 'gemini',
      geminiModel = 'gemini-2.5-pro',
      claudeApiKey,
      stream = false,
    } = body;

    // バリデーション
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Message is required' },
        { status: 400 }
      );
    }

    // モデルがClaudeの場合はAPIキーが必要
    if (model === 'claude') {
      if (!claudeApiKey) {
        return NextResponse.json(
          { 
            error: 'API key required', 
            message: 'Claude API key is required for using Claude model' 
          },
          { status: 400 }
        );
      }
      
      // Claude統合は後で実装
      return NextResponse.json(
        { 
          error: 'Not implemented', 
          message: 'Claude integration is not yet implemented' 
        },
        { status: 501 }
      );
    }

    // ストリーミングレスポンスの場合
    if (stream) {
      return handleStreamingResponse(message, chatHistory, currentItinerary, geminiModel);
    }

    // 非ストリーミングレスポンス
    return handleNonStreamingResponse(message, chatHistory, currentItinerary, geminiModel);

  } catch (error: any) {
    console.error('Chat API Error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: generateErrorMessage(error),
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * 非ストリーミングレスポンスを処理
 */
async function handleNonStreamingResponse(
  message: string,
  chatHistory: any[],
  currentItinerary: any,
  geminiModel: string = 'gemini-2.5-pro'
) {
  try {
    // Gemini APIにメッセージを送信
    const result = await sendGeminiMessage(message, chatHistory, currentItinerary, undefined, geminiModel);

    // しおりデータをマージ
    let updatedItinerary = currentItinerary;
    if (result.itinerary) {
      updatedItinerary = mergeItineraryData(currentItinerary, result.itinerary);
    }

    const response: ChatAPIResponse = {
      message: result.message,
      itinerary: updatedItinerary,
      model: 'gemini',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    throw error;
  }
}

/**
 * ストリーミングレスポンスを処理
 */
async function handleStreamingResponse(
  message: string,
  chatHistory: any[],
  currentItinerary: any,
  geminiModel: string = 'gemini-2.5-pro'
) {
  const encoder = new TextEncoder();

  // ReadableStreamを作成
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullResponse = '';

        // Gemini APIからストリーミングレスポンスを取得
        for await (const chunk of streamGeminiMessage(message, chatHistory, currentItinerary, undefined, geminiModel)) {
          fullResponse += chunk;

          // チャンクを送信
          const streamChunk: ChatStreamChunk = {
            type: 'message',
            content: chunk,
          };
          
          const data = `data: ${JSON.stringify(streamChunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        // 完全なレスポンスからしおりデータを抽出
        const { message: finalMessage, itineraryData } = parseAIResponse(fullResponse);

        // しおりデータがある場合は送信
        if (itineraryData) {
          const updatedItinerary = mergeItineraryData(currentItinerary, itineraryData);
          
          const itineraryChunk: ChatStreamChunk = {
            type: 'itinerary',
            itinerary: updatedItinerary,
          };
          
          const data = `data: ${JSON.stringify(itineraryChunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        // 完了を通知
        const doneChunk: ChatStreamChunk = {
          type: 'done',
        };
        
        const data = `data: ${JSON.stringify(doneChunk)}\n\n`;
        controller.enqueue(encoder.encode(data));

        controller.close();
      } catch (error: any) {
        console.error('Streaming error:', error);
        
        // エラーを送信
        const errorChunk: ChatStreamChunk = {
          type: 'error',
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
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * OPTIONS /api/chat
 * CORS対応
 */
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
