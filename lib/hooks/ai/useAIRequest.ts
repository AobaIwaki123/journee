/**
 * Phase 11.1: useAIRequest Hook
 * 
 * 統一されたAI呼び出しロジック
 * - エラーハンドリング
 * - リトライロジック
 * - プログレス表示
 * - キャンセル対応
 */

import { useState, useCallback, useRef } from 'react';
import { useChatStore } from '@/lib/store/chat';
import { useAIStore } from '@/lib/store/ai';
import { useUIStore } from '@/lib/store/ui';
import { sendChatMessageStream } from '@/lib/utils/api-client';
import type { AIModelId } from '@/types/ai';
import type { Message } from '@/types/chat';
import type { ItineraryData, ItineraryPhase } from '@/types/itinerary';

export interface UseAIRequestOptions {
  autoRetry?: boolean;
  retryCount?: number;
  retryDelay?: number;
  onChunk?: (chunk: string) => void;
  onComplete?: (result: any) => void;
  onError?: (error: Error) => void;
}

export interface UseAIRequestReturn {
  sendRequest: (
    prompt: string,
    context?: {
      messages?: Message[];
      itinerary?: ItineraryData;
      planningPhase?: ItineraryPhase;
      currentDetailingDay?: number | null;
      currency?: string;
    }
  ) => Promise<{ success: boolean; response?: string; itinerary?: ItineraryData; error?: string }>;
  isLoading: boolean;
  error: string | null;
  progress: number;
  abort: () => void;
}

export function useAIRequest(options: UseAIRequestOptions = {}): UseAIRequestReturn {
  const {
    autoRetry = false,
    retryCount = 3,
    retryDelay = 1000,
    onChunk,
    onComplete,
    onError,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { setAbortController } = useChatStore();
  const { selectedModel, claudeApiKey } = useAIStore();
  const { setError: setGlobalError } = useUIStore();

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setProgress(0);
    }
  }, []);

  const sendRequest = useCallback(
    async (
      prompt: string,
      context?: {
        messages?: Message[];
        itinerary?: ItineraryData;
        planningPhase?: ItineraryPhase;
        currentDetailingDay?: number | null;
        currency?: string;
      }
    ) => {
      let attempts = 0;
      const maxAttempts = autoRetry ? retryCount : 1;

      while (attempts < maxAttempts) {
        try {
          setIsLoading(true);
          setError(null);
          setProgress(0);

          const abortController = new AbortController();
          abortControllerRef.current = abortController;
          setAbortController(abortController);

          let fullResponse = '';
          let receivedItinerary: ItineraryData | undefined;
          let chunkCount = 0;

          for await (const chunk of sendChatMessageStream(
            prompt,
            context?.messages || [],
            context?.itinerary,
            selectedModel,
            claudeApiKey || undefined,
            context?.planningPhase,
            context?.currentDetailingDay,
            context?.currency,
            abortController.signal
          )) {
            if (chunk.type === 'message' && chunk.content) {
              fullResponse += chunk.content;
              chunkCount++;
              setProgress(Math.min(chunkCount * 5, 90));
              
              if (onChunk) {
                onChunk(chunk.content);
              }
            } else if (chunk.type === 'itinerary' && chunk.itinerary) {
              receivedItinerary = chunk.itinerary;
            } else if (chunk.type === 'error') {
              throw new Error(chunk.error || 'Unknown error occurred');
            } else if (chunk.type === 'done') {
              break;
            }
          }

          setProgress(100);
          setIsLoading(false);
          abortControllerRef.current = null;

          const result = {
            success: true,
            response: fullResponse,
            itinerary: receivedItinerary,
          };

          if (onComplete) {
            onComplete(result);
          }

          return result;
        } catch (err: any) {
          attempts++;

          if (err.name === 'AbortError') {
            return {
              success: false,
              error: 'リクエストがキャンセルされました',
            };
          }

          if (attempts >= maxAttempts) {
            const errorMessage = err.message || 'AI呼び出しに失敗しました';
            setError(errorMessage);
            setGlobalError(errorMessage);
            setIsLoading(false);

            if (onError) {
              onError(err);
            }

            return {
              success: false,
              error: errorMessage,
            };
          }

          // リトライ前に待機
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
        }
      }

      return {
        success: false,
        error: '予期しないエラーが発生しました',
      };
    },
    [selectedModel, claudeApiKey, autoRetry, retryCount, retryDelay, onChunk, onComplete, onError, setAbortController, setGlobalError]
  );

  return {
    sendRequest,
    isLoading,
    error,
    progress,
    abort,
  };
}
