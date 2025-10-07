import { create } from 'zustand';
import { Message } from '@/types/chat';
import { ItineraryData } from '@/types/itinerary';

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
  selectedAI: 'gemini' | 'claude';
  selectedGeminiModel: 'gemini-2.5-pro' | 'gemini-2.5-flash';
  claudeApiKey: string;
  setSelectedAI: (ai: 'gemini' | 'claude') => void;
  setSelectedGeminiModel: (model: 'gemini-2.5-pro' | 'gemini-2.5-flash') => void;
  setClaudeApiKey: (key: string) => void;

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
  selectedAI: 'gemini',
  selectedGeminiModel: 'gemini-2.5-pro',
  claudeApiKey: '',
  setSelectedAI: (ai) => set({ selectedAI: ai }),
  setSelectedGeminiModel: (model) => set({ selectedGeminiModel: model }),
  setClaudeApiKey: (key) => set({ claudeApiKey: key }),

  // Error state
  error: null,
  setError: (error) => set({ error }),
}));
