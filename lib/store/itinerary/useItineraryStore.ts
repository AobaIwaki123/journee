/**
 * useItineraryStore - しおり本体のストア
 * 
 * しおりデータの管理と基本操作を提供
 */

import { create } from 'zustand';
import type { ItineraryData } from '@/types/itinerary';

interface ItineraryStore {
  // State
  currentItinerary: ItineraryData | null;
  
  // Actions
  setItinerary: (itinerary: ItineraryData | null) => void;
  updateItinerary: (updates: Partial<ItineraryData>) => void;
  updateItineraryTitle: (title: string) => void;
  updateItineraryDestination: (destination: string) => void;
}

export const useItineraryStore = create<ItineraryStore>((set) => ({
  // State
  currentItinerary: null,
  
  // Actions
  setItinerary: (itinerary) => {
    // LocalStorageに保存
    if (typeof window !== 'undefined' && itinerary) {
      try {
        const currentStorage = localStorage.getItem('journee-storage');
        const parsed = currentStorage ? JSON.parse(currentStorage) : {};
        const newStorage = {
          ...parsed,
          state: {
            ...(parsed.state || {}),
            currentItinerary: itinerary,
          },
          version: 0,
        };
        localStorage.setItem('journee-storage', JSON.stringify(newStorage));
      } catch (e) {
        console.error('Failed to save itinerary to localStorage:', e);
      }
    }
    
    set({ currentItinerary: itinerary });
  },
  
  updateItinerary: (updates) => 
    set((state) => {
      if (!state.currentItinerary) return state;
      
      const updatedItinerary = {
        ...state.currentItinerary,
        ...updates,
        updatedAt: new Date(),
      };
      
      // LocalStorageに保存
      if (typeof window !== 'undefined') {
        try {
          const currentStorage = localStorage.getItem('journee-storage');
          const parsed = currentStorage ? JSON.parse(currentStorage) : {};
          const newStorage = {
            ...parsed,
            state: {
              ...(parsed.state || {}),
              currentItinerary: updatedItinerary,
            },
            version: 0,
          };
          localStorage.setItem('journee-storage', JSON.stringify(newStorage));
        } catch (e) {
          console.error('Failed to save itinerary to localStorage:', e);
        }
      }
      
      return { currentItinerary: updatedItinerary };
    }),
  
  updateItineraryTitle: (title) =>
    set((state) => {
      if (!state.currentItinerary) return state;
      
      const updatedItinerary = {
        ...state.currentItinerary,
        title,
        updatedAt: new Date(),
      };
      
      return { currentItinerary: updatedItinerary };
    }),
  
  updateItineraryDestination: (destination) =>
    set((state) => {
      if (!state.currentItinerary) return state;
      
      const updatedItinerary = {
        ...state.currentItinerary,
        destination,
        updatedAt: new Date(),
      };
      
      return { currentItinerary: updatedItinerary };
    }),
}));
