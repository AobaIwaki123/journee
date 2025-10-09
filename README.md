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

## 🚀 開発状況

**詳細**: [実装計画（PLAN.md）](./docs/PLAN.md) | [リリース履歴（RELEASE.md）](./docs/RELEASE.md)

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

# ブランチモード（開発・テスト環境のみ）
ENABLE_MOCK_AUTH=false  # trueでモック認証を有効化
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false
```

詳細: [DOCKER.md](./DOCKER.md) | [QUICK_START.md](./docs/QUICK_START.md) | [モック認証（MOCK_AUTH.md）](./docs/MOCK_AUTH.md)

## 📚 ドキュメント

### 開発ドキュメント
- [実装計画（PLAN.md）](./docs/PLAN.md) - フェーズ別実装計画と技術仕様
- [リリース履歴（RELEASE.md）](./docs/RELEASE.md) - バージョン別の機能一覧
- [バグ・改善点（BUG.md）](./docs/BUG.md) - 既知のバグと今後の改善計画

### セットアップ
- [クイックスタート（QUICK_START.md）](./docs/QUICK_START.md) - 初回セットアップガイド
- [Docker環境構築（DOCKER.md）](./docs/DOCKER.md) - Docker環境での開発方法
- [GCRデプロイ（GCR_DEPLOYMENT.md）](./docs/GCR_DEPLOYMENT.md) - Google Cloud Runへのデプロイ

### API・技術仕様
- [API仕様（API.md）](./docs/API.md) - REST API詳細仕様
- [モック認証（MOCK_AUTH.md）](./docs/MOCK_AUTH.md) - ブランチモード・テストユーザー認証

## 📄 ライセンス

MIT

---

**最終更新**: 2025-10-08 | **開発状況**: Phase 1-8 完了 → Phase 9 進行中
