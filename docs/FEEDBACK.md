# フィードバック機能ドキュメント

## 概要

Journeeアプリケーションのフィードバック機能は、ユーザーからのバグ報告、機能要望、その他の問い合わせを自動的にGitHub Issueとして登録します。

**実装フェーズ**: Phase 12  
**最終更新**: 2025-10-09

---

## 機能一覧

### ✅ 実装済み

- **フィードバック送信フォーム**
  - カテゴリー選択（バグ報告/機能要望/その他）
  - タイトル入力（最大100文字）
  - 詳細説明入力（最大2000文字）
  - ユーザー情報の自動付与（認証時）

- **GitHub Issue自動作成**
  - フィードバック内容をGitHub Issueとして登録
  - カテゴリーに応じたラベルの自動付与
  - ユーザー情報・環境情報の自動記録

- **レート制限**
  - ユーザーごとに1分間に3回まで送信可能
  - スパム対策の実装

- **UI統合**
  - デスクトップ版: ヘッダーにフィードバックボタン
  - モバイル版: ハンバーガーメニューにフィードバック項目
  - モーダルUIによる快適な入力体験

---

## セットアップ

### 1. GitHub Personal Access Tokenの取得

フィードバック機能を有効にするには、GitHub Personal Access Token（PAT）が必要です。

#### 手順

1. GitHubにログイン
2. **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. **Generate new token (classic)** をクリック
4. トークンの設定:
   - **Note**: `Journee Feedback Integration`
   - **Expiration**: `No expiration` または適切な期限
   - **Scopes**: `repo` にチェック（リポジトリへのフルアクセス）
5. **Generate token** をクリック
6. 生成されたトークンをコピー（**一度しか表示されません**）

#### 権限について

必要な権限:
- `repo` - Issueの作成・編集に必要

### 2. 環境変数の設定

`.env.local` ファイルに以下の環境変数を追加してください:

```bash
# GitHub Feedback Integration
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=your-github-username
GITHUB_REPO=journee
```

- `GITHUB_TOKEN`: 手順1で取得したPersonal Access Token
- `GITHUB_OWNER`: GitHubのユーザー名または組織名
- `GITHUB_REPO`: リポジトリ名（デフォルト: `journee`）

### 3. アプリケーションの再起動

環境変数を設定した後、開発サーバーを再起動してください:

```bash
npm run dev
```

---

## 使い方

### ユーザー側の操作

1. **フィードバックボタンをクリック**
   - デスクトップ: ヘッダーの「フィードバック」ボタン
   - モバイル: ハンバーガーメニューの「フィードバック」項目

2. **カテゴリーを選択**
   - 🐛 **バグ報告**: アプリの不具合を報告
   - 💡 **機能要望**: 新機能のリクエスト
   - ❓ **その他**: 質問やその他のフィードバック

3. **内容を入力**
   - **タイトル**: 簡潔な要約（最大100文字）
   - **詳細**: 詳しい説明（最大2000文字）

4. **送信**
   - 「送信」ボタンをクリック
   - 成功すると、GitHub IssueのURLが表示されます

### 送信されるデータ

以下の情報が自動的に記録されます:

- **カテゴリー**: 選択したカテゴリー
- **タイトル・詳細**: ユーザーが入力した内容
- **送信者情報**: ユーザー名・メールアドレス（認証時のみ）
- **環境情報**:
  - User Agent（ブラウザ情報）
  - URL（フィードバック送信時のページURL）
  - 日時（日本時間）

---

## APIエンドポイント

### `POST /api/feedback`

フィードバックを送信し、GitHub Issueを作成します。

#### リクエストボディ

```typescript
{
  category: 'bug' | 'enhancement' | 'question',
  title: string,          // 最大100文字
  description: string,    // 最大2000文字
  userEmail?: string,     // オプション
  userName?: string,      // オプション
  userAgent?: string,     // オプション
  url?: string            // オプション
}
```

#### レスポンス

**成功時 (201):**

```json
{
  "success": true,
  "issueUrl": "https://github.com/owner/repo/issues/123",
  "issueNumber": 123
}
```

**エラー時 (4xx/5xx):**

```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```

#### エラーコード

- `400 Bad Request`: 入力値が不正
- `429 Too Many Requests`: レート制限超過
- `500 Internal Server Error`: サーバーエラー
- `503 Service Unavailable`: GitHub API未設定

### `GET /api/feedback`

フィードバック機能の状態を取得します。

#### レスポンス

```json
{
  "configured": true,
  "message": "Feedback system is operational"
}
```

---

## GitHub Issueのフォーマット

### タイトル

```
[カテゴリー] ユーザーが入力したタイトル
```

例:
- `[バグ報告] ログインボタンが動作しない`
- `[機能要望] PDFエクスポート時のカスタマイズ機能`

### 本文

```markdown
## フィードバック

**カテゴリ**: バグ報告  
**送信者**: 田中太郎 (taro@example.com)  
**日時**: 2025/10/9 10:30:00

### 内容

[ユーザーが入力した詳細]

---

### 環境情報

- User Agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...`
- URL: https://journee-app.com/

---

_このIssueはJourneeアプリのフィードバック機能から自動生成されました。_
```

### ラベル

以下のラベルが自動的に付与されます:

- `feedback` - すべてのフィードバックに付与
- `bug` - バグ報告
- `enhancement` - 機能要望
- `question` - その他

---

## セキュリティとプライバシー

### レート制限

スパム対策として、以下のレート制限を実装しています:

- **制限**: ユーザーごとに1分間に3回まで
- **識別**: セッションユーザーID、またはIPアドレス
- **エラー**: 制限超過時は `429 Too Many Requests` を返す

### データの取り扱い

- **認証ユーザー**: ユーザー名とメールアドレスが自動的に記録されます
- **匿名ユーザー**: 「匿名ユーザー」として記録されます
- **環境情報**: ブラウザ情報とURLが記録されます（デバッグ用）

### プライバシーポリシー

フィードバック機能の使用前に、ユーザーに以下を通知することを推奨します:

- フィードバック内容が公開リポジトリのGitHub Issueとして登録されること
- 送信されるデータの種類（ユーザー情報、環境情報）
- データの用途（バグ修正、機能改善）

---

## トラブルシューティング

### フィードバックボタンが表示されない

**原因**: UIコンポーネントが正しくインポートされていない

**解決策**:
1. `components/layout/Header.tsx` を確認
2. `FeedbackModal` がインポートされているか確認
3. ブラウザのキャッシュをクリア

### 送信時に「利用できません」エラー

**原因**: GitHub APIが設定されていない

**解決策**:
1. `.env.local` に環境変数が設定されているか確認
2. `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO` が正しいか確認
3. 開発サーバーを再起動

### レート制限エラー

**原因**: 1分間に3回以上送信している

**解決策**:
- 1分間待ってから再度送信してください
- 本番環境では、Redisなどを使用してレート制限を管理することを推奨

### GitHub Issue作成エラー

**原因**: Personal Access Tokenの権限不足

**解決策**:
1. GitHubのトークン設定を確認
2. `repo` スコープが有効か確認
3. トークンが有効期限切れでないか確認
4. リポジトリへのアクセス権限があるか確認

---

## カスタマイズ

### カテゴリーの追加

`types/feedback.ts` を編集:

```typescript
export type FeedbackCategory = 'bug' | 'enhancement' | 'question' | 'new-category';

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'バグ報告',
  enhancement: '機能要望',
  question: 'その他',
  'new-category': '新カテゴリー',
};
```

### レート制限の変更

`app/api/feedback/route.ts` を編集:

```typescript
// 1分間に5回まで
if (!checkRateLimit(identifier, 5, 60000)) {
  // ...
}
```

### Issueテンプレートのカスタマイズ

`lib/utils/github-client.ts` の `generateFeedbackTemplate` 関数を編集してください。

---

## テスト

### 手動テスト

1. フィードバックボタンをクリック
2. 各カテゴリーを選択してフィードバックを送信
3. GitHubリポジトリでIssueが作成されたか確認

### E2Eテスト（オプション）

```typescript
// e2e/feedback.spec.ts
import { test, expect } from '@playwright/test';

test('フィードバック送信', async ({ page }) => {
  await page.goto('/');
  await page.click('text=フィードバック');
  await page.click('text=バグ報告');
  await page.fill('input[id="feedback-title"]', 'テストバグ');
  await page.fill('textarea[id="feedback-description"]', 'これはテストです');
  await page.click('button:has-text("送信")');
  await expect(page.locator('text=送信完了')).toBeVisible();
});
```

---

## 今後の改善案

### Phase 12.3: スクリーンショット添付（オプション）

- ユーザーがスクリーンショットを添付できる機能
- 画像をBase64エンコードしてIssue本文に埋め込み

### Phase 12.4: リアルタイム通知

- フィードバック送信時にSlack通知
- 管理者にメール通知

### Phase 12.5: フィードバック履歴

- ユーザーが自分の送信したフィードバックを確認できる機能
- `/mypage/feedback` ページの実装

---

## 関連ドキュメント

- [GitHub REST API - Issues](https://docs.github.com/en/rest/issues/issues)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [PLAN.md - Phase 12](./PLAN.md#phase-12-フィードバック機能)

---

**最終更新**: 2025-10-09  
**担当**: Journee Development Team