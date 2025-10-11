/**
 * Phase 10.1: ChatBox
 * 
 * チャットコンテナコンポーネント（useChatStore使用）
 */

"use client";

import React from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { AISelector } from "./AISelector";
import { useChatStore } from "@/lib/store/chat";

export const ChatBox: React.FC = () => {
  const { messages } = useChatStore();

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
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

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList />
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 border-t border-gray-200">
        <MessageInput />
      </div>
    </div>
  );
};
