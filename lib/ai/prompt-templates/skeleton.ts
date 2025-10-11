/**
 * Phase 11.3: 骨組み作成フェーズのプロンプトテンプレート
 */

export const SKELETON_PROMPTS = {
  create: (destination: string, duration: number, requirements: string[]) => `
${destination}への${duration}日間の旅行プランの骨組みを作成してください。

要件:
${requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

各日の大まかなテーマと主要スポットを提案してください。
`,

  refine: `骨組みを確認しました。修正したい点があれば教えてください。`,
};
