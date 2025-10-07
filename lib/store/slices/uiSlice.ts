/**
 * UI State Slice
 * UI関連の状態管理（エラー、ローディング、モーダルなど）
 */

import { StateCreator } from 'zustand';
import type { AIModelId } from '@/types/ai';
import type { TemplateId } from '@/types/template';
import { DEFAULT_AI_MODEL } from '@/lib/ai/models';
import {
  saveClaudeApiKey as storageSeaveClaudeApiKey,
  loadClaudeApiKey,
  removeClaudeApiKey as storageRemoveClaudeApiKey,
  saveSelectedAI as storageSaveSelectedAI,
  loadSelectedAI,
} from '@/lib/utils/storage';

export interface UISlice {
  // State
  error: string | null;
  selectedAI: AIModelId;
  claudeApiKey: string;
  selectedTemplate: TemplateId;
  isSaving: boolean;
  
  // Actions
  setError: (error: string | null) => void;
  setSelectedAI: (ai: AIModelId) => void;
  setClaudeApiKey: (key: string) => void;
  removeClaudeApiKey: () => void;
  setSelectedTemplate: (template: TemplateId) => void;
  setSaving: (saving: boolean) => void;
  initializeFromStorage: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  // Initial state
  error: null,
  selectedAI: DEFAULT_AI_MODEL,
  claudeApiKey: '',
  selectedTemplate: 'classic',
  isSaving: false,
  
  // Actions
  setError: (error) => set({ error }),
  
  setSelectedAI: (ai) => {
    storageSaveSelectedAI(ai);
    set({ selectedAI: ai });
  },
  
  setClaudeApiKey: (key) => {
    if (key) {
      storageSeaveClaudeApiKey(key);
    }
    set({ claudeApiKey: key });
  },
  
  removeClaudeApiKey: () => {
    storageRemoveClaudeApiKey();
    set({ claudeApiKey: '', selectedAI: DEFAULT_AI_MODEL });
  },
  
  setSelectedTemplate: (template) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('journee_template', template);
    }
    set({ selectedTemplate: template });
  },
  
  setSaving: (saving) => set({ isSaving: saving }),
  
  initializeFromStorage: () => {
    const savedApiKey = loadClaudeApiKey();
    const savedAI = loadSelectedAI();
    const savedTemplate = (typeof window !== 'undefined' 
      ? localStorage.getItem('journee_template') 
      : null) as TemplateId | null;
    
    set({
      claudeApiKey: savedApiKey,
      selectedAI: savedAI,
      selectedTemplate: savedTemplate || 'classic',
    });
  },
});