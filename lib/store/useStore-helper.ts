import { ItineraryData } from '@/types/itinerary';

interface HistoryState {
  past: ItineraryData[];
  present: ItineraryData | null;
  future: ItineraryData[];
}

/**
 * Add current itinerary to history and return new history state
 */
export const addToHistory = (
  currentItinerary: ItineraryData | null,
  history: HistoryState
): HistoryState => {
  if (!currentItinerary) return history;

  return {
    past: [...history.past, currentItinerary],
    present: currentItinerary,
    future: [], // Clear future when new action is performed
  };
};

/**
 * Create return state with updated itinerary and history
 */
export const createHistoryUpdate = (
  currentItinerary: ItineraryData | null,
  newItinerary: ItineraryData | null,
  history: HistoryState
) => ({
  currentItinerary: newItinerary,
  history: addToHistory(currentItinerary, history),
});