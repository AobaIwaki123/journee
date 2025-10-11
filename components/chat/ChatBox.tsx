/**
 * Phase 10.1: ChatBox
 * 
 * チャットコンテナコンポーネント（useChatStore使用）
 */

"use client";

import React from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { useChatStore } from "@/lib/store/chat";

export const ChatBox: React.FC = () => {
  const { messages } = useChatStore();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <MessageList />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white">
        <MessageInput />
      </div>
    </div>
  );
};
