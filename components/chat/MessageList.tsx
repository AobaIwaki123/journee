'use client';

import React, { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store/useStore';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

// マークダウン用カスタムコンポーネント
const markdownComponents: Components = {
  // 見出し
  h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-bold mt-3 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold mt-2 mb-1">{children}</h3>,
  h4: ({ children }) => <h4 className="text-base font-semibold mt-2 mb-1">{children}</h4>,
  
  // リスト
  ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="ml-4">{children}</li>,
  
  // コードブロック
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return <code className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
    }
    return (
      <code className="block bg-gray-800 text-gray-100 p-3 rounded-md my-2 overflow-x-auto text-sm font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="my-2">{children}</pre>,
  
  // テーブル
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="min-w-full border-collapse border border-gray-300">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-200">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-gray-300">{children}</tr>,
  th: ({ children }) => <th className="border border-gray-300 px-4 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-gray-300 px-4 py-2">{children}</td>,
  
  // リンク - 新しいタブで開く
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 underline"
    >
      {children}
    </a>
  ),
  
  // 引用
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2">{children}</blockquote>
  ),
  
  // 段落
  p: ({ children }) => <p className="my-2">{children}</p>,
  
  // 区切り線
  hr: () => <hr className="my-4 border-gray-300" />,
  
  // 強調
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
};

export const MessageList: React.FC = () => {
  const messages = useStore((state) => state.messages);
  const isLoading = useStore((state) => state.isLoading);
  const isStreaming = useStore((state) => state.isStreaming);
  const streamingMessage = useStore((state) => state.streamingMessage);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <Bot className="w-16 h-16 mb-4" />
          <p className="text-center">
            AIと対話して旅行計画を始めましょう
          </p>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-blue-500 ml-3'
                      : 'bg-gray-200 mr-3'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div
                  className={`rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user'
                        ? 'text-blue-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {/* ストリーミング中のメッセージ */}
          {isStreaming && streamingMessage && (
            <div className="flex justify-start">
              <div className="flex max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-gray-600" />
                </div>
                <div className="rounded-lg p-3 bg-gray-100 text-gray-800">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {streamingMessage}
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
