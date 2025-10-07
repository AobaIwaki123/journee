/**
 * Phase 4.10.2: 順次実行版しおり作成エンジン
 * 骨組み作成 → 各日を順次詳細化 → 完成の自動実行
 */

import { sendChatMessageStream } from '@/lib/utils/api-client';
import { mergeItineraryData } from '@/lib/ai/prompts';
import type { Message } from '@/types/chat';
import type { ItineraryData } from '@/types/itinerary';
import type { AIModelId } from '@/types/ai';

/**
 * 自動進行の進捗状態
 */
export interface AutoProgressState {
  phase: 'idle' | 'skeleton' | 'detailing' | 'completed' | 'error';
  currentStep: string;
  currentDay?: number;
  totalDays?: number;
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
 * 一気通貫でしおりを作成（順次実行版）
 */
export async function executeSequentialItineraryCreation(
  messages: Message[],
  currentItinerary: ItineraryData | undefined,
  selectedAI: AIModelId,
  claudeApiKey: string,
  callbacks: AutoProgressCallbacks
): Promise<void> {
  const { onStateChange, onMessage, onItineraryUpdate, onComplete, onError } = callbacks;
  
  try {
    // ステップ1: 骨組み作成
    onStateChange({
      phase: 'skeleton',
      currentStep: '旅程の骨組みを作成中...',
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
      '旅程の骨組みを作成してください。各日の大まかなテーマやエリアを決定してください。',
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
    
    // ステップ2: 各日を順次詳細化
    const totalDays = skeletonItinerary.schedule.length;
    const baseProgress = 30;
    const progressPerDay = 60 / totalDays; // 30% → 90%
    
    for (let i = 0; i < totalDays; i++) {
      const dayNumber = i + 1;
      const currentProgress = baseProgress + (progressPerDay * i);
      
      onStateChange({
        phase: 'detailing',
        currentStep: `${dayNumber}日目の詳細を作成中...`,
        currentDay: dayNumber,
        totalDays,
        progress: Math.round(currentProgress),
      });
      
      let dayResponse = '';
      
      // 各日の詳細化
      for await (const chunk of sendChatMessageStream(
        `${dayNumber}日目の詳細なスケジュールを作成してください。具体的な観光スポット、時間、移動手段を含めてください。`,
        [...chatHistory, ...(skeletonResponse ? [{
          id: `assistant-skeleton-${Date.now()}`,
          role: 'assistant' as const,
          content: skeletonResponse,
          timestamp: new Date(),
        }] : [])],
        skeletonItinerary,
        selectedAI,
        claudeApiKey,
        'detailing',
        dayNumber
      )) {
        if (chunk.type === 'message' && chunk.content) {
          dayResponse += chunk.content;
        } else if (chunk.type === 'itinerary' && chunk.itinerary) {
          skeletonItinerary = mergeItineraryData(
            skeletonItinerary,
            chunk.itinerary
          );
          onItineraryUpdate(skeletonItinerary);
        } else if (chunk.type === 'error') {
          console.error(`Day ${dayNumber} error:`, chunk.error);
          // エラーでも続行
        }
      }
      
      // 各日のメッセージを追加
      if (dayResponse) {
        const dayMessage: Message = {
          id: `assistant-day${dayNumber}-${Date.now()}`,
          role: 'assistant',
          content: dayResponse,
          timestamp: new Date(),
        };
        onMessage(dayMessage);
      }
      
      onStateChange({
        phase: 'detailing',
        currentStep: `${dayNumber}日目の詳細が完了`,
        currentDay: dayNumber,
        totalDays,
        progress: Math.round(currentProgress + progressPerDay),
      });
    }
    
    // ステップ3: 完成
    onStateChange({
      phase: 'completed',
      currentStep: 'しおりが完成しました！',
      progress: 100,
    });
    
    onComplete();
    
  } catch (error: any) {
    console.error('Sequential itinerary creation error:', error);
    onStateChange({
      phase: 'error',
      currentStep: 'エラーが発生しました',
      progress: 0,
      error: error.message,
    });
    onError(error.message || 'しおりの自動作成中にエラーが発生しました');
  }
}