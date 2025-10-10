"use client";

import React, { useEffect, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useStore } from "@/lib/store/useStore";
import { Bot, User } from "lucide-react";
import { toSafeDate } from "@/lib/utils/time-utils";

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
  const messages = useStore((state: any) => state.messages);
  const isLoading = useStore((state: any) => state.isLoading);
  const isStreaming = useStore((state: any) => state.isStreaming);
  const streamingMessage = useStore((state: any) => state.streamingMessage);
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
          {messages.map((message: any) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-[80%] ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === "user"
                      ? "bg-blue-500 ml-3"
                      : "bg-gray-200 mr-3"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div
                  className={`rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="markdown-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          a: ({ node, ...props }) => (
                            <a
                              {...props}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            />
                          ),
                          h1: ({ node, ...props }) => (
                            <h1
                              {...props}
                              className="text-2xl font-bold mt-4 mb-2"
                            />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2
                              {...props}
                              className="text-xl font-bold mt-3 mb-2"
                            />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3
                              {...props}
                              className="text-lg font-bold mt-2 mb-1"
                            />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul
                              {...props}
                              className="list-disc list-inside ml-4 my-2"
                            />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol
                              {...props}
                              className="list-decimal list-inside ml-4 my-2"
                            />
                          ),
                          li: ({ node, ...props }) => (
                            <li {...props} className="my-1" />
                          ),
                          p: ({ node, ...props }) => (
                            <p {...props} className="my-2" />
                          ),
                          code: ({ node, inline, ...props }: any) =>
                            inline ? (
                              <code
                                {...props}
                                className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-sm font-mono"
                              />
                            ) : (
                              <code
                                {...props}
                                className="block bg-gray-800 text-gray-100 p-3 rounded my-2 overflow-x-auto text-sm font-mono"
                              />
                            ),
                          pre: ({ node, ...props }) => (
                            <pre {...props} className="my-2" />
                          ),
                          blockquote: ({ node, ...props }) => (
                            <blockquote
                              {...props}
                              className="border-l-4 border-gray-400 pl-4 my-2 italic text-gray-600"
                            />
                          ),
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-2">
                              <table
                                {...props}
                                className="min-w-full border-collapse border border-gray-300"
                              />
                            </div>
                          ),
                          thead: ({ node, ...props }) => (
                            <thead {...props} className="bg-gray-200" />
                          ),
                          tbody: ({ node, ...props }) => <tbody {...props} />,
                          tr: ({ node, ...props }) => (
                            <tr
                              {...props}
                              className="border-b border-gray-300"
                            />
                          ),
                          th: ({ node, ...props }) => (
                            <th
                              {...props}
                              className="border border-gray-300 px-4 py-2 text-left font-semibold"
                            />
                          ),
                          td: ({ node, ...props }) => (
                            <td
                              {...props}
                              className="border border-gray-300 px-4 py-2"
                            />
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      message.role === "user"
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {toSafeDate(message.timestamp)?.toLocaleTimeString(
                      "ja-JP",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    ) || ""}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* ストリーミング中のメッセージ */}
          {isStreaming && cleanStreamingMessage && (
            <div className="flex justify-start">
              <div className="flex max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-gray-600" />
                </div>
                <div className="rounded-lg p-3 bg-gray-100 text-gray-800">
                  <div className="markdown-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          />
                        ),
                        h1: ({ node, ...props }) => (
                          <h1
                            {...props}
                            className="text-2xl font-bold mt-4 mb-2"
                          />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2
                            {...props}
                            className="text-xl font-bold mt-3 mb-2"
                          />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3
                            {...props}
                            className="text-lg font-bold mt-2 mb-1"
                          />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul
                            {...props}
                            className="list-disc list-inside ml-4 my-2"
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            {...props}
                            className="list-decimal list-inside ml-4 my-2"
                          />
                        ),
                        li: ({ node, ...props }) => (
                          <li {...props} className="my-1" />
                        ),
                        p: ({ node, ...props }) => (
                          <p {...props} className="my-2" />
                        ),
                        code: ({ node, inline, ...props }: any) =>
                          inline ? (
                            <code
                              {...props}
                              className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-sm font-mono"
                            />
                          ) : (
                            <code
                              {...props}
                              className="block bg-gray-800 text-gray-100 p-3 rounded my-2 overflow-x-auto text-sm font-mono"
                            />
                          ),
                        pre: ({ node, ...props }) => (
                          <pre {...props} className="my-2" />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote
                            {...props}
                            className="border-l-4 border-gray-400 pl-4 my-2 italic text-gray-600"
                          />
                        ),
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-2">
                            <table
                              {...props}
                              className="min-w-full border-collapse border border-gray-300"
                            />
                          </div>
                        ),
                        thead: ({ node, ...props }) => (
                          <thead {...props} className="bg-gray-200" />
                        ),
                        tbody: ({ node, ...props }) => <tbody {...props} />,
                        tr: ({ node, ...props }) => (
                          <tr {...props} className="border-b border-gray-300" />
                        ),
                        th: ({ node, ...props }) => (
                          <th
                            {...props}
                            className="border border-gray-300 px-4 py-2 text-left font-semibold"
                          />
                        ),
                        td: ({ node, ...props }) => (
                          <td
                            {...props}
                            className="border border-gray-300 px-4 py-2"
                          />
                        ),
                      }}
                    >
                      {cleanStreamingMessage}
                    </ReactMarkdown>
                  </div>
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
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 text-sm">考え中</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
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
