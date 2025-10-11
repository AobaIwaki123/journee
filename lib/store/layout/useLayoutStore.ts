/**
 * Phase 10.4: Layout Store
 * 
 * レイアウト状態の管理
 * - チャットパネル幅
 * - モバイルタブ
 * - モバイルメニュー
 * - LocalStorage同期
 */

import { create } from 'zustand';
import {
  saveChatPanelWidth,
  loadChatPanelWidth,
} from '@/lib/utils/storage';

export interface LayoutStore {
  // State
  chatPanelWidth: number;
  mobileActiveTab: 'chat' | 'itinerary';
  isMobileMenuOpen: boolean;
  
  // Actions
  setChatPanelWidth: (width: number) => void;
  setMobileActiveTab: (tab: 'chat' | 'itinerary') => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  
  // LocalStorage同期
  initializeFromStorage: () => void;
}

export const useLayoutStore = create<LayoutStore>((set) => ({
  // State
  chatPanelWidth: loadChatPanelWidth(),
  mobileActiveTab: 'itinerary',
  isMobileMenuOpen: false,
  
  // Actions
  setChatPanelWidth: (width) => {
    // 範囲チェック（30-70%）
    const clampedWidth = Math.max(30, Math.min(70, width));
    saveChatPanelWidth(clampedWidth);
    set({ chatPanelWidth: clampedWidth });
  },
  
  setMobileActiveTab: (tab) => set({ mobileActiveTab: tab }),
  
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  
  // LocalStorage同期
  initializeFromStorage: () => {
    const savedPanelWidth = loadChatPanelWidth();
    set({ chatPanelWidth: savedPanelWidth });
  },
}));
