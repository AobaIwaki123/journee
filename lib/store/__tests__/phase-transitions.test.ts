/**
 * Phase 4.2: フェーズ遷移ロジックのテスト
 *
 * このファイルは手動テスト用のシナリオを定義しています。
 * 実際のテストフレームワーク（Jest等）は今後のPhaseで導入予定です。
 */

import { ItineraryPhase, ItineraryData } from "@/types/itinerary";

/**
 * テストシナリオ: フェーズ遷移の検証
 */
export const testScenarios = {
  /**
   * シナリオ1: initial → collecting
   */
  scenario1: {
    description: "初期状態から情報収集フェーズへの遷移",
    initialPhase: "initial" as ItineraryPhase,
    expectedNextPhase: "collecting" as ItineraryPhase,
    expectedDetailingDay: null,
  },

  /**
   * シナリオ2: collecting → skeleton
   */
  scenario2: {
    description: "情報収集フェーズから骨組み作成フェーズへの遷移",
    initialPhase: "collecting" as ItineraryPhase,
    expectedNextPhase: "skeleton" as ItineraryPhase,
    expectedDetailingDay: null,
  },

  /**
   * シナリオ3: skeleton → detailing (1日目)
   */
  scenario3: {
    description: "骨組み作成フェーズから詳細化フェーズへの遷移",
    initialPhase: "skeleton" as ItineraryPhase,
    expectedNextPhase: "detailing" as ItineraryPhase,
    expectedDetailingDay: 1,
  },

  /**
   * シナリオ4: detailing (1日目 → 2日目)
   */
  scenario4: {
    description: "詳細化フェーズで次の日へ進む",
    initialPhase: "detailing" as ItineraryPhase,
    currentDetailingDay: 1,
    itineraryDuration: 3,
    expectedNextPhase: "detailing" as ItineraryPhase,
    expectedDetailingDay: 2,
  },

  /**
   * シナリオ5: detailing (最終日) → completed
   */
  scenario5: {
    description: "詳細化フェーズで最終日が完了し、完成フェーズへ遷移",
    initialPhase: "detailing" as ItineraryPhase,
    currentDetailingDay: 3,
    itineraryDuration: 3,
    expectedNextPhase: "completed" as ItineraryPhase,
    expectedDetailingDay: null,
  },

  /**
   * シナリオ6: completed → completed (変化なし)
   */
  scenario6: {
    description: "完成フェーズでは何も変わらない",
    initialPhase: "completed" as ItineraryPhase,
    expectedNextPhase: "completed" as ItineraryPhase,
    expectedDetailingDay: null,
  },
};

/**
 * モックデータ: テスト用旅程データ
 */
export const mockItineraryData: ItineraryData = {
  id: "test-itinerary-1",
  title: "東京3泊4日の旅",
  destination: "東京",
  duration: 3,
  schedule: [
    { day: 1, spots: [], status: "draft" },
    { day: 2, spots: [], status: "draft" },
    { day: 3, spots: [], status: "draft" },
  ],
  status: "draft",
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * 手動テスト手順
 *
 * 1. ブラウザの開発者ツールを開く
 * 2. 以下のコードをコンソールに貼り付けて実行:
 *
 * ```javascript
 * // Zustandストアにアクセス
 * const store = window.__ZUSTAND_STORE__;
 *
 * // 初期状態を確認
 * console.log('Initial phase:', store.getState().planningPhase);
 *
 * // フェーズを進める
 * store.getState().proceedToNextStep();
 * console.log('After 1st step:', store.getState().planningPhase);
 *
 * // さらに進める
 * store.getState().proceedToNextStep();
 * console.log('After 2nd step:', store.getState().planningPhase);
 *
 * // リセット
 * store.getState().resetPlanning();
 * console.log('After reset:', store.getState().planningPhase);
 * ```
 *
 * 3. 期待される出力:
 *    - Initial phase: initial
 *    - After 1st step: collecting
 *    - After 2nd step: skeleton
 *    - After reset: initial
 */

/**
 * フェーズ遷移の期待値マップ
 */
export const phaseTransitionMap: Record<
  ItineraryPhase,
  { next: ItineraryPhase; description: string }
> = {
  initial: {
    next: "collecting_basic",
    description: "基本情報の収集を開始",
  },
  collecting_basic: {
    next: "collecting_detailed",
    description: "詳細情報の収集を開始",
  },
  collecting_detailed: {
    next: "skeleton",
    description: "骨組み（各日のテーマ）の作成を開始",
  },
  skeleton: {
    next: "detailing",
    description: "1日目の詳細化を開始",
  },
  detailing: {
    next: "detailing", // または completed
    description: "次の日の詳細化、または完成へ",
  },
  completed: {
    next: "completed",
    description: "完成（変化なし）",
  },
};

export default testScenarios;
