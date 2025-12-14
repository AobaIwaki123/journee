# Journee エージェント用ナレッジベース

## 1. プロジェクト概要
- 旅行計画をAIとチャットしながら作成できるWebアプリケーション。
- メイン画面（`app/page.tsx`）でチャットと旅程プレビューを並行表示し、編集内容を即座に反映。
- 完成した旅程は共有URL（`app/share/[slug]`）やPDF（`lib/utils/pdf-generator.ts`）として配布可能。

## 2. システム構成
- **Next.js 14 App Router** 構成。`app/` 配下でページ・API・レイアウトを管理。
- **サーバー機能**: `/app/api` にREST APIがまとまり、AIチャット、旅程CRUD、OGP生成などを提供。
- **UIコンポーネント**: `components/` は機能別ディレクトリ（`chat/`, `itinerary/`, `layout/`, `feedback/` 等）で整理。
- **ビジネスロジック**: `lib/` にAI連携、Supabaseリポジトリ、Zustandストア、ユーティリティが集約。
- **型定義**: `types/` 配下でチャット・旅程・認証などを型安全に管理。

## 3. 主要利用技術
- **フロントエンド**: React 18 + TypeScript 5.x + Tailwind CSS。
- **状態管理**: Zustand（`lib/store/`）、スライス構成＋`persist`で設定を永続化。
- **認証**: NextAuth.js + Google OAuth。`lib/auth/auth-options.ts` と `middleware.ts` で保護。
- **データベース**: Supabase PostgreSQL。RLS有効。DDLは `lib/db/schema.sql`、要件は `docs/SCHEMA.md`。
- **AI**: Google Gemini（優先）とAnthropic Claude（フェイルオーバー）をサポート。プロンプトは `lib/ai/prompts.ts`、ストリーミング処理は `lib/ai/gemini.ts` と `/app/api/chat`.

## 4. コア機能フロー
1. ユーザーがチャット入力 → `/app/api/chat` がAIに問い合わせ、ReadableStreamで応答を返す。
2. フロントエンドのZustandストアがメッセージ・旅程ステートを更新。
3. `lib/execution/` のフローが旅程データを整形し、`lib/db/itinerary-repository.ts` 経由でSupabaseへ保存。
4. 公開設定時は `is_public` と `public_slug` を付与し、共有ページで表示。

## 5. データモデルの要点
- **主要テーブル**（100% Supabase管理）:
  - `users`: Google OAuth情報。
  - `itineraries`: 旅程メタ情報と進行フェーズ。
  - `day_schedules`: 日別スケジュールと詳細化ステータス。
  - `tourist_spots`: 観光スポット、移動、飲食などのエントリ。
  - `chat_messages`: 旅程生成時の対話履歴。
  - `user_settings`: AIモデルやAPIキーの暗号化保存。
- 各テーブルの詳細仕様・インデックス・RLSポリシーは `docs/SCHEMA.md` 参照。

## 6. 開発ワークフロー
- **起動/ビルド**: `npm run dev`、`npm run build`、`npm run start`。
- **静的検証**: `npm run lint`、`npm run type-check`。
- **テスト**: `npm run test`（Jest）、`npm run test:e2e`（Playwright）。設定は `jest.config.js` と `playwright.config.ts`。
- **Docker開発**: `scripts/docker-dev.sh` 経由で `npm run docker:start` などを提供。
- **デプロイ**: Vercel推奨。`docker-compose.yml`、`Dockerfile.prod`、`k8s/` のマニフェスト、`scripts/deploy-gcr.sh` でGCR/Cloud Runにも対応。

## 7. ドキュメントガイド
- `README.md`: 製品コンセプトと公開機能のビジュアル。
- `docs/README.md`: すべてのドキュメントの目次。技術仕様（`API.md`、`GUIDELINE.md`、`SCHEMA.md`）や開発・運用手順（`QUICK_START.md`、`DOCKER.md`、`GCR_DEPLOYMENT.md`）を案内。
- `docs/TESTING.md`, `docs/LINT.md`: 品質チェックの詳細手順。
- `docs/FEEDBACK.md`, `docs/MOCK_AUTH.md`: 機能別の補足資料。

## 8. 品質・運用上の留意点
- AIレスポンスのトークン数削減のため `lib/ai/chat-compressor.ts` で履歴を圧縮。
- ログイン必須ページは `middleware.ts` が自動リダイレクト。新規ページ追加時は `matcher` への追記を検討。
- IndexedDBからSupabaseへの移行ガイドは `docs/STORAGE_MIGRATION.md`、実装は `lib/utils/storage-migration.ts`。
- PDF生成やOGP生成など、ブラウザ専用処理は `next/dynamic` を用いた遅延ロードでパフォーマンスを確保。

## 9. これから作業するエージェント向けヒント
- 新しいAPIを追加する場合は `/app/api` にルート作成 → `docs/API.md` に仕様追記 → 必要なら `e2e/` へテスト追加。
- 状態を拡張する場合は `lib/store` の既存スライス構造に倣い、型を `types/` に定義してからUIへ配線すると安全。
- Supabaseスキーマに変更を加えたら `lib/db/schema.sql` と `docs/SCHEMA.md` の更新を忘れないこと。
- AIプロンプト調整時は `lib/ai/prompts.ts` を単一の真実とし、テストではモックを `lib/mock-data/` に追加すると便利。

