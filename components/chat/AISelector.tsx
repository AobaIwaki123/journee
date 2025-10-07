'use client';

import React from 'react';
import { useStore } from '@/lib/store/useStore';

export const AISelector: React.FC = () => {
  const selectedAI = useStore((state) => state.selectedAI);
  const setSelectedAI = useStore((state) => state.setSelectedAI);
  const selectedGeminiModel = useStore((state) => state.selectedGeminiModel);
  const setSelectedGeminiModel = useStore((state) => state.setSelectedGeminiModel);

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">AIモデル:</span>
        <select
          value={selectedAI}
          onChange={(e) => setSelectedAI(e.target.value as 'gemini' | 'claude')}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="gemini">Gemini</option>
          <option value="claude">Claude (Phase 7で実装)</option>
        </select>
      </div>

      {selectedAI === 'gemini' && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Geminiバージョン:</span>
          <select
            value={selectedGeminiModel}
            onChange={(e) => setSelectedGeminiModel(e.target.value as 'gemini-2.5-pro' | 'gemini-2.5-flash')}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="gemini-2.5-pro">gemini-2.5-pro (高性能)</option>
            <option value="gemini-2.5-flash">gemini-2.5-flash (高速)</option>
          </select>
        </div>
      )}
    </div>
  );
};
