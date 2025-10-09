# フィードバック機能ドキュメント

**実装フェーズ**: Phase 12  
**最終更新**: 2025-10-09

---

## 概要

Journeeアプリケーションのフィードバック機能は、ユーザーからのバグ報告、機能要望、その他の問い合わせを自動的にGitHub Issueとして登録します。

---

## 機能一覧

### 実装済み
- フィードバック送信フォーム（カテゴリー選択、タイトル・詳細入力）
- GitHub Issue自動作成（カテゴリー別ラベル付与）
- レート制限（1分間に3回まで）
- デスクトップ・モバイルUI統合

---

## セットアップ

### 1. GitHub Personal Access Token取得

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens**
2. **Generate new token (classic)**
3. 権限: `repo` にチェック
4. トークンをコピー

### 2. 環境変数設定

`.env.local`:
```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=your-github-username
GITHUB_REPO=journee
```

### 3. アプリ再起動

```bash
npm run dev
```

---

## 使い方

### ユーザー側
1. ヘッダー（デスクトップ）またはメニュー（モバイル）から「フィードバック」をクリック
2. カテゴリー選択：🐛 バグ報告 / 💡 機能要望 / ❓ その他
3. タイトル・詳細を入力（最大100文字 / 2000文字）
4. 送信（成功するとGitHub IssueのURLが表示される）

### 送信されるデータ
- カテゴリー、タイトル、詳細
- 送信者情報（認証時のみ）
- 環境情報（User Agent, URL, 日時）

---

## APIエンドポイント

### `POST /api/feedback`

**リクエスト**:
```typescript
{
  category: 'bug' | 'enhancement' | 'question',
  title: string,
  description: string,
  userEmail?: string,
  userName?: string
}
```

**レスポンス（成功）**:
```json
{
  "success": true,
  "issueUrl": "https://github.com/owner/repo/issues/123",
  "issueNumber": 123
}
```

**エラーコード**:
- `400` - 入力値不正
- `429` - レート制限超過
- `500` - サーバーエラー
- `503` - GitHub API未設定

詳細は[API仕様書（API.md）](./API.md)を参照。

---

## GitHub Issueフォーマット

**タイトル**: `[カテゴリー] ユーザー入力タイトル`

**本文**:
```markdown
## フィードバック
**カテゴリ**: バグ報告  
**送信者**: 田中太郎 (taro@example.com)  
**日時**: 2025/10/9 10:30:00

### 内容
[ユーザーが入力した詳細]

---
### 環境情報
- User Agent: `Mozilla/5.0...`
- URL: https://journee-app.com/
```

**ラベル**: `feedback`, `bug` / `enhancement` / `question`

---

## セキュリティとプライバシー

### レート制限
- ユーザーごとに1分間に3回まで
- 識別: セッションユーザーID or IPアドレス

### データ取り扱い
- 認証ユーザー: ユーザー名・メールアドレス記録
- 匿名ユーザー: 「匿名ユーザー」として記録
- 環境情報: ブラウザ情報・URL記録（デバッグ用）

### 注意事項
フィードバック内容は公開リポジトリのGitHub Issueとして登録されます。

---

## トラブルシューティング

### フィードバックボタンが表示されない
- `components/layout/Header.tsx`で`FeedbackModal`がインポートされているか確認
- ブラウザキャッシュをクリア

### 送信時に「利用できません」エラー
- `.env.local`に`GITHUB_TOKEN`等が設定されているか確認
- 開発サーバーを再起動

### レート制限エラー
- 1分間待ってから再送信

### GitHub Issue作成エラー
- Personal Access Tokenの`repo`権限を確認
- トークンの有効期限を確認

---

## カスタマイズ

### カテゴリー追加

`types/feedback.ts`:
```typescript
export type FeedbackCategory = 'bug' | 'enhancement' | 'question' | 'new-category';

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'バグ報告',
  enhancement: '機能要望',
  question: 'その他',
  'new-category': '新カテゴリー',
};
```

### レート制限変更

`app/api/feedback/route.ts`:
```typescript
// 1分間に5回まで
if (!checkRateLimit(identifier, 5, 60000)) {
  // ...
}
```

---

## 今後の改善案

- **Phase 12.3**: スクリーンショット添付機能
- **Phase 12.4**: リアルタイム通知（Slack/メール）
- **Phase 12.5**: フィードバック履歴（`/mypage/feedback`）

---

## 関連ドキュメント

- [GitHub REST API - Issues](https://docs.github.com/en/rest/issues/issues)
- [PLAN.md - Phase 12](./PLAN.md#phase-12-フィードバック機能)
- [API仕様（API.md）](./API.md)

---

**最終更新**: 2025-10-09
