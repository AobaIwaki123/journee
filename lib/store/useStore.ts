import { create } from "zustand";
import { Message } from "@/types/chat";
import { ItineraryData, TouristSpot, DaySchedule } from "@/types/itinerary";
import type { AIModelId } from "@/types/ai";
import {
  saveClaudeApiKey,
  loadClaudeApiKey,
  removeClaudeApiKey,
  saveSelectedAI,
  loadSelectedAI,
} from "@/lib/utils/storage";
import { DEFAULT_AI_MODEL } from "@/lib/ai/models";
import { createHistoryUpdate } from "./useStore-helper";
import { sortSpotsByTime, adjustTimeAfterReorder } from "@/lib/utils/time-utils";

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface HistoryState {
  past: ItineraryData[];
  present: ItineraryData | null;
  future: ItineraryData[];
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

  // Itinerary editing actions (Phase 5.1.2)
  updateItineraryTitle: (title: string) => void;
  updateItineraryDestination: (destination: string) => void;
  updateSpot: (
    dayIndex: number,
    spotId: string,
    updates: Partial<TouristSpot>
  ) => void;
  deleteSpot: (dayIndex: number, spotId: string) => void;
  addSpot: (dayIndex: number, spot: TouristSpot) => void;
  reorderSpots: (
    dayIndex: number,
    startIndex: number,
    endIndex: number
  ) => void;
  moveSpot: (fromDayIndex: number, toDayIndex: number, spotId: string) => void;

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

  // Toast notifications (Phase 5.1.2)
  toasts: ToastMessage[];
  addToast: (message: string, type: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;

  // Editing state (Phase 5.1.2)
  isSaving: boolean;
  setSaving: (saving: boolean) => void;

  // Undo/Redo state (Phase 5.1.3)
  history: HistoryState;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useStore = create<AppState>((set) => ({
  // Chat state
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingMessage: "",
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (loading) => set({ isLoading: loading }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setStreamingMessage: (message) => set({ streamingMessage: message }),
  appendStreamingMessage: (chunk) =>
    set((state) => ({ streamingMessage: state.streamingMessage + chunk })),
  clearMessages: () => set({ messages: [], streamingMessage: "" }),

  // Itinerary state
  currentItinerary: null,
  setItinerary: (itinerary) =>
    set((state) => ({
      currentItinerary: itinerary,
      history: {
        past: itinerary
          ? ([...state.history.past, state.currentItinerary].filter(
              Boolean
            ) as ItineraryData[])
          : [],
        present: itinerary,
        future: [],
      },
    })),
  updateItinerary: (updates) =>
    set((state) => {
      const newItinerary = state.currentItinerary
        ? {
            ...state.currentItinerary,
            ...updates,
            updatedAt: new Date(),
          }
        : null;

      return {
        currentItinerary: newItinerary,
        history: {
          past: state.currentItinerary
            ? [...state.history.past, state.currentItinerary]
            : state.history.past,
          present: newItinerary,
          future: [],
        },
      };
    }),

  // Itinerary editing actions (Phase 5.1.2)
  updateItineraryTitle: (title) =>
    set((state) => {
      const newItinerary = state.currentItinerary
        ? { ...state.currentItinerary, title, updatedAt: new Date() }
        : null;
      return createHistoryUpdate(state.currentItinerary, newItinerary, state.history);
    }),

  updateItineraryDestination: (destination) =>
    set((state) => {
      const newItinerary = state.currentItinerary
        ? { ...state.currentItinerary, destination, updatedAt: new Date() }
        : null;
      return createHistoryUpdate(state.currentItinerary, newItinerary, state.history);
    }),

  updateSpot: (dayIndex, spotId, updates) =>
    set((state) => {
      if (!state.currentItinerary) return state;

      const newSchedule = [...state.currentItinerary.schedule];
      const daySchedule = newSchedule[dayIndex];

      if (!daySchedule) return state;

      const spotIndex = daySchedule.spots.findIndex((s) => s.id === spotId);
      if (spotIndex === -1) return state;

      // スポット情報を更新
      daySchedule.spots[spotIndex] = {
        ...daySchedule.spots[spotIndex],
        ...updates,
      };

      // 時刻が変更された場合、時刻順にソート
      if (updates.scheduledTime !== undefined) {
        daySchedule.spots = sortSpotsByTime(daySchedule.spots);
      }

      const newItinerary = {
        ...state.currentItinerary,
        schedule: newSchedule,
        updatedAt: new Date(),
      };

      return createHistoryUpdate(state.currentItinerary, newItinerary, state.history);
    }),

  deleteSpot: (dayIndex, spotId) =>
    set((state) => {
      if (!state.currentItinerary) return state;

      const newSchedule = [...state.currentItinerary.schedule];
      const daySchedule = newSchedule[dayIndex];

      if (!daySchedule) return state;

      daySchedule.spots = daySchedule.spots.filter((s) => s.id !== spotId);

      const newItinerary = {
        ...state.currentItinerary,
        schedule: newSchedule,
        updatedAt: new Date(),
      };

      return createHistoryUpdate(state.currentItinerary, newItinerary, state.history);
    }),

  addSpot: (dayIndex, spot) =>
    set((state) => {
      if (!state.currentItinerary) return state;

      const newSchedule = [...state.currentItinerary.schedule];
      const daySchedule = newSchedule[dayIndex];

      if (!daySchedule) return state;

      daySchedule.spots.push(spot);

      // スポット追加後、時刻順にソート
      daySchedule.spots = sortSpotsByTime(daySchedule.spots);

      const newItinerary = {
        ...state.currentItinerary,
        schedule: newSchedule,
        updatedAt: new Date(),
      };

      return createHistoryUpdate(state.currentItinerary, newItinerary, state.history);
    }),

  reorderSpots: (dayIndex, startIndex, endIndex) =>
    set((state) => {
      if (!state.currentItinerary) return state;

      const newSchedule = [...state.currentItinerary.schedule];
      const daySchedule = newSchedule[dayIndex];

      if (!daySchedule) return state;

      const spots = [...daySchedule.spots];
      const [removed] = spots.splice(startIndex, 1);
      spots.splice(endIndex, 0, removed);

      // 並び替え後、移動したスポットの時刻を自動調整
      const adjustedSpots = adjustTimeAfterReorder(spots, endIndex);

      daySchedule.spots = adjustedSpots;

      const newItinerary = {
        ...state.currentItinerary,
        schedule: newSchedule,
        updatedAt: new Date(),
      };

      return createHistoryUpdate(state.currentItinerary, newItinerary, state.history);
    }),

  moveSpot: (fromDayIndex, toDayIndex, spotId) =>
    set((state) => {
      if (!state.currentItinerary) return state;

      const newSchedule = [...state.currentItinerary.schedule];
      const fromDay = newSchedule[fromDayIndex];
      const toDay = newSchedule[toDayIndex];

      if (!fromDay || !toDay) return state;

      const spotIndex = fromDay.spots.findIndex((s) => s.id === spotId);
      if (spotIndex === -1) return state;

      const [spot] = fromDay.spots.splice(spotIndex, 1);
      toDay.spots.push(spot);

      // スポット追加後、移動先の日を時刻順にソート
      toDay.spots = sortSpotsByTime(toDay.spots);

      const newItinerary = {
        ...state.currentItinerary,
        schedule: newSchedule,
        updatedAt: new Date(),
      };

      return createHistoryUpdate(state.currentItinerary, newItinerary, state.history);
    }),

  // UI state
  selectedAI: DEFAULT_AI_MODEL,
  claudeApiKey: "",
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
    set({ claudeApiKey: "", selectedAI: DEFAULT_AI_MODEL });
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

  // Toast notifications (Phase 5.1.2)
  toasts: [],
  addToast: (message, type) =>
    set((state) => ({
      toasts: [...state.toasts, { id: Date.now().toString(), message, type }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // Editing state (Phase 5.1.2)
  isSaving: false,
  setSaving: (saving) => set({ isSaving: saving }),

  // Undo/Redo state (Phase 5.1.3)
  history: {
    past: [],
    present: null,
    future: [],
  },

  undo: () =>
    set((state) => {
      if (state.history.past.length === 0) return state;

      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);

      return {
        currentItinerary: previous,
        history: {
          past: newPast,
          present: previous,
          future: state.currentItinerary
            ? [state.currentItinerary, ...state.history.future]
            : state.history.future,
        },
      };
    }),

  redo: () =>
    set((state) => {
      if (state.history.future.length === 0) return state;

      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);

      return {
        currentItinerary: next,
        history: {
          past: state.currentItinerary
            ? [...state.history.past, state.currentItinerary]
            : state.history.past,
          present: next,
          future: newFuture,
        },
      };
    }),

  canUndo: () => {
    const state = useStore.getState();
    return state.history.past.length > 0;
  },

  canRedo: () => {
    const state = useStore.getState();
    return state.history.future.length > 0;
  },
}));
