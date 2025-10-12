# アーキテクチャパターンとディレクトリ構造

## ディレクトリ構造

```
journee/
├── app/                     # Next.js App Router
│   ├── api/                 # APIルート（サーバーサイド）
│   │   ├── auth/            # NextAuth認証エンドポイント
│   │   ├── chat/            # AIチャットAPI
│   │   ├── itinerary/       # しおり管理API（CRUD）
│   │   ├── feedback/        # フィードバック送信
│   │   ├── migration/       # データマイグレーション
│   │   ├── og/              # OGP画像生成
│   │   └── user/            # ユーザー情報取得
│   ├── page.tsx             # メインページ（チャット + しおり）
│   ├── layout.tsx           # ルートレイアウト
│   ├── login/               # ログインページ
│   ├── mypage/              # マイページ
│   ├── settings/            # 設定ページ
│   ├── itineraries/         # しおり一覧
│   └── share/[slug]/        # 公開しおり共有ページ
│
├── components/              # Reactコンポーネント
│   ├── auth/                # 認証UI（LoginButton, UserMenu, AuthProvider）
│   ├── chat/                # チャット機能（ChatBox, MessageList, MessageInput）
│   ├── itinerary/           # しおり機能（Preview, Edit, PDF, Map等）
│   ├── layout/              # レイアウト（Header, Resizable, Mobile等）
│   ├── comments/            # コメント機能
│   ├── feedback/            # フィードバックモーダル
│   ├── settings/            # 設定UI
│   ├── mypage/              # マイページUI
│   └── ui/                  # 共通UI（LoadingSpinner, Toast等）
│
├── lib/                     # ビジネスロジック・ユーティリティ
│   ├── ai/                  # AI統合（gemini.ts, claude.ts, prompts.ts）
│   ├── auth/                # 認証ロジック（auth-options.ts, session.ts）
│   ├── db/                  # データベース（supabase.ts, itinerary-repository.ts）
│   ├── store/               # Zustand状態管理（useStore.ts）
│   ├── execution/           # しおり作成フロー実行
│   ├── requirements/        # 要件管理・チェックリスト
│   ├── hooks/               # カスタムフック
│   ├── mock-data/           # モックデータ
│   └── utils/               # ヘルパー関数（api-client, storage, pdf-generator等）
│
├── types/                   # TypeScript型定義
│   ├── chat.ts              # チャット関連型
│   ├── itinerary.ts         # しおり関連型
│   ├── auth.ts              # 認証型（NextAuth拡張）
│   ├── database.ts          # データベース型
│   └── ...
│
├── docs/                    # ドキュメント
│   ├── README.md            # プロジェクト概要
│   ├── GUIDELINE.md         # コーディング規約
│   ├── PLAN.md              # 実装計画
│   ├── API.md               # API仕様
│   ├── SCHEMA.md            # データベーススキーマ
│   └── ...
│
├── e2e/                     # E2Eテスト（Playwright）
├── k8s/                     # Kubernetes設定
├── scripts/                 # ビルド・デプロイスクリプト
└── public/                  # 静的ファイル
```

## アーキテクチャパターン

### 1. Next.js App Router
- **Server Components**: デフォルト（データフェッチ・SEO対応）
- **Client Components**: `'use client'` 指定（インタラクティブUI）
- **API Routes**: `/app/api` 配下にRESTful API実装

### 2. 状態管理（Zustand）
- **グローバルストア**: `lib/store/useStore.ts` で一元管理
- **スライス分割**: Chat, Itinerary, Settings等に分割
- **LocalStorage永続化**: `persist` ミドルウェア使用

### 3. 認証（NextAuth.js）
- **Google OAuth**: 唯一の認証方法
- **JWT戦略**: セッション管理
- **ミドルウェア**: `middleware.ts` で保護ルート自動チェック
- **保護API**: `getCurrentUser()` で認証チェック

### 4. データベース（Supabase）
- **PostgreSQL**: リレーショナルDB
- **RLS（Row Level Security）**: ユーザーごとのアクセス制御
- **リポジトリパターン**: `itinerary-repository.ts` でデータアクセス抽象化

### 5. AI統合
- **ストリーミングAPI**: ReadableStreamで逐次応答
- **プロンプト管理**: `lib/ai/prompts.ts` で一元管理
- **フォールバック**: Gemini → Claude への切り替え対応

### 6. コンポーネント設計
- **Atomic Design的アプローチ**:
  - `ui/`: 最小単位（Button, Input等）
  - `components/*/`: 機能単位（Chat, Itinerary等）
  - `app/`: ページレベル組み合わせ
- **Props型定義**: インターフェースで明示

### 7. エラーハンドリング
- **try-catch**: API呼び出し時は必須
- **エラー通知**: Zustandストアの `error` 状態 + Toast表示
- **ログ**: サーバーサイドは `console.error`、本番は外部ログサービス連携推奨

### 8. パフォーマンス最適化
- **React.memo**: 頻繁に再レンダリングされるコンポーネント
- **useCallback/useMemo**: 重い計算・関数のメモ化
- **動的インポート**: 大きいコンポーネントは遅延ロード
- **画像最適化**: Next.js Imageコンポーネント使用

### 9. テスト戦略
- **ユニットテスト（Jest）**: `lib/` 配下のロジック
- **E2Eテスト（Playwright）**: ユーザーフロー全体
- **テストファイル**: `__tests__` ディレクトリまたは同階層に配置

### 10. セキュリティ
- **APIキー**: 環境変数管理、クライアント側は暗号化保存
- **RLS**: データベースレベルのアクセス制御
- **CSRF対策**: NextAuth.jsが自動対応
- **入力検証**: Zodによるバリデーション

## データフロー

### しおり作成フロー
```
User Input (Chat)
  ↓
ChatBox Component
  ↓
/api/chat (AIストリーミング)
  ↓
Zustand Store (currentItinerary更新)
  ↓
ItineraryPreview Component (リアルタイム表示)
  ↓
/api/itinerary/save (Supabaseへ保存)
```

### 認証フロー
```
User clicks LoginButton
  ↓
NextAuth Google OAuth
  ↓
/api/auth/[...nextauth]
  ↓
Session作成（JWT）
  ↓
AuthProvider (useSession)
  ↓
Protected Pages/APIs
```

## デプロイアーキテクチャ

### Vercel（推奨）
- Next.jsネイティブ対応
- 自動ビルド・デプロイ
- Edge Functions対応

### Google Cloud Run + Kubernetes
- Docker コンテナベース
- ArgoCD による GitOps
- ブランチごとの独立環境構築可能
