/**
 * useItineraryUIStore - しおりUI状態のストア
 * 
 * フィルター、ソート、UI状態を管理
 */

import { create } from 'zustand';
import type { ItineraryFilter, ItinerarySort } from '@/types/filters';

interface ItineraryUIStore {
  // State
  filter: ItineraryFilter;
  sort: ItinerarySort;
  
  // Actions
  setFilter: (filter: ItineraryFilter) => void;
  setSort: (sort: ItinerarySort) => void;
  resetFilters: () => void;
}

export const useItineraryUIStore = create<ItineraryUIStore>((set) => ({
  // State
  filter: { status: 'all' },
  sort: { field: 'updatedAt', order: 'desc' },
  
  // Actions
  setFilter: (filter) => set({ filter }),
  
  setSort: (sort) => set({ sort }),
  
  resetFilters: () => set({
    filter: { status: 'all' },
    sort: { field: 'updatedAt', order: 'desc' },
  }),
}));
