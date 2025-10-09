/**
 * フィードバックAPIエンドポイント
 * ユーザーフィードバックをGitHub Issueとして登録
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { createGitHubIssue, generateFeedbackTemplate, isGitHubConfigured } from '@/lib/utils/github-client';
import {
  FeedbackSubmission,
  FeedbackResponse,
  FEEDBACK_LABELS,
  FEEDBACK_CATEGORY_LABELS,
} from '@/types/feedback';

/**
 * レート制限を管理するMap（簡易実装）
 * 本番環境ではRedisなどを使用すること
 */
const rateLimitMap = new Map<string, number[]>();

/**
 * レート制限をチェックする
 * @param identifier - ユーザーID または IPアドレス
 * @param limit - 制限回数
 * @param windowMs - 時間ウィンドウ（ミリ秒）
 * @returns 制限内であればtrue
 */
function checkRateLimit(
  identifier: string,
  limit: number = 3,
  windowMs: number = 60000 // 1分
): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier) || [];
  
  // 古いタイムスタンプを削除
  const recentTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < windowMs
  );

  if (recentTimestamps.length >= limit) {
    return false;
  }

  recentTimestamps.push(now);
  rateLimitMap.set(identifier, recentTimestamps);

  return true;
}

/**
 * POST /api/feedback
 * フィードバックを送信する
 */
export async function POST(request: NextRequest): Promise<NextResponse<FeedbackResponse>> {
  try {
    // GitHub APIが設定されているかチェック
    if (!isGitHubConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'フィードバック機能は現在利用できません。管理者に連絡してください。',
        },
        { status: 503 }
      );
    }

    // セッション取得（オプション）
    const session = await getServerSession(authOptions);

    // リクエストボディのパース
    const body: FeedbackSubmission = await request.json();

    // バリデーション
    if (!body.category || !body.title || !body.description) {
      return NextResponse.json(
        {
          success: false,
          error: '必須項目が不足しています。',
        },
        { status: 400 }
      );
    }

    // タイトルと説明の長さチェック
    if (body.title.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'タイトルは100文字以内で入力してください。',
        },
        { status: 400 }
      );
    }

    if (body.description.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: '詳細は2000文字以内で入力してください。',
        },
        { status: 400 }
      );
    }

    // レート制限チェック
    const identifier = session?.user?.id || request.ip || 'anonymous';
    if (!checkRateLimit(identifier, 3, 60000)) {
      return NextResponse.json(
        {
          success: false,
          error: '送信回数が制限を超えています。しばらく待ってから再度お試しください。',
        },
        { status: 429 }
      );
    }

    // GitHub Issue作成
    const categoryLabel = FEEDBACK_CATEGORY_LABELS[body.category];
    const issueTitle = `[${categoryLabel}] ${body.title}`;

    const issueBody = generateFeedbackTemplate({
      category: categoryLabel,
      description: body.description,
      userEmail: session?.user?.email || body.userEmail,
      userName: session?.user?.name || body.userName,
      userAgent: body.userAgent,
      url: body.url,
    });

    const labels = ['feedback', FEEDBACK_LABELS[body.category]];

    const issue = await createGitHubIssue({
      title: issueTitle,
      body: issueBody,
      labels,
    });

    // 成功レスポンス
    return NextResponse.json(
      {
        success: true,
        issueUrl: issue.html_url,
        issueNumber: issue.number,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Feedback submission error:', error);

    // エラーレスポンス
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'フィードバックの送信に失敗しました。',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/feedback
 * フィードバック機能の状態を取得
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    configured: isGitHubConfigured(),
    message: isGitHubConfigured()
      ? 'Feedback system is operational'
      : 'Feedback system is not configured',
  });
}
