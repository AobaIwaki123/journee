import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { itineraryRepository } from '@/lib/db/itinerary-repository';

/**
 * Phase 8.3: しおりを非公開にする（Database版）
 * POST /api/itinerary/unpublish
 */
export async function POST(req: NextRequest) {
  try {
    // 認証チェック
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { itineraryId } = body as { itineraryId: string };

    // バリデーション
    if (!itineraryId) {
      return NextResponse.json(
        { error: 'しおりIDが必要です' },
        { status: 400 }
      );
    }

    // しおりの所有権チェック
    const itinerary = await itineraryRepository.getItinerary(itineraryId, user.id);
    if (!itinerary) {
      return NextResponse.json(
        { error: 'しおりが見つかりません' },
        { status: 404 }
      );
    }

    // データベースで非公開に更新
    await itineraryRepository.updateItinerary(itineraryId, user.id, {
      isPublic: false,
      publicSlug: undefined,
      publishedAt: undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'しおりを非公開にしました',
    });
  } catch (error) {
    console.error('Error unpublishing itinerary:', error);
    return NextResponse.json(
      { error: '非公開化に失敗しました' },
      { status: 500 }
    );
  }
}
