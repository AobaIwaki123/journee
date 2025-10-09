# Journee

AIとともに旅のしおりを作成するアプリケーション

![](./images/toppage.png)

## 📋 概要

Journeeは、AIアシスタントと対話しながら旅行計画を立て、美しい旅のしおりを自動生成するWebアプリケーションです。

## ✨ 主な機能

- **AIチャット**: Gemini/Claude APIと対話しながら旅行計画を作成
- **リアルタイムプレビュー**: しおりをリアルタイムで生成・表示
- **認証**: Googleアカウントでログイン
- **データベース統合**: Supabase（PostgreSQL）による永続化
- **PDF出力**: 完成したしおりをPDF保存・印刷
- **編集機能**: ドラッグ&ドロップ、Undo/Redo、手動編集
- **共有機能**: 公開URL発行、Read-only閲覧
- **レスポンシブ**: デスクトップ/モバイル対応、PWA

## 🛠 技術スタック

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **State**: Zustand
- **Auth**: NextAuth.js (Google OAuth)
- **AI**: Google Gemini API, Anthropic Claude API
- **Database**: Supabase (PostgreSQL)
- **Deploy**: Vercel

## 📂 主要ディレクトリ

```
journee/
├── app/                  # Next.js App Router
│   ├── api/              # APIルート
│   ├── login/            # ログインページ
│   ├── mypage/           # マイページ
│   ├── settings/         # 設定ページ
│   └── share/[slug]/     # 公開しおり閲覧
├── components/           # Reactコンポーネント
│   ├── auth/             # 認証関連
│   ├── chat/             # チャット機能
│   ├── itinerary/        # しおり機能
│   └── layout/           # レイアウト
├── lib/                  # ユーティリティ
│   ├── ai/               # AI統合
│   ├── auth/             # 認証ロジック
│   ├── db/               # データベース
│   └── store/            # 状態管理
└── types/                # TypeScript型定義
```

## 🚀 実装ステータス

### ✅ 完了済み (Phase 1-8)
- **Phase 1-2**: 基礎構築、認証（NextAuth.js + Google OAuth）
- **Phase 3**: AI統合（Gemini/Claude API、ストリーミング対応）
- **Phase 4**: 段階的旅程構築システム
- **Phase 5**: しおり機能統合
  - 5.1: コンポーネント実装（表示、編集、Undo/Redo、D&D）
  - 5.2: 一時保存（LocalStorage、自動保存）
  - 5.3: PDF出力（日本語対応、A4最適化）
  - 5.4: マイページ、しおり一覧、設定ページ
  - 5.5: 公開・共有機能（URL発行、Read-only閲覧）
- **Phase 6**: Claude API統合、AIモデル切り替え
- **Phase 7**: UI最適化（リサイザー、モバイル対応、PWA）
- **Phase 8**: データベース統合（Supabase、マイグレーション）

### 🔄 進行中 (Phase 9)
- パフォーマンス最適化
- テストカバレッジ向上
- アクセシビリティ対応

### 📋 予定 (Phase 10)
- 本番環境デプロイ
- モニタリング・ログ設定
- ドキュメント整備

## 💡 主要機能

### セキュリティ
- NextAuth.js認証、APIキー暗号化保存
- RLS（Row Level Security）、入力値バリデーション

### データ保存
- Supabase (PostgreSQL) でデータ永続化
- 自動保存（5分ごと + 変更時デバウンス）
- LocalStorageからのマイグレーション機能

### パフォーマンス
- AIストリーミングレスポンス
- React.memo/useMemo最適化
- コード分割、画像遅延読み込み

## 🔧 開発環境セットアップ

### Docker環境（推奨）
```bash
git clone <repository-url>
cd journee
cp .env.example .env.local
npm run docker:start
# http://localhost:3000
```

### ローカル環境
```bash
npm install
cp .env.example .env.local
npm run dev
```

### 必要な環境変数
```env
GEMINI_API_KEY=your_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

詳細: [DOCKER.md](./DOCKER.md) | [QUICK_START.md](./docs/QUICK_START.md)

## 📚 ドキュメント

- [API仕様](./docs/API.md)
- [Phase 8 実装完了レポート](./docs/PHASE8_IMPLEMENTATION_COMPLETE.md)
- [クイックスタートガイド](./docs/QUICK_START.md)
- [Docker環境構築](./DOCKER.md)

## 📄 ライセンス

MIT

---

**最終更新**: 2025-10-08 | **開発状況**: Phase 1-8 完了 → Phase 9 進行中
