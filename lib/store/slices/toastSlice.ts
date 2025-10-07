/**
 * Toast Notifications Slice
 * トースト通知の状態管理
 */

import { StateCreator } from 'zustand';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ToastSlice {
  // State
  toasts: ToastMessage[];
  
  // Actions
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const createToastSlice: StateCreator<ToastSlice> = (set) => ({
  // Initial state
  toasts: [],
  
  // Actions
  addToast: (message, type) =>
    set((state) => ({
      toasts: [...state.toasts, { id: Date.now().toString(), message, type }],
    })),
  
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
});