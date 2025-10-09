/**
 * 個別コメントAPI（Phase 11）
 * DELETE /api/itinerary/[id]/comments/[commentId] - コメント削除
 * PATCH /api/itinerary/[id]/comments/[commentId] - コメント更新
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { commentRepository } from "@/lib/db/comment-repository";

/**
 * DELETE /api/itinerary/[id]/comments/[commentId]
 * コメント削除（自分のコメントのみ）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    // コメントを削除
    await commentRepository.deleteComment(
      params.commentId,
      session.user.id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete comment:", error);
    const message =
      error instanceof Error ? error.message : "コメントの削除に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/itinerary/[id]/comments/[commentId]
 * コメント更新（自分のコメントのみ）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content } = body;

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

    // コメントを更新
    const comment = await commentRepository.updateComment(
      params.commentId,
      session.user.id,
      { content: content.trim() }
    );

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Failed to update comment:", error);
    const message =
      error instanceof Error ? error.message : "コメントの更新に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
