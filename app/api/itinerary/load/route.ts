import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getItineraryById } from '@/lib/mock-data/itineraries';

/**
 * Phase 5.2: しおり読込API（モック版）
 * 
 * GET /api/itinerary/load?id={itineraryId}
 * 
 * LocalStorageを使用したモック実装。
 * 指定されたIDのしおりを取得する。
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

    // クエリパラメータからIDを取得
    const searchParams = request.nextUrl.searchParams;
    const itineraryId = searchParams.get('id');

    if (!itineraryId) {
      return NextResponse.json(
        { error: 'Itinerary ID is required' },
        { status: 400 }
      );
    }

    // しおりを取得
    const itinerary = getItineraryById(itineraryId);

    if (!itinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      );
    }

    // ユーザー権限チェック（自分のしおりのみ取得可能）
    if (itinerary.userId && itinerary.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      itinerary,
    });
  } catch (error) {
    console.error('Failed to load itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to load itinerary' },
      { status: 500 }
    );
  }
}
