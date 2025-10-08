import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getCurrentUser } from '@/lib/auth/session';
import { PublicItinerarySettings } from '@/types/itinerary';
import { itineraryRepository } from '@/lib/db/itinerary-repository';

/**
 * Phase 8.3: しおりを公開してURLを発行（Database版）
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

    // しおりの所有権チェック
    const itinerary = await itineraryRepository.getItinerary(itineraryId, user.id);
    if (!itinerary) {
      return NextResponse.json(
        { error: 'しおりが見つかりません' },
        { status: 404 }
      );
    }

    // ユニークなスラッグ生成（10文字、URL-safe）
    const slug = itinerary.publicSlug || nanoid(10);
    const publishedAt = new Date();

    // データベースに保存
    await itineraryRepository.updateItinerary(itineraryId, user.id, {
      isPublic: settings.isPublic,
      publicSlug: slug,
      publishedAt,
      allowPdfDownload: settings.allowPdfDownload ?? true,
      customMessage: settings.customMessage,
    });

    const publicUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${slug}`;

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
