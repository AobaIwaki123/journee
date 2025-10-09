/**
 * Phase 4.8: チェックリスト設定
 * 各フェーズで必要な情報の定義
 */

import type { ItineraryPhase } from "@/types/itinerary";
import type { PhaseRequirements } from "@/types/requirements";
import {
  extractDestination,
  extractDuration,
  extractBudget,
  extractTravelers,
  extractInterests,
  extractThemeIdeas,
  checkSkeletonCreated,
  extractSpotPreferences,
} from "./extractors";

/**
 * 各フェーズのチェックリスト設定
 */
export const PHASE_REQUIREMENTS: Record<ItineraryPhase, PhaseRequirements> = {
  initial: {
    phase: "initial",
    requiredItems: [],
    optionalItems: [],
    items: [],
  },

  collecting: {
    phase: "collecting",
    requiredItems: ["destination", "duration"],
    optionalItems: ["budget", "travelers", "interests"],
    items: [
      {
        id: "destination",
        label: "行き先",
        description: "旅行先の都市や地域",
        required: true,
        status: "empty",
        extractor: extractDestination,
      },
      {
        id: "duration",
        label: "日程",
        description: "旅行の日数または期間",
        required: true,
        status: "empty",
        extractor: extractDuration,
      },
      {
        id: "budget",
        label: "予算",
        description: "旅行の予算目安",
        required: false,
        status: "empty",
        extractor: extractBudget,
      },
      {
        id: "travelers",
        label: "人数",
        description: "旅行者の人数・構成",
        required: false,
        status: "empty",
        extractor: extractTravelers,
      },
      {
        id: "interests",
        label: "興味・テーマ",
        description: "観光、グルメ、自然など",
        required: false,
        status: "empty",
        extractor: extractInterests,
      },
    ],
  },

  skeleton: {
    phase: "skeleton",
    requiredItems: ["destination", "duration"],
    optionalItems: ["theme_ideas"],
    items: [
      {
        id: "destination",
        label: "行き先",
        description: "旅行先（骨組み作成に必要）",
        required: true,
        status: "empty",
        extractor: extractDestination,
      },
      {
        id: "duration",
        label: "日程",
        description: "旅行の日数（骨組み作成に必要）",
        required: true,
        status: "empty",
        extractor: extractDuration,
      },
      {
        id: "theme_ideas",
        label: "各日のテーマアイデア",
        description: "ユーザーが希望する各日の大まかなテーマ",
        required: false,
        status: "empty",
        extractor: extractThemeIdeas,
      },
    ],
  },

  detailing: {
    phase: "detailing",
    requiredItems: ["skeleton_created"],
    optionalItems: ["spot_preferences"],
    items: [
      {
        id: "skeleton_created",
        label: "骨組みの作成",
        description: "各日のテーマが決定している",
        required: true,
        status: "empty",
        extractor: checkSkeletonCreated,
      },
      {
        id: "spot_preferences",
        label: "観光スポットの希望",
        description: "訪れたい観光スポット",
        required: false,
        status: "empty",
        extractor: extractSpotPreferences,
      },
    ],
  },

  completed: {
    phase: "completed",
    requiredItems: [],
    optionalItems: [],
    items: [],
  },
};

/**
 * フェーズごとのチェックリストを取得
 */
export function getRequirementsForPhase(
  phase: ItineraryPhase
): PhaseRequirements {
  return PHASE_REQUIREMENTS[phase];
}
