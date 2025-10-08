/**
 * データマイグレーション機能（Phase 8.3）
 * 
 * LocalStorageからSupabaseデータベースへデータを移行します。
 */

import { itineraryRepository } from './itinerary-repository';
import type { ItineraryData } from '@/types/itinerary';
import { loadItinerariesFromStorage, clearAllItineraries } from '@/lib/mock-data/itineraries';

/**
 * マイグレーション結果
 */
export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  errors: Array<{ itineraryId: string; error: string }>;
}

/**
 * LocalStorageからSupabaseへしおりを移行
 */
export async function migrateItinerariesToDatabase(userId: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    // LocalStorageからしおりを読込
    const itineraries = loadItinerariesFromStorage();

    if (itineraries.length === 0) {
      console.log('No itineraries to migrate');
      return result;
    }

    console.log(`Starting migration of ${itineraries.length} itineraries for user ${userId}`);

    // 各しおりを順番に移行
    for (const itinerary of itineraries) {
      try {
        // ユーザーIDを設定
        const itineraryWithUser: ItineraryData = {
          ...itinerary,
          userId,
        };

        // データベースに既に存在するかチェック
        const existing = await itineraryRepository.getItinerary(itinerary.id, userId);

        if (existing) {
          // 既に存在する場合はスキップ
          console.log(`Itinerary ${itinerary.id} already exists in database, skipping`);
          continue;
        }

        // データベースに保存
        await itineraryRepository.createItinerary(userId, itineraryWithUser);

        result.migratedCount++;
        console.log(`Migrated itinerary ${itinerary.id} (${result.migratedCount}/${itineraries.length})`);
      } catch (error) {
        result.failedCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push({
          itineraryId: itinerary.id,
          error: errorMessage,
        });
        console.error(`Failed to migrate itinerary ${itinerary.id}:`, errorMessage);
      }
    }

    // 全て成功した場合のみLocalStorageをクリア
    if (result.failedCount === 0 && result.migratedCount > 0) {
      clearAllItineraries();
      console.log('Migration completed successfully. LocalStorage cleared.');
    } else if (result.failedCount > 0) {
      result.success = false;
      console.warn(`Migration completed with ${result.failedCount} failures`);
    }

    return result;
  } catch (error) {
    console.error('Migration failed:', error);
    result.success = false;
    return result;
  }
}

/**
 * マイグレーションが必要かチェック
 */
export function needsMigration(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const itineraries = loadItinerariesFromStorage();
  return itineraries.length > 0;
}

/**
 * マイグレーション状態をLocalStorageに保存
 */
export function saveMigrationStatus(status: 'pending' | 'completed' | 'failed'): void {
  if (typeof window === 'undefined') {
    return;
  }

  const migrationStatus = {
    status,
    timestamp: new Date().toISOString(),
  };

  window.localStorage.setItem('journee_migration_status', JSON.stringify(migrationStatus));
}

/**
 * マイグレーション状態を取得
 */
export function getMigrationStatus(): { status: string; timestamp: string } | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const statusStr = window.localStorage.getItem('journee_migration_status');
  if (!statusStr) {
    return null;
  }

  try {
    return JSON.parse(statusStr);
  } catch {
    return null;
  }
}

/**
 * マイグレーション状態をクリア
 */
export function clearMigrationStatus(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem('journee_migration_status');
}
