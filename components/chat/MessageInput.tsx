'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import { Send } from 'lucide-react';
import { sendChatMessageStream } from '@/lib/utils/api-client';
import { mergeItineraryData, parseAIResponse } from '@/lib/ai/prompts';

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

      // ストリーミング完了後、JSONブロックを削除してAIメッセージを追加
      const { message: cleanMessage } = parseAIResponse(fullResponse);
      
      const aiMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: cleanMessage,
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

  const disabled = isLoading || isStreaming;

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="メッセージを入力..."
        disabled={disabled}
        className="
          flex-1 px-4 py-3 
          border-2 border-gray-300 rounded-lg 
          text-gray-900 placeholder:text-gray-500
          bg-white
          transition-all duration-200
          focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100
          hover:border-gray-400
          disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed
          shadow-sm focus:shadow-md
        "
      />
      <button
        type="submit"
        disabled={disabled}
        className="
          px-5 py-3 
          bg-gradient-to-r from-blue-500 to-blue-600 
          text-white font-medium rounded-lg 
          hover:from-blue-600 hover:to-blue-700 
          active:from-blue-700 active:to-blue-800
          focus:outline-none focus:ring-4 focus:ring-blue-200
          disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400
          transition-all duration-200
          shadow-md hover:shadow-lg
        "
        aria-label="メッセージを送信"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
};
