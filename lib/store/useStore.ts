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

  // Itinerary editing state
  isEditingItinerary: boolean;
  editingSpotId: string | null;
  editingDayIndex: number | null;
  setEditingItinerary: (editing: boolean) => void;
  setEditingSpot: (spotId: string | null, dayIndex: number | null) => void;
  updateSpot: (dayIndex: number, spotId: string, updates: Partial<any>) => void;
  deleteSpot: (dayIndex: number, spotId: string) => void;

  // UI state
  selectedAI: 'gemini' | 'claude';
  claudeApiKey: string;
  selectedTemplate: 'default' | 'modern' | 'minimal' | 'colorful';
  setSelectedAI: (ai: 'gemini' | 'claude') => void;
  setClaudeApiKey: (key: string) => void;
  setSelectedTemplate: (template: 'default' | 'modern' | 'minimal' | 'colorful') => void;

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
        ? { ...state.currentItinerary, ...updates, updatedAt: new Date() }
        : null,
    })),

  // Itinerary editing state
  isEditingItinerary: false,
  editingSpotId: null,
  editingDayIndex: null,
  setEditingItinerary: (editing) => set({ isEditingItinerary: editing }),
  setEditingSpot: (spotId, dayIndex) => 
    set({ editingSpotId: spotId, editingDayIndex: dayIndex }),
  updateSpot: (dayIndex, spotId, updates) =>
    set((state) => {
      if (!state.currentItinerary) return state;
      const newSchedule = [...state.currentItinerary.schedule];
      const day = newSchedule[dayIndex];
      if (!day) return state;
      
      const spotIndex = day.spots.findIndex((s) => s.id === spotId);
      if (spotIndex === -1) return state;
      
      day.spots[spotIndex] = { ...day.spots[spotIndex], ...updates };
      
      return {
        currentItinerary: {
          ...state.currentItinerary,
          schedule: newSchedule,
          updatedAt: new Date(),
        },
      };
    }),
  deleteSpot: (dayIndex, spotId) =>
    set((state) => {
      if (!state.currentItinerary) return state;
      const newSchedule = [...state.currentItinerary.schedule];
      const day = newSchedule[dayIndex];
      if (!day) return state;
      
      day.spots = day.spots.filter((s) => s.id !== spotId);
      
      return {
        currentItinerary: {
          ...state.currentItinerary,
          schedule: newSchedule,
          updatedAt: new Date(),
        },
      };
    }),

  // UI state
  selectedAI: 'gemini',
  claudeApiKey: '',
  selectedTemplate: 'default',
  setSelectedAI: (ai) => set({ selectedAI: ai }),
  setClaudeApiKey: (key) => set({ claudeApiKey: key }),
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),

  // Error state
  error: null,
  setError: (error) => set({ error }),
}));
