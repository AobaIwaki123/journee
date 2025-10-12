/**
 * localStorageからIndexedDBへのマイグレーション
 */

import { journeeDB, isIndexedDBAvailable } from './indexed-db';
import type { AIModelId } from '@/types/ai';
import type { AutoProgressSettings } from './storage';

/**
 * マイグレーション結果
 */
export interface MigrationResult {
  success: boolean;
  migratedKeys: string[];
  errors: string[];
  skippedKeys: string[];
}

/**
 * マイグレーション状況
 */
export interface MigrationStatus {
  isCompleted: boolean;
  version: number;
  completedAt?: string;
}

/**
 * localStorageキーとIndexedDBストア/キーのマッピング
 */
const MIGRATION_MAP: Record<
  string,
  { store: 'ui_state' | 'settings' | 'cache' | 'store_state'; key: string }
> = {
  // UI状態
  journee_panel_width: { store: 'ui_state', key: 'chat_panel_width' },
  journee_selected_ai: { store: 'ui_state', key: 'selected_ai' },
  journee_auto_progress_mode: { store: 'ui_state', key: 'auto_progress_mode' },
  journee_auto_progress_settings: {
    store: 'ui_state',
    key: 'auto_progress_settings',
  },

  // アプリケーション設定
  journee_app_settings: { store: 'settings', key: 'app_settings' },

  // 公開しおりキャッシュ
  journee_public_itineraries: { store: 'cache', key: 'public_itineraries' },

  // Zustandストア
  'journee-storage': { store: 'store_state', key: 'journee-storage' },

  // APIキーは削除（Supabaseに移行）
  journee_claude_api_key: { store: 'ui_state', key: '_deprecated_api_key' },
};

/**
 * マイグレーション完了フラグキー
 */
const MIGRATION_COMPLETED_KEY = 'journee_migration_completed';
const MIGRATION_VERSION = 1;

/**
 * マイグレーション状況を確認
 */
export async function checkMigrationStatus(): Promise<MigrationStatus> {
  if (typeof window === 'undefined') {
    return { isCompleted: false, version: 0 };
  }

  try {
    const statusStr = localStorage.getItem(MIGRATION_COMPLETED_KEY);
    if (!statusStr) {
      return { isCompleted: false, version: 0 };
    }

    const status = JSON.parse(statusStr) as MigrationStatus;
    return status;
  } catch (error) {
    console.error('Failed to check migration status:', error);
    return { isCompleted: false, version: 0 };
  }
}

/**
 * マイグレーション完了をマーク
 */
function markMigrationCompleted(): void {
  if (typeof window === 'undefined') return;

  const status: MigrationStatus = {
    isCompleted: true,
    version: MIGRATION_VERSION,
    completedAt: new Date().toISOString(),
  };

  localStorage.setItem(MIGRATION_COMPLETED_KEY, JSON.stringify(status));
}

/**
 * localStorageからIndexedDBへ全データを移行
 */
export async function migrateLocalStorageToIndexedDB(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedKeys: [],
    errors: [],
    skippedKeys: [],
  };

  // IndexedDBが利用不可の場合
  if (!isIndexedDBAvailable()) {
    result.errors.push('IndexedDB is not available');
    return result;
  }

  // ブラウザ環境外
  if (typeof window === 'undefined') {
    result.errors.push('Not in browser environment');
    return result;
  }

  try {
    // IndexedDBを初期化
    await journeeDB.init();

    // マイグレーション対象のキーを処理
    for (const [localStorageKey, mapping] of Object.entries(MIGRATION_MAP)) {
      try {
        // localStorageから値を取得
        const value = localStorage.getItem(localStorageKey);

        if (value === null) {
          result.skippedKeys.push(localStorageKey);
          continue;
        }

        // APIキーは移行しない（Supabaseへ移行予定）
        if (localStorageKey === 'journee_claude_api_key') {
          console.log('Skipping API key migration (will be migrated to Supabase)');
          result.skippedKeys.push(localStorageKey);
          continue;
        }

        // 値をパース（JSON文字列の場合）
        let parsedValue: any;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          // JSON以外の場合はそのまま使用
          parsedValue = value;
        }

        // IndexedDBに保存
        await journeeDB.set(mapping.store, mapping.key, parsedValue);

        result.migratedKeys.push(localStorageKey);
        console.log(`Migrated: ${localStorageKey} -> ${mapping.store}/${mapping.key}`);
      } catch (error) {
        const errorMsg = `Failed to migrate ${localStorageKey}: ${error}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    // マイグレーション完了をマーク
    if (result.errors.length === 0) {
      markMigrationCompleted();
      result.success = true;
    }
  } catch (error) {
    const errorMsg = `Migration failed: ${error}`;
    console.error(errorMsg);
    result.errors.push(errorMsg);
  }

  return result;
}

/**
 * 個別キーのマイグレーション
 */
export async function migrateKey(
  localStorageKey: string,
  targetStore: 'ui_state' | 'settings' | 'cache' | 'store_state',
  targetKey: string
): Promise<boolean> {
  if (!isIndexedDBAvailable() || typeof window === 'undefined') {
    return false;
  }

  try {
    // IndexedDBを初期化
    await journeeDB.init();

    // localStorageから値を取得
    const value = localStorage.getItem(localStorageKey);
    if (value === null) {
      return false;
    }

    // 値をパース
    let parsedValue: any;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = value;
    }

    // IndexedDBに保存
    await journeeDB.set(targetStore, targetKey, parsedValue);
    console.log(`Migrated: ${localStorageKey} -> ${targetStore}/${targetKey}`);

    return true;
  } catch (error) {
    console.error(`Failed to migrate ${localStorageKey}:`, error);
    return false;
  }
}

/**
 * マイグレーション完了後、localStorageから旧データを削除
 * （30日間の猶予期間後に実行することを推奨）
 */
export async function cleanupOldLocalStorageData(): Promise<void> {
  if (typeof window === 'undefined') return;

  // マイグレーション完了を確認
  const status = await checkMigrationStatus();
  if (!status.isCompleted || !status.completedAt) {
    console.warn('Migration not completed, skipping cleanup');
    return;
  }

  // 30日以上経過しているかチェック
  const completedDate = new Date(status.completedAt);
  const daysSinceCompletion =
    (Date.now() - completedDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceCompletion < 30) {
    console.log(
      `Migration completed ${Math.floor(daysSinceCompletion)} days ago, waiting for 30 days before cleanup`
    );
    return;
  }

  // 旧データを削除
  for (const localStorageKey of Object.keys(MIGRATION_MAP)) {
    try {
      localStorage.removeItem(localStorageKey);
      console.log(`Removed old data: ${localStorageKey}`);
    } catch (error) {
      console.error(`Failed to remove ${localStorageKey}:`, error);
    }
  }

  console.log('Old localStorage data cleaned up');
}
