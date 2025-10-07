import { create } from 'zustand';
import { Message } from '@/types/chat';
import { ItineraryData } from '@/types/itinerary';
import type { AIModelId } from '@/types/ai';
import type { AppSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';
import {
  saveClaudeApiKey,
  loadClaudeApiKey,
  removeClaudeApiKey,
  saveSelectedAI,
  loadSelectedAI,
  saveAppSettings,
  loadAppSettings,
} from '@/lib/utils/storage';
import { DEFAULT_AI_MODEL } from '@/lib/ai/models';

interface AppState {
  // Chat state
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessage: string;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setStreamingMessage: (message: string) => void;
  appendStreamingMessage: (chunk: string) => void;
  clearMessages: () => void;

  // Itinerary state
  currentItinerary: ItineraryData | null;
  setItinerary: (itinerary: ItineraryData | null) => void;
  updateItinerary: (updates: Partial<ItineraryData>) => void;

  // UI state
  selectedAI: AIModelId;
  claudeApiKey: string;
  setSelectedAI: (ai: AIModelId) => void;
  setClaudeApiKey: (key: string) => void;
  removeClaudeApiKey: () => void;
  initializeFromStorage: () => void;

  // Settings state (Phase 5.4.3)
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateGeneralSettings: (updates: Partial<AppSettings['general']>) => void;
  updateSoundSettings: (updates: Partial<AppSettings['sound']>) => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  // Chat state
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingMessage: '',
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (loading) => set({ isLoading: loading }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setStreamingMessage: (message) => set({ streamingMessage: message }),
  appendStreamingMessage: (chunk) =>
    set((state) => ({ streamingMessage: state.streamingMessage + chunk })),
  clearMessages: () => set({ messages: [], streamingMessage: '' }),

  // Itinerary state
  currentItinerary: null,
  setItinerary: (itinerary) => set({ currentItinerary: itinerary }),
  updateItinerary: (updates) =>
    set((state) => ({
      currentItinerary: state.currentItinerary
        ? { ...state.currentItinerary, ...updates }
        : null,
    })),

  // UI state
  selectedAI: DEFAULT_AI_MODEL,
  claudeApiKey: '',
  setSelectedAI: (ai) => {
    saveSelectedAI(ai);
    set({ selectedAI: ai });
  },
  setClaudeApiKey: (key) => {
    if (key) {
      saveClaudeApiKey(key);
    }
    set({ claudeApiKey: key });
  },
  removeClaudeApiKey: () => {
    removeClaudeApiKey();
    set({ claudeApiKey: '', selectedAI: DEFAULT_AI_MODEL });
  },
  initializeFromStorage: () => {
    const savedApiKey = loadClaudeApiKey();
    const savedAI = loadSelectedAI();
    const savedSettings = loadAppSettings();
    set({
      claudeApiKey: savedApiKey,
      selectedAI: savedAI,
      settings: savedSettings ? { ...DEFAULT_SETTINGS, ...savedSettings } : DEFAULT_SETTINGS,
    });
  },

  // Settings state (Phase 5.4.3)
  settings: DEFAULT_SETTINGS,
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

  // Error state
  error: null,
  setError: (error) => set({ error }),
}));
