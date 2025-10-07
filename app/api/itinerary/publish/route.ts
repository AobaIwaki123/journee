import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getCurrentUser } from '@/lib/auth/session';
import { PublicItinerarySettings } from '@/types/itinerary';

/**
 * Phase 5.5: しおりを公開してURLを発行
 * POST /api/itinerary/publish
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
    const { itineraryId, settings } = body as {
      itineraryId: string;
      settings: PublicItinerarySettings;
    };

    // バリデーション
    if (!itineraryId) {
      return NextResponse.json(
        { error: 'しおりIDが必要です' },
        { status: 400 }
      );
    }

    if (typeof settings?.isPublic !== 'boolean') {
      return NextResponse.json(
        { error: '公開設定が不正です' },
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

    // ユニークなスラッグ生成（10文字、URL-safe）
    const slug = nanoid(10);

    // Phase 8以降: データベースに保存
    // await db.updateItinerary(itineraryId, {
    //   isPublic: settings.isPublic,
    //   publicSlug: slug,
    //   publishedAt: new Date(),
    //   allowPdfDownload: settings.allowPdfDownload ?? true,
    //   customMessage: settings.customMessage,
    //   updatedAt: new Date(),
    // });

    // Phase 5-7: LocalStorageでの管理（クライアント側で処理）
    // ここではスラッグを生成して返すのみ

    const publicUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${slug}`;
    const publishedAt = new Date();

    return NextResponse.json({
      success: true,
      publicUrl,
      slug,
      publishedAt: publishedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error publishing itinerary:', error);
    return NextResponse.json(
      { error: '公開に失敗しました' },
      { status: 500 }
    );
  }
}
