import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import type { ItineraryData } from "@/types/itinerary";
import { itineraryRepository } from "@/lib/db/itinerary-repository";

// UUID検証ヘルパー関数
function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Phase 8.3: しおり保存API（Database版）
 *
 * POST /api/itinerary/save
 *
 * Supabaseデータベースを使用した実装。
 *
 * 保存モード:
 * - overwrite: 既存のしおりを更新（デフォルト）
 * - new: 新規のしおりとして保存（既存のしおりがあっても新規作成）
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // リクエストボディからしおりデータと保存モードを取得
    const body = await request.json();
    const itinerary: ItineraryData = body.itinerary;
    const saveMode: "overwrite" | "new" = body.saveMode || "overwrite";

    if (!itinerary) {
      return NextResponse.json(
        { error: "Invalid itinerary data" },
        { status: 400 }
      );
    }

    // IDが無効またはモックIDの場合、新しいUUIDを生成
    if (!itinerary.id || !isValidUUID(itinerary.id)) {
      itinerary.id = crypto.randomUUID();
    }

    // ユーザーIDを設定
    const itineraryWithUser: ItineraryData = {
      ...itinerary,
      userId: user.id,
      updatedAt: new Date(),
    };

    let savedItinerary: ItineraryData;
    let message: string;

    if (saveMode === "new") {
      // 新規保存モード: 常に新しいしおりとして作成
      // 新規保存の場合は新しいIDを強制生成
      itineraryWithUser.id = crypto.randomUUID();
      savedItinerary = await itineraryRepository.createItinerary(
        user.id,
        itineraryWithUser
      );
      message = "新規しおりとして保存しました";
    } else {
      // 上書き保存モード: 既存のしおりがあれば更新、なければ新規作成
      const existing = await itineraryRepository.getItinerary(
        itinerary.id,
        user.id
      );

      if (existing) {
        // 既存のしおりを更新
        savedItinerary = await itineraryRepository.updateItinerary(
          itinerary.id,
          user.id,
          itineraryWithUser
        );
        message = "しおりを更新しました";
      } else {
        // 新規しおりを追加
        savedItinerary = await itineraryRepository.createItinerary(
          user.id,
          itineraryWithUser
        );
        message = "しおりを保存しました";
      }
    }

    return NextResponse.json({
      success: true,
      itinerary: savedItinerary,
      message,
    });
  } catch (error) {
    console.error("Failed to save itinerary:", error);
    return NextResponse.json(
      { error: "Failed to save itinerary" },
      { status: 500 }
    );
  }
}
