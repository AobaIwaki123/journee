/**
 * 環境変数ユーティリティ
 * 環境変数の参照を一元管理
 */

/**
 * モック認証が有効かどうかを判定
 * @returns {boolean} モック認証が有効な場合true
 */
export const isMockAuthEnabled = (): boolean => {
  return process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === "true";
};
