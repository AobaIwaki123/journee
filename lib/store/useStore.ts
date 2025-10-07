import { create } from 'zustand';
import { Message } from '@/types/chat';
import { Itinerary } from '@/types/itinerary';

interface AppState {
  // Chat state
  messages: Message[];
  isLoading: boolean;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;

  // Itinerary state
  currentItinerary: Itinerary | null;
  setItinerary: (itinerary: Itinerary | null) => void;
  updateItinerary: (updates: Partial<Itinerary>) => void;

  // UI state
  selectedAI: 'gemini' | 'claude';
  setSelectedAI: (ai: 'gemini' | 'claude') => void;
}

export const useStore = create<AppState>((set) => ({
  // Chat state
  messages: [],
  isLoading: false,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (loading) => set({ isLoading: loading }),
  clearMessages: () => set({ messages: [] }),

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
  setSelectedAI: (ai) => set({ selectedAI: ai }),
}));
