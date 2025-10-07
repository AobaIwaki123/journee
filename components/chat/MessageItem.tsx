/**
 * 個別メッセージ表示コンポーネント
 */

'use client';

import React from 'react';
import { Bot, User } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import type { Message } from '@/types/chat';

interface MessageItemProps {
  message: Message;
}

/**
 * 1つのメッセージを表示
 * React.memoで最適化されており、propsが変わらない限り再レンダリングしない
 */
export const MessageItem = React.memo<MessageItemProps>(({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* アバター */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-blue-500 ml-3' : 'bg-gray-200 mr-3'
          }`}
        >
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-gray-600" />
          )}
        </div>

        {/* メッセージ内容 */}
        <div
          className={`rounded-lg p-3 ${
            isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer 
              content={message.content}
              className="markdown-content"
            />
          )}
          
          {/* タイムスタンプ */}
          <p
            className={`text-xs mt-1 ${
              isUser ? 'text-blue-100' : 'text-gray-500'
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
  );
});

MessageItem.displayName = 'MessageItem';