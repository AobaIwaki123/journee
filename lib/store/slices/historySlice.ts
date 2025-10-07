/**
 * History Slice (Undo/Redo)
 * しおり編集履歴の状態管理
 */

import { StateCreator } from 'zustand';
import type { ItineraryData } from '@/types/itinerary';

export interface HistoryState {
  past: ItineraryData[];
  present: ItineraryData | null;
  future: ItineraryData[];
}

export interface HistorySlice {
  // State
  history: HistoryState;
  
  // Actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  addToHistory: (itinerary: ItineraryData) => void;
  clearHistory: () => void;
}

export const createHistorySlice: StateCreator<HistorySlice> = (set, get) => ({
  // Initial state
  history: {
    past: [],
    present: null,
    future: [],
  },
  
  // Actions
  undo: () =>
    set((state) => {
      if (state.history.past.length === 0) return state;

      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);

      return {
        history: {
          past: newPast,
          present: previous,
          future: state.history.present
            ? [state.history.present, ...state.history.future]
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
        history: {
          past: state.history.present
            ? [...state.history.past, state.history.present]
            : state.history.past,
          present: next,
          future: newFuture,
        },
      };
    }),

  canUndo: () => {
    const state = get();
    return state.history.past.length > 0;
  },

  canRedo: () => {
    const state = get();
    return state.history.future.length > 0;
  },
  
  addToHistory: (itinerary) =>
    set((state) => ({
      history: {
        past: state.history.present
          ? [...state.history.past, state.history.present]
          : state.history.past,
        present: itinerary,
        future: [], // Clear future when new change is made
      },
    })),
  
  clearHistory: () =>
    set({
      history: {
        past: [],
        present: null,
        future: [],
      },
    }),
});