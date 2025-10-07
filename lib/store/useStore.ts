/**
 * メインストア - リファクタリング版
 * 全スライスを統合
 */

import { create } from 'zustand';
import { ChatSlice, createChatSlice } from './slices/chatSlice';
import { UISlice, createUISlice } from './slices/uiSlice';
import { ToastSlice, createToastSlice } from './slices/toastSlice';
import { SettingsSlice, createSettingsSlice, ItinerarySortField, ItinerarySortOrder, ItinerarySort, ItineraryFilter } from './slices/settingsSlice';
import { HistorySlice, createHistorySlice } from './slices/historySlice';
import { ItinerarySlice, createItinerarySlice } from './slices/itinerarySlice';

// Re-export types for backward compatibility
export type { ItinerarySortField, ItinerarySortOrder, ItinerarySort, ItineraryFilter };

// 全スライスを統合した型
export type AppState = ChatSlice & UISlice & ToastSlice & SettingsSlice & HistorySlice & ItinerarySlice;

/**
 * メインストア
 * 全てのスライスを組み合わせて作成
 */
export const useStore = create<AppState>()((...a) => ({
  ...createChatSlice(...a),
  ...createUISlice(...a),
  ...createToastSlice(...a),
  ...createSettingsSlice(...a),
  ...createHistorySlice(...a),
  ...createItinerarySlice(...a),
}));