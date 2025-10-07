/**
 * Settings Slice
 * アプリケーション設定の状態管理
 */

import { StateCreator } from 'zustand';
import type { AppSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';
import {
  saveAppSettings,
  loadAppSettings,
  saveAutoProgressMode,
  loadAutoProgressMode,
  saveAutoProgressSettings,
  loadAutoProgressSettings,
  type AutoProgressSettings,
} from '@/lib/utils/storage';

export interface ItineraryFilter {
  status?: 'draft' | 'completed' | 'archived' | 'all';
  destination?: string;
  startDate?: string;
  endDate?: string;
}

export type ItinerarySortField = 'updatedAt' | 'createdAt' | 'title' | 'startDate';
export type ItinerarySortOrder = 'asc' | 'desc';

export interface ItinerarySort {
  field: ItinerarySortField;
  order: ItinerarySortOrder;
}

export interface SettingsSlice {
  // State
  settings: AppSettings;
  autoProgressMode: boolean;
  autoProgressSettings: AutoProgressSettings;
  itineraryFilter: ItineraryFilter;
  itinerarySort: ItinerarySort;
  
  // Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateGeneralSettings: (updates: Partial<AppSettings['general']>) => void;
  updateSoundSettings: (updates: Partial<AppSettings['sound']>) => void;
  setAutoProgressMode: (enabled: boolean) => void;
  setAutoProgressSettings: (settings: AutoProgressSettings) => void;
  setItineraryFilter: (filter: ItineraryFilter) => void;
  setItinerarySort: (sort: ItinerarySort) => void;
  resetItineraryFilters: () => void;
  initializeSettings: () => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  // Initial state
  settings: DEFAULT_SETTINGS,
  autoProgressMode: true,
  autoProgressSettings: {
    enabled: true,
    parallelCount: 3,
    showNotifications: true,
  },
  itineraryFilter: {
    status: 'all',
  },
  itinerarySort: {
    field: 'updatedAt',
    order: 'desc',
  },
  
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
  
  setAutoProgressMode: (enabled) => {
    saveAutoProgressMode(enabled);
    set({ autoProgressMode: enabled });
  },
  
  setAutoProgressSettings: (settings) => {
    saveAutoProgressSettings(settings);
    set({ autoProgressSettings: settings });
  },
  
  setItineraryFilter: (filter) => set({ itineraryFilter: filter }),
  
  setItinerarySort: (sort) => set({ itinerarySort: sort }),
  
  resetItineraryFilters: () =>
    set({
      itineraryFilter: { status: 'all' },
      itinerarySort: { field: 'updatedAt', order: 'desc' },
    }),
  
  initializeSettings: () => {
    const savedSettings = loadAppSettings();
    const savedAutoProgress = loadAutoProgressMode();
    const savedAutoProgressSettings = loadAutoProgressSettings();
    
    set({
      settings: savedSettings ? { ...DEFAULT_SETTINGS, ...savedSettings } : DEFAULT_SETTINGS,
      autoProgressMode: savedAutoProgress,
      autoProgressSettings: savedAutoProgressSettings,
    });
  },
});