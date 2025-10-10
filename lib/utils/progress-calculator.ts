/**
 * Progress Calculator for Itinerary Planning
 * Calculates real-time progress based on JSON completeness
 */

import type {
  TouristSpot,
  DaySchedule,
  ItineraryData,
  ItineraryPhase,
} from "@/types/itinerary";

/**
 * Weight configuration for spot completeness scoring
 */
const SPOT_WEIGHTS = {
  // Required fields (70%)
  name: 0.25,
  description: 0.25,
  hasSpot: 0.2,

  // Important optional fields (20%)
  scheduledTime: 0.1,
  duration: 0.1,

  // Nice-to-have fields (10%)
  location: 0.04,
  estimatedCost: 0.03,
  category: 0.03,
};

/**
 * Calculate completeness score for a single spot (0-1)
 */
export function calculateSpotCompleteness(spot: TouristSpot): number {
  let score = 0;

  // Required fields
  if (spot.name && spot.name.trim().length > 0) {
    score += SPOT_WEIGHTS.name;
  }
  if (spot.description && spot.description.trim().length > 0) {
    score += SPOT_WEIGHTS.description;
  }
  // hasSpot is implicit - if the spot exists, it has this score
  score += SPOT_WEIGHTS.hasSpot;

  // Important optional fields
  if (spot.scheduledTime && spot.scheduledTime.trim().length > 0) {
    score += SPOT_WEIGHTS.scheduledTime;
  }
  if (spot.duration && spot.duration > 0) {
    score += SPOT_WEIGHTS.duration;
  }

  // Nice-to-have fields
  if (spot.location && spot.location.lat && spot.location.lng) {
    score += SPOT_WEIGHTS.location;
  }
  if (spot.estimatedCost && spot.estimatedCost > 0) {
    score += SPOT_WEIGHTS.estimatedCost;
  }
  if (spot.category) {
    score += SPOT_WEIGHTS.category;
  }

  return Math.min(score, 1.0); // Cap at 1.0
}

/**
 * Calculate completeness score for a day schedule (0-1)
 */
export function calculateDayCompleteness(day: DaySchedule): number {
  // If no spots, return 0
  if (!day.spots || day.spots.length === 0) {
    return 0;
  }

  // Calculate average completeness of all spots
  const totalCompleteness = day.spots.reduce((sum, spot) => {
    return sum + calculateSpotCompleteness(spot);
  }, 0);

  return totalCompleteness / day.spots.length;
}

/**
 * Calculate overall itinerary progress (0-100)
 * Based on phase and JSON completeness
 */
export function calculateItineraryProgress(
  itinerary: ItineraryData | null,
  planningPhase: ItineraryPhase
): number {
  console.log("📊 calculateItineraryProgress called:", {
    phase: planningPhase,
    hasItinerary: !!itinerary,
    scheduleLength: itinerary?.schedule?.length || 0,
  });

  // Phase: initial - 0%
  if (planningPhase === "initial") {
    return 0;
  }

  // Phase: collecting - fixed 10%
  if (planningPhase === "collecting") {
    return 10;
  }

  // Phase: completed - 100%
  if (planningPhase === "completed") {
    return 100;
  }

  // For skeleton and detailing phases, we need itinerary data
  if (!itinerary || !itinerary.schedule || itinerary.schedule.length === 0) {
    // If no itinerary data yet, return base progress
    console.log("⚠️ No itinerary data, returning base progress");
    if (planningPhase === "skeleton") {
      return 10;
    }
    if (planningPhase === "detailing") {
      return 10;
    }
    return 0;
  }

  const totalDays = itinerary.duration || itinerary.schedule.length;
  if (totalDays === 0) {
    return 10; // Base progress
  }

  // Calculate per-day max progress
  // 90% distributed across all days (10% reserved for collecting phase)
  const maxProgressPerDay = 90 / totalDays;

  // Phase: skeleton
  // Progress = 10% + (sum of each day's skeleton progress)
  // Each day contributes up to 50% of its max progress (maxProgressPerDay * 0.5)
  if (planningPhase === "skeleton") {
    let totalSkeletonProgress = 0;

    for (const day of itinerary.schedule) {
      const dayCompleteness = calculateDayCompleteness(day);
      const daySkeletonContribution = maxProgressPerDay * 0.5 * dayCompleteness;
      totalSkeletonProgress += daySkeletonContribution;
      console.log(
        `  Day ${day.day}: completeness=${dayCompleteness.toFixed(
          2
        )}, contribution=${daySkeletonContribution.toFixed(2)}%`
      );
    }

    const finalProgress = 10 + totalSkeletonProgress;
    console.log(`✅ Skeleton phase progress: ${finalProgress.toFixed(2)}%`);
    return finalProgress;
  }

  // Phase: detailing
  // Progress = 10% + (sum of skeleton progress) + (sum of detailing progress)
  // Skeleton progress: all days contribute their skeleton portion (maxProgressPerDay * 0.5)
  // Detailing progress: each day contributes up to 50% of its max progress (maxProgressPerDay * 0.5)
  if (planningPhase === "detailing") {
    let totalSkeletonProgress = 0;
    let totalDetailingProgress = 0;

    for (const day of itinerary.schedule) {
      const dayCompleteness = calculateDayCompleteness(day);

      // All days get full skeleton contribution (since we're past skeleton phase)
      totalSkeletonProgress += maxProgressPerDay * 0.5;

      // Each day's detailing contribution based on completeness
      const dayDetailingContribution =
        maxProgressPerDay * 0.5 * dayCompleteness;
      totalDetailingProgress += dayDetailingContribution;
      console.log(
        `  Day ${day.day}: completeness=${dayCompleteness.toFixed(
          2
        )}, detailing contribution=${dayDetailingContribution.toFixed(2)}%`
      );
    }

    const finalProgress = 10 + totalSkeletonProgress + totalDetailingProgress;
    console.log(
      `✅ Detailing phase progress: ${finalProgress.toFixed(
        2
      )}% (base=10%, skeleton=${totalSkeletonProgress.toFixed(
        2
      )}%, detailing=${totalDetailingProgress.toFixed(2)}%)`
    );
    return finalProgress;
  }

  // Default fallback
  return 0;
}
