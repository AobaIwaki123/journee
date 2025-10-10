/**
 * useItineraryHistoryStore - しおり履歴管理のストア
 * 
 * Undo/Redo操作を管理
 */

import { create } from 'zustand';
import type { ItineraryData } from '@/types/itinerary';

interface HistoryState {
  past: ItineraryData[];
  present: ItineraryData | null;
  future: ItineraryData[];
}

interface ItineraryHistoryStore {
  // State
  history: HistoryState;
  
  // Actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  addToHistory: (itinerary: ItineraryData) => void;
}

export const useItineraryHistoryStore = create<ItineraryHistoryStore>((set, get) => ({
  // State
  history: {
    past: [],
    present: null,
    future: [],
  },
  
  // Actions
  undo: () => {
    const { past, present, future } = get().history;
    
    if (past.length === 0) return;
    
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    set({
      history: {
        past: newPast,
        present: previous,
        future: present ? [present, ...future] : future,
      },
    });
    
    return previous;
  },
  
  redo: () => {
    const { past, present, future } = get().history;
    
    if (future.length === 0) return;
    
    const next = future[0];
    const newFuture = future.slice(1);
    
    set({
      history: {
        past: present ? [...past, present] : past,
        present: next,
        future: newFuture,
      },
    });
    
    return next;
  },
  
  canUndo: () => {
    return get().history.past.length > 0;
  },
  
  canRedo: () => {
    return get().history.future.length > 0;
  },
  
  clearHistory: () => {
    set({
      history: {
        past: [],
        present: get().history.present,
        future: [],
      },
    });
  },
  
  addToHistory: (itinerary) => {
    const { past, present } = get().history;
    
    set({
      history: {
        past: present ? [...past, present] : past,
        present: itinerary,
        future: [], // 新しい変更が入ったらfutureをクリア
      },
    });
  },
}));
