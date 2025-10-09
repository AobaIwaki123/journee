/**
 * UUID v4 ID Generator
 *
 * すべてのエンティティ（しおり、スポット、メッセージ、トーストなど）の
 * IDを生成するためのユーティリティ関数
 */

/**
 * UUID v4を生成
 * ブラウザとNode.js両対応
 *
 * @returns UUID v4形式の文字列（例: "550e8400-e29b-41d4-a716-446655440000"）
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // フォールバック（古い環境用、実際には使われない想定）
  // Next.js 14+ とモダンブラウザでは常にcrypto.randomUUIDが利用可能
  console.warn("crypto.randomUUID not available, using fallback");
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
