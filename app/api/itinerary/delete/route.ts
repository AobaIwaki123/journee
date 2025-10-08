import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { itineraryRepository } from '@/lib/db/itinerary-repository';

/**
 * Phase 8.3: しおり削除API（Database版）
 * 
 * DELETE /api/itinerary/delete?id={itineraryId}
 * 
 * Supabaseデータベースを使用した実装。
 * 指定されたIDのしおりを削除する（カスケード削除で関連データも削除）。
 */
export async function DELETE(request: NextRequest) {
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

    // しおりを削除（RLSで自動的に権限チェックされる）
    const success = await itineraryRepository.deleteItinerary(itineraryId, user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete itinerary' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'しおりを削除しました',
    });
  } catch (error) {
    console.error('Failed to delete itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to delete itinerary' },
      { status: 500 }
    );
  }
}
