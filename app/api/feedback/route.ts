/**
 * フィードバックAPI
 * POST: フィードバックを受信してGitHub Issueを作成
 * GET: ヘルスチェック
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  rateLimit, 
  DEFAULT_RATE_LIMITS, 
  generateRateLimitHeaders, 
  generateRateLimitMessage,
  generateIdentifier 
} from '@/lib/utils/rate-limit';
import { processFeedbackWithLLM } from '@/lib/ai/feedback-prompts';
import { GitHubIssueClient } from '@/lib/github/client';
import { generateIssueBody } from '@/lib/github/issue-template';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

// バリデーションスキーマ
const feedbackSchema = z.object({
  category: z.enum(['bug', 'feature', 'ui-ux', 'performance', 'content', 'other'], {
    errorMap: () => ({ message: '有効なカテゴリを選択してください' })
  }),
  title: z.string()
    .min(5, 'タイトルは5文字以上必要です')
    .max(200, 'タイトルは200文字以内にしてください'),
  description: z.string()
    .min(10, '説明は10文字以上必要です')
    .max(5000, '説明は5000文字以内にしてください'),
  email: z.string()
    .email('有効なメールアドレスを入力してください')
    .optional()
    .or(z.literal('')),
  context: z.object({
    url: z.string(),
    userAgent: z.string(),
    timestamp: z.string(),
    userId: z.string().optional(),
    currentItinerary: z.string().optional(),
    viewport: z.object({
      width: z.number(),
      height: z.number()
    }).optional()
  }).optional()
});

/**
 * POST /api/feedback
 * フィードバックを送信
 */
export async function POST(request: NextRequest) {
  try {
    // セッション取得（認証済みユーザーの場合）
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // レート制限チェック
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               request.ip;
    const identifier = generateIdentifier(ip, userId);
    
    const rateLimitResult = await rateLimit.check(
      identifier, 
      DEFAULT_RATE_LIMITS.feedback
    );

    // レート制限ヘッダーを設定
    const rateLimitHeaders = generateRateLimitHeaders(rateLimitResult);

    if (!rateLimitResult.success) {
      const message = generateRateLimitMessage(rateLimitResult);
      
      return NextResponse.json(
        { 
          success: false, 
          error: message
        },
        { 
          status: 429,
          headers: rateLimitHeaders
        }
      );
    }

    // リクエストボディの取得
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: '無効なJSONフォーマットです'
        },
        { status: 400 }
      );
    }

    // バリデーション
    let feedback;
    try {
      feedback = feedbackSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'バリデーションエラー', 
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // コンテキストにユーザーIDを追加
    if (feedback.context && userId) {
      feedback.context.userId = userId;
    }

    console.log('[Feedback] Processing feedback:', {
      category: feedback.category,
      title: feedback.title,
      userId: userId || 'anonymous',
      identifier
    });

    // LLMでフィードバックを処理
    let processed;
    try {
      processed = await processFeedbackWithLLM(feedback);
      console.log('[Feedback] LLM processing complete:', {
        category: processed.structured.category,
        priority: processed.structured.priority,
        labels: processed.structured.labels
      });
    } catch (error) {
      console.error('[Feedback] LLM processing error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'フィードバックの処理中にエラーが発生しました。しばらくしてから再度お試しください。'
        },
        { 
          status: 500,
          headers: rateLimitHeaders
        }
      );
    }

    // GitHub Issueを作成
    let issue;
    try {
      const githubClient = new GitHubIssueClient();
      const issueBody = generateIssueBody(processed);
      
      issue = await githubClient.createIssue({
        title: processed.structured.title,
        body: issueBody,
        labels: [...processed.structured.labels, '🤖 auto-generated']
      });

      console.log('[Feedback] GitHub issue created:', {
        number: issue.number,
        url: issue.url
      });

    } catch (error: any) {
      console.error('[Feedback] GitHub issue creation error:', error);
      
      // GitHub APIエラーの場合でもフィードバック自体は受け付けた扱いにする
      // （後で手動でIssueを作成できるように）
      return NextResponse.json(
        { 
          success: false, 
          error: 'GitHub Issueの作成に失敗しました。フィードバックは記録されましたが、後ほど手動で対応します。',
          details: error.message
        },
        { 
          status: 500,
          headers: rateLimitHeaders
        }
      );
    }

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      issueNumber: issue.number,
      issueUrl: issue.url,
      remaining: rateLimitResult.remaining
    }, {
      headers: rateLimitHeaders
    });

  } catch (error: any) {
    console.error('[Feedback] Unexpected error:', error);

    return NextResponse.json(
      { 
        success: false, 
        error: '予期しないエラーが発生しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/feedback
 * ヘルスチェック
 */
export async function GET(request: NextRequest) {
  try {
    // GitHub接続チェック
    let githubStatus = 'unknown';
    let githubError: string | undefined;

    try {
      const githubClient = new GitHubIssueClient();
      const isConnected = await githubClient.checkConnection();
      githubStatus = isConnected ? 'connected' : 'disconnected';
      
      if (isConnected) {
        const repoInfo = await githubClient.getRepositoryInfo();
        if (repoInfo) {
          githubStatus = `connected (${repoInfo.fullName})`;
        }
      }
    } catch (error: any) {
      githubStatus = 'error';
      githubError = error.message;
    }

    // LLM接続チェック
    const llmStatus = process.env.GOOGLE_API_KEY ? 'configured' : 'not_configured';

    // レート制限統計
    const testIdentifier = 'health-check';
    const rateLimitStatus = rateLimit.getStatus(
      testIdentifier, 
      DEFAULT_RATE_LIMITS.feedback
    );

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        github: {
          status: githubStatus,
          error: githubError
        },
        llm: {
          status: llmStatus,
          model: 'gemini-2.0-flash-exp'
        },
        rateLimit: {
          enabled: true,
          limits: DEFAULT_RATE_LIMITS.feedback,
          status: rateLimitStatus
        }
      },
      environment: process.env.NODE_ENV
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
