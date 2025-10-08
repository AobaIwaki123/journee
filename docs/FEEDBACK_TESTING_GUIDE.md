# フィードバックシステム - テストガイド

このドキュメントでは、フィードバックシステムの動作確認手順を説明します。

## 前提条件

- Node.js 18+ がインストールされている
- プロジェクトの依存関係がインストールされている
- 環境変数が正しく設定されている

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install @octokit/rest
```

### 2. 環境変数の設定

`.env.local` ファイルに以下を追加:

```env
# 既存の環境変数
GOOGLE_API_KEY=your_google_api_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# 新規追加: GitHub統合
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_OWNER=your-github-username
GITHUB_REPO=journee
```

#### GitHub Personal Access Tokenの作成

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)" をクリック
3. 必要な権限を選択:
   - ✅ `repo` (リポジトリへのフルアクセス)
4. トークンを生成してコピー
5. `.env.local` の `GITHUB_TOKEN` に設定

### 3. 開発サーバーの起動

```bash
npm run dev
```

## テストシナリオ

### テスト1: ヘルスチェック

APIが正常に動作しているか確認します。

**手順:**

```bash
curl http://localhost:3000/api/feedback
```

**期待される出力:**

```json
{
  "status": "ok",
  "timestamp": "2025-10-08T...",
  "services": {
    "github": {
      "status": "connected (your-username/journee)"
    },
    "llm": {
      "status": "configured",
      "model": "gemini-2.0-flash-exp"
    },
    "rateLimit": {
      "enabled": true,
      "limits": {
        "limit": 5,
        "window": 3600000
      },
      "status": {
        "requests": 0,
        "remaining": 5,
        "limit": 5
      }
    }
  },
  "environment": "development"
}
```

**トラブルシューティング:**

- `github.status` が `error` の場合:
  - GITHUB_TOKEN が正しく設定されているか確認
  - トークンの権限を確認
  - GITHUB_OWNER と GITHUB_REPO が正しいか確認

- `llm.status` が `not_configured` の場合:
  - GOOGLE_API_KEY が設定されているか確認

### テスト2: バグ報告の送信

**手順:**

```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "category": "bug",
    "title": "テスト: ログインボタンが反応しない",
    "description": "これはテストです。\n\n再現手順:\n1. ログインページを開く\n2. ログインボタンをクリック\n3. 何も起こらない\n\n期待される動作: ログインフォームが表示される\n実際の動作: 何も起こらない",
    "email": "test@example.com",
    "context": {
      "url": "http://localhost:3000/login",
      "userAgent": "Test Agent",
      "timestamp": "2025-10-08T12:00:00Z"
    }
  }'
```

**期待される出力:**

```json
{
  "success": true,
  "issueNumber": 123,
  "issueUrl": "https://github.com/your-username/journee/issues/123",
  "remaining": 4
}
```

**確認事項:**

1. GitHub Issues に新しいIssueが作成されているか
2. Issueのタイトルが適切に整形されているか
3. Issueの本文が構造化されているか
4. ラベルが付与されているか（`bug`, `user-feedback`, `🤖 auto-generated`）

### テスト3: 機能リクエストの送信

**手順:**

```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "category": "feature",
    "title": "テスト: ダークモード対応",
    "description": "ダークモードに対応してほしいです。\n\n夜間に使用すると目が疲れます。",
    "context": {
      "url": "http://localhost:3000",
      "userAgent": "Test Agent",
      "timestamp": "2025-10-08T12:00:00Z"
    }
  }'
```

**確認事項:**

1. カテゴリが `feature` のIssueが作成されているか
2. 適切なラベルが付与されているか

### テスト4: バリデーションエラー

**手順:**

```bash
# タイトルが短すぎる場合
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "category": "bug",
    "title": "テスト",
    "description": "これは説明です"
  }'
```

**期待される出力:**

```json
{
  "success": false,
  "error": "バリデーションエラー",
  "details": [
    {
      "field": "title",
      "message": "タイトルは5文字以上必要です"
    }
  ]
}
```

### テスト5: レート制限

**手順:**

同じリクエストを6回連続で送信:

```bash
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/feedback \
    -H "Content-Type: application/json" \
    -d '{
      "category": "other",
      "title": "テストリクエスト '$i'",
      "description": "これはレート制限のテストです。"
    }'
  echo ""
done
```

**期待される動作:**

- 1-5回目: 成功（`success: true`）
- 6回目: エラー（`status: 429`, レート制限メッセージ）

### テスト6: UIテスト

#### ブラウザでのテスト

1. **ヘッダーボタンのテスト**
   - http://localhost:3000 を開く
   - ヘッダーの「フィードバック」ボタンをクリック
   - モーダルが開くことを確認

2. **カテゴリ選択のテスト**
   - 各カテゴリボタンをクリック
   - 選択したカテゴリがハイライトされることを確認

3. **フォーム入力のテスト**
   - タイトル: 「テスト: UIからの送信」
   - 説明: 「ブラウザからフィードバックを送信しています。」
   - メール: 「test@example.com」（オプション）
   - 「送信する」ボタンをクリック

4. **成功画面の確認**
   - 成功メッセージが表示される
   - GitHub Issueへのリンクが表示される
   - 残り送信回数が表示される
   - 3秒後に自動的にモーダルが閉じる

5. **エラーハンドリングのテスト**
   - タイトルを3文字で入力して送信
   - バリデーションエラーが表示されることを確認

6. **ドラフト保存のテスト**
   - フォームに入力
   - モーダルを閉じる
   - 再度モーダルを開く
   - 入力内容が復元されることを確認

### テスト7: フローティングボタンのテスト

**注意:** 現在、フローティングボタンはまだ統合されていません。

統合する場合は `app/page.tsx` または `app/layout.tsx` に追加:

```typescript
import FeedbackButton from '@/components/ui/FeedbackButton';

// ページコンポーネント内
<FeedbackButton position="floating" />
```

## 自動テストの実装（オプション）

### Unit Tests

```typescript
// __tests__/feedback.test.ts
import { describe, it, expect } from '@jest/globals';
import { processFeedbackWithLLM } from '@/lib/ai/feedback-prompts';
import type { FeedbackInput } from '@/types/feedback';

describe('Feedback Processing', () => {
  it('should process feedback with LLM', async () => {
    const feedback: FeedbackInput = {
      category: 'bug',
      title: 'テストバグ',
      description: 'これはテストです。'
    };

    const processed = await processFeedbackWithLLM(feedback);

    expect(processed.original).toEqual(feedback);
    expect(processed.structured.category).toBeDefined();
    expect(processed.structured.priority).toBeDefined();
    expect(processed.structured.title).toBeDefined();
    expect(processed.structured.body).toBeDefined();
  });
});
```

### E2E Tests

```typescript
// e2e/feedback.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Feedback System', () => {
  test('should open feedback modal', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    await page.click('button:has-text("フィードバック")');
    
    await expect(page.locator('text=フィードバックを送信')).toBeVisible();
  });

  test('should submit feedback', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    await page.click('button:has-text("フィードバック")');
    
    await page.click('button:has-text("バグ報告")');
    await page.fill('input[id="title"]', 'テスト: E2Eテスト');
    await page.fill('textarea[id="description"]', 'これはE2Eテストです。');
    
    await page.click('button:has-text("送信する")');
    
    await expect(page.locator('text=フィードバックを送信しました！')).toBeVisible();
  });
});
```

## トラブルシューティング

### 問題1: GitHub APIエラー

**症状:**
```json
{
  "success": false,
  "error": "GitHub認証に失敗しました。GITHUB_TOKENを確認してください。"
}
```

**解決策:**
1. GITHUB_TOKEN が正しく設定されているか確認
2. トークンの権限（repo）を確認
3. トークンが有効期限切れでないか確認

### 問題2: LLM処理エラー

**症状:**
```json
{
  "success": false,
  "error": "フィードバックの処理中にエラーが発生しました。"
}
```

**解決策:**
1. GOOGLE_API_KEY が正しく設定されているか確認
2. APIキーの使用制限を確認
3. フォールバック処理が動作しているか確認（コンソールログ）

### 問題3: レート制限が機能しない

**症状:**
6回以上リクエストを送信しても制限されない

**解決策:**
1. 開発サーバーを再起動
2. メモリベースのレート制限なので、サーバー再起動でリセットされる
3. 本番環境ではRedisやUpstashを使用することを推奨

### 問題4: モーダルが表示されない

**症状:**
フィードバックボタンをクリックしても何も起こらない

**解決策:**
1. ブラウザのコンソールでエラーを確認
2. FeedbackModalコンポーネントがインポートされているか確認
3. z-indexが他の要素より高いか確認（z-50）

## パフォーマンステスト

### 同時リクエストのテスト

```bash
# 10個の同時リクエストを送信
for i in {1..10}; do
  (curl -X POST http://localhost:3000/api/feedback \
    -H "Content-Type: application/json" \
    -d '{
      "category": "other",
      "title": "並列テスト '$i'",
      "description": "これは並列処理のテストです。"
    }' &)
done
wait
```

**期待される動作:**
- レート制限により、5つのリクエストのみが成功
- 残りはエラー（429）

## チェックリスト

実装完了後、以下を確認してください:

- [ ] ヘルスチェックが成功する
- [ ] バグ報告が正常に送信される
- [ ] 機能リクエストが正常に送信される
- [ ] GitHub Issueが正しく作成される
- [ ] バリデーションエラーが正しく表示される
- [ ] レート制限が機能する
- [ ] UIモーダルが正常に動作する
- [ ] カテゴリ選択が機能する
- [ ] フォームバリデーションが機能する
- [ ] 成功画面が表示される
- [ ] エラー画面が表示される
- [ ] ドラフト保存が機能する
- [ ] Escapeキーでモーダルが閉じる
- [ ] 送信中はモーダルが閉じられない

## 本番環境へのデプロイ前チェック

- [ ] 環境変数がVercelに設定されている
- [ ] GITHUB_TOKENが本番用に更新されている
- [ ] レート制限が適切に設定されている
- [ ] エラーログが適切に記録されている
- [ ] プライバシーポリシーが更新されている

---

**作成日**: 2025-10-08
**最終更新**: 2025-10-08
