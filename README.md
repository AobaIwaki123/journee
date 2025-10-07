# Journee

AIとともに旅のしおりを作成するアプリケーション

![](./images/toppage.png)

## 📋 プロジェクト概要

Journeeは、AIアシスタントと対話しながら旅行計画を立て、美しい旅のしおりを自動生成するWebアプリケーションです。チャット形式で旅行の希望を伝えるだけで、AIが最適な旅程を提案し、リアルタイムで旅のしおりを作成します。

## ✨ 主な機能

- **AIチャット機能**: 左側のチャットボックスでAIと対話しながら旅行計画を作成
- **リアルタイムプレビュー**: 右側に旅のしおりをリアルタイムでレンダリング
- **Googleログイン**: Googleアカウントで簡単ログイン
- **一時保存機能**: 作成中のしおりをユーザーごとに自動保存
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
- **認証**: NextAuth.js with Google Provider
- **データベース**: Vercel Postgres または Supabase (最終フェーズで統合)
- **一時保存**: 初期はモックデータ（LocalStorage + Context）、後にDB統合

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
Google Login → NextAuth.js → Authenticated Session
                                    ↓
User Input → Chat UI → API Route → AI (Gemini/Claude) → Response
                                         ↓
                                   Data Processing
                                         ↓
                                   State Update
                                         ↓
                    ┌────────────────────┴────────────────────┐
                    ↓                                         ↓
            Auto Save (5分ごと)                    Itinerary Renderer
                    ↓                                         ↓
      ┌─────────────┴─────────────┐                  Real-time Preview
      ↓                           ↓                          ↓
LocalStorage (Phase 4-8)    Database (Phase 9+)        PDF Export
```

## 📂 ディレクトリ構造（提案）

```
journee/
├── app/
│   ├── (routes)/
│   │   ├── page.tsx              # メインページ
│   │   ├── login/
│   │   │   └── page.tsx          # ログインページ
│   │   └── layout.tsx            # ルートレイアウト
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts      # NextAuth設定
│   │   ├── chat/
│   │   │   └── route.ts          # チャットAPI
│   │   ├── itinerary/
│   │   │   ├── save/
│   │   │   │   └── route.ts      # しおり保存API
│   │   │   ├── load/
│   │   │   │   └── route.ts      # しおり読込API
│   │   │   └── list/
│   │   │       └── route.ts      # しおり一覧API
│   │   ├── generate-pdf/
│   │   │   └── route.ts          # PDF生成API
│   │   └── settings/
│   │       └── route.ts          # 設定管理API
│   └── globals.css
├── components/
│   ├── auth/
│   │   ├── LoginButton.tsx       # ログインボタン
│   │   ├── UserMenu.tsx          # ユーザーメニュー
│   │   └── AuthProvider.tsx      # 認証プロバイダー
│   ├── chat/
│   │   ├── ChatBox.tsx           # チャットコンテナ
│   │   ├── MessageList.tsx       # メッセージ一覧
│   │   ├── MessageInput.tsx      # メッセージ入力
│   │   └── AISelector.tsx        # AIモデル選択
│   ├── itinerary/
│   │   ├── ItineraryPreview.tsx  # しおりプレビュー
│   │   ├── DaySchedule.tsx       # 日程コンポーネント
│   │   ├── SpotCard.tsx          # 観光スポットカード
│   │   ├── MapView.tsx           # 地図表示
│   │   └── SaveButton.tsx        # 保存ボタン
│   ├── pdf/
│   │   └── PDFGenerator.tsx      # PDF生成コンポーネント
│   ├── settings/
│   │   └── APIKeyModal.tsx       # APIキー設定モーダル
│   └── ui/                       # shadcn/uiコンポーネント
├── lib/
│   ├── auth/
│   │   └── auth-options.ts       # NextAuth設定
│   ├── ai/
│   │   ├── gemini.ts             # Gemini API統合
│   │   ├── claude.ts             # Claude API統合
│   │   └── prompts.ts            # プロンプトテンプレート
│   ├── storage/
│   │   ├── mock-storage.ts       # モックストレージ（初期実装）
│   │   └── db-storage.ts         # データベースストレージ（後期実装）
│   ├── utils/
│   │   ├── pdf-generator.ts      # PDF生成ユーティリティ
│   │   └── format.ts             # データフォーマット
│   └── store/
│       └── useStore.ts            # 状態管理
├── types/
│   ├── auth.ts                    # 認証型定義
│   ├── chat.ts                    # チャット型定義
│   ├── itinerary.ts               # しおり型定義
│   └── api.ts                     # API型定義
├── public/
│   └── assets/                    # 画像・アイコン
├── .env.local                     # 環境変数
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🚀 実装フェーズ

### Phase 1: 基礎構築（Week 1-2）
- [x] プロジェクトセットアップ（Next.js + TypeScript + Tailwind CSS）
- [x] 基本的なレイアウト構築（デスクトップ版）
- [x] チャットUIコンポーネントの実装
- [x] しおりプレビューの基本レイアウト
- [x] 状態管理の実装（Zustand / Context API）

### Phase 2: 認証機能（Week 3）✅ **完了**
- [x] NextAuth.jsのセットアップ
- [x] Google OAuth設定
- [x] ログイン/ログアウトUI
- [x] ユーザーメニューコンポーネント
- [x] 認証ミドルウェアの実装
- [x] ログインページの作成

### Phase 3: AI統合（Week 4-5）✅ **完了**
- [x] Gemini API統合
- [x] チャット機能の実装
- [x] プロンプトエンジニアリング
- [x] AIレスポンスのパース処理
- [x] しおりデータの構造化
- [x] ストリーミングレスポンス対応
- [x] UI統合（MessageInput, MessageList, ItineraryPreview）
- [x] エラーハンドリング実装
- [x] しおりデータのリアルタイム更新

### Phase 3.5: UI/UX改善（Week 5.5）✅ **完了**
**目的**: チャット体験を向上させるマークダウンレンダリング機能の追加とUI改善

#### 3.5.1 マークダウンレンダリング機能追加 ✅
- [x] 依存パッケージのインストール
  - `react-markdown`: マークダウンレンダリング
  - `remark-gfm`: GitHub Flavored Markdown対応（テーブル、チェックボックス等）
  - `rehype-raw`: HTMLタグのサポート
- [x] `MessageList.tsx` の更新
  - アシスタントメッセージに `ReactMarkdown` コンポーネントを統合
  - カスタムスタイリング適用（見出し、リスト、コードブロック等）
  - リンクは新しいタブで開く（`target="_blank"`、`rel="noopener noreferrer"`）
- [x] マークダウン専用スタイル定義
  - コードブロックのスタイリング（インライン・ブロック対応）
  - テーブルのスタイリング（レスポンシブ対応）
  - リストのインデント調整（ネスト対応）

**期待される効果**:
- AIの返答が読みやすく、見出しやリストが美しく表示される

**詳細**: [docs/PHASE3.5.1_MARKDOWN_RENDERING.md](./docs/PHASE3.5.1_MARKDOWN_RENDERING.md)

#### 3.5.2 AIモデル選択トグルとテキストハイライト改善 ✅
**目的**: AIモデル選択の視認性向上とテキストボックスの可読性改善

- [x] AIモデル選択トグルの実装
  - [x] トグルスイッチUIの追加（Gemini / Claude切り替え）
  - [x] 現在選択中のモデルを視覚的にハイライト
  - [x] アイコンとラベルで明確に区別（Sparkles / Brain）
  - [x] トグル状態をZustandで管理
  - [x] アニメーション効果の追加（スムーズな切り替え）
  - [x] モバイル対応（タップエリア拡大）

- [x] テキストボックスのハイライト改善
  - [x] テキスト入力エリアのフォーカス時のボーダーカラー調整
  - [x] プレースホルダーテキストの視認性向上
  - [x] 入力中のテキストカラーのコントラスト改善
  - [x] ダークモード対応を見据えたカラーパレット設計
  - [x] フォーカス状態のアウトラインスタイル最適化

**期待される効果**:
- ユーザーが現在使用しているAIモデルを一目で把握できる
- テキスト入力時の視認性が向上し、快適な入力体験を提供
- アクセシビリティの向上（WCAG準拠のカラーコントラスト）

**関連コンポーネント**:
- `components/chat/AISelector.tsx`
- `components/chat/MessageInput.tsx`

**詳細**: [docs/PHASE3.5.2_UI_IMPROVEMENTS.md](./docs/PHASE3.5.2_UI_IMPROVEMENTS.md)

### Phase 4: 段階的旅程構築システム（Week 6-7） 🆕
**目的**: 一度のリクエストで全てを完結させるのではなく、複数回のリクエストで段階的に旅程を構築

**アーキテクチャ**:
1. **基本情報収集**: 行き先、期間、人数、興味を確認
2. **骨組み作成**: 各日の大まかなテーマ（エリア・コンセプト）を決定
3. **日程詳細化**: 1日ずつ具体的な観光スポット、時間、移動手段を追加
4. **最終調整**: 全体のバランス調整、予算確認

#### 4.1 型定義の拡張
- [ ] `DayStatus` 型の追加（draft/skeleton/detailed/completed）
- [ ] `ItineraryPhase` 型の追加（initial/collecting/skeleton/detailing/completed）
- [ ] `DaySchedule` に `status`, `theme` プロパティ追加
- [ ] `ItineraryData` に `phase`, `currentDay` プロパティ追加

#### 4.2 状態管理の拡張
- [ ] `planningPhase`, `currentDetailingDay` の状態管理
- [ ] `proceedToNextStep` 関数の実装

#### 4.3 プロンプトシステムの改善
- [ ] `INCREMENTAL_SYSTEM_PROMPT` の作成
- [ ] `createSkeletonPrompt` 関数の実装（骨組み作成用）
- [ ] `createDayDetailPrompt` 関数の実装（日程詳細化用）
- [ ] `createNextStepPrompt` 関数の実装（次のステップ誘導）

#### 4.4 UIコンポーネントの追加
- [ ] `PlanningProgress` コンポーネント（進捗インジケーター）
- [ ] `QuickActions` コンポーネント（「次へ」ボタン）
- [ ] `ItineraryPreview` にプログレス表示を統合

#### 4.5 APIの拡張
- [ ] チャットAPIにフェーズ判定ロジックを追加
- [ ] 自動進行のトリガー実装（「次へ」の検出）
- [ ] レスポンスパース処理の改善

#### 4.6 しおりマージロジックの改善
- [ ] 骨組み段階のマージ処理
- [ ] 日程詳細化のマージ処理（既存の日を保持）

#### 4.7 テスト・デバッグ
- [ ] 骨組み作成のテスト
- [ ] 日程詳細化のテスト（複数日）
- [ ] ユーザー介入（修正要求）のテスト

**詳細**: [docs/PHASE4_INCREMENTAL_PLANNING.md](./docs/PHASE4_INCREMENTAL_PLANNING.md)

### Phase 5: しおり機能統合（Week 8-10）
**目的**: しおりの詳細表示、一時保存、PDF出力を統合的に実装

#### 5.1 しおりコンポーネントの詳細実装

##### 5.1.1 基本表示コンポーネント（Step 1）
**目的**: しおりの基本的な表示コンポーネントを実装（読み取り専用）

- [ ] タイトル・サマリーコンポーネントの実装
  - [ ] `ItineraryHeader.tsx` - タイトル、目的地、期間表示
  - [ ] `ItinerarySummary.tsx` - サマリー、総予算、ステータス表示
  - [ ] レスポンシブレイアウト対応
  - [ ] Tailwind CSSによるスタイリング
- [ ] 日程表コンポーネントの実装
  - [ ] `DaySchedule.tsx` の詳細実装
  - [ ] 日付・曜日の表示
  - [ ] 1日の総移動距離・総費用の表示
  - [ ] タイムライン形式のレイアウト
  - [ ] 折りたたみ機能（アコーディオン）
- [ ] 観光スポット詳細カードの実装
  - [ ] `SpotCard.tsx` の詳細実装
  - [ ] カテゴリー別アイコン表示（観光・食事・移動・宿泊）
  - [ ] 時刻・所要時間の表示
  - [ ] 費用の表示
  - [ ] 説明・ノートの表示
  - [ ] カードホバー効果・アニメーション
- [ ] 空状態（しおりがない場合）の実装
  - [ ] EmptyItinerary コンポーネント
  - [ ] 案内メッセージとCTA

**期待される効果**: 
- しおりの基本的な情報が美しく読みやすく表示される
- ユーザーがAIで生成した旅程を一目で把握できる

##### 5.1.2 インタラクティブ機能（Step 2）
**目的**: ユーザーがしおりを編集・カスタマイズできる機能を追加

- [ ] リアルタイム更新機能の実装
  - [ ] Zustandストアとの連携強化
  - [ ] しおりデータ変更の即座反映
  - [ ] 更新アニメーション（フェードイン等）
  - [ ] 楽観的UI更新（Optimistic UI）
- [ ] 編集機能の追加
  - [ ] `EditableTitle.tsx` - タイトル編集
  - [ ] `EditableSpotCard.tsx` - スポット情報の編集
  - [ ] インライン編集UI（クリックで編集モード）
  - [ ] 編集中の視覚的フィードバック
  - [ ] 編集のキャンセル・保存機能
  - [ ] バリデーション（必須項目、文字数制限等）
- [ ] スポット操作機能
  - [ ] スポットの並び替え（ドラッグ&ドロップ）
  - [ ] スポットの削除（確認ダイアログ付き）
  - [ ] スポットの追加（手動入力フォーム）
  - [ ] 日程間のスポット移動
- [ ] UIフィードバック
  - [ ] 保存中のローディング状態
  - [ ] 成功・エラー通知（Toast）
  - [ ] 変更の取り消し機能（Undo）

**期待される効果**:
- ユーザーがAI生成のしおりを自由にカスタマイズできる
- 直感的な編集操作でストレスフリーな体験

##### 5.1.3 高度な機能（Step 3）
**目的**: 地図統合とテンプレート機能で完成度を高める

- [ ] 地図統合（Google Maps API）
  - [ ] Google Maps JavaScript APIのセットアップ
  - [ ] `MapView.tsx` コンポーネントの実装
  - [ ] 観光スポットのマーカー表示
  - [ ] マーカークリックで詳細表示
  - [ ] 移動ルートの描画（Directions API）
  - [ ] 地図とスポットカードの連動（ホバー・クリック）
  - [ ] 地図の表示/非表示切り替え
  - [ ] モバイル対応（タッチ操作）
- [ ] しおりテンプレートの実装
  - [ ] テンプレート選択UI
  - [ ] テンプレートのデザイン（3種類以上）
    - [ ] クラシック（シンプル・読みやすい）
    - [ ] モダン（カラフル・ビジュアル重視）
    - [ ] ミニマル（白黒・印刷向け）
  - [ ] テンプレート切り替え機能
  - [ ] テンプレート設定の保存
- [ ] パフォーマンス最適化
  - [ ] React.memo による再レンダリング抑制
  - [ ] useMemo/useCallback の適切な使用
  - [ ] 仮想スクロール（長い日程の場合）
  - [ ] 画像の遅延読み込み

**期待される効果**:
- 視覚的に観光ルートを把握できる
- 好みのデザインでしおりをカスタマイズできる
- 大規模なしおりでもスムーズに動作

#### 5.2 一時保存機能（LocalStorage版）
- [ ] モックストレージの実装（LocalStorage + Context）
- [ ] 保存APIの実装（モックデータ）
  - [ ] しおり保存API
  - [ ] しおり読込API
  - [ ] しおり一覧API
- [ ] 自動保存機能（5分ごと）
- [ ] 保存・読込UIコンポーネント
- [ ] ユーザーごとのデータ分離（ローカル）
- [ ] 保存状態のビジュアルフィードバック

#### 5.3 PDF出力機能
- [ ] PDF生成ライブラリの統合（react-pdf / jsPDF）
- [ ] しおりのPDFレイアウト設計
- [ ] PDF出力機能の実装
- [ ] 印刷最適化
- [ ] PDFプレビュー機能
- [ ] PDF出力ボタンUIの実装

**期待される効果**:
- しおりの作成から保存、出力までの一連の流れがシームレスに
- ユーザーは作成中のしおりを失うことなく、いつでも再開可能
- 美しいPDFで旅のしおりを印刷・共有できる

### Phase 6: Claude API統合（Week 11）
**目的**: Gemini APIに加えて、Claude APIを選択可能にする

#### 6.1 APIキー管理
- [ ] APIキー管理UIの実装
- [ ] ローカルストレージでのAPIキー保存（暗号化）
- [ ] APIキーの検証機能

#### 6.2 Claude API統合
- [ ] Claude API クライアントの実装
- [ ] ストリーミングレスポンス対応
- [ ] Gemini APIと同じインターフェース実装

#### 6.3 AIモデル切り替え機能
- [ ] AIセレクターUIの拡張
- [ ] モデル切り替え時の状態管理
- [ ] AI切り替え時の動作確認とテスト

### Phase 7: UI最適化・レスポンシブ対応（Week 12-13）
**目的**: デスクトップとモバイルの両方で最適なUXを提供

#### 7.1 リサイザー機能実装
- [ ] `ResizablePanel.tsx` コンポーネントの作成
  - [ ] ドラッグ可能なリサイザーバーの実装
  - [ ] マウスイベント（`mousedown`, `mousemove`, `mouseup`）のハンドリング
  - [ ] タッチイベント対応（モバイル互換性）
  - [ ] 最小幅・最大幅の制限（チャット: 30-70%、しおり: 30-70%）
- [ ] `app/page.tsx` の更新
  - [ ] 固定幅（`w-2/5`, `w-3/5`）から動的幅に変更
  - [ ] リサイザーコンポーネントの統合
  - [ ] リサイズ状態の管理（`useState` または Zustand）
- [ ] LocalStorage による幅の永続化
  - [ ] ユーザーが設定した幅を保存
  - [ ] ページリロード時に復元
- [ ] リサイザーバーのUI実装
  - [ ] ホバー時のビジュアルフィードバック
  - [ ] ドラッグ中のカーソル変更（`cursor: col-resize`）
  - [ ] 縦の区切り線デザイン

#### 7.2 モバイル対応
- [ ] レスポンシブデザインの実装
- [ ] タブ切り替え機能（チャット/しおり）
- [ ] モバイル最適化UI
- [ ] タッチジェスチャー対応
- [ ] PWA対応（オプション）
- [ ] モバイル用のナビゲーション
- [ ] 小画面でのフォント・レイアウト調整

**期待される効果**:
- デスクトップでは自由にレイアウトをカスタマイズ可能
- モバイルでも快適にしおり作成が可能
- あらゆるデバイスで最適なUX

### Phase 8: データベース統合（Week 14-15）
**目的**: LocalStorageからデータベースへ移行し、永続的なデータ保存を実現

#### 8.1 データベースセットアップ
- [ ] データベーススキーマ設計
- [ ] Vercel PostgresまたはSupabaseのセットアップ
- [ ] マイグレーションスクリプトの作成

#### 8.2 データベースストレージの実装
- [ ] データベースクライアントの実装
- [ ] CRUD操作の実装（作成、読込、更新、削除）
- [ ] トランザクション処理

#### 8.3 モックストレージからの移行
- [ ] APIルートの更新（LocalStorage → DB）
- [ ] データマイグレーション機能
- [ ] 後方互換性の確保

#### 8.4 しおり管理機能
- [ ] しおり一覧・履歴機能
- [ ] しおり削除機能
- [ ] しおり検索・フィルター機能

### Phase 9: 最適化・テスト（Week 16）
**目的**: アプリケーション全体の品質向上とテストカバレッジの確保

#### 9.1 パフォーマンス最適化
- [ ] コンポーネントの最適化（React.memo、useMemo、useCallback）
- [ ] 画像の最適化（遅延読み込み、WebP変換）
- [ ] バンドルサイズの最適化
- [ ] Lighthouse スコア改善

#### 9.2 テスト実装
- [ ] ユニットテスト（Jest + React Testing Library）
- [ ] E2Eテスト（Playwright）
- [ ] APIテスト
- [ ] テストカバレッジ80%以上

#### 9.3 品質向上
- [ ] エラーハンドリング強化
- [ ] アクセシビリティ対応（WCAG 2.1 AA準拠）
- [ ] セキュリティ監査
- [ ] コードレビュー・リファクタリング

### Phase 10: デプロイ・運用（Week 17-18）
**目的**: 本番環境へのデプロイと運用体制の確立

#### 10.1 デプロイ設定
- [ ] Vercelへのデプロイ
- [ ] 環境変数の設定
- [ ] ドメイン設定
- [ ] SSL証明書の設定

#### 10.2 モニタリング・ログ
- [ ] モニタリング設定（Vercel Analytics）
- [ ] エラートラッキング（Sentry等）
- [ ] ログ管理
- [ ] アラート設定

#### 10.3 ドキュメント整備
- [ ] API ドキュメント
- [ ] ユーザーガイド作成
- [ ] 開発者向けドキュメント
- [ ] トラブルシューティングガイド

## 🐛 バグ修正・技術的負債

このセクションには、各Phaseから独立した既知のバグ修正や技術的負債の解消タスクをまとめます。

### BUG-001: JSON削除バグ修正 ✅ **完了** (2025-10-07)
**発生状況**: AIからのレスポンスに生のJSONブロックが表示される（ストリーミング中・完了後の両方）

**修正内容**:
- [x] `lib/ai/prompts.ts` の `parseAIResponse` 関数を修正
  - JSON抽出後、メッセージ部分からJSONブロック全体を完全に削除
  - 正規表現を使用して ```json ... ``` ブロックを除去
  - 前後の余分な空白・改行を削除
- [x] `components/chat/MessageInput.tsx` の修正
  - ストリーミング完了後に `parseAIResponse` を適用
  - クリーンなメッセージのみをチャット履歴に保存
- [x] `components/chat/MessageList.tsx` の修正
  - ストリーミング中のリアルタイム表示でJSONブロックを除去
  - 完全なJSONブロック（```json ... ```）を非表示
  - 不完全なJSONブロック（ストリーミング途中）も非表示
  - `useMemo` でパフォーマンス最適化
- [x] エッジケース対応
  - 複数のJSONブロックが含まれる場合の処理
  - JSONブロックの前後にメッセージがない場合のデフォルトメッセージ
  - 不正なJSON形式の場合のエラーハンドリング
  - ストリーミング中の部分的なJSONブロックの処理
- [x] テスト
  - JSON含むレスポンスの表示確認
  - JSON除外後のメッセージ整形確認
  - ユーザーに表示されるメッセージにJSONが含まれていないことを確認

**実装結果**: 
- ✅ **3段階のJSONブロック防御システムを実装**
  1. サーバー側: `parseAIResponse` でJSONを分離
  2. クライアント側（完了時）: `parseAIResponse` で再処理
  3. クライアント側（リアルタイム）: `removeJsonBlocks` でフィルタリング
- ✅ すべてのJSONブロックが正しく削除される
- ✅ ストリーミング中も完了後もJSONは一切表示されない
- ✅ 複数JSONブロック対応済み（最初のJSONのみ使用）
- ✅ 不完全なJSONブロック（ストリーミング途中）も非表示
- ✅ JSONブロックの前後のメッセージが正しく結合される
- ✅ 余分な空白・改行が整理される
- ✅ メッセージがない場合「しおりを更新しました。」を表示
- ✅ 7つのテストケースで動作確認済み

**コミット履歴**:
- `ae8ac7b`: parseAIResponse関数の修正（基礎実装）
- `b989ad5`: README.md更新
- `9122843`: ストリーミング中・完了後のJSONブロック表示を完全に防止

**関連Phase**: Phase 3（AI統合）

---

## 💡 実装上の重要ポイント

### セキュリティ
- **認証**: NextAuth.jsによる安全な認証フロー
- **APIキー管理**: クライアント側で暗号化して保存
- **サーバーサイド処理**: AI APIはサーバーサイドから呼び出し
- **レート制限**: API呼び出しの制限実装
- **入力値バリデーション**: Zodによる厳格なバリデーション
- **セッション管理**: JWT/データベースセッションの適切な管理

### データ保存戦略
#### Phase 5-7（モックデータ期間）
- **LocalStorage**: ブラウザのLocalStorageにユーザーIDをキーとして保存
- **Context API**: アプリ全体でのデータ共有
- **自動保存**: 5分ごとまたは変更時に自動保存
- **データ構造**: JSON形式でシリアライズ可能な構造

#### Phase 8以降（データベース統合後）
- **データベース**: Vercel PostgresまたはSupabase
- **マイグレーション**: モックデータから段階的に移行
- **互換性**: 既存のAPIインターフェースを維持
- **バックアップ**: 定期的なデータバックアップ

### パフォーマンス
- **ストリーミングレスポンス**: AIレスポンスのリアルタイム表示
- **画像の遅延読み込み**: Next.js Imageコンポーネント活用
- **コンポーネント最適化**: React.memo、useMemo、useCallback
- **PDF生成**: Web Workerでの非同期処理
- **コード分割**: 動的インポートによる初期ロード最適化

### UX
- **ローディング状態**: Skeletonローダー、プログレスバー
- **エラーハンドリング**: ユーザーフレンドリーなエラーメッセージ
- **オンボーディング**: 初回利用時のガイドツアー
- **オフライン対応**: LocalStorageによるオフライン編集（モック期間）
- **自動保存通知**: 保存状態のビジュアルフィードバック
- **レスポンシブデザイン**: すべてのデバイスで快適な操作

## 🔧 開発環境セットアップ

### 🐳 Docker環境（推奨）

ローカル環境を汚さずに開発できます。

```bash
# リポジトリのクローン
git clone <repository-url>
cd journee

# 環境変数の設定
cp .env.example .env.local

# Dockerコンテナの起動
npm run docker:start

# ブラウザでアクセス
# http://localhost:3000
```

**詳細は [DOCKER.md](./DOCKER.md) を参照してください。**

### ローカル環境

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
# AI API
GEMINI_API_KEY=your_gemini_api_key

# 認証
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key

# データベース（Phase 9以降）
DATABASE_URL=your_database_url
```

## 🗄️ データベーススキーマ（Phase 8実装時）

```sql
-- ユーザーテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image TEXT,
  google_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- しおりテーブル
CREATE TABLE itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  destination VARCHAR(255),
  start_date DATE,
  end_date DATE,
  content JSONB NOT NULL, -- しおりの詳細データ（JSON形式）
  status VARCHAR(50) DEFAULT 'draft', -- draft, completed, archived
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- チャット履歴テーブル
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- user, assistant
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- APIキー設定テーブル（暗号化して保存）
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  encrypted_claude_api_key TEXT,
  ai_model_preference VARCHAR(50) DEFAULT 'gemini', -- gemini, claude
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- インデックス
CREATE INDEX idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX idx_itineraries_created_at ON itineraries(created_at DESC);
CREATE INDEX idx_chat_messages_itinerary_id ON chat_messages(itinerary_id);
```

## 📝 今後の拡張機能

### コア機能（Phase 10以降）
- [ ] しおりのテンプレート選択（複数デザイン）
- [ ] SNS共有機能（Twitter、Instagram、LINE）
- [ ] 多言語対応（英語、中国語、韓国語など）
- [ ] オフライン対応（PWA、Service Worker）
- [ ] ダークモード対応

### 高度な機能
- [ ] 予算管理機能
  - [ ] 予算入力・管理
  - [ ] 支出追跡
  - [ ] 為替レート対応
- [ ] 天気情報の統合
  - [ ] 旅行先の天気予報
  - [ ] 服装アドバイス
- [ ] 外部サービス連携
  - [ ] ホテル予約連携（Booking.com、Expedia等）
  - [ ] レストラン予約連携（食べログ、ぐるなび等）
  - [ ] 交通機関予約連携
- [ ] コラボレーション機能
  - [ ] 複数人での共同編集
  - [ ] リアルタイム同期
  - [ ] コメント・提案機能
- [ ] AIアシスタント強化
  - [ ] 音声入力対応
  - [ ] 画像認識（観光スポット検索）
  - [ ] パーソナライズされた提案

## 📄 ライセンス

MIT

## 👥 コントリビューション

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

---

**開発状況**: ✅ Phase 1, 2, 3, 3.5 完了・統合済み → 次は Phase 4（段階的旅程構築システム）

**実装済み機能**:
- ✅ **Phase 1**: Next.js + TypeScript + Tailwind CSS セットアップ
- ✅ **Phase 1**: デスクトップ版レイアウト（チャット40% / しおり60%）
- ✅ **Phase 1**: チャットUI（メッセージ送受信、AIモデル選択）
- ✅ **Phase 1**: しおりプレビュー（日程表示、観光スポット）
- ✅ **Phase 1**: Zustand状態管理
- ✅ **Phase 2**: 認証システム（NextAuth.js + Google OAuth）
- ✅ **Phase 2**: ユーザー管理（ログイン/ログアウト、ユーザーメニュー）
- ✅ **Phase 3**: Gemini API統合
- ✅ **Phase 3**: AIチャット機能（リアルタイムストリーミング対応）
- ✅ **Phase 3**: しおり自動生成・更新機能
- ✅ **Phase 3**: エラーハンドリング
- ✅ **Phase 3.5.1**: マークダウンレンダリング機能（見出し、リスト、コード、テーブル）
- ✅ **Phase 3.5.2**: AIモデル選択トグル、テキストボックスハイライト改善
- ✅ **BUG-001**: JSON削除バグ修正（3段階防御システム実装）

**次の実装**: 
- **Phase 4** - 段階的旅程構築システム（骨組み作成 → 日程詳細化）
- **Phase 5** - しおり機能統合（詳細実装 + 一時保存 + PDF出力）
- **Phase 6** - Claude API統合
- **Phase 7** - UI最適化・レスポンシブ対応（リサイザー + モバイル）

**最終更新**: 2025-10-07

**詳細ドキュメント**:
- [Phase 3 統合完了レポート](./docs/PHASE3_INTEGRATION_COMPLETE.md)
- [API ドキュメント](./PHASE3_API_DOCUMENTATION.md)
