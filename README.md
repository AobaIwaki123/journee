# Journee

AIとともに旅のしおりを作成するアプリケーション

## 📋 プロジェクト概要

Journeeは、AIアシスタントと対話しながら旅行計画を立て、美しい旅のしおりを自動生成するWebアプリケーションです。チャット形式で旅行の希望を伝えるだけで、AIが最適な旅程を提案し、リアルタイムで旅のしおりを作成します。

## ✨ 主な機能

- **AIチャット機能**: 左側のチャットボックスでAIと対話しながら旅行計画を作成
- **リアルタイムプレビュー**: 右側に旅のしおりをリアルタイムでレンダリング
- **PDF出力**: 完成した旅のしおりをPDFとして保存・印刷
- **レスポンシブデザイン**: モバイル対応の最適化されたレイアウト
- **AIモデル選択**: 基本はGemini API、本格利用時はClaude APIに切り替え可能
- **APIキー管理**: UI上からClaudeのAPIキーを登録・管理

## 🛠 技術スタック（推奨）

### フロントエンド
- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: shadcn/ui
- **PDF生成**: react-pdf または jsPDF
- **状態管理**: Zustand または React Context
- **フォーム管理**: React Hook Form + Zod

### バックエンド
- **API Routes**: Next.js API Routes
- **AI統合**: 
  - Google Gemini API (デフォルト)
  - Anthropic Claude API (オプション)
- **データベース**: Vercel Postgres または Supabase (旅行履歴保存用)
- **認証**: NextAuth.js (将来的な実装)

### デプロイ
- **ホスティング**: Vercel
- **環境変数管理**: Vercel Environment Variables

## 🏗 アーキテクチャ設計

### レイアウト構成

#### デスクトップ版
```
┌─────────────────────────────────────────┐
│           Header (ナビゲーション)          │
├──────────────────┬──────────────────────┤
│                  │                      │
│   チャットボックス  │   旅のしおりプレビュー   │
│   (左側 40%)     │   (右側 60%)         │
│                  │                      │
│  - メッセージ履歴  │  - タイトル           │
│  - 入力フォーム    │  - 日程表            │
│  - AI選択        │  - 観光スポット        │
│  - 設定          │  - 地図              │
│                  │  - PDF出力ボタン      │
│                  │                      │
└──────────────────┴──────────────────────┘
```

#### モバイル版
```
┌─────────────────────┐
│  Header             │
├─────────────────────┤
│  タブ切り替え         │
│  [チャット|しおり]    │
├─────────────────────┤
│                     │
│  選択されたビュー      │
│  (全幅表示)          │
│                     │
└─────────────────────┘
```

### データフロー
```
User Input → Chat UI → API Route → AI (Gemini/Claude) → Response
                                         ↓
                                   Data Processing
                                         ↓
                                   State Update
                                         ↓
                              Itinerary Renderer → PDF Export
```

## 📂 ディレクトリ構造（提案）

```
journee/
├── app/
│   ├── (routes)/
│   │   ├── page.tsx              # メインページ
│   │   └── layout.tsx            # ルートレイアウト
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts          # チャットAPI
│   │   ├── generate-pdf/
│   │   │   └── route.ts          # PDF生成API
│   │   └── settings/
│   │       └── route.ts          # 設定管理API
│   └── globals.css
├── components/
│   ├── chat/
│   │   ├── ChatBox.tsx           # チャットコンテナ
│   │   ├── MessageList.tsx       # メッセージ一覧
│   │   ├── MessageInput.tsx      # メッセージ入力
│   │   └── AISelector.tsx        # AIモデル選択
│   ├── itinerary/
│   │   ├── ItineraryPreview.tsx  # しおりプレビュー
│   │   ├── DaySchedule.tsx       # 日程コンポーネント
│   │   ├── SpotCard.tsx          # 観光スポットカード
│   │   └── MapView.tsx           # 地図表示
│   ├── pdf/
│   │   └── PDFGenerator.tsx      # PDF生成コンポーネント
│   ├── settings/
│   │   └── APIKeyModal.tsx       # APIキー設定モーダル
│   └── ui/                       # shadcn/uiコンポーネント
├── lib/
│   ├── ai/
│   │   ├── gemini.ts             # Gemini API統合
│   │   ├── claude.ts             # Claude API統合
│   │   └── prompts.ts            # プロンプトテンプレート
│   ├── utils/
│   │   ├── pdf-generator.ts     # PDF生成ユーティリティ
│   │   └── format.ts            # データフォーマット
│   └── store/
│       └── useStore.ts           # 状態管理
├── types/
│   ├── chat.ts                   # チャット型定義
│   ├── itinerary.ts              # しおり型定義
│   └── api.ts                    # API型定義
├── public/
│   └── assets/                   # 画像・アイコン
├── .env.local                    # 環境変数
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🚀 実装フェーズ

### Phase 1: 基礎構築（Week 1-2）
- [x] プロジェクトセットアップ（Next.js + TypeScript + Tailwind CSS）
- [ ] 基本的なレイアウト構築（デスクトップ版）
- [ ] チャットUIコンポーネントの実装
- [ ] しおりプレビューの基本レイアウト
- [ ] 状態管理の実装

### Phase 2: AI統合（Week 3-4）
- [ ] Gemini API統合
- [ ] チャット機能の実装
- [ ] プロンプトエンジニアリング
- [ ] AIレスポンスのパース処理
- [ ] しおりデータの構造化

### Phase 3: しおり機能（Week 5-6）
- [ ] しおりコンポーネントの詳細実装
  - [ ] タイトル・サマリー
  - [ ] 日程表
  - [ ] 観光スポット詳細
  - [ ] 地図統合（Google Maps API）
- [ ] リアルタイム更新機能
- [ ] 編集機能の追加

### Phase 4: PDF出力（Week 7）
- [ ] PDF生成ライブラリの統合
- [ ] しおりのPDFレイアウト設計
- [ ] PDF出力機能の実装
- [ ] 印刷最適化

### Phase 5: Claude API統合（Week 8）
- [ ] APIキー管理UI
- [ ] Claude API統合
- [ ] AIモデル切り替え機能
- [ ] ローカルストレージでのAPIキー保存（暗号化）

### Phase 6: モバイル対応（Week 9）
- [ ] レスポンシブデザインの実装
- [ ] タブ切り替え機能
- [ ] モバイル最適化UI
- [ ] タッチジェスチャー対応

### Phase 7: 最適化・テスト（Week 10）
- [ ] パフォーマンス最適化
- [ ] エラーハンドリング
- [ ] ユニットテスト
- [ ] E2Eテスト
- [ ] アクセシビリティ対応

### Phase 8: デプロイ・運用（Week 11-12）
- [ ] Vercelへのデプロイ
- [ ] 環境変数の設定
- [ ] ドメイン設定
- [ ] モニタリング設定
- [ ] ドキュメント整備

## 💡 実装上の重要ポイント

### セキュリティ
- APIキーはクライアント側で暗号化して保存
- サーバーサイドでのAPI呼び出し処理
- レート制限の実装
- 入力値のバリデーション

### パフォーマンス
- ストリーミングレスポンス対応
- 画像の遅延読み込み
- コンポーネントの最適化（React.memo）
- PDF生成の非同期処理

### UX
- ローディング状態の明示
- エラーメッセージの適切な表示
- オンボーディング体験
- レスポンシブなフィードバック

## 🔧 開発環境セットアップ

```bash
# リポジトリのクローン
git clone <repository-url>
cd journee

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localにAPIキーを設定

# 開発サーバーの起動
npm run dev
```

### 必要な環境変数
```
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key
DATABASE_URL=your_database_url (optional)
```

## 📝 今後の拡張機能

- [ ] ユーザー認証・ログイン機能
- [ ] 旅行履歴の保存・管理
- [ ] しおりのテンプレート選択
- [ ] SNS共有機能
- [ ] 多言語対応
- [ ] 予算管理機能
- [ ] 天気情報の統合
- [ ] ホテル・レストラン予約連携
- [ ] コラボレーション機能（複数人で編集）

## 📄 ライセンス

MIT

## 👥 コントリビューション

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

---

**開発状況**: 🚧 企画・設計フェーズ
