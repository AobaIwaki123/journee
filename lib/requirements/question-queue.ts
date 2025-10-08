/**
 * Phase 4.8改善: 質問キュー管理システム
 * LLM主導で情報を収集するための質問管理
 */

import type { ItineraryPhase } from "@/types/itinerary";

/**
 * 質問のカテゴリ
 */
export type QuestionCategory =
  | "travelers" // 同行者
  | "interests" // 興味・テーマ
  | "budget" // 予算
  | "pace" // 旅行のペース
  | "specific_spots" // 具体的な訪問希望スポット
  | "meal_preferences" // 食事の希望
  | "accommodation"; // 宿泊の希望

/**
 * 質問の優先度
 */
export type QuestionPriority = "high" | "medium" | "low";

/**
 * 質問アイテム
 */
export interface Question {
  /** 質問のカテゴリ */
  category: QuestionCategory;

  /** 質問文 */
  question: string;

  /** フォローアップメッセージ（回答受領後） */
  followUp?: string | ((answer: string) => string);

  /** 優先度 */
  priority: QuestionPriority;

  /** 必須質問かどうか */
  required: boolean;

  /** この質問をスキップする条件 */
  skipIf?: (extractedInfo: Record<string, any>) => boolean;
}

/**
 * 質問キューの設定
 */
export interface QuestionQueueConfig {
  phase: ItineraryPhase;
  questions: Question[];
}

/**
 * collecting_detailed フェーズの質問キュー
 */
export const DETAILED_COLLECTION_QUESTIONS: Question[] = [
  {
    category: "travelers",
    question: "誰と行かれますか？（一人旅、カップル、家族、友人など）",
    followUp: "楽しそうですね！",
    priority: "high",
    required: false,
    skipIf: (info) => !!info.travelers,
  },
  {
    category: "interests",
    question:
      "どんなことに興味がありますか？（観光、グルメ、自然、歴史、ショッピングなど）",
    followUp: (interests: string) =>
      `${interests}がお好きなんですね！具体的に訪れたい場所はありますか？`,
    priority: "high",
    required: false,
    skipIf: (info) => info.interests && info.interests.length > 0,
  },
  {
    category: "specific_spots",
    question: "絶対に行きたい場所や、やりたいことはありますか？",
    followUp: "かしこまりました！それも含めてプランを考えますね。",
    priority: "high",
    required: false,
  },
  {
    category: "budget",
    question:
      "ご予算の目安はありますか？（交通費・宿泊費を除いた現地での支出）",
    followUp: "承知しました！その予算内で最適なプランを考えますね。",
    priority: "medium",
    required: false,
    skipIf: (info) => !!info.budget,
  },
  {
    category: "pace",
    question:
      "旅行のペースはどうされたいですか？（のんびり派、アクティブ派など）",
    followUp: undefined,
    priority: "medium",
    required: false,
  },
  {
    category: "meal_preferences",
    question: "食事で避けたいものや、特に食べたいものはありますか？",
    followUp: "了解です！それを考慮してレストランを提案しますね。",
    priority: "low",
    required: false,
  },
  {
    category: "accommodation",
    question: "宿泊施設の希望はありますか？（ホテル、旅館、民泊など）",
    followUp: undefined,
    priority: "low",
    required: false,
  },
];

/**
 * フェーズごとの質問キュー設定
 */
export const PHASE_QUESTION_QUEUES: Record<
  ItineraryPhase,
  QuestionQueueConfig
> = {
  initial: {
    phase: "initial",
    questions: [],
  },
  collecting_basic: {
    phase: "collecting_basic",
    questions: [],
  },
  collecting_detailed: {
    phase: "collecting_detailed",
    questions: DETAILED_COLLECTION_QUESTIONS,
  },
  skeleton: {
    phase: "skeleton",
    questions: [],
  },
  detailing: {
    phase: "detailing",
    questions: [],
  },
  completed: {
    phase: "completed",
    questions: [],
  },
};

/**
 * 質問の優先度でソート
 */
export function sortQuestionsByPriority(questions: Question[]): Question[] {
  const priorityOrder: Record<QuestionPriority, number> = {
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...questions].sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * 質問をフィルタリング（スキップ条件を適用）
 */
export function filterQuestions(
  questions: Question[],
  extractedInfo: Record<string, any>
): Question[] {
  return questions.filter((q) => {
    if (q.skipIf) {
      return !q.skipIf(extractedInfo);
    }
    return true;
  });
}
