/**
 * Phase 10.1: Chat Store
 * 
 * チャット機能の状態管理
 * - メッセージ履歴
 * - ローディング状態
 * - ストリーミング状態
 * - メッセージ編集
 * - AI応答制御
 */

import { create } from 'zustand';
import { Message } from '@/types/chat';
import { generateId } from '@/lib/utils/id-generator';

export interface ChatStore {
  // State
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessage: string;
  hasReceivedResponse: boolean;
  editingMessageId: string | null;
  messageDraft: string;
  abortController: AbortController | null;
  
  // Actions - Messages
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  deleteMessage: (messageId: string) => void;
  
  // Actions - Message Editing
  startEditingMessage: (messageId: string) => void;
  cancelEditingMessage: () => void;
  saveEditedMessage: (messageId: string, newContent: string) => void;
  setMessageDraft: (draft: string) => void;
  
  // Actions - Loading/Streaming
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setStreamingMessage: (message: string) => void;
  appendStreamingMessage: (chunk: string) => void;
  setHasReceivedResponse: (value: boolean) => void;
  
  // Actions - AI Response Control
  setAbortController: (controller: AbortController | null) => void;
  abortAIResponse: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // State
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingMessage: '',
  hasReceivedResponse: false,
  editingMessageId: null,
  messageDraft: '',
  abortController: null,
  
  // Actions - Messages
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  
  clearMessages: () =>
    set({ messages: [], streamingMessage: '' }),
  
  deleteMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              isDeleted: true,
              content: 'このメッセージは削除されました',
            }
          : msg
      ),
    })),
  
  // Actions - Message Editing
  startEditingMessage: (messageId) => {
    const state = get();
    
    // 編集モード開始時に進行中のAI応答をキャンセル
    if (state.isStreaming || state.isLoading) {
      state.abortAIResponse();
    }
    
    // 新規メッセージドラフトを一時保存
    const currentDraft = state.messageDraft;
    
    set({
      editingMessageId: messageId,
      messageDraft: currentDraft, // ドラフトを保持
    });
  },
  
  cancelEditingMessage: () => {
    set({ editingMessageId: null });
    // messageDraftは保持したまま（編集終了後に復元）
  },
  
  saveEditedMessage: (messageId, newContent) => {
    set((state) => {
      // 編集対象のメッセージを見つける
      const editedMessage = state.messages.find((msg) => msg.id === messageId);
      
      // 編集されたメッセージの直後のAI応答を削除
      let messagesToKeep = state.messages;
      if (editedMessage) {
        const editedIndex = state.messages.findIndex((msg) => msg.id === messageId);
        // 編集されたメッセージの直後のメッセージがAI応答なら削除
        if (
          editedIndex >= 0 &&
          editedIndex < state.messages.length - 1 &&
          state.messages[editedIndex + 1].role === 'assistant'
        ) {
          messagesToKeep = [
            ...state.messages.slice(0, editedIndex + 1),
            ...state.messages.slice(editedIndex + 2),
          ];
        }
      }
      
      return {
        messages: messagesToKeep.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: newContent, editedAt: new Date() }
            : msg
        ),
        editingMessageId: null,
        // messageDraftは保持したまま
      };
    });
  },
  
  setMessageDraft: (draft) => set({ messageDraft: draft }),
  
  // Actions - Loading/Streaming
  setLoading: (loading) => set({ isLoading: loading }),
  
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  
  setStreamingMessage: (message) => set({ streamingMessage: message }),
  
  appendStreamingMessage: (chunk) =>
    set((state) => ({ streamingMessage: state.streamingMessage + chunk })),
  
  setHasReceivedResponse: (value) => set({ hasReceivedResponse: value }),
  
  // Actions - AI Response Control
  setAbortController: (controller) => set({ abortController: controller }),
  
  abortAIResponse: () => {
    const state = get();
    if (state.abortController) {
      state.abortController.abort();
      set({
        abortController: null,
        isLoading: false,
        isStreaming: false,
        streamingMessage: '',
      });
    }
  },
}));
