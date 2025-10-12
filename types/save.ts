/**
 * 保存機能関連の型定義
 */

/**
 * 保存場所の種類
 * - 'browser': ブラウザ（LocalStorage）のみに保存
 * - 'database': データベースのみに保存
 * - 'both': ブラウザとデータベースの両方に保存
 */
export type SaveLocation = 'browser' | 'database' | 'both';

/**
 * 保存状態
 */
export interface SaveState {
  /** 保存中かどうか */
  isSaving: boolean;
  /** 最後の保存時刻 */
  lastSaveTime: Date | null;
  /** 保存場所 */
  saveLocation: SaveLocation | null;
  /** データベース保存の成功状態 */
  dbSaveSuccess: boolean | null;
}

/**
 * 保存結果
 */
export interface SaveResult {
  /** 保存成功したかどうか */
  success: boolean;
  /** 保存場所 */
  location: SaveLocation;
  /** エラーメッセージ（失敗時） */
  error?: string;
}
