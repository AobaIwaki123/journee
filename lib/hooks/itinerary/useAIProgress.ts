/**
 * Phase 7.3 & 10: useAIProgress - AI進行管理
 * 
 * AI呼び出しとストリーミング処理をカプセル化
 * Phase 10: Store分割対応
 */

import { useState, useCallback } from 'react';
import { useChatStore } from '@/lib/store/chat';
import { useAIStore } from '@/lib/store/ai';
import { useUIStore } from '@/lib/store/ui';
import { useSettingsStore } from '@/lib/store/settings';
import { useItineraryStore, useItineraryProgressStore } from '@/lib/store/itinerary';
import { sendChatMessageStream } from '@/lib/utils/api-client';
import { mergeItineraryData } from '@/lib/ai/prompts';
import { generateId } from '@/lib/utils/id-generator';

export interface UseAIProgressReturn {
  isProcessing: boolean;
  proceedAndSendMessage: () => Promise<void>;
}

/**
 * AI進行管理Hook
 */
export function useAIProgress(): UseAIProgressReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Phase 10: 分割されたStoreを使用
  const {
    messages,
    addMessage,
    setLoading,
    setStreaming,
    setStreamingMessage,
    appendStreamingMessage,
    setAbortController,
    setHasReceivedResponse,
  } = useChatStore();
  
  const { selectedModel, claudeApiKey } = useAIStore();
  const { setError } = useUIStore();
  const { settings } = useSettingsStore();
  const { currentItinerary, setItinerary } = useItineraryStore();
  const {
    planningPhase,
    currentDetailingDay,
    proceedToNextStep,
  } = useItineraryProgressStore();
  
  const proceedAndSendMessage = useCallback(async () => {
    setIsProcessing(true);
    setLoading(true);
    setStreaming(true);
    setStreamingMessage("");
    setError(null);

    try {
      const currentPhase = planningPhase;
      
      // フェーズを次に進める
      proceedToNextStep();
      
      // システムメッセージを追加
      const systemMessage = {
        id: generateId(),
        role: "assistant" as const,
        content: `次のステップに進みます...`,
        timestamp: new Date(),
      };
      addMessage(systemMessage);
      
      // AI呼び出し
      const abortController = new AbortController();
      setAbortController(abortController);
      setHasReceivedResponse(true);
      
      let fullResponse = '';
      
      for await (const chunk of sendChatMessageStream(
        `次のステップに進んでください`,
        messages,
        currentItinerary || undefined,
        selectedModel,
        claudeApiKey || undefined,
        planningPhase,
        currentDetailingDay,
        settings.general.currency,
        abortController.signal
      )) {
        if (chunk.type === 'message' && chunk.content) {
          appendStreamingMessage(chunk.content);
          fullResponse += chunk.content;
        } else if (chunk.type === 'itinerary' && chunk.itinerary) {
          const mergedItinerary = mergeItineraryData(currentItinerary || undefined, chunk.itinerary);
          setItinerary(mergedItinerary);
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Unknown error occurred');
        } else if (chunk.type === 'done') {
          break;
        }
      }
      
      const aiMessage = {
        id: generateId(),
        role: "assistant" as const,
        content: fullResponse,
        timestamp: new Date(),
      };
      addMessage(aiMessage);
      setStreamingMessage('');
      setAbortController(null);
    } catch (error: any) {
      console.error('AI progress error:', error);
      setError(error.message || 'AI進行エラーが発生しました');
    } finally {
      setLoading(false);
      setStreaming(false);
      setIsProcessing(false);
    }
  }, [
    planningPhase,
    currentDetailingDay,
    messages,
    currentItinerary,
    selectedModel,
    claudeApiKey,
    settings,
    proceedToNextStep,
    addMessage,
    setLoading,
    setStreaming,
    setStreamingMessage,
    appendStreamingMessage,
    setAbortController,
    setHasReceivedResponse,
    setItinerary,
    setError,
  ]);
  
  return {
    isProcessing,
    proceedAndSendMessage,
  };
}
