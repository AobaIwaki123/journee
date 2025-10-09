# Journee

AIとともに旅のしおりを作成するアプリケーション

![](./images/toppage.png)

## 📋 概要

Journeeは、AIアシスタントと対話しながら旅行計画を立て、美しい旅のしおりを自動生成するWebアプリケーションです。

## ✨ 主な機能

### AI機能
- **AIチャット**: Gemini/Claude APIと対話しながら旅行計画を作成
- **段階的旅程構築**: 5フェーズで情報を整理（情報収集→骨組み作成→詳細化→完成）
- **AIモデル選択**: Gemini/Claude を自由に切り替え
- **ストリーミングレスポンス**: リアルタイムでAIの応答を表示

### しおり作成・編集
- **リアルタイムプレビュー**: しおりをリアルタイムで生成・表示
- **インライン編集**: タイトル、スポット情報をその場で編集
- **ドラッグ&ドロップ**: スポットの並び替え、日程間の移動
- **Undo/Redo**: 編集履歴の管理とショートカット対応
- **自動保存**: 5分間隔の定期保存とデバウンス保存

### データ管理
- **Supabase統合**: PostgreSQLによる永続化とRLSセキュリティ
- **データマイグレーション**: LocalStorageからSupabaseへの自動移行
- **複数デバイス同期**: 同じアカウントでどこからでもアクセス

### 認証
- **Google OAuth**: Googleアカウントで簡単ログイン
- **モック認証**: 開発・テスト環境向けの認証機能
- **セッション管理**: 安全なJWT認証

### 共有・出力
- **PDF出力**: 美しいレイアウトでPDF保存・印刷
- **PDFプレビュー**: 出力前のプレビュー確認
- **公開URL発行**: しおりを公開して共有
- **Read-only閲覧**: 共有リンク経由での閲覧
- **OGP画像**: SNSシェア時の動的画像生成

### コミュニティ
- **コメント機能**: 公開しおりへのコメント投稿・返信
- **フィードバック**: アプリへのフィードバック送信

### UI/UX
- **レスポンシブ**: デスクトップ/モバイル/タブレット対応
- **リサイザー**: チャット/しおりの表示比率を自由に調整
- **タブ切り替え**: モバイルでの快適な操作
- **PWA対応**: アプリとしてインストール可能、オフライン閲覧

## 🛠 技術スタック

### フロントエンド
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Icons**: lucide-react
- **State Management**: Zustand
- **DnD**: @hello-pangea/dnd
- **PDF**: jsPDF, html2canvas
- **Markdown**: react-markdown, remark-gfm, rehype-raw

### バックエンド
- **Auth**: NextAuth.js (Google OAuth)
- **Database**: Supabase (PostgreSQL)
- **AI APIs**: Google Gemini API, Anthropic Claude API
- **API**: Next.js API Routes

### インフラ・開発
- **Development**: Docker, Docker Compose
- **Testing**: Jest (Unit), Playwright (E2E)
- **CI/CD**: GitHub Actions
- **Deploy**: Google Cloud Run, Kubernetes
- **Monitoring**: Google Cloud Logging

### セキュリティ
- **Authentication**: NextAuth.js (JWT Strategy)
- **Authorization**: Supabase Row Level Security (RLS)
- **Encryption**: Web Crypto API (APIキー暗号化)

## 📂 主要ディレクトリ

```
journee/
├── app/                       # Next.js App Router
│   ├── api/                   # APIルート
│   │   ├── auth/              # NextAuth認証エンドポイント
│   │   ├── chat/              # AIチャットAPI（ストリーミング）
│   │   ├── feedback/          # フィードバックAPI
│   │   ├── itinerary/         # しおり管理API（CRUD、公開、コメント）
│   │   ├── migration/         # データマイグレーションAPI
│   │   ├── og/                # OGP画像生成API
│   │   └── user/              # ユーザー情報API
│   ├── itineraries/           # しおり一覧ページ
│   ├── login/                 # ログインページ
│   ├── mypage/                # マイページ
│   ├── settings/              # 設定ページ
│   ├── share/[slug]/          # 公開しおり閲覧ページ
│   ├── privacy/               # プライバシーポリシー
│   ├── terms/                 # 利用規約
│   └── page.tsx               # メインページ（チャット+プレビュー）
├── components/                # Reactコンポーネント
│   ├── auth/                  # 認証UI（AuthProvider、LoginButton、UserMenu）
│   ├── chat/                  # チャット機能（ChatBox、MessageList、AISelector）
│   ├── comments/              # コメント機能（CommentList、CommentForm）
│   ├── feedback/              # フィードバックモーダル
│   ├── itinerary/             # しおり機能（25+コンポーネント）
│   │   ├── ItineraryPreview   # プレビュー表示
│   │   ├── EditableSpotCard   # 編集可能スポットカード
│   │   ├── PDFExportButton    # PDF出力
│   │   ├── ShareButton        # 共有機能
│   │   └── ...                # その他
│   ├── layout/                # レイアウト（Header、Resizable、AutoSave）
│   ├── mypage/                # マイページ（UserProfile、UserStats）
│   ├── settings/              # 設定UI（GeneralSettings、AISettings）
│   └── ui/                    # 共通UI（LoadingSpinner、Toast、ErrorNotification）
├── lib/                       # ユーティリティ・ロジック
│   ├── ai/                    # AI統合（gemini.ts、claude.ts、prompts.ts）
│   ├── auth/                  # 認証ロジック（auth-options.ts、session.ts）
│   ├── db/                    # データベース（supabase.ts、schema.sql、repository）
│   ├── execution/             # しおり構築フロー
│   ├── requirements/          # 情報抽出・チェックリスト
│   ├── store/                 # Zustand状態管理
│   └── utils/                 # ユーティリティ（api-client、pdf-generator、encryption）
├── types/                     # TypeScript型定義
│   ├── itinerary.ts           # しおり関連の型
│   ├── chat.ts                # チャット関連の型
│   ├── auth.ts                # 認証関連の型
│   ├── database.ts            # データベース型定義
│   └── ...                    # その他の型定義
├── e2e/                       # E2Eテスト（Playwright）
├── k8s/                       # Kubernetes設定（Deployment、Service、Ingress）
├── scripts/                   # スクリプト（deploy、docker、seed）
└── docs/                      # ドキュメント（API、PLAN、SCHEMA、TESTING）
```

詳細な構造は [プロジェクト構造ドキュメント](.cursor/rules/project_structure.mdc) を参照してください。

## 🚀 開発状況

**現在のバージョン**: 0.10.0  
**現在のフェーズ**: Phase 10 完了、Phase 11 準備中

### 完了済み機能
- ✅ Phase 1-8: 基本機能、認証、AI統合、データベース統合
- ✅ Phase 10: バグ修正とUX改善
  - 閲覧ページのPDF機能修正
  - OGP画像の動的生成
  - フィードバックフォームのコントラスト改善
  - しおり保存のデータベース統合

### 次のステップ
- 🔄 Phase 11: コメント機能のUI/UX改善
- 📝 Phase 12: フィードバック機能の拡張
- ⚡ Phase 13: パフォーマンス最適化

**詳細**: [実装計画（PLAN.md）](./docs/PLAN.md) | [リリース履歴（RELEASE.md）](./docs/RELEASE.md) | [既知のバグ（BUG.md）](./docs/BUG.md)

---

## 🔧 開発環境セットアップ

### 必要要件
- Node.js 18.0 以上
- npm 9.0 以上
- Docker & Docker Compose（Docker環境の場合）

### Docker環境（推奨）
```bash
# リポジトリをクローン
git clone https://github.com/yourusername/journee.git
cd journee

# 環境変数を設定
# .env.localファイルを作成して必要な環境変数を設定（下記参照）

# Dockerコンテナを起動
npm run docker:start

# ブラウザでアクセス
# http://localhost:3000
```

### ローカル環境
```bash
# 依存関係をインストール
npm install

# 環境変数を設定
# .env.localファイルを作成（下記参照）

# 開発サーバーを起動
npm run dev

# ブラウザでアクセス
# http://localhost:3000
```

### 環境変数の設定

`.env.local` ファイルをプロジェクトルートに作成し、以下の環境変数を設定してください：

```env
# NextAuth.js認証
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<openssl rand -base64 32 で生成>

# Google OAuth（必須 または ENABLE_MOCK_AUTH=true）
GOOGLE_CLIENT_ID=<Google Cloud Consoleから取得>
GOOGLE_CLIENT_SECRET=<Google Cloud Consoleから取得>

# Supabase（必須）
NEXT_PUBLIC_SUPABASE_URL=<Supabaseプロジェクトから取得>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabaseプロジェクトから取得>

# Google Gemini API（必須）
GEMINI_API_KEY=<Google AI Studioから取得>

# Google Maps API（オプション - 地図機能用）
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<Google Cloud Consoleから取得>

# モック認証（開発・テスト環境のみ - Google OAuth不要）
ENABLE_MOCK_AUTH=false          # trueでモック認証を有効化
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false
```

### モック認証モード（開発・テスト用）

Google OAuth設定をスキップしたい場合は、モック認証を使用できます：

```env
ENABLE_MOCK_AUTH=true
NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
```

**注意**: 本番環境では絶対に有効化しないでください。

詳細: [モック認証ドキュメント（MOCK_AUTH.md）](./docs/MOCK_AUTH.md)

### セットアップガイド

詳しいセットアップ手順は以下のドキュメントを参照してください：
- [クイックスタートガイド（QUICK_START.md）](./docs/QUICK_START.md) - 初回セットアップの詳細
- [Docker環境構築（DOCKER.md）](./docs/DOCKER.md) - Docker環境での開発方法
- [Google Cloud Run デプロイ（GCR_DEPLOYMENT.md）](./docs/GCR_DEPLOYMENT.md) - デプロイ手順

## 📚 ドキュメント

### 開発ドキュメント
- [実装計画（PLAN.md）](./docs/PLAN.md) - フェーズ別実装計画と技術仕様
- [リリース履歴（RELEASE.md）](./docs/RELEASE.md) - バージョン別の機能一覧
- [バグ・改善点（BUG.md）](./docs/BUG.md) - 既知のバグと今後の改善計画
- [開発ガイドライン（GUIDELINE.md）](./docs/GUIDELINE.md) - コーディング規約とベストプラクティス

### セットアップ
- [クイックスタート（QUICK_START.md）](./docs/QUICK_START.md) - 初回セットアップガイド
- [Docker環境構築（DOCKER.md）](./docs/DOCKER.md) - Docker環境での開発方法
- [Google Cloud Run デプロイ（GCR_DEPLOYMENT.md）](./docs/GCR_DEPLOYMENT.md) - デプロイ手順

### API・技術仕様
- [API仕様（API.md）](./docs/API.md) - REST API詳細仕様
- [データベーススキーマ（SCHEMA.md）](./docs/SCHEMA.md) - Supabaseスキーマ定義
- [テストガイド（TESTING.md）](./docs/TESTING.md) - テスト戦略と実行手順

### 機能ドキュメント
- [認証機能（lib/auth/README.md）](./lib/auth/README.md) - NextAuth.js認証の詳細
- [データベース機能（lib/db/README.md）](./lib/db/README.md) - Supabase統合の詳細
- [フィードバック機能（FEEDBACK.md）](./docs/FEEDBACK.md) - フィードバックシステムの仕様
- [モック認証（MOCK_AUTH.md）](./docs/MOCK_AUTH.md) - ブランチモード・テストユーザー認証

---

## 🛠 開発コマンド

### 開発サーバー
```bash
npm run dev              # 開発サーバー起動
npm run build            # プロダクションビルド
npm run start            # プロダクションサーバー起動
npm run lint             # ESLintチェック
npm run type-check       # TypeScriptチェック
```

### テスト
```bash
npm run test             # ユニットテスト実行
npm run test:watch       # ユニットテスト（ウォッチモード）
npm run test:coverage    # カバレッジレポート生成
npm run test:e2e         # E2Eテスト実行
npm run test:e2e:ui      # E2EテストUI起動
npm run test:all         # 全テスト実行
```

### Docker
```bash
npm run docker:start     # Dockerコンテナ起動
npm run docker:stop      # Dockerコンテナ停止
npm run docker:restart   # Dockerコンテナ再起動
npm run docker:logs      # ログ表示
npm run docker:shell     # コンテナシェル起動
npm run docker:build     # イメージ再ビルド
npm run docker:clean     # コンテナ・イメージ削除
npm run docker:status    # コンテナ状態確認
```

### デプロイ
```bash
npm run deploy:gcr       # Google Cloud Runへデプロイ
npm run release          # バージョンタグ作成
```

### ユーティリティ
```bash
npm run seed:mock-users  # モックユーザーをSupabaseに登録
```

---

## 🤝 コントリビューション

コントリビューションを歓迎します！以下の手順でご協力ください：

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

コーディング規約については [開発ガイドライン（GUIDELINE.md）](./docs/GUIDELINE.md) を参照してください。

---

## 📄 ライセンス

MIT License - 詳細は [LICENSE](./LICENSE) ファイルを参照してください。

---

## 🙏 謝辞

このプロジェクトは以下のオープンソースプロジェクトに支えられています：
- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [NextAuth.js](https://next-auth.js.org/)
- その他多数の素晴らしいライブラリ

---

**最終更新**: 2025-10-09  
**バージョン**: 0.10.0  
**開発状況**: Phase 10 完了 → Phase 11 準備中
