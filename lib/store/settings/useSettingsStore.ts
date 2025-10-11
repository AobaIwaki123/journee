/**
 * Phase 10.2: Settings Store
 * 
 * 設定の状態管理
 * - 一般設定
 * - アカウント設定  
 * - サウンド設定
 * - LocalStorage同期
 */

import { create } from 'zustand';
import type { AppSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';
import {
  saveAppSettings,
  loadAppSettings,
} from '@/lib/utils/storage';

export interface SettingsStore {
  // State
  settings: AppSettings;
  
  // Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateGeneralSettings: (updates: Partial<AppSettings['general']>) => void;
  updateSoundSettings: (updates: Partial<AppSettings['sound']>) => void;
  resetToDefaults: () => void;
  
  // LocalStorage同期
  initializeFromStorage: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  // State
  settings: DEFAULT_SETTINGS,
  
  // Actions
  updateSettings: (updates) => {
    set((state) => {
      const newSettings = { ...state.settings, ...updates };
      saveAppSettings(newSettings);
      return { settings: newSettings };
    });
  },
  
  updateGeneralSettings: (updates) => {
    set((state) => {
      const newSettings = {
        ...state.settings,
        general: { ...state.settings.general, ...updates },
      };
      saveAppSettings(newSettings);
      return { settings: newSettings };
    });
  },
  
  updateSoundSettings: (updates) => {
    set((state) => {
      const newSettings = {
        ...state.settings,
        sound: { ...state.settings.sound, ...updates },
      };
      saveAppSettings(newSettings);
      return { settings: newSettings };
    });
  },
  
  resetToDefaults: () => {
    saveAppSettings(DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },
  
  // LocalStorage同期
  initializeFromStorage: () => {
    const savedSettings = loadAppSettings();
    if (savedSettings) {
      set({ settings: { ...DEFAULT_SETTINGS, ...savedSettings } });
    }
  },
}));
