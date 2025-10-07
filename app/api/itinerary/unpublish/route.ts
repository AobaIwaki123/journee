import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

/**
 * Phase 5.5: しおりを非公開にする
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

    // しおりの所有権チェック（Phase 8以降でデータベースから取得）
    // const itinerary = await db.getItinerary(itineraryId, user.id);
    // if (!itinerary) {
    //   return NextResponse.json(
    //     { error: 'しおりが見つかりません' },
    //     { status: 404 }
    //   );
    // }

    // Phase 8以降: データベースで非公開に更新
    // await db.updateItinerary(itineraryId, {
    //   isPublic: false,
    //   publicSlug: null,
    //   publishedAt: null,
    //   updatedAt: new Date(),
    // });

    // Phase 5-7: LocalStorageでの管理（クライアント側で処理）
    // ここではサクセスレスポンスを返すのみ

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
