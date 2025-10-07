/**
 * Chat State Slice
 * チャット関連の状態管理
 */

import { StateCreator } from 'zustand';
import { Message } from '@/types/chat';

export interface ChatSlice {
  // State
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessage: string;
  
  // Actions
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setStreamingMessage: (message: string) => void;
  appendStreamingMessage: (chunk: string) => void;
  clearMessages: () => void;
}

export const createChatSlice: StateCreator<ChatSlice> = (set) => ({
  // Initial state
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingMessage: '',
  
  // Actions
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  
  setStreamingMessage: (message) => set({ streamingMessage: message }),
  
  appendStreamingMessage: (chunk) =>
    set((state) => ({ streamingMessage: state.streamingMessage + chunk })),
  
  clearMessages: () => set({ messages: [], streamingMessage: '' }),
});