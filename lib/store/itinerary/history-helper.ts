/**
 * Phase 10: History Helper
 * 
 * useStore-helper.tsから移行
 */

import type { ItineraryData } from '@/types/itinerary';

export interface HistoryState {
  past: ItineraryData[];
  present: ItineraryData | null;
  future: ItineraryData[];
}

/**
 * 履歴更新のためのヘルパー関数
 */
export function createHistoryUpdate(
  current: ItineraryData | null,
  next: ItineraryData | null,
  history: HistoryState
): { currentItinerary: ItineraryData | null; history: HistoryState } {
  return {
    currentItinerary: next,
    history: {
      past: current ? [...history.past, current] : history.past,
      present: next,
      future: [],
    },
  };
}
