'use client';

import React from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { AISelector } from './AISelector';
import { useStore } from '@/lib/store/useStore';
import { Loader2 } from 'lucide-react';

export const ChatBox: React.FC = () => {
  const isLoading = useStore((state: any) => state.isLoading);
  const isStreaming = useStore((state: any) => state.isStreaming);
  const isAutoProgressing = useStore((state: any) => state.isAutoProgressing);

  const isProcessing = isLoading || isStreaming || isAutoProgressing;

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 relative">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-gray-200">
        <h2 className="text-base md:text-lg font-semibold text-gray-800">AIチャット</h2>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          旅行の希望を伝えてください
        </p>
        <div className="mt-2 md:mt-3">
          <AISelector />
        </div>
      </div>

      {/* ローディングバー */}
      {isProcessing && (
        <div className="h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 animate-pulse">
          <div className="h-full bg-blue-500 animate-[shimmer_1.5s_ease-in-out_infinite]" 
               style={{
                 background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                 backgroundSize: '200% 100%',
                 animation: 'shimmer 1.5s infinite'
               }}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList />
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 border-t border-gray-200">
        <MessageInput />
      </div>

      {/* グローバルローディングインジケーター（ホバー表示） */}
      {isProcessing && (
        <div className="absolute top-20 left-1/2 z-20 animate-slide-in-from-top">
          <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium text-sm">
              {isAutoProgressing ? "しおりを自動作成中..." : isStreaming ? "AIが返答中..." : "メッセージを送信中..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
