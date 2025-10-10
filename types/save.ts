/**
 * 保存機能関連の型定義
 */

/**
 * 保存先の種類
 */
export type SaveLocation = 'browser' | 'database' | 'both';

/**
 * 保存状態
 */
export interface SaveState {
  /** 保存中かどうか */
  isSaving: boolean;
  /** 最後に保存した時刻 */
  lastSaveTime: Date | null;
  /** 保存先 */
  location: SaveLocation | null;
  /** データベース保存が成功したか */
  dbSaveSuccess: boolean;
  /** ブラウザ保存が成功したか */
  browserSaveSuccess: boolean;
}

/**
 * 自動保存の設定
 */
export interface AutoSaveConfig {
  /** LocalStorage保存のデバウンス時間（ミリ秒） */
  localStorageDebounceMs: number;
  /** データベース保存のデバウンス時間（ミリ秒） */
  databaseDebounceMs: number;
  /** 定期保存の間隔（ミリ秒） */
  periodicSaveIntervalMs: number;
}

/**
 * デフォルト設定
 */
export const DEFAULT_AUTO_SAVE_CONFIG: AutoSaveConfig = {
  localStorageDebounceMs: 2000, // 2秒
  databaseDebounceMs: 5000, // 5秒
  periodicSaveIntervalMs: 5 * 60 * 1000, // 5分
};
