/**
 * Phase 10: History Helper
 * 
 * useStore-helperから抽出
 */

import type { ItineraryData } from '@/types/itinerary';

interface HistoryState {
  past: ItineraryData[];
  present: ItineraryData | null;
  future: ItineraryData[];
}

/**
 * 履歴更新ヘルパー
 */
export function createHistoryUpdate(
  currentItinerary: ItineraryData | null,
  newItinerary: ItineraryData | null,
  history: HistoryState
) {
  return {
    currentItinerary: newItinerary,
    history: {
      past: currentItinerary ? [...history.past, currentItinerary] : history.past,
      present: newItinerary,
      future: [],
    },
  };
}
