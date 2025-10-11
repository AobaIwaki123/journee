/**
 * Phase 10.3: UI Store
 * 
 * UI状態の管理
 * - トースト通知
 * - 保存状態
 * - エラー状態
 * - ストレージ初期化状態
 */

import { create } from 'zustand';
import { generateId } from '@/lib/utils/id-generator';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface UIStore {
  // State
  toasts: ToastMessage[];
  isSaving: boolean;
  lastSaveTime: Date | null;
  storageInitialized: boolean;
  error: string | null;
  
  // Actions - Toast
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Actions - Save Status
  setSaving: (saving: boolean) => void;
  setLastSaveTime: (time: Date | null) => void;
  
  // Actions - Error
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Actions - Initialization
  setStorageInitialized: (initialized: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // State
  toasts: [],
  isSaving: false,
  lastSaveTime: null,
  storageInitialized: false,
  error: null,
  
  // Actions - Toast
  addToast: (message, type) =>
    set((state) => ({
      toasts: [...state.toasts, { id: generateId(), message, type }],
    })),
  
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  
  clearToasts: () => set({ toasts: [] }),
  
  // Actions - Save Status
  setSaving: (saving) => set({ isSaving: saving }),
  
  setLastSaveTime: (time) => set({ lastSaveTime: time }),
  
  // Actions - Error
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  // Actions - Initialization
  setStorageInitialized: (initialized) => set({ storageInitialized: initialized }),
}));
