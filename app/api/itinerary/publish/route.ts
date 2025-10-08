import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getCurrentUser } from "@/lib/auth/session";
import { PublicItinerarySettings, ItineraryData } from "@/types/itinerary";
import { itineraryRepository } from "@/lib/db/itinerary-repository";

/**
 * Phase 8.3: しおりを公開してURLを発行（Database版）
 * POST /api/itinerary/publish
 */
export async function POST(req: NextRequest) {
  console.log("[DEBUG] POST /api/itinerary/publish - Start");
  try {
    // 認証チェック
    const user = await getCurrentUser();
    console.log("[DEBUG] User:", user ? `ID: ${user.id}` : "No user");
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await req.json();
    console.log("[DEBUG] Request body:", JSON.stringify(body, null, 2));
    const {
      itineraryId,
      settings,
      itinerary: itineraryData,
    } = body as {
      itineraryId: string;
      settings: PublicItinerarySettings;
      itinerary?: ItineraryData;
    };

    // バリデーション
    if (!itineraryId) {
      console.log("[DEBUG] Error: No itineraryId provided");
      return NextResponse.json(
        { error: "しおりIDが必要です" },
        { status: 400 }
      );
    }

    if (typeof settings?.isPublic !== "boolean") {
      return NextResponse.json(
        { error: "公開設定が不正です" },
        { status: 400 }
      );
    }

    // しおりの存在確認
    console.log(
      "[DEBUG] Fetching itinerary:",
      itineraryId,
      "for user:",
      user.id
    );
    let itinerary = await itineraryRepository.getItinerary(
      itineraryId,
      user.id
    );
    console.log("[DEBUG] Itinerary found:", itinerary ? "Yes" : "No");

    // しおりが存在しない場合は、リクエストボディから作成
    if (!itinerary) {
      console.log(
        "[DEBUG] Itinerary not found in database, attempting to create from request data"
      );

      if (!itineraryData) {
        console.log("[DEBUG] Error: No itinerary data provided for creation");
        return NextResponse.json(
          { error: "しおりが見つかりません。しおりデータを含めてください。" },
          { status: 404 }
        );
      }

      // しおりを新規作成
      console.log("[DEBUG] Creating new itinerary:", itineraryData.id);
      const itineraryWithUser: ItineraryData = {
        ...itineraryData,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      itinerary = await itineraryRepository.createItinerary(
        user.id,
        itineraryWithUser
      );
      console.log("[DEBUG] Itinerary created successfully");
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

    const publicUrl = `${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/share/${slug}`;

    return NextResponse.json({
      success: true,
      publicUrl,
      slug,
      publishedAt: publishedAt.toISOString(),
    });
  } catch (error) {
    console.error("[DEBUG] Error publishing itinerary:", error);
    console.error(
      "[DEBUG] Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return NextResponse.json(
      {
        error: "公開に失敗しました",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
