'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import { APIKeyModal } from '@/components/settings/APIKeyModal';
import { getEnabledModels, requiresApiKey } from '@/lib/ai/models';
import type { AIModelId } from '@/types/ai';

export const AISelector: React.FC = () => {
  const selectedAI = useStore((state) => state.selectedAI);
  const claudeApiKey = useStore((state) => state.claudeApiKey);
  const setSelectedAI = useStore((state) => state.setSelectedAI);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 有効なモデル一覧を取得
  const enabledModels = getEnabledModels();

  const handleAIChange = (modelId: string) => {
    const ai = modelId as AIModelId;
    
    // APIキーが必要なモデルの場合、確認
    if (requiresApiKey(ai)) {
      if (ai === 'claude' && !claudeApiKey) {
        // APIキーが未設定の場合、モーダルを表示
        setIsModalOpen(true);
        return;
      }
    }

    setSelectedAI(ai);
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">AIモデル:</span>
        <select
          value={selectedAI}
          onChange={(e) => handleAIChange(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {enabledModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.icon && `${model.icon} `}
              {model.displayName}
              {model.requiresApiKey && model.id === 'claude' && !claudeApiKey && ' (APIキー必要)'}
            </option>
          ))}
        </select>
      </div>

      {/* APIキー設定モーダル */}
      <APIKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};