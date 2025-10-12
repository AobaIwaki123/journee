"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useStore } from "@/lib/store/useStore";
import { Bot, User, Edit2, Trash2, Save, X } from "lucide-react";
import { toSafeDate } from "@/lib/utils/time-utils";
import { MessageSkeleton } from "./MessageSkeleton";
import { sendChatMessageStream } from "@/lib/utils/api-client";
import { mergeItineraryData, parseAIResponse } from "@/lib/ai/prompts";
import { generateId } from "@/lib/utils/id-generator";
import type { Message } from "@/types/chat";

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
  const editingMessageId = useStore((state: any) => state.editingMessageId);
  const startEditingMessage = useStore(
    (state: any) => state.startEditingMessage
  );
  const cancelEditingMessage = useStore(
    (state: any) => state.cancelEditingMessage
  );
  const saveEditedMessage = useStore((state: any) => state.saveEditedMessage);
  const deleteMessage = useStore((state: any) => state.deleteMessage);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasReceivedResponse = useStore(
    (state: any) => state.hasReceivedResponse
  );
  const [editContent, setEditContent] = useState("");

  // 送信関連のストア
  const addMessage = useStore((state: any) => state.addMessage);
  const setLoading = useStore((state: any) => state.setLoading);
  const setStreaming = useStore((state: any) => state.setStreaming);
  const setStreamingMessage = useStore(
    (state: any) => state.setStreamingMessage
  );
  const appendStreamingMessage = useStore(
    (state: any) => state.appendStreamingMessage
  );
  const currentItinerary = useStore((state: any) => state.currentItinerary);
  const setItinerary = useStore((state: any) => state.setItinerary);
  const selectedAI = useStore((state: any) => state.selectedAI);
  const claudeApiKey = useStore((state: any) => state.claudeApiKey);
  const setError = useStore((state: any) => state.setError);
  const planningPhase = useStore((state: any) => state.planningPhase);
  const currentDetailingDay = useStore(
    (state: any) => state.currentDetailingDay
  );
  const currency = useStore((state: any) => state.settings.general.currency);
  const setAbortController = useStore((state: any) => state.setAbortController);
  const updateChecklist = useStore((state: any) => state.updateChecklist);

  const isProcessing = (isLoading || isStreaming) && !hasReceivedResponse;

  // ストリーミング中のメッセージからJSONブロックを除去
  const cleanStreamingMessage = useMemo(() => {
    if (!streamingMessage) return "";
    return removeJsonBlocks(streamingMessage);
  }, [streamingMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  const handleStartEdit = (messageId: string, currentContent: string) => {
    setEditContent(currentContent);
    startEditingMessage(messageId);
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editContent.trim()) return;

    const editedContent = editContent.trim();

    // メッセージを保存（古いAI応答も削除される）
    saveEditedMessage(messageId, editedContent);
    setEditContent("");

    // 編集されたメッセージをAIに送信
    await sendEditedMessageToAI(editedContent);
  };

  /**
   * 編集されたメッセージをAIに送信
   */
  const sendEditedMessageToAI = async (content: string) => {
    if (isLoading || isStreaming) return;

    setLoading(true);
    setStreaming(true);
    setStreamingMessage("");
    setError(null);

    // AbortController を作成してストアに保存
    const abortController = new AbortController();
    setAbortController(abortController);

    try {
      // チャット履歴を準備（最新10件）
      const chatHistory = messages.slice(-10).map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      let fullResponse = "";

      // ストリーミングレスポンスを処理
      for await (const chunk of sendChatMessageStream(
        content,
        chatHistory,
        currentItinerary || undefined,
        selectedAI,
        claudeApiKey || undefined,
        planningPhase,
        currentDetailingDay,
        currency,
        abortController.signal
      )) {
        if (chunk.type === "message" && chunk.content) {
          appendStreamingMessage(chunk.content);
          fullResponse += chunk.content;
        } else if (chunk.type === "itinerary" && chunk.itinerary) {
          const mergedItinerary = mergeItineraryData(
            currentItinerary || undefined,
            chunk.itinerary
          );
          setItinerary(mergedItinerary);
        } else if (chunk.type === "error") {
          throw new Error(chunk.error || "Unknown error occurred");
        } else if (chunk.type === "done") {
          break;
        }
      }

      // ストリーミング完了後、JSONブロックを削除してAIメッセージを追加
      const { message: cleanMessage } = parseAIResponse(fullResponse);

      const aiMessage: Message = {
        id: generateId(),
        role: "assistant" as const,
        content: cleanMessage,
        timestamp: new Date(),
      };
      addMessage(aiMessage);
      setStreamingMessage("");

      // チェックリスト更新と自動進行チェック
      updateChecklist();

    } catch (error: any) {
      // AbortErrorの場合は、エラーメッセージを表示しない
      if (error.name === "AbortError") {
        console.log("AI応答がキャンセルされました");
        const cancelMessage: Message = {
          id: generateId(),
          role: "assistant" as const,
          content: "メッセージの送信がキャンセルされました。",
          timestamp: new Date(),
        };
        addMessage(cancelMessage);
        setStreamingMessage("");
      } else {
        console.error("Chat error:", error);
        const errorMessage: Message = {
          id: generateId(),
          role: "assistant" as const,
          content: `申し訳ございません。エラーが発生しました: ${error.message}`,
          timestamp: new Date(),
        };
        addMessage(errorMessage);
        setError(error.message);
        setStreamingMessage("");
      }
    } finally {
      setLoading(false);
      setStreaming(false);
      setAbortController(null);
    }
  };

  const handleCancelEdit = () => {
    cancelEditingMessage();
    setEditContent("");
  };

  const handleDeleteMessage = (messageId: string) => {
    if (confirm("このメッセージを削除してもよろしいですか？")) {
      deleteMessage(messageId);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <Bot className="w-16 h-16 mb-4" />
          <p className="text-center">AIと対話して旅行計画を始めましょう</p>
        </div>
      ) : (
        <>
          {messages.map((message: any) => {
            const isEditing = editingMessageId === message.id;
            const isDeleted = message.isDeleted;

            return (
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
                      isDeleted
                        ? "bg-gray-100 text-gray-400 italic"
                        : message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {isEditing ? (
                      // 編集モード
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-2 py-1 text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 min-h-[60px]"
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSaveEdit(message.id)}
                            className="flex items-center px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            <Save className="w-4 h-4 mr-1" />
                            保存
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            <X className="w-4 h-4 mr-1" />
                            キャンセル
                          </button>
                        </div>
                      </div>
                    ) : message.role === "user" ? (
                      // ユーザーメッセージ表示
                      <>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {!isDeleted && (
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={() =>
                                handleStartEdit(message.id, message.content)
                              }
                              className="flex items-center text-xs text-blue-100 hover:text-white"
                              title="編集"
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              編集
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="flex items-center text-xs text-blue-100 hover:text-white"
                              title="削除"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              削除
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      // AIメッセージ表示
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
                        isDeleted
                          ? "text-gray-400"
                          : message.role === "user"
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
                      {message.editedAt && !isDeleted && " (編集済み)"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

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
                  <div className="inline-flex items-center mt-1 gap-0.5">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ローディング中（ストリーミング開始前） */}
          {isProcessing && <MessageSkeleton />}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
