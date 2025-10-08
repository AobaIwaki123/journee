import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { migrateItinerariesToDatabase } from '@/lib/db/migration';

/**
 * Phase 8.3: データマイグレーションAPI
 * 
 * POST /api/migration/start
 * 
 * LocalStorageからSupabaseへしおりデータを移行します。
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`Starting migration for user ${user.id}`);

    // マイグレーション実行
    const result = await migrateItinerariesToDatabase(user.id);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'マイグレーションが部分的に失敗しました',
          migratedCount: result.migratedCount,
          failedCount: result.failedCount,
          errors: result.errors,
        },
        { status: 207 } // Multi-Status
      );
    }

    return NextResponse.json({
      success: true,
      message: `${result.migratedCount}件のしおりを移行しました`,
      migratedCount: result.migratedCount,
      failedCount: result.failedCount,
    });
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { error: 'Migration failed' },
      { status: 500 }
    );
  }
}
