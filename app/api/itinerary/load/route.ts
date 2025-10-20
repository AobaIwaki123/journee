import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { itineraryRepository } from "@/lib/db/itinerary-repository";
import { getChatHistory } from "@/lib/db/chat-repository"; // 追加

/**
 * Phase 8.3: しおり読込API（Database版）
 *
 * GET /api/itinerary/load?id={itineraryId}
 *
 * Supabaseデータベースを使用した実装。
 * 指定されたIDのしおりを取得する。
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // クエリパラメータからIDを取得
    const searchParams = request.nextUrl.searchParams;
    const itineraryId = searchParams.get("id");

    if (!itineraryId) {
      return NextResponse.json(
        { error: "Itinerary ID is required" },
        { status: 400 }
      );
    }

    // しおりを取得（RLSで自動的に権限チェックされる）
    const itinerary = await itineraryRepository.getItinerary(
      itineraryId,
      user.id
    );

    if (!itinerary) {
      return NextResponse.json(
        { error: "Itinerary not found" },
        { status: 404 }
      );
    }

    console.log(
      `[Load API] Loaded itinerary ${itineraryId} with ${itinerary.schedule.length} days`
    );

    // チャット履歴を取得
    const { messages: chatMessages } = await getChatHistory(itineraryId);

    return NextResponse.json({
      success: true,
      itinerary,
      messages: chatMessages,
    });
  } catch (error) {
    console.error("Failed to load itinerary:", error);
    return NextResponse.json(
      { error: "Failed to load itinerary" },
      { status: 500 }
    );
  }
}
