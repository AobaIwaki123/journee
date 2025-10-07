import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import type { ItineraryData } from '@/types/itinerary';
import {
  loadItinerariesFromStorage,
  saveItinerariesToStorage,
  updateItinerary,
  addItinerary,
} from '@/lib/mock-data/itineraries';

/**
 * Phase 5.2: しおり保存API（モック版）
 * 
 * POST /api/itinerary/save
 * 
 * LocalStorageを使用したモック実装。
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

    // しおり一覧を取得
    const itineraries = loadItinerariesFromStorage();
    const existingIndex = itineraries.findIndex((item) => item.id === itinerary.id);

    if (existingIndex !== -1) {
      // 既存のしおりを更新
      updateItinerary(itinerary.id, itineraryWithUser);
    } else {
      // 新規しおりを追加
      addItinerary(itineraryWithUser);
    }

    return NextResponse.json({
      success: true,
      itinerary: itineraryWithUser,
      message: existingIndex !== -1 ? 'しおりを更新しました' : 'しおりを保存しました',
    });
  } catch (error) {
    console.error('Failed to save itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to save itinerary' },
      { status: 500 }
    );
  }
}
