'use client';

import React, { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store/useStore';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export const MessageList: React.FC = () => {
  const messages = useStore((state) => state.messages);
  const isLoading = useStore((state) => state.isLoading);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          // 見出し
                          h1: ({ node, ...props }) => (
                            <h1 className="text-2xl font-bold mt-4 mb-2 text-gray-900" {...props} />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 className="text-xl font-bold mt-3 mb-2 text-gray-900" {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 className="text-lg font-semibold mt-2 mb-1 text-gray-900" {...props} />
                          ),
                          h4: ({ node, ...props }) => (
                            <h4 className="text-base font-semibold mt-2 mb-1 text-gray-900" {...props} />
                          ),
                          // リスト
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc list-inside my-2 space-y-1" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className="list-decimal list-inside my-2 space-y-1" {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="text-gray-800 ml-2" {...props} />
                          ),
                          // コードブロック
                          code: ({ node, inline, ...props }: any) =>
                            inline ? (
                              <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono text-red-600" {...props} />
                            ) : (
                              <code className="block bg-gray-800 text-gray-100 p-3 rounded-md my-2 overflow-x-auto font-mono text-sm" {...props} />
                            ),
                          pre: ({ node, ...props }) => (
                            <pre className="my-2" {...props} />
                          ),
                          // テーブル
                          table: ({ node, ...props }) => (
                            <table className="min-w-full divide-y divide-gray-300 my-2 border border-gray-300" {...props} />
                          ),
                          thead: ({ node, ...props }) => (
                            <thead className="bg-gray-50" {...props} />
                          ),
                          tbody: ({ node, ...props }) => (
                            <tbody className="divide-y divide-gray-200 bg-white" {...props} />
                          ),
                          tr: ({ node, ...props }) => (
                            <tr {...props} />
                          ),
                          th: ({ node, ...props }) => (
                            <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900" {...props} />
                          ),
                          td: ({ node, ...props }) => (
                            <td className="px-3 py-2 text-sm text-gray-800" {...props} />
                          ),
                          // リンク
                          a: ({ node, ...props }) => (
                            <a
                              className="text-blue-600 hover:text-blue-800 underline"
                              target="_blank"
                              rel="noopener noreferrer"
                              {...props}
                            />
                          ),
                          // 段落
                          p: ({ node, ...props }) => (
                            <p className="my-2 text-gray-800 leading-relaxed" {...props} />
                          ),
                          // 引用
                          blockquote: ({ node, ...props }) => (
                            <blockquote className="border-l-4 border-gray-300 pl-4 my-2 italic text-gray-700" {...props} />
                          ),
                          // 水平線
                          hr: ({ node, ...props }) => (
                            <hr className="my-4 border-gray-300" {...props} />
                          ),
                          // 強調
                          strong: ({ node, ...props }) => (
                            <strong className="font-bold text-gray-900" {...props} />
                          ),
                          em: ({ node, ...props }) => (
                            <em className="italic" {...props} />
                          ),
                        }}
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
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-gray-600" />
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
