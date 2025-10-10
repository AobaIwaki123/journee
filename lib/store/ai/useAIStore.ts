/**
 * Phase 10.1: AI Store
 * 
 * AI設定の状態管理
 * - モデル選択
 * - APIキー管理
 * - LocalStorage同期
 */

import { create } from 'zustand';
import type { AIModelId } from '@/types/ai';
import { DEFAULT_AI_MODEL } from '@/lib/ai/models';
import {
  saveClaudeApiKey,
  loadClaudeApiKey,
  removeClaudeApiKey as removeClaudeApiKeyFromStorage,
  saveSelectedAI,
  loadSelectedAI,
} from '@/lib/utils/storage';

export interface AIStore {
  // State
  selectedModel: AIModelId;
  claudeApiKey: string;
  geminiApiKey: string; // 将来の拡張用
  
  // Actions
  setSelectedModel: (model: AIModelId) => void;
  setClaudeApiKey: (key: string) => void;
  removeClaudeApiKey: () => void;
  setGeminiApiKey: (key: string) => void;
  
  // LocalStorage同期
  initializeFromStorage: () => void;
}

export const useAIStore = create<AIStore>((set) => ({
  // State
  selectedModel: DEFAULT_AI_MODEL,
  claudeApiKey: '',
  geminiApiKey: '',
  
  // Actions
  setSelectedModel: (model) => {
    saveSelectedAI(model);
    set({ selectedModel: model });
  },
  
  setClaudeApiKey: (key) => {
    if (key) {
      saveClaudeApiKey(key);
    }
    set({ claudeApiKey: key });
  },
  
  removeClaudeApiKey: () => {
    removeClaudeApiKeyFromStorage();
    set({ claudeApiKey: '', selectedModel: DEFAULT_AI_MODEL });
  },
  
  setGeminiApiKey: (key) => {
    // 将来の拡張: Gemini APIキーの保存
    set({ geminiApiKey: key });
  },
  
  // LocalStorage同期
  initializeFromStorage: () => {
    const savedApiKey = loadClaudeApiKey();
    const savedModel = loadSelectedAI();
    
    set({
      claudeApiKey: savedApiKey,
      selectedModel: savedModel,
    });
  },
}));
