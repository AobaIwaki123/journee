/**
 * Phase 11.3: 詳細化フェーズのプロンプトテンプレート
 */

export const DETAILING_PROMPTS = {
  createDay: (day: number) => `${day}日目の詳細なスケジュールを作成してください。

含めるべき情報:
- 各スポットの訪問時間
- 滞在時間
- 移動手段と所要時間
- 予算目安
- おすすめポイント`,

  refineDay: (day: number) => `${day}日目のスケジュールを確認しました。修正点があれば教えてください。`,
};
