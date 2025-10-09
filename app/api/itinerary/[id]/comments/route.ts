/**
 * コメントAPI（Phase 11）
 * GET /api/itinerary/[id]/comments - コメント一覧取得
 * POST /api/itinerary/[id]/comments - コメント投稿
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { commentRepository } from "@/lib/db/comment-repository";
import { itineraryRepository } from "@/lib/db/itinerary-repository";

/**
 * GET /api/itinerary/[id]/comments
 * コメント一覧取得（ページネーション対応）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const sortOrder = (searchParams.get("sortOrder") || "desc") as
      | "asc"
      | "desc";

    // バリデーション
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "limitは1〜100の範囲で指定してください" },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: "offsetは0以上で指定してください" },
        { status: 400 }
      );
    }

    // しおりが公開されているか確認
    const itinerary = await itineraryRepository.getPublicItinerary(params.id);
    
    if (!itinerary) {
      return NextResponse.json(
        { error: "公開しおりが見つかりません" },
        { status: 404 }
      );
    }

    // コメント一覧を取得
    const result = await commentRepository.listComments(
      {
        itineraryId: itinerary.id!,
        sortBy: "created_at",
        sortOrder,
      },
      {
        limit,
        offset,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { error: "コメントの取得に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/itinerary/[id]/comments
 * コメント投稿（認証ユーザー・匿名両対応）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const { content, isAnonymous, authorName } = body;

    // バリデーション
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "コメント内容を入力してください" },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: "コメントは500文字以内で入力してください" },
        { status: 400 }
      );
    }

    if (isAnonymous && (!authorName || authorName.trim().length === 0)) {
      return NextResponse.json(
        { error: "匿名投稿の場合は名前を入力してください" },
        { status: 400 }
      );
    }

    // しおりが公開されているか確認
    const itinerary = await itineraryRepository.getPublicItinerary(params.id);
    
    if (!itinerary) {
      return NextResponse.json(
        { error: "公開しおりが見つかりません" },
        { status: 404 }
      );
    }

    // レート制限（簡易版）
    // TODO: Redis等を使った本格的なレート制限実装
    // 現在は1分に3回までの制限をクライアント側で実装

    // コメントを作成
    const comment = await commentRepository.createComment(
      {
        itineraryId: itinerary.id!,
        content: content.trim(),
        isAnonymous: isAnonymous || false,
        authorName: isAnonymous ? authorName : session?.user?.name || undefined,
      },
      session?.user?.id
    );

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Failed to create comment:", error);
    const message =
      error instanceof Error ? error.message : "コメントの投稿に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
