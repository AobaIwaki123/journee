# Journee AGENT ガイド

Codex を含む AI エージェントが Journee プロジェクトで作業する際のナビゲーションと実務メモをまとめています。詳細な仕様や手順は既存ドキュメントを参照してください。

## プロジェクト概要
- 旅行計画としおり生成をサポートする Next.js 14 + TypeScript アプリケーション。
- Gemini / Claude を切り替え可能な AI チャット、Supabase 永続化、PDF 出力、公開機能などを提供。
- 主要技術: Next.js App Router, Tailwind CSS, Zustand, Supabase, NextAuth, Playwright, Jest。
- 追加の背景やフェーズ進行は `README.md` と `docs/PLAN.md` を参照。

## ディレクトリ早見表
- `app/` : ページと API ルート。本体の UI・API 実装が集約。
- `components/` : 機能別 React コンポーネント群（chat, itinerary, layout など）。
- `lib/` : AI 連携・認証・DB・ユーティリティロジック。
- `types/` : TypeScript 型定義。
- `docs/` : 設計・手順ドキュメント（PLAN, SCHEMA, TESTING など）。
- `scripts/` : Docker/デプロイ/シードなどの自動化スクリプト。
- `e2e/` : Playwright テスト。
- `.cursor/rules/` : AI エージェント向け作業ルール・コンテキスト。
- `blog/` : 技術ブログ（例: ブランチごと独立環境構築の解説）。

詳細なツリーは `README.md` の「主要ディレクトリ」および `.cursor/rules/project_structure.mdc` を参照。

## 主要ドキュメント
- **全体概要**: `README.md`
- **開発計画 / 既知課題**: `docs/PLAN.md`, `docs/BUG.md`, `docs/RELEASE.md`
- **セットアップ / 実行**: `docs/QUICK_START.md`, `docs/DOCKER.md`, `docs/GCR_DEPLOYMENT.md`
- **仕様**: `docs/API.md`, `docs/SCHEMA.md`, `docs/TESTING.md`
- **コーディング規約**: `docs/GUIDELINE.md`, `.cursor/rules/typescript-react-rules.mdc`, `.cursor/rules/styling-rules.mdc`
- **機能別メモ**: `.cursor/rules/*` (AI連携, 認証, コメント機能, テスト戦略 など)
- **開発体験メモ**: `blog/ISOLATED_BRANCH_ENV.md`（ブランチ独立環境の背景と意図）

ドキュメント更新時は `.cursor/commands/` のカスタムコマンド方針（`.cursor/rules/cursor-commands.mdc`）に沿って対応。

## よく使う npm スクリプト
- 開発サーバー: `npm run dev`
- ビルド / 本番起動: `npm run build`, `npm run start`
- 静的解析: `npm run lint`, `npm run type-check`
- テスト: `npm run test` (Jest), `npm run test:e2e` (Playwright)、`npm run test:all`
- Docker 開発: `npm run docker:start|stop|restart|logs|shell|build|clean|status`
- デプロイ関連: `npm run deploy:gcr`, `npm run release`, `npm run k8s:clean`
- シード: `npm run seed:mock-users`

Node.js 18+ / npm 9+ が前提 (`package.json` の `engines` を参照)。

## 作業ガイドライン
- **事前確認**: 着手前に `.cursor/rules/` と関連ドキュメントで対象分野のルールを確認。
- **変更方針**: TypeScript + Next.js のベストプラクティス（Server Components / Client Components の境界、Tailwind のユーティリティ活用）を守る。
- **テスト**: 可能な限り単体テスト or Playwright E2E を追加/更新し、`docs/TESTING.md` の手順で検証。
- **AI 連携**: `lib/ai/` 配下の抽象化を利用し、キー管理やエラーハンドリングは既存パターンに合わせる。
- **データベース**: Supabase スキーマは `lib/db/` と `docs/SCHEMA.md` を参照し、RLS ポリシーへの影響を考慮。
- **ドキュメント**: 機能追加・フロー変更時は該当ドキュメント（特に `docs/PLAN.md`, `docs/README.md`, `.cursor/rules/`）の更新を検討。
- **独立環境**: ブランチごとのプレビューや CI/CD 方針は `blog/ISOLATED_BRANCH_ENV.md` に背景説明あり。環境調整時に参照。

## 迅速に状況把握するためのチェックリスト
1. `README.md` を読んで現状フェーズと主要機能を確認。
2. 関連フェーズの詳細は `docs/PLAN.md` → 実装ステータスを `docs/RELEASE.md` と照合。
3. ターゲット機能のルールは `.cursor/rules/` で確認。
4. 依存コードは `lib/` や `components/` で既存パターンを参照。
5. 変更後は対応するテスト (`npm run test`, `npm run test:e2e`) を実行。
6. 必要に応じてドキュメントの更新や補足を追加。

このファイルは適宜更新してください。新しい運用ルールやドキュメントが追加された場合は、本ガイドの反映も忘れずに。

