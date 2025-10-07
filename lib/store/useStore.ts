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
} from '@/lib/utils/storage';
import { DEFAULT_AI_MODEL } from '@/lib/ai/models';

/**
 * しおりフィルター条件
 */
export interface ItineraryFilter {
  status?: 'draft' | 'completed' | 'archived' | 'all';
  destination?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * しおりソート条件
 */
export type ItinerarySortField = 'updatedAt' | 'createdAt' | 'title' | 'startDate';
export type ItinerarySortOrder = 'asc' | 'desc';

export interface ItinerarySort {
  field: ItinerarySortField;
  order: ItinerarySortOrder;
}

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

  // Itinerary list state
  itineraryFilter: ItineraryFilter;
  itinerarySort: ItinerarySort;
  setItineraryFilter: (filter: ItineraryFilter) => void;
  setItinerarySort: (sort: ItinerarySort) => void;
  resetItineraryFilters: () => void;

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

  // Itinerary list state
  itineraryFilter: {
    status: 'all',
  },
  itinerarySort: {
    field: 'updatedAt',
    order: 'desc',
  },
  setItineraryFilter: (filter) => set({ itineraryFilter: filter }),
  setItinerarySort: (sort) => set({ itinerarySort: sort }),
  resetItineraryFilters: () =>
    set({
      itineraryFilter: { status: 'all' },
      itinerarySort: { field: 'updatedAt', order: 'desc' },
    }),

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
    set({
      claudeApiKey: savedApiKey,
      selectedAI: savedAI,
    });
  },

  // Error state
  error: null,
  setError: (error) => set({ error }),
}));
