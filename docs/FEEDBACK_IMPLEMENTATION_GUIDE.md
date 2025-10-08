# フィードバックシステム実装ガイド

## ステップバイステップ実装手順

このガイドでは、フィードバックシステムを段階的に実装する具体的な手順を説明します。

## 前提条件

- Node.js 18+
- Next.js 14+
- TypeScript
- 既存のJourneeプロジェクト環境

## Step 1: 依存パッケージのインストール

```bash
npm install @octokit/rest
npm install zod  # 既にインストール済みの場合はスキップ
```

## Step 2: 環境変数の設定

### 2.1 GitHub Personal Access Tokenの作成

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)" をクリック
3. 必要な権限を選択:
   - `repo` (リポジトリへのフルアクセス)
4. トークンを生成してコピー

### 2.2 .env.local の更新

```env
# 既存の環境変数
GOOGLE_API_KEY=xxxxx
NEXTAUTH_SECRET=xxxxx
NEXTAUTH_URL=http://localhost:3000

# 新規追加: GitHub統合
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_OWNER=your-github-username
GITHUB_REPO=journee
```

### 2.3 .env.example の更新

```env
# GitHub統合（フィードバックシステム用）
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_repo_name
```

## Step 3: 型定義の作成

### 3.1 `types/feedback.ts` を作成

```typescript
// フィードバックカテゴリ
export type FeedbackCategory = 
  | 'bug'
  | 'feature'
  | 'ui-ux'
  | 'performance'
  | 'content'
  | 'other';

export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

export interface FeedbackInput {
  category: FeedbackCategory;
  title: string;
  description: string;
  email?: string;
  context?: {
    url: string;
    userAgent: string;
    timestamp: string;
    userId?: string;
    currentItinerary?: string;
  };
}

export interface ProcessedFeedback {
  original: FeedbackInput;
  structured: {
    category: FeedbackCategory;
    priority: FeedbackPriority;
    labels: string[];
    title: string;
    body: string;
    estimatedEffort?: string;
    suggestedSolution?: string;
  };
}

export interface GitHubIssuePayload {
  title: string;
  body: string;
  labels: string[];
  assignees?: string[];
}

export interface FeedbackResponse {
  success: boolean;
  issueNumber?: number;
  issueUrl?: string;
  remaining?: number;
  error?: string;
}

// カテゴリメタデータ
export interface CategoryMetadata {
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const CATEGORY_METADATA: Record<FeedbackCategory, CategoryMetadata> = {
  bug: {
    label: 'バグ報告',
    description: '動作がおかしい、エラーが出る',
    icon: 'Bug',
    color: 'text-red-500'
  },
  feature: {
    label: '機能リクエスト',
    description: '新しい機能の提案',
    icon: 'Lightbulb',
    color: 'text-yellow-500'
  },
  'ui-ux': {
    label: 'UI/UX改善',
    description: '使いにくい、わかりにくい',
    icon: 'Palette',
    color: 'text-purple-500'
  },
  performance: {
    label: 'パフォーマンス',
    description: '遅い、重い',
    icon: 'Zap',
    color: 'text-orange-500'
  },
  content: {
    label: 'コンテンツ',
    description: 'AIの応答、テキストの改善',
    icon: 'FileText',
    color: 'text-blue-500'
  },
  other: {
    label: 'その他',
    description: '上記に当てはまらない',
    icon: 'MoreHorizontal',
    color: 'text-gray-500'
  }
};
```

## Step 4: LLM統合の実装

### 4.1 `lib/ai/feedback-prompts.ts` を作成

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FeedbackInput, ProcessedFeedback } from '@/types/feedback';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const FEEDBACK_PROCESSING_PROMPT = `
あなたはソフトウェア開発プロジェクトのプロダクトマネージャーです。
ユーザーからのフィードバックを受け取り、GitHub Issueとして適切に整形してください。

# タスク
1. フィードバックの内容を分析
2. カテゴリと優先度を判定
3. 適切なGitHub Issue形式に変換
4. 開発者が理解しやすいように構造化

# 出力形式
必ずJSON形式で出力してください。JSON以外の文字は含めないでください:
{
  "category": "bug|feature|ui-ux|performance|content|other",
  "priority": "low|medium|high|critical",
  "labels": ["label1", "label2"],
  "title": "整形されたタイトル（50文字以内）",
  "body": "整形された本文（Markdown形式）",
  "estimatedEffort": "工数の推定（オプション）",
  "suggestedSolution": "提案される解決策（オプション）"
}

# 入力情報
カテゴリ: {category}
タイトル: {title}
詳細: {description}
URL: {url}
ユーザーID: {userId}
`;

export async function processFeedbackWithLLM(
  feedback: FeedbackInput
): Promise<ProcessedFeedback> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = FEEDBACK_PROCESSING_PROMPT
      .replace('{category}', feedback.category)
      .replace('{title}', feedback.title)
      .replace('{description}', feedback.description)
      .replace('{url}', feedback.context?.url || 'N/A')
      .replace('{userId}', feedback.context?.userId || '未認証');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSONをパース
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSONレスポンスが見つかりません');
    }

    const structured = JSON.parse(jsonMatch[0]);

    return {
      original: feedback,
      structured
    };
  } catch (error) {
    console.error('LLM processing error:', error);
    
    // フォールバック: 基本的な構造化
    return {
      original: feedback,
      structured: {
        category: feedback.category,
        priority: 'medium',
        labels: [feedback.category, 'user-feedback'],
        title: feedback.title,
        body: feedback.description,
      }
    };
  }
}
```

## Step 5: GitHub API統合の実装

### 5.1 `lib/github/client.ts` を作成

```typescript
import { Octokit } from '@octokit/rest';
import type { GitHubIssuePayload } from '@/types/feedback';

export class GitHubIssueClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor() {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN is not set');
    }
    if (!process.env.GITHUB_OWNER) {
      throw new Error('GITHUB_OWNER is not set');
    }
    if (!process.env.GITHUB_REPO) {
      throw new Error('GITHUB_REPO is not set');
    }

    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    this.owner = process.env.GITHUB_OWNER;
    this.repo = process.env.GITHUB_REPO;
  }

  async createIssue(payload: GitHubIssuePayload): Promise<{
    number: number;
    url: string;
  }> {
    try {
      const response = await this.octokit.rest.issues.create({
        owner: this.owner,
        repo: this.repo,
        title: payload.title,
        body: payload.body,
        labels: payload.labels,
        assignees: payload.assignees
      });

      return {
        number: response.data.number,
        url: response.data.html_url
      };
    } catch (error) {
      console.error('GitHub API error:', error);
      throw new Error('GitHub Issueの作成に失敗しました');
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo
      });
      return true;
    } catch (error) {
      console.error('GitHub connection error:', error);
      return false;
    }
  }
}
```

### 5.2 `lib/github/issue-template.ts` を作成

```typescript
import type { ProcessedFeedback } from '@/types/feedback';

export function generateIssueBody(feedback: ProcessedFeedback): string {
  const { original, structured } = feedback;
  
  return `
## 📋 フィードバック情報

**カテゴリ**: ${structured.category}
**優先度**: ${structured.priority}
**報告日時**: ${original.context?.timestamp || new Date().toISOString()}

---

${structured.body}

---

## 🔍 コンテキスト情報

- **URL**: ${original.context?.url || 'N/A'}
- **ユーザーエージェント**: ${original.context?.userAgent || 'N/A'}
- **ユーザーID**: ${original.context?.userId || '未認証'}
${original.email ? `- **連絡先**: ${original.email}` : ''}

${structured.suggestedSolution ? `
## 💡 提案される解決策

${structured.suggestedSolution}
` : ''}

${structured.estimatedEffort ? `
## ⏱️ 推定工数

${structured.estimatedEffort}
` : ''}

---

> *このIssueはユーザーフィードバックシステムにより自動生成されました。*
> *フィードバックを送信してくださったユーザーに感謝します！*
`;
}
```

## Step 6: レート制限の実装

### 6.1 `lib/utils/rate-limit.ts` を作成

```typescript
interface RateLimitConfig {
  limit: number;
  window: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

class RateLimiter {
  private requests = new Map<string, number[]>();

  async check(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - config.window;

    // 古いリクエストを削除
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);

    // リクエスト数チェック
    if (recentRequests.length >= config.limit) {
      return {
        success: false,
        remaining: 0,
        reset: recentRequests[0] + config.window
      };
    }

    // 新しいリクエストを記録
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return {
      success: true,
      remaining: config.limit - recentRequests.length,
      reset: now + config.window
    };
  }

  cleanup() {
    const now = Date.now();
    for (const [identifier, requests] of this.requests.entries()) {
      const recent = requests.filter(time => time > now - 3600000);
      if (recent.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recent);
      }
    }
  }
}

export const rateLimit = new RateLimiter();

// 1時間ごとにクリーンアップ
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimit.cleanup(), 3600000);
}
```

## Step 7: APIエンドポイントの実装

### 7.1 `app/api/feedback/route.ts` を作成

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/utils/rate-limit';
import { processFeedbackWithLLM } from '@/lib/ai/feedback-prompts';
import { GitHubIssueClient } from '@/lib/github/client';
import { generateIssueBody } from '@/lib/github/issue-template';

// バリデーションスキーマ
const feedbackSchema = z.object({
  category: z.enum(['bug', 'feature', 'ui-ux', 'performance', 'content', 'other']),
  title: z.string().min(5, 'タイトルは5文字以上必要です').max(200, 'タイトルは200文字以内にしてください'),
  description: z.string().min(10, '説明は10文字以上必要です').max(5000, '説明は5000文字以内にしてください'),
  email: z.string().email('有効なメールアドレスを入力してください').optional().or(z.literal('')),
  context: z.object({
    url: z.string(),
    userAgent: z.string(),
    timestamp: z.string(),
    userId: z.string().optional(),
    currentItinerary: z.string().optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    // レート制限チェック
    const identifier = request.headers.get('x-forwarded-for') || request.ip || 'anonymous';
    const { success, remaining, reset } = await rateLimit.check(identifier, {
      limit: 5,        // 5回まで
      window: 3600000  // 1時間
    });

    if (!success) {
      const resetDate = new Date(reset);
      return NextResponse.json(
        { 
          success: false, 
          error: `レート制限に達しました。${resetDate.toLocaleTimeString('ja-JP')}以降に再度お試しください。`
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toString()
          }
        }
      );
    }

    // リクエストボディの取得とバリデーション
    const body = await request.json();
    const feedback = feedbackSchema.parse(body);

    // LLMでフィードバックを処理
    console.log('Processing feedback with LLM...');
    const processed = await processFeedbackWithLLM(feedback);

    // GitHub Issueを作成
    console.log('Creating GitHub issue...');
    const githubClient = new GitHubIssueClient();
    const issueBody = generateIssueBody(processed);
    const issue = await githubClient.createIssue({
      title: processed.structured.title,
      body: issueBody,
      labels: [...processed.structured.labels, '🤖 auto-generated']
    });

    console.log(`GitHub issue created: #${issue.number}`);

    return NextResponse.json({
      success: true,
      issueNumber: issue.number,
      issueUrl: issue.url,
      remaining
    }, {
      headers: {
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': remaining.toString()
      }
    });

  } catch (error) {
    console.error('Feedback processing error:', error);

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

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '内部サーバーエラーが発生しました'
      },
      { status: 500 }
    );
  }
}

// ヘルスチェック
export async function GET() {
  try {
    const githubClient = new GitHubIssueClient();
    const isConnected = await githubClient.checkConnection();

    return NextResponse.json({
      status: 'ok',
      github: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

## Step 8: UIコンポーネントの実装

### 8.1 `components/ui/FeedbackButton.tsx` を作成

```typescript
'use client';

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

interface FeedbackButtonProps {
  position?: 'header' | 'floating';
  className?: string;
}

export default function FeedbackButton({ 
  position = 'header',
  className = '' 
}: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const buttonClasses = position === 'floating'
    ? 'fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110'
    : 'flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors';

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`${buttonClasses} ${className}`}
        title="フィードバックを送信"
      >
        <MessageSquarePlus className="w-5 h-5" />
        {position === 'header' && <span>フィードバック</span>}
      </button>

      <FeedbackModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
```

### 8.2 `components/ui/FeedbackModal.tsx` を作成

この部分は長くなるため、別のファイルとして実装してください。主な機能：

- カテゴリ選択UI
- フォーム入力
- バリデーション
- 送信処理
- 成功/エラー表示

詳細は次のステップで提供します。

## Step 9: ヘッダーへの統合

### 9.1 `components/layout/Header.tsx` を更新

```typescript
import FeedbackButton from '@/components/ui/FeedbackButton';

// ヘッダーのナビゲーション部分に追加
<div className="flex items-center gap-4">
  <FeedbackButton position="header" />
  <UserMenu />
</div>
```

## Step 10: テストとデバッグ

### 10.1 GitHub接続のテスト

```bash
curl http://localhost:3000/api/feedback
```

期待される出力:
```json
{
  "status": "ok",
  "github": "connected",
  "timestamp": "2025-10-08T..."
}
```

### 10.2 フィードバック送信のテスト

```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "category": "bug",
    "title": "テストフィードバック",
    "description": "これはテストです。実際の問題ではありません。",
    "context": {
      "url": "http://localhost:3000",
      "userAgent": "Test Agent",
      "timestamp": "2025-10-08T12:00:00Z"
    }
  }'
```

## トラブルシューティング

### 問題1: GitHub APIエラー

**エラー**: `Bad credentials`
**解決策**: 
- GITHUB_TOKENが正しく設定されているか確認
- トークンの権限（scope）を確認

### 問題2: レート制限エラー

**エラー**: `429 Too Many Requests`
**解決策**:
- 1時間待つ
- または、レート制限の設定を調整（開発環境のみ）

### 問題3: LLM処理エラー

**エラー**: `JSON parse error`
**解決策**:
- プロンプトを調整
- フォールバック処理が動作することを確認

## ベストプラクティス

1. **環境変数の管理**
   - 本番環境ではVercel環境変数を使用
   - GitHub Tokenは定期的にローテーション

2. **エラーハンドリング**
   - すべてのエラーをログに記録
   - ユーザーにはフレンドリーなメッセージを表示

3. **セキュリティ**
   - レート制限を必ず実装
   - 個人情報の取り扱いに注意

4. **パフォーマンス**
   - LLM処理は非同期で実行
   - タイムアウトを設定（30秒推奨）

## 次のステップ

- [ ] フィードバックモーダルの完全な実装
- [ ] スクリーンショット機能の追加
- [ ] 管理者ダッシュボードの作成
- [ ] 通知機能の実装
- [ ] 投票機能の追加

---

**作成日**: 2025-10-08
**最終更新**: 2025-10-08
