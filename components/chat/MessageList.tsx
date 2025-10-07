"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { useStore } from "@/lib/store/useStore";
import { Bot } from "lucide-react";
import { MessageItem } from "./MessageItem";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

/**
 * リアルタイムでJSONブロックを除去する関数
 * ストリーミング中の部分的なレスポンスでも安全に処理
 */
function removeJsonBlocks(text: string): string {
  // 完全な ```json ... ``` ブロックを削除
  let cleaned = text.replace(/```json[\s\S]*?```/g, "");

  // 不完全なJSONブロック（```json で始まるが閉じていない）も削除
  // ストリーミング中に途中まで受信した場合に対応
  if (cleaned.includes("```json")) {
    const jsonStartIndex = cleaned.indexOf("```json");
    cleaned = cleaned.substring(0, jsonStartIndex);
  }

  // 余分な空白・改行を整理
  cleaned = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .trim();

  return cleaned;
}

export const MessageList: React.FC = () => {
  const messages = useStore((state) => state.messages);
  const isLoading = useStore((state) => state.isLoading);
  const isStreaming = useStore((state) => state.isStreaming);
  const streamingMessage = useStore((state) => state.streamingMessage);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ストリーミング中のメッセージからJSONブロックを除去
  const cleanStreamingMessage = useMemo(() => {
    if (!streamingMessage) return "";
    return removeJsonBlocks(streamingMessage);
  }, [streamingMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <Bot className="w-16 h-16 mb-4" />
          <p className="text-center">AIと対話して旅行計画を始めましょう</p>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}

          {/* ストリーミング中のメッセージ */}
          {isStreaming && cleanStreamingMessage && (
            <div className="flex justify-start">
              <div className="flex max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-gray-600" />
                </div>
                <div className="rounded-lg p-3 bg-gray-100 text-gray-800">
                  <MarkdownRenderer 
                    content={cleanStreamingMessage}
                    className="markdown-content"
                  />
                  <div className="inline-flex mt-1">
                    <span className="animate-pulse">▋</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ローディング中（ストリーミング開始前） */}
          {isLoading && !isStreaming && !streamingMessage && (
            <div className="flex justify-start">
              <div className="flex max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-gray-600 animate-pulse" />
                </div>
                <div className="rounded-lg p-3 bg-gray-100">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
