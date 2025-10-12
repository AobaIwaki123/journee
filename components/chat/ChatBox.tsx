'use client';

import React from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { AISelector } from './AISelector';
import { GeminiFlashBanner } from './GeminiFlashBanner'; // 追加
import { useStore } from '@/lib/store/useStore'; // 追加

export const ChatBox: React.FC = () => {
  const messages = useStore((state: any) => state.messages); // 追加
  const isLoading = useStore((state: any) => state.isLoading); // 追加
  const isStreaming = useStore((state: any) => state.isStreaming); // 追加
  const resetChatHistory = useStore((state: any) => state.resetChatHistory); // 追加

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 relative"> {/* relativeを追加 */}
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-gray-200">
        <div className="flex items-center"> {/* Flex container for title and banner */}
          <h2 className="text-base md:text-lg font-semibold text-gray-800">AIチャット</h2>
          <GeminiFlashBanner /> {/* Gemini Flashバナーを配置 */}
        </div>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          旅行の希望を伝えてください
        </p>
        <div className="mt-2 md:mt-3">
          <AISelector />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden relative"> {/* relativeを追加 */}
        <MessageList />
        {/* チャット履歴リセットボタン */}
        <button
          onClick={resetChatHistory}
          disabled={isLoading || isStreaming || messages.length === 0}
          className="absolute bottom-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
          title="チャット履歴をリセット"
        >
          リセット
        </button>
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 border-t border-gray-200">
        <MessageInput />
      </div>
    </div>
  );
};
