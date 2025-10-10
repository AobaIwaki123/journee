/**
 * Phase 10.1: useChatHistory Hook
 * 
 * メッセージ履歴管理
 * - 履歴の取得・フィルタリング
 * - 検索機能
 * - エクスポート・インポート
 */

import { useMemo } from 'react';
import { useChatStore } from '@/lib/store/chat';
import type { Message } from '@/types/chat';

export interface UseChatHistoryReturn {
  messages: Message[];
  searchMessages: (query: string) => Message[];
  filterByType: (type: 'user' | 'assistant') => Message[];
  clearHistory: () => void;
  exportHistory: () => string;
  importHistory: (data: string) => void;
}

export function useChatHistory(): UseChatHistoryReturn {
  const { messages, clearMessages } = useChatStore();
  
  const searchMessages = (query: string): Message[] => {
    if (!query.trim()) return messages;
    
    const lowerQuery = query.toLowerCase();
    return messages.filter((msg) =>
      msg.content.toLowerCase().includes(lowerQuery)
    );
  };
  
  const filterByType = (type: 'user' | 'assistant'): Message[] => {
    return messages.filter((msg) => msg.role === type);
  };
  
  const exportHistory = (): string => {
    return JSON.stringify(messages, null, 2);
  };
  
  const importHistory = (data: string): void => {
    try {
      const imported: Message[] = JSON.parse(data);
      // TODO: メッセージのインポート機能を実装
      console.log('Imported messages:', imported);
    } catch (error) {
      console.error('Failed to import history:', error);
    }
  };
  
  return {
    messages,
    searchMessages,
    filterByType,
    clearHistory: clearMessages,
    exportHistory,
    importHistory,
  };
}
