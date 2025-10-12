/**
 * APIキー管理ユーティリティ
 * APIキーの形式バリデーションとマスキング表示機能を提供
 */

/**
 * APIキーの形式を検証（簡易的なバリデーション）
 */
export function validateApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== "string") {
    return false;
  }

  // 最低限の長さチェック（20文字以上）
  if (apiKey.length < 20) {
    return false;
  }

  // 空白のみでないことを確認
  if (apiKey.trim().length === 0) {
    return false;
  }

  return true;
}

/**
 * APIキーをマスク表示用にフォーマット
 * 例: "sk-ant-...xyz123" → "sk-ant-***...xyz123"
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 10) {
    return "***";
  }

  const start = apiKey.substring(0, 7);
  const end = apiKey.substring(apiKey.length - 6);
  return `${start}***...${end}`;
}
