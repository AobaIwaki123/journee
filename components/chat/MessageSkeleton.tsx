/**
 * Phase 10.1: MessageSkeleton
 * 
 * ローディング時のスケルトンUI（useChatStore使用）
 */

"use client";

import React from "react";
import { useChatStore } from "@/lib/store/chat";
import { Bot, Loader2 } from "lucide-react";

export const MessageSkeleton: React.FC = () => {
  const { streamingMessage } = useChatStore();

  return (
    <div className="flex gap-3 p-4 bg-blue-50 animate-pulse">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          {streamingMessage ? (
            <Bot className="w-5 h-5 text-white" />
          ) : (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          )}
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {streamingMessage ? (
          <div className="text-gray-700 whitespace-pre-wrap">
            {streamingMessage}
            <span className="inline-block w-2 h-4 ml-1 bg-blue-600 animate-pulse" />
          </div>
        ) : (
          <>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </>
        )}
      </div>
    </div>
  );
};
