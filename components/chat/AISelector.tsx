/**
 * Phase 10.1: AISelector
 * 
 * AIモデル選択コンポーネント（useAIStore使用）
 */

"use client";

import React from "react";
import { useAIStore } from "@/lib/store/ai";
import { Bot, Sparkles } from "lucide-react";
import type { AIModelId } from "@/types/ai";

export const AISelector: React.FC = () => {
  const { selectedModel, setSelectedModel } = useAIStore();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value as AIModelId);
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      <Bot className="w-5 h-5 text-blue-600" />
      <label htmlFor="ai-selector" className="text-sm font-medium text-gray-700">
        AIモデル:
      </label>
      <select
        id="ai-selector"
        value={selectedModel}
        onChange={handleChange}
        className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="gemini">
          Google Gemini (推奨)
        </option>
        <option value="claude">
          Claude 3.5 Sonnet
        </option>
      </select>
      {selectedModel === "gemini" && (
        <Sparkles className="w-4 h-4 text-yellow-500" />
      )}
    </div>
  );
};
