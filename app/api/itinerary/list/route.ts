import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { loadItinerariesFromStorage } from '@/lib/mock-data/itineraries';

/**
 * Phase 5.2: しおり一覧取得API（モック版）
 * 
 * GET /api/itinerary/list
 * 
 * LocalStorageを使用したモック実装。
 * ユーザーのしおり一覧を取得する。
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // しおり一覧を取得
    const allItineraries = loadItinerariesFromStorage();
    
    // ユーザーのしおりのみフィルタリング
    const userItineraries = allItineraries.filter(
      (itinerary) => !itinerary.userId || itinerary.userId === user.id
    );

    return NextResponse.json({
      success: true,
      itineraries: userItineraries,
      total: userItineraries.length,
    });
  } catch (error) {
    console.error('Failed to load itineraries:', error);
    return NextResponse.json(
      { error: 'Failed to load itineraries' },
      { status: 500 }
    );
  }
}
