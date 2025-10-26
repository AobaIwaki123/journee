# Journee プロジェクト概要

## プロジェクトの目的

**Journee（ジャーニー）** - AIとともに旅のしおりを作成するWebアプリケーション

### コンセプト
- まるで旅行好きの友人と話すように、AIアシスタントとチャット形式で対話
- 行き先の相談、おすすめスポット、予算・日程調整を対話的に決定
- リアルタイムで旅行計画が形になり、「旅のしおり」として出力

### 主要機能
1. **AIチャット**: Google Gemini / Anthropic Claude APIを使用した対話的なしおり作成
2. **しおりプレビュー**: リアルタイムで更新される旅程表示（編集可能）
3. **共有機能**: リンク一つで友人・家族と共有
4. **PDF出力**: 旅行前に印刷・保存可能
5. **モバイル対応**: PWA対応、スマホでも快適に利用可能
6. **コメント機能**: 公開しおりへのコメント投稿
7. **認証**: Google OAuthによる安全なログイン
8. **データ永続化**: Supabase PostgreSQLによるデータ保存

### ターゲットユーザー
- 旅行の計画を立てるのが面倒だと感じる人
- AIと対話しながら旅程を作りたい人
- 友人や家族と旅行計画を共有したい人

### プロジェクト規模
- TypeScript/React/Next.jsによるフルスタックWebアプリ
- Vercel / Google Cloud Run / Kubernetes対応
- E2Eテスト・ユニットテスト完備

## 最新補足メモ
- **アプリ構成**: Next.js 14 App Routerベース。`app/page.tsx` がチャット+しおり画面、`app/itineraries`, `app/mypage`, `app/share/[slug]` などで主要機能を提供。
- **主要ディレクトリ**: `components/` に機能別UI、`lib/ai` にGemini/Claude連携、`lib/db` にSupabaseアクセス、`lib/store` にZustandのスライスが配置されている。
- **データベース**: Supabase PostgreSQL。`docs/SCHEMA.md` にテーブル仕様、`lib/db/schema.sql` がDDL。RLSが有効でユーザー単位にアクセス制御。
- **ドキュメント**: `docs/README.md` が索引。API仕様、スキーマ、デプロイ（Docker/GCR）、テスト、コーディング規約などが細分化されている。
- **開発スクリプト**: `npm run dev` でローカル起動、`npm run test`（Jest）と `npm run test:e2e`（Playwright）でテスト、`npm run docker:*` でDocker開発環境操作、`npm run deploy:gcr` でGCRデプロイ。
- **AI実装メモ**: `lib/ai/gemini.ts` を優先し、必要に応じて `lib/ai/claude.ts` にフェイルオーバー。プロンプト管理は `lib/ai/prompts.ts`、チャット履歴圧縮は `lib/ai/chat-compressor.ts`。
- **PDF & 共有**: `lib/utils/pdf-generator.ts` でjsPDFを利用したしおりPDF化。公開URLは `app/share/[slug]` でレンダリング。
- **テスト配置**: `__tests__` と `e2e/` ディレクトリ。Playwright設定は `playwright.config.ts`。
- **その他**: Tailwind設定は `tailwind.config.ts`、グローバルスタイルは `app/globals.css`。Dockerfile, Dockerfile.prod で開発/本番ビルドを分け、`k8s/` にマニフェストがある。
