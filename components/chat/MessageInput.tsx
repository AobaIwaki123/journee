'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import { Send } from 'lucide-react';

export const MessageInput: React.FC = () => {
  const [input, setInput] = useState('');
  const addMessage = useStore((state) => state.addMessage);
  const setLoading = useStore((state) => state.setLoading);
  const isLoading = useStore((state) => state.isLoading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput('');
    setLoading(true);

    // TODO: Phase 3でAI統合を実装
    // 現在はモックレスポンス
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content:
          'ありがとうございます！旅行計画のお手伝いをさせていただきます。\n\nPhase 3でAI機能を統合予定です。',
        timestamp: new Date(),
      };
      addMessage(aiMessage);
      setLoading(false);
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="メッセージを入力..."
        disabled={isLoading}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      />
      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
};
