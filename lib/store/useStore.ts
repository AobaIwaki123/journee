import { create } from 'zustand';
import { Message } from '@/types/chat';
import { ItineraryData } from '@/types/itinerary';
import type { AIModelId } from '@/types/ai';
import {
  saveClaudeApiKey,
  loadClaudeApiKey,
  removeClaudeApiKey,
  saveSelectedAI,
  loadSelectedAI,
  saveSoundEnabled,
  loadSoundEnabled,
  saveSoundVolume,
  loadSoundVolume,
} from '@/lib/utils/storage';
import { DEFAULT_AI_MODEL } from '@/lib/ai/models';
import { soundManager } from '@/lib/sound/SoundManager';

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

  // Error state
  error: string | null;
  setError: (error: string | null) => void;

  // Sound state (Phase 3.6)
  soundEnabled: boolean;
  soundVolume: number;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
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
    const savedSoundEnabled = loadSoundEnabled();
    const savedSoundVolume = loadSoundVolume();
    
    // SoundManager にも設定を反映
    soundManager.setEnabled(savedSoundEnabled);
    soundManager.setVolume(savedSoundVolume);
    
    set({
      claudeApiKey: savedApiKey,
      selectedAI: savedAI,
      soundEnabled: savedSoundEnabled,
      soundVolume: savedSoundVolume,
    });
  },

  // Error state
  error: null,
  setError: (error) => set({ error }),

  // Sound state (Phase 3.6)
  soundEnabled: true,
  soundVolume: 0.7,
  setSoundEnabled: (enabled) => {
    saveSoundEnabled(enabled);
    soundManager.setEnabled(enabled);
    set({ soundEnabled: enabled });
  },
  setSoundVolume: (volume) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    saveSoundVolume(clampedVolume);
    soundManager.setVolume(clampedVolume);
    set({ soundVolume: clampedVolume });
  },
}));
