/**
 * Phase 10.1: useChatMessage Hook
 * 
 * メッセージ送信ロジック
 * - AIへのメッセージ送信
 * - ストリーミング処理
 * - エラーハンドリング
 * - メッセージ再送・削除
 */

import { useState, useCallback } from 'react';
import { useChatStore } from '@/lib/store/chat';
import { useAIStore } from '@/lib/store/ai';
import { useItineraryStore, useItineraryProgressStore } from '@/lib/store/itinerary';
import { sendChatMessageStream } from '@/lib/utils/api-client';
import { mergeItineraryData } from '@/lib/ai/prompts';
import { generateId } from '@/lib/utils/id-generator';
import type { Message } from '@/types/chat';

export interface UseChatMessageReturn {
  sendMessage: (content: string) => Promise<void>;
  resendMessage: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => void;
  editMessage: (messageId: string, newContent: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function useChatMessage(): UseChatMessageReturn {
  const [error, setError] = useState<string | null>(null);
  
  // Chat Store
  const {
    messages,
    isLoading,
    addMessage,
    setLoading,
    setStreaming,
    setStreamingMessage,
    appendStreamingMessage,
    setAbortController,
    deleteMessage: deleteChatMessage,
    saveEditedMessage,
    setHasReceivedResponse,
  } = useChatStore();
  
  // AI Store
  const { selectedModel, claudeApiKey } = useAIStore();
  
  // Itinerary Store
  const { currentItinerary, setItinerary } = useItineraryStore();
  const { planningPhase, currentDetailingDay } = useItineraryProgressStore();
  
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    try {
      setError(null);
      setLoading(true);
      
      // ユーザーメッセージを追加
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };
      addMessage(userMessage);
      
      // AI応答を取得（ストリーミング）
      setStreaming(true);
      setStreamingMessage('');
      setHasReceivedResponse(true);
      
      const abortController = new AbortController();
      setAbortController(abortController);
      
      let fullResponse = '';
      let receivedItinerary = false;
      let firstChunk = true;
      
      // sendChatMessageStreamはasync generatorを返す
      for await (const chunk of sendChatMessageStream(
        content.trim(),
        messages,
        currentItinerary || undefined,
        selectedModel,
        claudeApiKey || undefined,
        planningPhase,
        currentDetailingDay,
        currentItinerary?.currency,
        abortController.signal
      )) {
        if (chunk.type === 'message' && chunk.content) {
          if (firstChunk) {
            firstChunk = false;
          }
          appendStreamingMessage(chunk.content);
          fullResponse += chunk.content;
        } else if (chunk.type === 'itinerary' && chunk.itinerary) {
          receivedItinerary = true;
          const mergedItinerary = mergeItineraryData(currentItinerary || undefined, chunk.itinerary);
          setItinerary(mergedItinerary);
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Unknown error occurred');
        } else if (chunk.type === 'done') {
          break;
        }
      }
      
      // ストリーミング完了後、AIメッセージを追加
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
      };
      addMessage(assistantMessage);
      
      setStreaming(false);
      setStreamingMessage('');
      setAbortController(null);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'メッセージの送信に失敗しました');
      setStreaming(false);
      setStreamingMessage('');
    } finally {
      setLoading(false);
    }
  }, [
    messages,
    selectedModel,
    claudeApiKey,
    planningPhase,
    currentDetailingDay,
    currentItinerary,
    addMessage,
    setLoading,
    setStreaming,
    setStreamingMessage,
    appendStreamingMessage,
    setAbortController,
    setItinerary,
    setHasReceivedResponse,
  ]);
  
  const resendMessage = useCallback(async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message && message.role === 'user') {
      await sendMessage(message.content);
    }
  }, [messages, sendMessage]);
  
  const deleteMessage = useCallback((messageId: string) => {
    deleteChatMessage(messageId);
  }, [deleteChatMessage]);
  
  const editMessage = useCallback((messageId: string, newContent: string) => {
    saveEditedMessage(messageId, newContent);
  }, [saveEditedMessage]);
  
  return {
    sendMessage,
    resendMessage,
    deleteMessage,
    editMessage,
    isLoading,
    error,
  };
}
