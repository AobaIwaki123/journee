# 技術スタック詳細

## フロントエンド
- **Next.js 14 (App Router)**: React フレームワーク
- **React 18**: UIライブラリ
- **TypeScript 5.3+**: 型安全な開発（strictモード）
- **Tailwind CSS**: ユーティリティファーストCSS
- **lucide-react**: アイコンライブラリ

## 状態管理
- **Zustand 4.5+**: 軽量グローバル状態管理
  - ストア: `lib/store/useStore.ts`
  - スライスベースで管理（Chat, Itinerary, Settings）

## 認証
- **NextAuth.js 4**: Google OAuth認証
  - 設定: `lib/auth/auth-options.ts`
  - プロバイダー: `components/auth/AuthProvider.tsx`
  - ミドルウェア: `middleware.ts` (保護ルート自動チェック)

## データベース
- **Supabase (PostgreSQL)**: データ永続化
  - クライアント: `lib/db/supabase.ts`
  - スキーマ: `lib/db/schema.sql`
  - RLS (Row Level Security) 有効

## AI統合
- **Google Gemini API**: メインAIモデル
  - 実装: `lib/ai/gemini.ts`
- **Anthropic Claude API**: 代替AIモデル
  - 実装: `lib/ai/claude.ts`
- **ストリーミングレスポンス対応**

## その他ライブラリ
- **jsPDF**: PDF生成
- **react-markdown**: Markdown表示
- **@hello-pangea/dnd**: ドラッグ&ドロップ
- **recharts**: 統計グラフ表示
- **zod**: バリデーション

## 開発ツール
- **TypeScript**: 型チェック
- **ESLint**: Lint
- **Jest**: ユニットテスト
- **Playwright**: E2Eテスト
- **Docker**: 開発環境

## デプロイ
- **Vercel**: 推奨デプロイ先
- **Google Cloud Run**: コンテナベースデプロイ
- **Kubernetes + ArgoCD**: ブランチごとの独立環境

## Node.js / npm バージョン
- Node.js: >= 18.0.0
- npm: >= 9.0.0
