/**
 * コメント報告API（Phase 11）
 * POST /api/itinerary/[id]/comments/[commentId]/report - コメント報告
 */

import { NextRequest, NextResponse } from "next/server";
import { commentRepository } from "@/lib/db/comment-repository";

/**
 * POST /api/itinerary/[id]/comments/[commentId]/report
 * コメントをスパム・不適切として報告
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const body = await request.json();
    const { reason } = body;

    // コメントが存在するか確認
    const comment = await commentRepository.getComment(params.commentId);

    if (!comment) {
      return NextResponse.json(
        { error: "コメントが見つかりません" },
        { status: 404 }
      );
    }

    // すでに報告されているか確認
    if (comment.isReported) {
      return NextResponse.json(
        { error: "このコメントは既に報告されています" },
        { status: 400 }
      );
    }

    // コメントを報告
    await commentRepository.reportComment(params.commentId);

    // TODO: 管理者への通知処理
    console.log(`Comment reported: ${params.commentId}, reason: ${reason || "未指定"}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to report comment:", error);
    const message =
      error instanceof Error ? error.message : "コメントの報告に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
