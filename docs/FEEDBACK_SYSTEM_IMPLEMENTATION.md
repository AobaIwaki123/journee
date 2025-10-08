# ユーザーフィードバックシステム実装計画

## 概要

ユーザーからのフィードバックを収集し、LLMで構造化してGitHub Issueとして自動作成するシステムの実装計画。

## 目的

1. **ユーザー体験の向上**: ユーザーが簡単にフィードバックを送信できる
2. **効率的な課題管理**: フィードバックを自動的にGitHub Issueに変換
3. **インテリジェントな分類**: LLMによる自動カテゴリ分類と優先度推定

## システムアーキテクチャ

```
User Input → FeedbackModal → API Endpoint → LLM Processing → GitHub Issue Creation
                                    ↓
                               Rate Limiting
                               Validation
                               Security Check
```

## 実装計画

### Phase 1: 型定義とインターフェース設計

#### 1.1 型定義 (`types/feedback.ts`)

```typescript
// フィードバックカテゴリ
export type FeedbackCategory = 
  | 'bug'           // バグ報告
  | 'feature'       // 機能リクエスト
  | 'ui-ux'         // UI/UX改善
  | 'performance'   // パフォーマンス
  | 'content'       // コンテンツ（プロンプト、テキスト）
  | 'other';        // その他

// フィードバック優先度（LLMが推定）
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

// フィードバック入力データ
export interface FeedbackInput {
  category: FeedbackCategory;
  title: string;
  description: string;
  email?: string;                    // オプション：連絡先
  context?: {
    url: string;                     // フィードバック時のURL
    userAgent: string;               // ブラウザ情報
    timestamp: string;               // タイムスタンプ
    userId?: string;                 // ユーザーID（認証済みの場合）
    currentItinerary?: string;       // 現在のしおりデータ（JSON）
  };
}

// LLM処理後のフィードバック
export interface ProcessedFeedback {
  original: FeedbackInput;
  structured: {
    category: FeedbackCategory;
    priority: FeedbackPriority;
    labels: string[];                // GitHub ラベル
    title: string;                   // 整形されたタイトル
    body: string;                    // 整形された本文
    estimatedEffort?: string;        // 推定工数
    suggestedSolution?: string;      // 提案される解決策
  };
}

// GitHub Issue テンプレート
export interface GitHubIssuePayload {
  title: string;
  body: string;
  labels: string[];
  assignees?: string[];
}

// API レスポンス
export interface FeedbackResponse {
  success: boolean;
  issueNumber?: number;
  issueUrl?: string;
  error?: string;
}
```

### Phase 2: UIコンポーネント実装

#### 2.1 フィードバックボタン (`components/ui/FeedbackButton.tsx`)

**配置場所**: ヘッダーの右端、またはフローティングボタン

**機能**:
- クリックでモーダルを開く
- フィードバック中/成功/失敗の状態表示
- アニメーション効果

```typescript
interface FeedbackButtonProps {
  position?: 'header' | 'floating';
  className?: string;
}
```

#### 2.2 フィードバックモーダル (`components/ui/FeedbackModal.tsx`)

**機能**:
- カテゴリ選択（アイコン付き）
- タイトル入力（必須）
- 詳細説明入力（必須、マルチライン）
- メールアドレス入力（オプション）
- 現在のコンテキスト情報を自動収集
- プレビュー機能
- 送信ボタン
- キャンセルボタン

**バリデーション**:
- タイトル: 5文字以上、200文字以下
- 説明: 10文字以上、5000文字以下
- メール: 有効な形式（提供された場合）

**UX考慮**:
- フォーム入力中のドラフト保存（LocalStorage）
- 送信中のローディング表示
- 成功時のアニメーション
- エラー時のリトライオプション

### Phase 3: LLM統合ロジック

#### 3.1 フィードバックプロンプト処理 (`lib/ai/feedback-prompts.ts`)

**機能**:
- ユーザーフィードバックをGitHub Issue形式に変換
- カテゴリと優先度の推定
- 適切なラベルの付与
- タイトルと本文の整形

**プロンプトテンプレート**:

```typescript
export const FEEDBACK_PROCESSING_PROMPT = `
あなたはソフトウェア開発プロジェクトのプロダクトマネージャーです。
ユーザーからのフィードバックを受け取り、GitHub Issueとして適切に整形してください。

# タスク
1. フィードバックの内容を分析
2. カテゴリと優先度を判定
3. 適切なGitHub Issue形式に変換
4. 開発者が理解しやすいように構造化

# 入力フォーマット
- カテゴリ: {category}
- タイトル: {title}
- 詳細: {description}
- コンテキスト: {context}

# 出力要件
- カテゴリの妥当性を確認（必要に応じて修正）
- 優先度を判定: low/medium/high/critical
- GitHub ラベルを提案（最大5つ）
- タイトルを簡潔に整形（50文字以内）
- 本文を構造化:
  ## 概要
  ## 再現手順（バグの場合）
  ## 期待される動作
  ## 実際の動作
  ## 提案（あれば）
  ## 追加情報

# 出力形式
必ずJSON形式で出力してください:
{
  "category": "bug|feature|ui-ux|performance|content|other",
  "priority": "low|medium|high|critical",
  "labels": ["label1", "label2"],
  "title": "整形されたタイトル",
  "body": "整形された本文（Markdown形式）",
  "estimatedEffort": "工数の推定（オプション）",
  "suggestedSolution": "提案される解決策（オプション）"
}
`;
```

**実装**:

```typescript
export async function processFeedbackWithLLM(
  feedback: FeedbackInput
): Promise<ProcessedFeedback> {
  // Gemini APIを使用してフィードバックを処理
  const response = await gemini.generateContent({
    prompt: formatPrompt(FEEDBACK_PROCESSING_PROMPT, feedback),
    systemInstruction: "You are a product manager analyzing user feedback.",
  });
  
  // レスポンスをパース
  const structured = parseJSONResponse(response);
  
  return {
    original: feedback,
    structured
  };
}
```

### Phase 4: GitHub API統合

#### 4.1 GitHub クライアント (`lib/github/client.ts`)

**依存関係**:
```bash
npm install @octokit/rest
```

**環境変数**:
```
GITHUB_TOKEN=ghp_xxx...           # Personal Access Token
GITHUB_OWNER=your-username        # リポジトリオーナー
GITHUB_REPO=journee               # リポジトリ名
```

**実装**:

```typescript
import { Octokit } from '@octokit/rest';

export class GitHubIssueClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    this.owner = process.env.GITHUB_OWNER!;
    this.repo = process.env.GITHUB_REPO!;
  }

  async createIssue(payload: GitHubIssuePayload): Promise<{
    number: number;
    url: string;
  }> {
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
  }
}
```

#### 4.2 Issue テンプレート生成 (`lib/github/issue-template.ts`)

```typescript
export function generateIssueBody(
  feedback: ProcessedFeedback
): string {
  const { original, structured } = feedback;
  
  return `
## フィードバック情報

**カテゴリ**: ${structured.category}
**優先度**: ${structured.priority}
**報告日時**: ${original.context?.timestamp}

---

${structured.body}

---

## コンテキスト情報

- **URL**: ${original.context?.url}
- **ユーザーエージェント**: ${original.context?.userAgent}
- **ユーザーID**: ${original.context?.userId || '未認証'}
${original.email ? `- **連絡先**: ${original.email}` : ''}

${structured.suggestedSolution ? `
## 提案される解決策

${structured.suggestedSolution}
` : ''}

${structured.estimatedEffort ? `
## 推定工数

${structured.estimatedEffort}
` : ''}

---

*このIssueはユーザーフィードバックシステムにより自動生成されました。*
`;
}
```

### Phase 5: APIエンドポイント実装

#### 5.1 フィードバックAPI (`app/api/feedback/route.ts`)

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
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  email: z.string().email().optional(),
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
    const identifier = request.ip || 'anonymous';
    const { success, remaining } = await rateLimit.check(identifier, {
      limit: 5,        // 5回まで
      window: 3600000  // 1時間
    });

    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'レート制限に達しました。1時間後に再度お試しください。' 
        },
        { status: 429 }
      );
    }

    // リクエストボディの取得とバリデーション
    const body = await request.json();
    const feedback = feedbackSchema.parse(body);

    // LLMでフィードバックを処理
    const processed = await processFeedbackWithLLM(feedback);

    // GitHub Issueを作成
    const githubClient = new GitHubIssueClient();
    const issueBody = generateIssueBody(processed);
    const issue = await githubClient.createIssue({
      title: processed.structured.title,
      body: issueBody,
      labels: processed.structured.labels
    });

    return NextResponse.json({
      success: true,
      issueNumber: issue.number,
      issueUrl: issue.url,
      remaining
    });

  } catch (error) {
    console.error('Feedback processing error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: '内部サーバーエラー' },
      { status: 500 }
    );
  }
}
```

### Phase 6: セキュリティとレート制限

#### 6.1 レート制限実装 (`lib/utils/rate-limit.ts`)

```typescript
interface RateLimitConfig {
  limit: number;    // 許可される最大リクエスト数
  window: number;   // 時間枠（ミリ秒）
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

  // 定期的なクリーンアップ
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
setInterval(() => rateLimit.cleanup(), 3600000);
```

#### 6.2 セキュリティ対策

1. **入力サニタイゼーション**
   - XSS対策: HTMLタグのエスケープ
   - SQLインジェクション対策: Zodバリデーション

2. **個人情報保護**
   - メールアドレスは暗号化して保存（必要な場合）
   - しおりデータは最小限の情報のみ送信
   - ユーザーIDの匿名化オプション

3. **スパム対策**
   - レート制限
   - CAPTCHA統合（オプション）
   - 同一内容の連続送信検出

4. **APIキーの保護**
   - GitHub Tokenはサーバーサイドでのみ使用
   - 環境変数での管理
   - トークンの定期的なローテーション

### Phase 7: 統合とテスト

#### 7.1 コンポーネント統合

**ヘッダーに統合** (`components/layout/Header.tsx`):

```typescript
import FeedbackButton from '@/components/ui/FeedbackButton';

// ヘッダー内に追加
<div className="flex items-center gap-4">
  <FeedbackButton position="header" />
  <UserMenu />
</div>
```

**フローティングボタンとして追加** (オプション):

```typescript
// app/layout.tsx または app/page.tsx
<FeedbackButton position="floating" />
```

#### 7.2 テストシナリオ

**手動テスト**:
1. フィードバックボタンのクリック
2. 各カテゴリでのフィードバック送信
3. バリデーションエラーの確認
4. レート制限の動作確認
5. GitHub Issueの作成確認

**自動テスト**:
```typescript
// __tests__/feedback.test.ts
describe('Feedback System', () => {
  it('should validate feedback input', () => {});
  it('should process feedback with LLM', () => {});
  it('should create GitHub issue', () => {});
  it('should enforce rate limits', () => {});
});
```

## 実装スケジュール

| フェーズ | タスク | 推定時間 |
|---------|-------|---------|
| Phase 1 | 型定義とインターフェース | 1-2時間 |
| Phase 2 | UIコンポーネント | 3-4時間 |
| Phase 3 | LLM統合 | 2-3時間 |
| Phase 4 | GitHub API統合 | 2-3時間 |
| Phase 5 | APIエンドポイント | 2-3時間 |
| Phase 6 | セキュリティとレート制限 | 2-3時間 |
| Phase 7 | 統合とテスト | 2-3時間 |
| **合計** | | **14-21時間** |

## 依存パッケージ

```json
{
  "dependencies": {
    "@octokit/rest": "^20.0.0",
    "zod": "^3.22.0"
  }
}
```

## 環境変数設定

```env
# GitHub統合
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_OWNER=your-username
GITHUB_REPO=journee

# Gemini API（既存）
GOOGLE_API_KEY=xxxxx
```

## GitHub Token権限設定

必要な権限（Scopes）:
- `repo` - リポジトリへのフルアクセス
  - `repo:status` - コミットステータスへのアクセス
  - `repo_deployment` - デプロイメントステータスへのアクセス
  - `public_repo` - パブリックリポジトリへのアクセス
  - `repo:invite` - コラボレーター招待
- `write:discussion` - ディスカッションの書き込み（オプション）

## 今後の拡張

### フェーズ2の機能
1. **フィードバック管理ダッシュボード**
   - 管理者用のフィードバック一覧
   - ステータス管理（処理中、完了、却下）
   - 統計情報の表示

2. **通知機能**
   - Issue作成時の通知
   - 処理完了時のユーザーへの通知（メール提供時）

3. **投票機能**
   - 他のユーザーのフィードバックへの賛同
   - 人気のある機能リクエストの可視化

4. **スクリーンショット添付**
   - 画面キャプチャ機能
   - 画像アップロード

5. **AI分析の強化**
   - 重複フィードバックの検出
   - 関連Issueの提案
   - トレンド分析

## 注意事項

1. **プライバシー**
   - ユーザーのしおりデータは最小限のみ送信
   - 個人を特定できる情報の慎重な取り扱い
   - GDPR/個人情報保護法への準拠

2. **コスト**
   - LLM API使用量の監視
   - GitHub APIのレート制限（5000リクエスト/時）
   - 必要に応じてキャッシング戦略の実装

3. **メンテナンス**
   - GitHub Tokenの定期的な更新
   - Issueテンプレートの改善
   - プロンプトの継続的な最適化

## 参考資料

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [Octokit.js Documentation](https://octokit.github.io/rest.js/)
- [Google Gemini API](https://ai.google.dev/docs)
- [Zod Documentation](https://zod.dev/)

---

**更新日**: 2025-10-08
**バージョン**: 1.0
**ステータス**: 設計フェーズ
