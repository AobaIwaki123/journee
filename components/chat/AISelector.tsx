'use client';

import React from 'react';
import { useStore } from '@/lib/store/useStore';

export const AISelector: React.FC = () => {
  const selectedAI = useStore((state) => state.selectedAI);
  const setSelectedAI = useStore((state) => state.setSelectedAI);

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">AIモデル:</span>
      <select
        value={selectedAI}
        onChange={(e) => setSelectedAI(e.target.value as 'gemini' | 'claude')}
        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="gemini">Gemini (デフォルト)</option>
        <option value="claude">Claude (Phase 7で実装)</option>
      </select>
    </div>
  );
};
