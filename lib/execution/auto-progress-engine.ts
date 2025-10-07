/**
 * Phase 4.10.2: 一気通貫実行エンジン
 * 骨組み作成 → 詳細化 → 完成の自動実行
 */

import { sendChatMessageStream } from '@/lib/utils/api-client';
import { batchDetailDaysStream, createDayDetailTasks } from '@/lib/utils/batch-api-client';
import { mergeItineraryData } from '@/lib/ai/prompts';
import type { Message } from '@/types/chat';
import type { ItineraryData } from '@/types/itinerary';
import type { AIModelId } from '@/types/ai';
import type { MultiStreamChunk } from '@/types/api';

/**
 * 自動進行の進捗状態
 */
export interface AutoProgressState {
  phase: 'idle' | 'skeleton' | 'detailing' | 'completed' | 'error';
  currentStep: string;
  progress: number; // 0-100
  error?: string;
}

/**
 * 自動進行コールバック
 */
export interface AutoProgressCallbacks {
  onStateChange: (state: AutoProgressState) => void;
  onMessage: (message: Message) => void;
  onItineraryUpdate: (itinerary: ItineraryData) => void;
  onComplete: () => void;
  onError: (error: string) => void;
}

/**
 * 一気通貫でしおりを作成
 */
export async function executeFullItineraryCreation(
  messages: Message[],
  currentItinerary: ItineraryData | undefined,
  selectedAI: AIModelId,
  claudeApiKey: string,
  parallelCount: number,
  callbacks: AutoProgressCallbacks
): Promise<void> {
  const { onStateChange, onMessage, onItineraryUpdate, onComplete, onError } = callbacks;
  
  try {
    // ステップ1: 骨組み作成
    onStateChange({
      phase: 'skeleton',
      currentStep: '骨組みを作成中...',
      progress: 10,
    });
    
    const chatHistory = messages.slice(-10).map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
    }));
    
    let skeletonItinerary: ItineraryData | undefined;
    let skeletonResponse = '';
    
    // 骨組み作成のストリーミング
    for await (const chunk of sendChatMessageStream(
      '骨組みを作成してください',
      chatHistory,
      currentItinerary,
      selectedAI,
      claudeApiKey,
      'skeleton',
      null
    )) {
      if (chunk.type === 'message' && chunk.content) {
        skeletonResponse += chunk.content;
      } else if (chunk.type === 'itinerary' && chunk.itinerary) {
        skeletonItinerary = mergeItineraryData(
          currentItinerary,
          chunk.itinerary
        );
        onItineraryUpdate(skeletonItinerary);
      } else if (chunk.type === 'error') {
        throw new Error(chunk.error || 'Skeleton creation failed');
      }
    }
    
    // 骨組みメッセージを追加
    if (skeletonResponse) {
      const skeletonMessage: Message = {
        id: `assistant-skeleton-${Date.now()}`,
        role: 'assistant',
        content: skeletonResponse,
        timestamp: new Date(),
      };
      onMessage(skeletonMessage);
    }
    
    if (!skeletonItinerary || !skeletonItinerary.schedule || skeletonItinerary.schedule.length === 0) {
      throw new Error('骨組みの作成に失敗しました');
    }
    
    onStateChange({
      phase: 'skeleton',
      currentStep: '骨組み作成完了',
      progress: 30,
    });
    
    // ステップ2: 全日程の並列詳細化
    onStateChange({
      phase: 'detailing',
      currentStep: `全${skeletonItinerary.schedule.length}日の詳細を並列作成中...`,
      progress: 40,
    });
    
    const tasks = createDayDetailTasks(skeletonItinerary);
    let detailProgress = 40;
    const progressPerDay = 50 / tasks.length; // 40% → 90%
    
    for await (const chunk of batchDetailDaysStream(
      tasks,
      [...messages, ...(skeletonResponse ? [{
        id: `assistant-skeleton-${Date.now()}`,
        role: 'assistant' as const,
        content: skeletonResponse,
        timestamp: new Date(),
      }] : [])],
      skeletonItinerary,
      parallelCount
    )) {
      if (chunk.type === 'day_start') {
        onStateChange({
          phase: 'detailing',
          currentStep: `${chunk.day}日目の詳細を作成中...`,
          progress: detailProgress,
        });
      } else if (chunk.type === 'day_complete') {
        detailProgress += progressPerDay;
        onStateChange({
          phase: 'detailing',
          currentStep: `${chunk.day}日目の詳細が完了`,
          progress: Math.min(90, Math.round(detailProgress)),
        });
      } else if (chunk.type === 'itinerary' && chunk.itinerary) {
        const updatedItinerary = mergeItineraryData(
          skeletonItinerary,
          chunk.itinerary
        );
        onItineraryUpdate(updatedItinerary);
        skeletonItinerary = updatedItinerary;
      } else if (chunk.type === 'day_error') {
        console.error(`Day ${chunk.day} error:`, chunk.error);
        // エラーでも続行（部分的失敗を許容）
      } else if (chunk.type === 'progress' && chunk.progress) {
        const rate = 40 + (chunk.progress.progressRate * 0.5);
        onStateChange({
          phase: 'detailing',
          currentStep: `詳細化中... (${chunk.progress.completedDays.length}/${chunk.progress.totalDays}日完了)`,
          progress: Math.round(rate),
        });
      } else if (chunk.type === 'done') {
        break;
      }
    }
    
    // ステップ3: 完成
    onStateChange({
      phase: 'completed',
      currentStep: 'しおりが完成しました！',
      progress: 100,
    });
    
    onComplete();
    
  } catch (error: any) {
    console.error('Auto progress error:', error);
    onStateChange({
      phase: 'error',
      currentStep: 'エラーが発生しました',
      progress: 0,
      error: error.message,
    });
    onError(error.message || 'しおりの自動作成中にエラーが発生しました');
  }
}