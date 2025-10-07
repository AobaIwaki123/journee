'use client';

import React from 'react';
import { useStore } from '@/lib/store/useStore';
import { Sparkles, Brain } from 'lucide-react';

export const AISelector: React.FC = () => {
  const selectedAI = useStore((state) => state.selectedAI);
  const setSelectedAI = useStore((state) => state.setSelectedAI);

  const handleToggle = (ai: 'gemini' | 'claude') => {
    setSelectedAI(ai);
  };

  return (
    <div className="flex flex-col space-y-2">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">AIモデル</span>
      <div className="flex items-center bg-gray-100 rounded-lg p-1 shadow-inner">
        {/* Gemini オプション */}
        <button
          onClick={() => handleToggle('gemini')}
          className={`
            flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md transition-all duration-200 flex-1
            ${selectedAI === 'gemini' 
              ? 'bg-white text-blue-600 shadow-md font-semibold' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }
          `}
          aria-label="Gemini AIモデルを選択"
          aria-pressed={selectedAI === 'gemini'}
        >
          <Sparkles className={`w-4 h-4 ${selectedAI === 'gemini' ? 'text-blue-500' : 'text-gray-400'}`} />
          <span className="text-sm whitespace-nowrap">Gemini</span>
        </button>

        {/* Claude オプション */}
        <button
          onClick={() => handleToggle('claude')}
          className={`
            flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md transition-all duration-200 flex-1
            ${selectedAI === 'claude' 
              ? 'bg-white text-purple-600 shadow-md font-semibold' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }
          `}
          aria-label="Claude AIモデルを選択"
          aria-pressed={selectedAI === 'claude'}
          disabled={true}
          title="Phase 6で実装予定"
        >
          <Brain className={`w-4 h-4 ${selectedAI === 'claude' ? 'text-purple-500' : 'text-gray-400'}`} />
          <span className="text-sm whitespace-nowrap">Claude</span>
          <span className="text-xs text-gray-400 ml-1">(準備中)</span>
        </button>
      </div>
    </div>
  );
};
