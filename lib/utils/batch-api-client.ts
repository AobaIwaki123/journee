/**
 * Phase 4.9: バッチAPI処理用クライアント
 * 並列日程詳細化のフロントエンドクライアント
 */

import type {
  BatchDayDetailRequest,
  BatchDayDetailResponse,
  MultiStreamChunk,
  DayDetailTask,
} from '@/types/api';
import type { ItineraryData } from '@/types/itinerary';
import type { ChatMessage } from '@/types/chat';

/**
 * バッチ日程詳細化をストリーミングで実行
 */
export async function* batchDetailDaysStream(
  days: DayDetailTask[],
  chatHistory: ChatMessage[],
  currentItinerary: ItineraryData | undefined,
  maxParallel: number = 3
): AsyncGenerator<MultiStreamChunk, void, unknown> {
  const request: BatchDayDetailRequest = {
    itineraryId: currentItinerary?.id || 'temp',
    days,
    chatHistory: chatHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    currentItinerary,
    maxParallel,
  };
  
  const response = await fetch('/api/chat/batch-detail-days', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  if (!response.body) {
    throw new Error('Response body is null');
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // 最後の行は不完全な可能性があるので保持
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            yield { type: 'done', timestamp: Date.now() };
            return;
          }
          
          try {
            const chunk: MultiStreamChunk = JSON.parse(data);
            yield chunk;
          } catch (error) {
            console.error('Failed to parse SSE data:', error, data);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * バッチ日程詳細化（非ストリーミング版）
 */
export async function batchDetailDays(
  days: DayDetailTask[],
  chatHistory: ChatMessage[],
  currentItinerary: ItineraryData | undefined,
  maxParallel: number = 3
): Promise<BatchDayDetailResponse> {
  const request: BatchDayDetailRequest = {
    itineraryId: currentItinerary?.id || 'temp',
    days,
    chatHistory: chatHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    currentItinerary,
    maxParallel,
  };
  
  const response = await fetch('/api/chat/batch-detail-days', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

/**
 * 日程詳細化タスクを生成
 */
export function createDayDetailTasks(
  itinerary: ItineraryData
): DayDetailTask[] {
  return itinerary.schedule.map((day, index) => ({
    day: day.day,
    theme: day.theme,
    additionalInfo: `${day.day}日目: ${day.theme || '詳細を追加'}`,
    priority: index, // 順番通りの優先度
  }));
}