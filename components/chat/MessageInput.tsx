'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import { Send } from 'lucide-react';
import { sendChatMessageStream } from '@/lib/utils/api-client';
import { mergeItineraryData } from '@/lib/ai/prompts';

export const MessageInput: React.FC = () => {
  const [input, setInput] = useState('');
  
  // Store state
  const messages = useStore((state) => state.messages);
  const addMessage = useStore((state) => state.addMessage);
  const isLoading = useStore((state) => state.isLoading);
  const isStreaming = useStore((state) => state.isStreaming);
  const setLoading = useStore((state) => state.setLoading);
  const setStreaming = useStore((state) => state.setStreaming);
  const setStreamingMessage = useStore((state) => state.setStreamingMessage);
  const appendStreamingMessage = useStore((state) => state.appendStreamingMessage);
  const currentItinerary = useStore((state) => state.currentItinerary);
  const setItinerary = useStore((state) => state.setItinerary);
  const selectedAI = useStore((state) => state.selectedAI);
  const claudeApiKey = useStore((state) => state.claudeApiKey);
  const setError = useStore((state) => state.setError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isStreaming) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: input.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput('');
    setLoading(true);
    setStreaming(true);
    setStreamingMessage('');
    setError(null);

    try {
      // チャット履歴を準備（最新10件）
      const chatHistory = messages.slice(-10).map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      let fullResponse = '';
      let receivedItinerary = false;

      // ストリーミングレスポンスを処理
      for await (const chunk of sendChatMessageStream(
        userMessage.content,
        chatHistory,
        currentItinerary || undefined
      )) {
        if (chunk.type === 'message' && chunk.content) {
          // メッセージチャンクを追加
          appendStreamingMessage(chunk.content);
          fullResponse += chunk.content;
        } else if (chunk.type === 'itinerary' && chunk.itinerary) {
          // しおりデータを受信
          receivedItinerary = true;
          const mergedItinerary = mergeItineraryData(
            currentItinerary || undefined,
            chunk.itinerary
          );
          setItinerary(mergedItinerary);
        } else if (chunk.type === 'error') {
          // エラーを受信
          throw new Error(chunk.error || 'Unknown error occurred');
        } else if (chunk.type === 'done') {
          // 完了
          break;
        }
      }

      // ストリーミング完了後、AIメッセージを追加
      const aiMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: fullResponse || 'しおりを更新しました。',
        timestamp: new Date(),
      };
      addMessage(aiMessage);
      setStreamingMessage('');

    } catch (error: any) {
      console.error('Chat error:', error);
      
      // エラーメッセージを表示
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant' as const,
        content: `申し訳ございません。エラーが発生しました: ${error.message}`,
        timestamp: new Date(),
      };
      addMessage(errorMessage);
      setError(error.message);
      setStreamingMessage('');
      
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const disabled = !input.trim() || isLoading || isStreaming;

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="メッセージを入力..."
        disabled={disabled}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={disabled}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
};
