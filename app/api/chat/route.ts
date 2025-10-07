/**
 * チャットAPIルート
 * POST /api/chat
 * Phase 4.5: フェーズ判定ロジックと「次へ」キーワード検出を追加
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ChatAPIRequest, ChatAPIResponse, ChatStreamChunk } from '@/types/api';
import { sendGeminiMessage, streamGeminiMessage } from '@/lib/ai/gemini';
import { 
  parseAIResponse, 
  mergeItineraryData, 
  generateErrorMessage,
  createNextStepPrompt 
} from '@/lib/ai/prompts';

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
      claudeApiKey,
      stream = false,
      planningPhase = 'initial',
      currentDetailingDay,
    } = body;

    // バリデーション
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Message is required' },
        { status: 400 }
      );
    }

    // Phase 4.5: 「次へ」キーワードの検出
    const isNextStepTrigger = detectNextStepKeyword(message);
    let enhancedMessage = message;
    
    if (isNextStepTrigger) {
      // 「次へ」が検出された場合、次のステップ誘導プロンプトを追加
      const nextStepPrompt = createNextStepPrompt(planningPhase, currentItinerary);
      if (nextStepPrompt) {
        enhancedMessage = `${message}\n\n【システムからの補足】\n${nextStepPrompt}`;
      }
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
      return handleStreamingResponse(
        enhancedMessage,
        chatHistory,
        currentItinerary,
        planningPhase,
        currentDetailingDay
      );
    }

    // 非ストリーミングレスポンス
    return handleNonStreamingResponse(
      enhancedMessage,
      chatHistory,
      currentItinerary,
      planningPhase,
      currentDetailingDay
    );

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
 * Phase 4.5: フェーズ情報を追加
 */
async function handleNonStreamingResponse(
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
      model: 'gemini',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    throw error;
  }
}

/**
 * ストリーミングレスポンスを処理
 * Phase 4.5: フェーズ情報を追加
 */
async function handleStreamingResponse(
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
        let fullResponse = '';

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
 * Phase 4.5: 「次へ」キーワードを検出
 */
function detectNextStepKeyword(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  const nextKeywords = [
    '次へ',
    '次に',
    '次',
    'つぎ',
    '進む',
    '進んで',
    '次のステップ',
    '次の段階',
    'next',
  ];
  
  return nextKeywords.some(keyword => lowerMessage.includes(keyword));
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
