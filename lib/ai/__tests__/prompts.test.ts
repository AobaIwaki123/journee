/**
 * Phase 4.3: プロンプト関数のテスト
 *
 * このファイルは手動テスト用のサンプルとテストケースを定義しています。
 */

import {
  INCREMENTAL_SYSTEM_PROMPT,
  createSkeletonPrompt,
  createDayDetailPrompt,
  createNextStepPrompt,
  getSystemPromptForPhase,
} from "../prompts";
import type { ItineraryData, ItineraryPhase } from "@/types/itinerary";

/**
 * テストデータ: 基本情報収集後のしおりデータ
 */
export const mockItineraryAfterCollecting: ItineraryData = {
  id: "test-1",
  title: "東京3泊4日の旅",
  destination: "東京",
  duration: 3,
  summary:
    "歴史と現代が融合する東京を満喫。浅草、渋谷、お台場を中心に観光とグルメを楽しむ旅",
  schedule: [],
  status: "draft",
  phase: "collecting_detailed",
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * テストデータ: 骨組み作成後のしおりデータ
 */
export const mockItineraryAfterSkeleton: ItineraryData = {
  id: "test-1",
  title: "東京3泊4日の旅",
  destination: "東京",
  duration: 3,
  summary: "歴史と現代が融合する東京を満喫",
  phase: "skeleton",
  schedule: [
    {
      day: 1,
      title: "下町情緒を楽しむ",
      theme: "浅草・スカイツリー周辺",
      status: "skeleton",
      spots: [],
    },
    {
      day: 2,
      title: "若者文化の中心地",
      theme: "渋谷・原宿エリア",
      status: "skeleton",
      spots: [],
    },
    {
      day: 3,
      title: "未来を感じる",
      theme: "お台場・豊洲エリア",
      status: "skeleton",
      spots: [],
    },
  ],
  status: "draft",
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * テストデータ: 1日目詳細化後のしおりデータ
 */
export const mockItineraryDay1Detailed: ItineraryData = {
  ...mockItineraryAfterSkeleton,
  phase: "detailing",
  currentDay: 1,
  schedule: [
    {
      day: 1,
      title: "下町情緒を楽しむ",
      theme: "浅草・スカイツリー周辺",
      status: "detailed",
      spots: [
        {
          id: "spot-1-1",
          name: "浅草寺",
          description: "東京最古の寺院、雷門が有名",
          scheduledTime: "10:00",
          duration: 90,
          category: "sightseeing",
          estimatedCost: 0,
        },
        {
          id: "spot-1-2",
          name: "仲見世通り",
          description: "伝統的なお土産屋が並ぶ商店街",
          scheduledTime: "11:30",
          duration: 60,
          category: "sightseeing",
          estimatedCost: 2000,
        },
      ],
    },
    {
      day: 2,
      title: "若者文化の中心地",
      theme: "渋谷・原宿エリア",
      status: "skeleton",
      spots: [],
    },
    {
      day: 3,
      title: "未来を感じる",
      theme: "お台場・豊洲エリア",
      status: "skeleton",
      spots: [],
    },
  ],
};

/**
 * テストケース: createSkeletonPrompt
 */
export function testCreateSkeletonPrompt() {
  console.log("=== createSkeletonPrompt テスト ===\n");

  const prompt = createSkeletonPrompt(mockItineraryAfterCollecting);
  console.log(prompt);
  console.log("\n✅ 期待される結果:");
  console.log("- 行き先、期間、旅行の概要が含まれている");
  console.log("- 骨組み作成の指示が明確");
  console.log("- JSON出力形式が指定されている");
  console.log("- 具体的なスポット名を出さないよう注意喚起されている\n");
}

/**
 * テストケース: createDayDetailPrompt
 */
export function testCreateDayDetailPrompt() {
  console.log("=== createDayDetailPrompt テスト ===\n");

  const prompt = createDayDetailPrompt(mockItineraryAfterSkeleton, 1);
  console.log(prompt);
  console.log("\n✅ 期待される結果:");
  console.log("- 対象日（1日目）が明確");
  console.log("- その日のテーマが含まれている");
  console.log("- 詳細化のタスク（時間、スポット、費用等）が列挙されている");
  console.log("- JSON出力形式が指定されている\n");
}

/**
 * テストケース: createNextStepPrompt（各フェーズ）
 */
export function testCreateNextStepPrompt() {
  console.log("=== createNextStepPrompt テスト ===\n");

  const phases: ItineraryPhase[] = [
    "initial",
    "collecting",
    "skeleton",
    "detailing",
    "completed",
  ];

  phases.forEach((phase) => {
    console.log(`\n【フェーズ: ${phase}】`);
    const prompt = createNextStepPrompt(
      phase,
      phase === "detailing"
        ? mockItineraryDay1Detailed
        : mockItineraryAfterSkeleton
    );
    console.log(prompt);
  });

  console.log("\n✅ 期待される結果:");
  console.log("- 各フェーズに応じた適切な誘導メッセージ");
  console.log("- collecting: 不足情報の確認");
  console.log("- skeleton: 次のステップへの準備確認");
  console.log("- detailing: 次の日への誘導 or 完成の通知");
  console.log("- completed: 完成の祝福と微調整の案内\n");
}

/**
 * テストケース: getSystemPromptForPhase
 */
export function testGetSystemPromptForPhase() {
  console.log("=== getSystemPromptForPhase テスト ===\n");

  const phases: ItineraryPhase[] = [
    "initial",
    "collecting",
    "skeleton",
    "detailing",
    "completed",
  ];

  phases.forEach((phase) => {
    const systemPrompt = getSystemPromptForPhase(phase);
    const isIncremental = systemPrompt === INCREMENTAL_SYSTEM_PROMPT;
    console.log(
      `${phase}: ${
        isIncremental ? "INCREMENTAL_SYSTEM_PROMPT" : "SYSTEM_PROMPT"
      }`
    );
  });

  console.log("\n✅ 期待される結果:");
  console.log("- initial: SYSTEM_PROMPT（通常版）");
  console.log("- その他: INCREMENTAL_SYSTEM_PROMPT（段階的構築版）\n");
}

/**
 * 全テストを実行
 */
export function runAllTests() {
  console.log("\n🧪 Phase 4.3 プロンプト関数テスト開始\n");
  console.log("=".repeat(60));

  testCreateSkeletonPrompt();
  console.log("=".repeat(60));

  testCreateDayDetailPrompt();
  console.log("=".repeat(60));

  testCreateNextStepPrompt();
  console.log("=".repeat(60));

  testGetSystemPromptForPhase();
  console.log("=".repeat(60));

  console.log("\n✅ 全テスト完了\n");
}

/**
 * 使用例: プロンプト生成の実演
 */
export function demonstratePromptGeneration() {
  console.log("\n📝 プロンプト生成の実演\n");
  console.log("=".repeat(60));

  // シナリオ1: 骨組み作成
  console.log("\n【シナリオ1: 骨組み作成】");
  console.log("ユーザーが基本情報を入力後、骨組みを作成するフェーズ\n");
  const skeletonPrompt = createSkeletonPrompt(mockItineraryAfterCollecting);
  console.log("生成されたプロンプト（一部）:");
  console.log(skeletonPrompt.substring(0, 300) + "...\n");

  // シナリオ2: 1日目詳細化
  console.log("\n【シナリオ2: 1日目の詳細化】");
  console.log("骨組み完成後、1日目の具体的なスケジュールを作成するフェーズ\n");
  const dayDetailPrompt = createDayDetailPrompt(mockItineraryAfterSkeleton, 1);
  console.log("生成されたプロンプト（一部）:");
  console.log(dayDetailPrompt.substring(0, 300) + "...\n");

  // シナリオ3: 次のステップへの誘導
  console.log("\n【シナリオ3: 1日目完了後の誘導】");
  console.log("1日目が詳細化された後、2日目への誘導\n");
  const nextStepPrompt = createNextStepPrompt(
    "detailing",
    mockItineraryDay1Detailed
  );
  console.log("生成されたプロンプト:");
  console.log(nextStepPrompt + "\n");

  console.log("=".repeat(60));
  console.log("\n✅ 実演完了\n");
}

// ブラウザコンソールでテストを実行できるようにexport
if (typeof window !== "undefined") {
  (window as any).Phase4PromptTests = {
    runAllTests,
    demonstratePromptGeneration,
    testCreateSkeletonPrompt,
    testCreateDayDetailPrompt,
    testCreateNextStepPrompt,
    testGetSystemPromptForPhase,
  };
}

export default {
  runAllTests,
  demonstratePromptGeneration,
};
