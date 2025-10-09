/**
 * 日付処理ユーティリティ（Phase 11 - エラー修正）
 */

/**
 * 値を安全にDateオブジェクトに変換
 * @param value - 変換する値（Date, string, number）
 * @returns Dateオブジェクト、変換失敗時はnull
 */
export function toSafeDate(value: Date | string | number | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  // すでにDateオブジェクトの場合
  if (value instanceof Date) {
    // 無効な日付でないかチェック
    return isNaN(value.getTime()) ? null : value;
  }

  // 文字列または数値の場合
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * 相対時間の表示を取得
 * @param date - 基準となる日付
 * @returns 相対時間の文字列（例: "3時間前"）
 */
export function getRelativeTime(date: Date | string | number | null | undefined): string {
  const safeDate = toSafeDate(date);
  
  if (!safeDate) {
    return "不明";
  }

  const now = new Date();
  const diffMs = now.getTime() - safeDate.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMinutes < 1) return "たった今";
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  if (diffWeeks < 4) return `${diffWeeks}週間前`;
  if (diffMonths < 12) return `${diffMonths}ヶ月前`;

  return safeDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * 日付を日本語形式でフォーマット
 * @param date - フォーマットする日付
 * @param format - フォーマット形式
 * @returns フォーマットされた文字列
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  format: "full" | "short" | "datetime" = "full"
): string {
  const safeDate = toSafeDate(date);
  
  if (!safeDate) {
    return "不明";
  }

  switch (format) {
    case "full":
      return safeDate.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });
    case "short":
      return safeDate.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    case "datetime":
      return safeDate.toLocaleString("ja-JP", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    default:
      return safeDate.toLocaleDateString("ja-JP");
  }
}

/**
 * 日付が有効かチェック
 * @param date - チェックする日付
 * @returns 有効ならtrue
 */
export function isValidDate(date: Date | string | number | null | undefined): boolean {
  return toSafeDate(date) !== null;
}
