/**
 * Custom hook for real-time itinerary progress calculation
 * Monitors currentItinerary and planningPhase from Zustand store
 */

import { useMemo } from "react";
import { useStore } from "@/lib/store/useStore";
import { calculateItineraryProgress } from "@/lib/utils/progress-calculator";

/**
 * Calculate and return real-time itinerary progress (0-100)
 * Automatically updates when itinerary data or planning phase changes
 */
export function useItineraryProgress(): number {
  const { currentItinerary, planningPhase } = useStore();

  return useMemo(() => {
    const progress = calculateItineraryProgress(
      currentItinerary,
      planningPhase
    );

    // Debug logging
    console.log("🔍 Progress Calculation:", {
      phase: planningPhase,
      hasDuration: !!currentItinerary?.duration,
      scheduleLength: currentItinerary?.schedule?.length || 0,
      calculatedProgress: progress,
    });

    return progress;
  }, [currentItinerary, planningPhase]);
}
