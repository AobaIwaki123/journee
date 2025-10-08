import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import type { ItineraryData } from '@/types/itinerary';
import { itineraryRepository } from '@/lib/db/itinerary-repository';

/**
 * Phase 8.3: しおり保存API（Database版）
 * 
 * POST /api/itinerary/save
 * 
 * Supabaseデータベースを使用した実装。
 * 既存のしおりは更新、新規のしおりは追加する。
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

    // リクエストボディからしおりデータを取得
    const body = await request.json();
    const itinerary: ItineraryData = body.itinerary;

    if (!itinerary || !itinerary.id) {
      return NextResponse.json(
        { error: 'Invalid itinerary data' },
        { status: 400 }
      );
    }

    // ユーザーIDを設定
    const itineraryWithUser: ItineraryData = {
      ...itinerary,
      userId: user.id,
      updatedAt: new Date(),
    };

    // 既存のしおりかチェック
    const existing = await itineraryRepository.getItinerary(itinerary.id, user.id);

    let savedItinerary: ItineraryData;

    if (existing) {
      // 既存のしおりを更新
      savedItinerary = await itineraryRepository.updateItinerary(
        itinerary.id,
        user.id,
        itineraryWithUser
      );
    } else {
      // 新規しおりを追加
      savedItinerary = await itineraryRepository.createItinerary(user.id, itineraryWithUser);
    }

    return NextResponse.json({
      success: true,
      itinerary: savedItinerary,
      message: existing ? 'しおりを更新しました' : 'しおりを保存しました',
    });
  } catch (error) {
    console.error('Failed to save itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to save itinerary' },
      { status: 500 }
    );
  }
}
