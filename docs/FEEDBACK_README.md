# フィードバックシステム

ユーザーからのフィードバックを収集し、LLMで構造化してGitHub Issueとして自動作成するシステム。

## 概要

このシステムにより、ユーザーは簡単にフィードバックを送信でき、開発チームは構造化された課題管理ができます。

### 主な機能

- 📝 **簡単な送信**: ユーザーフレンドリーなモーダルUI
- 🤖 **AI処理**: LLMによる自動分類と優先度判定
- 🐙 **GitHub統合**: 自動的にIssueを作成
- 🛡️ **セキュリティ**: レート制限とバリデーション
- 🎨 **カテゴリ分類**: バグ、機能リクエスト、UI/UX改善など

## アーキテクチャ

```
┌─────────────┐
│   ユーザー   │
└──────┬──────┘
       │
       ↓
┌──────────────────┐
│ FeedbackModal UI │
└──────┬───────────┘
       │
       ↓
┌────────────────────┐
│ /api/feedback      │
│ - バリデーション    │
│ - レート制限        │
└──────┬─────────────┘
       │
       ├──────────────┐
       ↓              ↓
┌─────────────┐  ┌──────────────┐
│ LLM処理     │  │ GitHub API   │
│ (Gemini)    │  │ (Octokit)    │
└─────────────┘  └──────────────┘
                        │
                        ↓
                 ┌──────────────┐
                 │ GitHub Issue │
                 └──────────────┘
```

## ディレクトリ構造

```
/workspace/
├── types/
│   └── feedback.ts                  # 型定義
├── lib/
│   ├── ai/
│   │   └── feedback-prompts.ts      # LLM統合
│   ├── github/
│   │   ├── client.ts                # GitHub APIクライアント
│   │   └── issue-template.ts        # Issueテンプレート
│   └── utils/
│       └── rate-limit.ts            # レート制限
├── app/
│   └── api/
│       └── feedback/
│           └── route.ts             # APIエンドポイント
├── components/
│   └── ui/
│       ├── FeedbackButton.tsx       # フィードバックボタン
│       └── FeedbackModal.tsx        # フィードバックモーダル
└── docs/
    ├── FEEDBACK_README.md                      # このファイル
    ├── FEEDBACK_SYSTEM_IMPLEMENTATION.md       # 実装計画
    ├── FEEDBACK_IMPLEMENTATION_GUIDE.md        # 実装ガイド
    ├── FEEDBACK_COMPONENT_TEMPLATES.md         # コンポーネントテンプレート
    └── FEEDBACK_TESTING_GUIDE.md               # テストガイド
```

## クイックスタート

### 1. 依存パッケージのインストール

```bash
npm install @octokit/rest
```

### 2. 環境変数の設定

`.env.local` ファイルを作成:

```env
# GitHub統合
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_OWNER=your-github-username
GITHUB_REPO=journee

# Google AI（既存）
GOOGLE_API_KEY=your_google_api_key
```

### 3. GitHub Personal Access Tokenの作成

1. GitHub → Settings → Developer settings → Personal access tokens
2. "Generate new token (classic)"
3. 権限: `repo` を選択
4. トークンをコピーして `.env.local` に設定

### 4. 開発サーバーの起動

```bash
npm run dev
```

### 5. ヘルスチェック

```bash
curl http://localhost:3000/api/feedback
```

成功すると:

```json
{
  "status": "ok",
  "services": {
    "github": { "status": "connected" },
    "llm": { "status": "configured" }
  }
}
```

## 使用方法

### ヘッダーに統合

```typescript
// components/layout/Header.tsx
import FeedbackButton from '@/components/ui/FeedbackButton';

export default function Header() {
  return (
    <header>
      <nav>
        {/* 他のナビゲーション項目 */}
        <FeedbackButton position="header" />
      </nav>
    </header>
  );
}
```

### フローティングボタンとして使用

```typescript
// app/page.tsx または app/layout.tsx
import FeedbackButton from '@/components/ui/FeedbackButton';

export default function Page() {
  return (
    <>
      {/* ページコンテンツ */}
      <FeedbackButton position="floating" />
    </>
  );
}
```

## API仕様

### POST /api/feedback

フィードバックを送信します。

**リクエスト:**

```json
{
  "category": "bug|feature|ui-ux|performance|content|other",
  "title": "タイトル（5-200文字）",
  "description": "詳細説明（10-5000文字）",
  "email": "example@example.com（オプション）",
  "context": {
    "url": "http://localhost:3000",
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2025-10-08T12:00:00Z",
    "userId": "user123（オプション）"
  }
}
```

**レスポンス（成功）:**

```json
{
  "success": true,
  "issueNumber": 123,
  "issueUrl": "https://github.com/owner/repo/issues/123",
  "remaining": 4
}
```

**レスポンス（エラー）:**

```json
{
  "success": false,
  "error": "エラーメッセージ",
  "details": [...]
}
```

### GET /api/feedback

ヘルスチェックとサービス状態の確認。

**レスポンス:**

```json
{
  "status": "ok",
  "timestamp": "2025-10-08T12:00:00Z",
  "services": {
    "github": { "status": "connected" },
    "llm": { "status": "configured" },
    "rateLimit": { "enabled": true }
  }
}
```

## レート制限

- **制限**: 1時間に5回
- **識別**: IPアドレスまたはユーザーID
- **リセット**: 最も古いリクエストから1時間後

レート制限に達した場合:

```json
{
  "success": false,
  "error": "レート制限に達しました。約XX分後に再度お試しください。"
}
```

ヘッダー:

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1728388800000
```

## カテゴリ

| カテゴリ | 説明 | アイコン |
|---------|------|---------|
| bug | バグ報告 | 🐛 |
| feature | 機能リクエスト | 💡 |
| ui-ux | UI/UX改善 | 🎨 |
| performance | パフォーマンス | ⚡ |
| content | コンテンツ | 📝 |
| other | その他 | 📌 |

## LLM処理

フィードバックはGoogle Gemini APIで処理され、以下の情報が自動生成されます:

- **カテゴリの検証・修正**: ユーザーが選択したカテゴリが適切か確認
- **優先度の判定**: low / medium / high / critical
- **ラベルの生成**: GitHub Issueに付与するラベル（最大5つ）
- **タイトルの整形**: 簡潔で明確なタイトル（50文字以内）
- **本文の構造化**: Markdown形式で見やすく整形
- **解決策の提案**: 可能な場合、解決策を提案（オプション）
- **工数の推定**: 実装にかかる時間の推定（オプション）

## GitHub Issue

作成されるIssueには以下が含まれます:

- **構造化された本文**: 概要、再現手順、期待される動作など
- **環境情報**: URL、ユーザーエージェント、タイムスタンプ
- **ラベル**: カテゴリ、優先度、`user-feedback`, `🤖 auto-generated`
- **元の入力**: 折りたたみ可能な詳細セクション

## セキュリティ

### 入力バリデーション

- Zodによる厳格なバリデーション
- 文字数制限（タイトル: 5-200、説明: 10-5000）
- メールアドレス形式の検証

### レート制限

- IPアドレスベース
- 1時間に5回まで
- ユーザーIDがある場合はそちらを優先

### プライバシー

- 送信された情報はGitHub Issueとして公開されます
- 個人を特定できる情報は含めないよう警告を表示
- メールアドレスはオプション

### API保護

- サーバーサイドでのみAPIキーを使用
- クライアントサイドでは機密情報を非露出
- エラーの詳細は開発環境でのみ表示

## トラブルシューティング

### GitHub接続エラー

**症状:** `github.status: "error"` または `github.status: "disconnected"`

**解決策:**
1. GITHUB_TOKEN が正しく設定されているか確認
2. トークンの権限（repo）を確認
3. GITHUB_OWNER と GITHUB_REPO が正しいか確認
4. トークンの有効期限を確認

### LLM処理エラー

**症状:** フィードバック処理中にエラー

**解決策:**
1. GOOGLE_API_KEY が設定されているか確認
2. APIキーの使用制限を確認
3. フォールバック処理が動作することを確認（基本的な構造化は行われる）

### レート制限の問題

**症状:** レート制限が機能しない、または厳しすぎる

**解決策:**
1. 開発環境では `lib/utils/rate-limit.ts` の設定を調整
2. 本番環境では Redis や Upstash を使用することを推奨
3. サーバー再起動でメモリベースの制限はリセットされる

## パフォーマンス

- **LLM処理**: 通常2-5秒
- **GitHub Issue作成**: 通常1-2秒
- **合計レスポンス時間**: 3-7秒

## 今後の拡張

### Phase 2の機能

1. **管理者ダッシュボード**
   - フィードバック一覧
   - ステータス管理
   - 統計情報

2. **通知機能**
   - Issue作成時の通知
   - 処理完了時のユーザーへの通知

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

## ドキュメント

- **[FEEDBACK_SYSTEM_IMPLEMENTATION.md](./FEEDBACK_SYSTEM_IMPLEMENTATION.md)**: 実装計画と設計ドキュメント
- **[FEEDBACK_IMPLEMENTATION_GUIDE.md](./FEEDBACK_IMPLEMENTATION_GUIDE.md)**: ステップバイステップの実装ガイド
- **[FEEDBACK_COMPONENT_TEMPLATES.md](./FEEDBACK_COMPONENT_TEMPLATES.md)**: コンポーネントの完全な実装例
- **[FEEDBACK_TESTING_GUIDE.md](./FEEDBACK_TESTING_GUIDE.md)**: テストシナリオと手順

## コントリビューション

フィードバックシステムの改善提案やバグ報告は、このシステム自体を使って送信してください！

## ライセンス

このプロジェクトと同じライセンスに従います。

---

**作成日**: 2025-10-08
**最終更新**: 2025-10-08
**バージョン**: 1.0
