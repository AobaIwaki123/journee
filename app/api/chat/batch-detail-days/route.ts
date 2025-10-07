/**
 * Phase 4.9.2: バッチ日程詳細化API
 * 並列ストリーミング処理で複数日の詳細化を同時実行
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamGeminiMessage } from '@/lib/ai/gemini';
import { mergeItineraryData, createDayDetailPrompt } from '@/lib/ai/prompts';
import type {
  BatchDayDetailRequest,
  MultiStreamChunk,
  DayDetailTask,
} from '@/types/api';
import type { ItineraryData } from '@/types/itinerary';

// レート制限対策のセマフォ
class Semaphore {
  private permits: number;
  private queue: (() => void)[] = [];
  
  constructor(permits: number) {
    this.permits = permits;
  }
  
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }
  
  release(): void {
    this.permits++;
    const resolve = this.queue.shift();
    if (resolve) {
      this.permits--;
      resolve();
    }
  }
}

/**
 * 各日の詳細化を並列実行
 * Phase 4.9.4: タイムアウトとリトライ処理を追加
 */
async function processDayDetail(
  day: DayDetailTask,
  request: BatchDayDetailRequest,
  semaphore: Semaphore,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController,
  timeout: number = 120000 // デフォルト120秒
): Promise<{ day: number; success: boolean; error?: string }> {
  const maxRetries = 2;
  let retryCount = 0;
  
  while (retryCount <= maxRetries) {
    try {
      // セマフォを取得（並列数制限）
      await semaphore.acquire();
    
    // 開始通知
    const startChunk: MultiStreamChunk = {
      type: 'day_start',
      day: day.day,
      timestamp: Date.now(),
    };
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(startChunk)}\n\n`));
    
    // 日程詳細化プロンプトを生成
    const dayPrompt = createDayDetailPrompt(
      day.day,
      day.theme || `${day.day}日目`,
      request.currentItinerary
    );
    
    const userMessage = `${day.day}日目の詳細を作成してください。\n\n${dayPrompt}`;
    
    let fullResponse = '';
    let dayItinerary: Partial<ItineraryData> | undefined;
    
    // Phase 4.9.4: タイムアウト処理
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout);
    });
    
    const streamPromise = (async () => {
      // Gemini APIをストリーミングで呼び出し
      for await (const chunk of streamGeminiMessage(
        userMessage,
        request.chatHistory,
        request.currentItinerary,
        'detailing',
        day.day
      )) {
      if (chunk.type === 'message' && chunk.content) {
        fullResponse += chunk.content;
        
        // メッセージチャンクを送信
        const messageChunk: MultiStreamChunk = {
          type: 'message',
          day: day.day,
          content: chunk.content,
          timestamp: Date.now(),
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(messageChunk)}\n\n`));
      } else if (chunk.type === 'itinerary' && chunk.itinerary) {
        dayItinerary = chunk.itinerary;
        
        // しおりチャンクを送信
        const itineraryChunk: MultiStreamChunk = {
          type: 'itinerary',
          day: day.day,
          itinerary: chunk.itinerary,
          timestamp: Date.now(),
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(itineraryChunk)}\n\n`));
      }
      }
    })();
    
    // タイムアウトとストリーミングをレース
    await Promise.race([streamPromise, timeoutPromise]);
    
    // 完了通知
    const completeChunk: MultiStreamChunk = {
      type: 'day_complete',
      day: day.day,
      timestamp: Date.now(),
    };
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(completeChunk)}\n\n`));
    
    return { day: day.day, success: true };
    
  } catch (error: any) {
    console.error(`Error processing day ${day.day} (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
    
    // Phase 4.9.4: リトライ判定
    const isRetryable = retryCount < maxRetries && 
      (error.message?.includes('Timeout') || 
       error.message?.includes('rate limit') ||
       error.message?.includes('429'));
    
    if (isRetryable) {
      retryCount++;
      const waitTime = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff (最大5秒)
      console.log(`Retrying day ${day.day} after ${waitTime}ms...`);
      
      // 再試行通知
      const retryChunk: MultiStreamChunk = {
        type: 'message',
        day: day.day,
        content: `\n[再試行中... (${retryCount}/${maxRetries})]`,
        timestamp: Date.now(),
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(retryChunk)}\n\n`));
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue; // リトライ
    }
    
    // リトライ不可またはリトライ回数超過 - エラー通知
    const errorChunk: MultiStreamChunk = {
      type: 'day_error',
      day: day.day,
      error: retryCount > 0 
        ? `${error.message} (${retryCount}回の再試行後に失敗)`
        : error.message || 'Unknown error',
      timestamp: Date.now(),
    };
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
    
    return { day: day.day, success: false, error: error.message };
    
  } finally {
    // セマフォを解放
    semaphore.release();
  }
  }
  
  // すべてのリトライが失敗した場合
  return { day: day.day, success: false, error: 'Max retries exceeded' };
}

/**
 * POST /api/chat/batch-detail-days
 * 並列日程詳細化API（ストリーミング対応）
 */
export async function POST(request: NextRequest) {
  try {
    const body: BatchDayDetailRequest = await request.json();
    const { days, maxParallel = 3, timeout = 120000 } = body; // Phase 4.9.4: タイムアウト設定
    
    // セマフォを作成（並列数を制限）
    const semaphore = new Semaphore(maxParallel);
    
    // ストリーミングレスポンスを作成
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const startTime = Date.now();
        
        let completedDays: number[] = [];
        let errorDays: number[] = [];
        
        try {
          // 全ての日を並列処理（Phase 4.9.4: タイムアウト付き）
          const tasks = days.map(day =>
            processDayDetail(day, body, semaphore, encoder, controller, timeout)
          );
          
          // 🚀 真の並列実行: Promise.allSettledで全てのタスクを同時実行
          const results = await Promise.allSettled(tasks);
          
          // 結果を集計
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              if (result.value.success) {
                completedDays.push(result.value.day);
              } else {
                errorDays.push(result.value.day);
              }
            } else {
              // Promise自体が失敗した場合
              errorDays.push(days[index].day);
              console.error(`Task ${days[index].day} rejected:`, result.reason);
            }
          });
          
          // 最終進捗を送信
          const finalProgressChunk: MultiStreamChunk = {
            type: 'progress',
            progress: {
              completedDays,
              processingDays: [],
              errorDays,
              totalDays: days.length,
              progressRate: Math.round((completedDays.length / days.length) * 100),
            },
            timestamp: Date.now(),
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalProgressChunk)}\n\n`));
          
          const processingTime = Date.now() - startTime;
          
          // 完了通知
          const doneChunk: MultiStreamChunk = {
            type: 'done',
            progress: {
              completedDays,
              processingDays: [],
              errorDays,
              totalDays: days.length,
              progressRate: 100,
            },
            timestamp: Date.now(),
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(doneChunk)}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          
          console.log(`Batch processing complete: ${processingTime}ms, success: ${completedDays.length}, errors: ${errorDays.length}`);
          
        } catch (error: any) {
          console.error('Batch processing error:', error);
          
          const errorChunk: MultiStreamChunk = {
            type: 'error',
            error: error.message || 'Unknown error occurred',
            timestamp: Date.now(),
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
        } finally {
          controller.close();
        }
      },
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error: any) {
    console.error('Batch detail API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}