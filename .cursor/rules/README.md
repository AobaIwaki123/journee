# Cursor Rules 概要

このディレクトリには、Journeeプロジェクトのコーディング規約、実装パターン、ベストプラクティスを定義したCursor Rulesが格納されています。

## Rules一覧

### 常に適用されるRules（alwaysApply: true）

これらのrulesは、すべてのファイル編集時に自動的に適用されます。

| Rule | 説明 | ファイル |
|------|------|----------|
| **プロジェクト構造** | プロジェクト全体の構造とアーキテクチャ定義 | [project_structure.mdc](project_structure.mdc) |
| **状態管理** | Zustandを使用した状態管理パターン | [state_management.mdc](state_management.mdc) |
| **セキュリティ & パフォーマンス** | セキュリティとパフォーマンスの実装ルール | [security_and_performance.mdc](security_and_performance.mdc) |
| **Context7 MCP** | Context7 MCP Serverの使用ガイド | [context7-mcp.mdc](context7-mcp.mdc) |
| **Serena MCP** | Serena MCP Serverの使用ガイド | [serena-mcp.mdc](serena-mcp.mdc) |
| **PR作成ガイドライン** | IssueからPRを作成する際のガイドライン | [pr-from-issue.mdc](pr-from-issue.mdc) |

### ファイルパターンで適用されるRules（globs）

特定のファイルやディレクトリに対してのみ適用されます。

| Rule | 適用対象 | 説明 | ファイル |
|------|----------|------|----------|
| **TypeScript & React規約** | `*.ts`, `*.tsx`, `app/**/*`, `components/**/*` | TypeScriptとReactのコーディング規約 | [typescript-react-rules.mdc](typescript-react-rules.mdc) |
| **スタイリング規約** | `*.tsx`, `components/**/*`, `app/**/*` | Tailwind CSSのスタイリングルール | [styling-rules.mdc](styling-rules.mdc) |
| **API開発パターン** | `app/api/**/*` | Next.js Route Handlersの実装パターン | [api-patterns.mdc](api-patterns.mdc) |
| **エラーハンドリング** | `**/*.ts`, `**/*.tsx`, `app/api/**/*`, `lib/**/*` | エラーハンドリングの標準パターン | [error-handling.mdc](error-handling.mdc) |
| **環境変数管理** | `**/*.ts`, `**/*.tsx`, `.env*`, `next.config.js` | 環境変数の管理パターンとセキュリティ | [environment-variables.mdc](environment-variables.mdc) |
| **AI統合** | `lib/ai/**/*`, `app/api/chat/**/*` | Gemini API統合パターン | [ai-integration.mdc](ai-integration.mdc) |
| **認証機能** | `lib/auth/**/*`, `app/api/auth/**/*`, `components/auth/**/*`, `middleware.ts` | NextAuth.js認証実装パターン | [authentication.mdc](authentication.mdc) |
| **データベース統合** | `lib/db/**/*`, `app/api/itinerary/**/*` | Supabase統合パターン | [database-integration.mdc](database-integration.mdc) |
| **レスポンシブレイアウト** | `components/layout/**/*` | リサイズ可能パネルとレスポンシブUI | [responsive-layout.mdc](responsive-layout.mdc) |
| **テスト戦略** | `e2e/**/*`, `**/*.test.ts`, `**/*.test.tsx`, `playwright.config.ts` | Playwright E2Eテストパターン | [testing-strategy.mdc](testing-strategy.mdc) |
| **コメント機能** | `components/comments/**/*`, `app/api/itinerary/**/comments/**/*` | コメント機能実装パターン | [comment-feature.mdc](comment-feature.mdc) |
| **フィードバック機能** | `components/feedback/**/*`, `app/api/feedback/**/*` | フィードバック機能実装パターン | [feedback-feature.mdc](feedback-feature.mdc) |
| **OGP画像生成** | `app/api/og/**/*`, `app/share/[slug]/layout.tsx` | 動的OGP画像生成の実装パターン | [ogp-image-generation.mdc](ogp-image-generation.mdc) |
| **ブランチ環境分離** | `k8s/manifests-*/**/*`, `k8s/argocd-*/**/*`, `scripts/create-branch-infra.sh` | ブランチごとの独立環境構築パターン | [branch-isolation.mdc](branch-isolation.mdc) |
| **Cursorコマンド** | `.cursor/commands/**/*` | Cursorカスタムコマンドの作成パターン | [cursor-commands.mdc](cursor-commands.mdc) |
| **Gitワークフロー** | `.git/**/*`, `.github/**/*` | Gitワークフローとコミット規約 | [git-workflow.mdc](git-workflow.mdc) |

### 手動で参照するRules（description）

Cursor AIが必要に応じて参照します。ユーザーが明示的に指定することも可能です。

| Rule | 説明 | ファイル |
|------|------|----------|
| **Pre-buildチェック** | Push前の必須チェック項目（型・Lint・ビルド） | [pre-build-check.mdc](pre-build-check.mdc) |
| **Context7 MCP** | Context7 MCP Serverの使用ガイド | [context7-mcp.mdc](context7-mcp.mdc) |
| **Serena MCP** | Serena MCP Serverの使用ガイド | [serena-mcp.mdc](serena-mcp.mdc) |
| **エラーハンドリング** | エラーハンドリングの標準パターン | [error-handling.mdc](error-handling.mdc) |
| **環境変数管理** | 環境変数の管理パターンとセキュリティ | [environment-variables.mdc](environment-variables.mdc) |
| **データベース統合** | Supabase統合パターン | [database-integration.mdc](database-integration.mdc) |
| **テスト戦略** | Playwright E2Eテストパターン | [testing-strategy.mdc](testing-strategy.mdc) |
| **レスポンシブレイアウト** | リサイズ可能パネルとレスポンシブUI | [responsive-layout.mdc](responsive-layout.mdc) |
| **コメント機能** | コメント機能実装パターン | [comment-feature.mdc](comment-feature.mdc) |
| **フィードバック機能** | フィードバック機能実装パターン | [feedback-feature.mdc](feedback-feature.mdc) |
| **OGP画像生成** | 動的OGP画像生成の実装パターン | [ogp-image-generation.mdc](ogp-image-generation.mdc) |
| **ブランチ環境分離** | ブランチごとの独立環境構築パターン | [branch-isolation.mdc](branch-isolation.mdc) |
| **Cursorコマンド** | Cursorカスタムコマンドの作成パターン | [cursor-commands.mdc](cursor-commands.mdc) |
| **Gitワークフロー** | Gitワークフローとコミット規約 | [git-workflow.mdc](git-workflow.mdc) |

## Rules使用方法

### 自動適用されるRules
- **alwaysApply: true** のrulesは常に適用されます
- **globs** で指定されたパターンに一致するファイルを編集すると自動適用されます

### 手動で参照する方法
```
@rule-name を使用して特定のruleを参照
または
@pre-build-check のようにdescriptionで検索
```

## Push前の必須チェック

コミット・Push前に必ず以下を実行してください：

```bash
# 型チェック
npm run type-check

# Lint
npm run lint

# ビルド確認
npm run build
```

または、Cursorコマンドを使用：
```
@pre-build-check
```

詳細: [pre-build-check.mdc](pre-build-check.mdc)

## 開発ワークフロー

### 1. 新機能開発時
1. 該当するrulesを確認（例: API開発なら `api-patterns.mdc`）
2. 実装パターンに従ってコーディング
3. Push前に `@pre-build-check` を実行

### 2. コードレビュー時
- 該当するrulesに準拠しているか確認
- 新しいパターンが必要な場合はruleを更新

### 3. ドキュメント更新時
- `cursor-commands.mdc` に記載されたコマンドを使用
- 定期的に `@compress-docs` でドキュメント整理

## Rulesの更新

### 新しいRuleの追加
1. `.cursor/rules/` に `.mdc` ファイルを作成
2. frontmatterで `alwaysApply`, `globs`, `description` を設定
3. Markdown形式でルールを記述

### 既存Ruleの更新
- 実装パターンが変わった場合は該当するruleを更新
- 統合可能なrulesは統合して重複を避ける

## 最近の変更

### 2025-10-12 (最新)
- ✅ **error-handling.mdc** を新規作成（エラーハンドリング標準パターン）
- ✅ **environment-variables.mdc** を新規作成（環境変数管理とセキュリティ）
- ✅ **git-workflow.mdc** を新規作成（Gitワークフローとコミット規約）
- ✅ **README.md** を更新（最新のルール一覧を反映）

### 2025-10-12 (以前)
- ✅ **pre-build-check.mdc** を新規作成（Push前チェック）
- ✅ **state_management.mdc** を更新（Zustandパターンを統合）
- ✅ **zustand-patterns.mdc** を削除（state_management.mdcに統合）
- ✅ **cursor-commands.mdc** を更新（pre-build-checkへの参照追加）

### Rules数の推移
- **統合前**: 17個のrules（重複あり）
- **統合後**: 16個のrules（重複削除）
- **現在**: 23個のrules（新規3つ追加、より体系的に整理）

## 参考リンク

- [Cursor Rules公式ドキュメント](https://docs.cursor.com/rules)
- [プロジェクト開発ガイドライン](../../docs/GUIDELINE.md)
- [Cursorカスタムコマンド](../commands/)

## まとめ

Cursor Rulesを活用することで：

- ✅ 一貫したコーディングスタイル
- ✅ ベストプラクティスの自動適用
- ✅ 実装パターンの共有
- ✅ コードレビューの効率化
- ✅ 新メンバーのオンボーディング支援
- ✅ エラーハンドリングの標準化
- ✅ セキュアな環境変数管理
- ✅ 効率的なGitワークフロー

### カテゴリ別ルール数
- **コア（常に適用）**: 6個
- **コーディング規約**: 4個（TypeScript, React, スタイリング, API）
- **機能別パターン**: 10個（認証, DB, AI, テストなど）
- **開発プロセス**: 3個（エラーハンドリング, 環境変数, Git）

**適切なrulesを設定して、開発効率を最大化しましょう！** 🚀

