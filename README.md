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

### Phase 3.5: UI/UX改善（Week 5.5）
**目的**: チャット体験を向上させるマークダウンレンダリング機能の追加

#### 3.5.1 マークダウンレンダリング機能追加
- [ ] 依存パッケージのインストール
  - `react-markdown`: マークダウンレンダリング
  - `remark-gfm`: GitHub Flavored Markdown対応（テーブル、チェックボックス等）
  - `rehype-raw`: HTMLタグのサポート
- [ ] `MessageList.tsx` の更新
  - アシスタントメッセージに `ReactMarkdown` コンポーネントを統合
  - カスタムスタイリング適用（見出し、リスト、コードブロック等）
  - リンクは新しいタブで開く（`target="_blank"`、`rel="noopener noreferrer"`）
- [ ] マークダウン専用スタイル定義
  - コードブロックのシンタックスハイライト（オプション: `react-syntax-highlighter`）
  - テーブルのスタイリング
  - リストのインデント調整

**期待される効果**:
- AIの返答が読みやすく、見出しやリストが美しく表示される

### Phase 4: 段階的旅程構築システム（Week 6-7） 🆕
**目的**: 一度のリクエストで全てを完結させるのではなく、複数回のリクエストで段階的に旅程を構築

**アーキテクチャ**:
1. **基本情報収集**: 行き先、期間、人数、興味を確認
2. **骨組み作成**: 各日の大まかなテーマ（エリア・コンセプト）を決定
3. **日程詳細化**: 1日ずつ具体的な観光スポット、時間、移動手段を追加
4. **最終調整**: 全体のバランス調整、予算確認

#### 4.1 型定義の拡張 ✅ **完了**
- [x] `DayStatus` 型の追加（draft/skeleton/detailed/completed）
- [x] `ItineraryPhase` 型の追加（initial/collecting/skeleton/detailing/completed）
- [x] `DaySchedule` に `status`, `theme` プロパティ追加
- [x] `ItineraryData` に `phase`, `currentDay` プロパティ追加

#### 4.2 状態管理の拡張 ✅ **完了**
- [x] `planningPhase`, `currentDetailingDay` の状態管理
- [x] `proceedToNextStep` 関数の実装
- [x] `resetPlanning` 関数の実装
- [x] フェーズ遷移ロジックの実装とテストシナリオ作成

#### 4.3 プロンプトシステムの改善 ✅ **完了**
- [x] `INCREMENTAL_SYSTEM_PROMPT` の作成
- [x] `createSkeletonPrompt` 関数の実装（骨組み作成用）
- [x] `createDayDetailPrompt` 関数の実装（日程詳細化用）
- [x] `createNextStepPrompt` 関数の実装（次のステップ誘導）
- [x] `getSystemPromptForPhase` 関数の実装（フェーズ別プロンプト選択）
- [x] テストケースとモックデータの作成

#### 4.4 UIコンポーネントの追加 ✅ **完了**
- [x] `PlanningProgress` コンポーネント（進捗インジケーター）
- [x] `QuickActions` コンポーネント（「次へ」ボタン）
- [x] `ItineraryPreview` にプログレス表示を統合
- [x] `DaySchedule` にステータスバッジとテーマ表示を追加
- [x] レスポンシブレイアウトの実装

#### 4.5 APIの拡張 ✅ **完了**
- [x] チャットAPIにフェーズ判定ロジックを追加
- [x] 自動進行のトリガー実装（「次へ」の検出）
- [x] Geminiクライアントにフェーズ別プロンプトを統合
- [x] フロントエンドでフェーズ情報をAPIに送信
- [x] QuickActionsボタンでAIメッセージ送信を実装

#### 4.6 しおりマージロジックの改善
- [ ] 骨組み段階のマージ処理
- [ ] 日程詳細化のマージ処理（既存の日を保持）

#### 4.7 テスト・デバッグ
- [ ] 骨組み作成のテスト
- [ ] 日程詳細化のテスト（複数日）
- [ ] ユーザー介入（修正要求）のテスト

#### 4.8 フェーズ移動処理の半自動化 🆕 ✅ **部分完了**（4.8.1-4.8.3）
**目的**: チャット内容から自動的に必要情報の充足度を判定し、次のフェーズへ進むタイミングを視覚的に示す

##### 4.8.1 情報充足度チェックシステム ✅ **完了**
- [x] チェックリスト型定義の作成
  - [x] `RequirementChecklistItem` 型（項目名、必須/オプション、充足状態）
  - [x] `PhaseRequirements` 型（各フェーズで必要な情報のリスト）
  - [x] `ChecklistStatus` 型（全体の充足率、必須項目の充足状態）
  - [x] `ButtonReadiness` 型（ボタンの準備度）
- [x] 状態管理の拡張（Zustand）
  - [x] `requirementsChecklist` 状態の追加
  - [x] `checklistStatus` 状態の追加
  - [x] `buttonReadiness` 状態の追加
  - [x] `updateChecklist` アクション
  - [x] `getChecklistForPhase` 関数

##### 4.8.2 チャット内容の自動解析 ✅ **完了**
- [x] 情報抽出ロジックの実装
  - [x] `extractDestination` 関数（行き先の検出）
  - [x] `extractDuration` 関数（日程の検出）
  - [x] `extractBudget` 関数（予算の検出）
  - [x] `extractTravelers` 関数（人数の検出）
  - [x] `extractInterests` 関数（興味・テーマの検出）
  - [x] `extractThemeIdeas`, `extractAreaPreferences` など
- [x] リアルタイム更新
  - [x] メッセージ追加時にチェックリストを自動更新
  - [x] しおりデータ更新時にチェックリストを自動更新
  - [x] `useEffect`でチェックリストを監視

##### 4.8.3 QuickActionsボタンの動的スタイリング ✅ **完了**
- [x] ボタンスタイルの条件分岐
  - [x] 必須情報が揃っている場合: 強調表示（緑/脈動アニメーション）
  - [x] 一部情報が不足: 通常表示（青）
  - [x] 情報が大幅に不足: 抑制表示（グレー + 警告アイコン）
- [x] ツールチップの動的表示
  - [x] 不足している情報を列挙（`buttonReadiness.tooltip`）
  - [x] 画面下部に不足情報のヒント表示
- [x] アテンション効果
  - [x] 必須情報が揃った瞬間に脈動アニメーション（`animate-pulse`）
  - [x] アイコンの動的変化（Check/AlertCircle/ArrowRight）

##### 4.8.4 チェックリスト表示UI ✅ **完了**
- [x] `RequirementsChecklist` コンポーネント
  - [x] アコーディオン形式で折りたたみ可能
  - [x] 各項目のチェックマーク表示
  - [x] 充足率プログレスバー
  - [x] 不足情報の入力促進メッセージ
- [x] `ItineraryPreview` との統合
  - [x] チェックリストをプログレスバー下部に表示
  - [x] 必須/オプション項目の区別表示
  - [x] リアルタイム更新対応

**実装完了**:
- ✅ Phase 4.8.1-4.8.4: 情報充足度判定、チェックリスト表示、動的スタイリング
- ✅ 強制進行機能は4.8.3で実装済み（警告ダイアログ）

**期待される効果**:
- ✅ ユーザーが適切なタイミングで次のフェーズへ進める
- ✅ 情報不足による不完全なしおり生成を防ぐ
- ✅ 柔軟性を保ちつつ、ガイダンスを提供
- ✅ チェックリストで不足情報が一目でわかる

#### 4.9 日程作成処理の並列化 🆕
**目的**: 骨組み作成後の各日程の詳細化を並列処理し、しおり作成を高速化

##### 4.9.1 並列処理APIの設計 ✅ **完了**
- [x] バッチリクエスト型定義
  - [x] `BatchDayDetailRequest` 型（複数日の詳細化リクエスト）
  - [x] `DayDetailTask` 型（各日の詳細化タスク）
  - [x] `BatchDayDetailResponse` 型（並列処理の結果）
  - [x] `MultiStreamChunk` 型の拡張（進捗情報、エラーハンドリング）
- [x] 新しいAPIエンドポイント
  - [x] `POST /api/chat/batch-detail-days`
  - [x] 複数日の詳細化を同時にリクエスト
  - [x] 各日ごとにGemini APIを呼び出し
  - [x] セマフォで並列数を制御（レート制限対策）

##### 4.9.2 並列ストリーミング処理 ✅ **完了**
- [x] マルチストリーミングの実装
  - [x] 各日ごとに個別のストリーミング接続
  - [x] Server-Sent Eventsで複数チャンネル対応
  - [x] チャンク識別子（day番号）の追加
  - [x] セマフォによる並列数制御（最大3並列）
- [x] フロントエンドの受信処理
  - [x] `batchDetailDaysStream` 関数の実装
  - [x] 複数ストリームの同時処理
  - [x] 日ごとのストリーミングメッセージ管理
  - [x] 完了状況のトラッキング
  - [x] エラーハンドリングと再試行ロジック

##### 4.9.3 UI表示の更新
- [ ] `DaySchedule` コンポーネントの拡張
  - [ ] ローディング状態の表示（各日ごと）
  - [ ] ストリーミング中のプログレスバー
  - [ ] リアルタイム更新アニメーション
- [ ] 全体進捗の表示
  - [ ] 「3/5日完了」などの表示
  - [ ] 残り時間の推定

##### 4.9.4 エラーハンドリングと再試行
- [ ] 部分的な失敗への対応
  - [ ] 一部の日の詳細化が失敗しても続行
  - [ ] 失敗した日の再試行ボタン
- [ ] タイムアウト処理
  - [ ] 各日ごとのタイムアウト設定
  - [ ] 全体のタイムアウト設定
- [ ] レート制限対策
  - [ ] Gemini APIのレート制限を考慮
  - [ ] 並列数の制御（最大3-5並列）
  - [ ] 順次フォールバック

##### 4.9.5 キャッシュと最適化
- [ ] レスポンスキャッシュ
  - [ ] 同じ条件での再生成を防ぐ
  - [ ] LocalStorageまたはメモリキャッシュ
- [ ] トークン使用量の最適化
  - [ ] 各日のプロンプトを最小化
  - [ ] 共通情報の重複送信を削減

**期待される効果**:
- しおり生成時間の大幅短縮（5日の場合、5倍速）
- ユーザー体験の向上（待ち時間の削減）
- リアルタイム感の強化

**技術的課題**:
- Gemini APIのレート制限
- 並列リクエストのコスト増加
- エラー時の部分的なデータ整合性

#### 4.10 一気通貫作成モード 🆕 ⚡
**目的**: トリガー条件を満たしたら、ユーザーがボタンを押すことなく自動的に骨組み→詳細化→完成まで一気に作成

**課題**:
- ユーザーが「次へ」ボタンを何度も押すのは体験が悪い
- 必須情報が揃った時点で、自動的に全工程を実行すべき

**アーキテクチャ**:
```
[必須情報が揃う]
    ↓
[自動進行モード発動]
    ↓
[骨組み作成] → [全日程の詳細化（並列）] → [完成]
    ↓
[リアルタイムで進捗表示]
```

##### 4.10.1 自動進行トリガーシステム
- [ ] 自動進行モードの設定
  - [ ] `autoProgressMode` フラグ（Zustand）
  - [ ] `enableAutoProgress`, `disableAutoProgress` アクション
  - [ ] ユーザー設定としてLocalStorageに保存
- [ ] トリガー条件の定義
  - [ ] collecting フェーズで必須情報が揃った時
  - [ ] `checklistStatus.allRequiredFilled === true`
  - [ ] ユーザーがメッセージを送信した直後に判定
- [ ] トリガー検出ロジック
  - [ ] `MessageInput` でメッセージ送信後にチェック
  - [ ] `updateChecklist()` の後に自動進行判定

##### 4.10.2 一気通貫実行エンジン
- [ ] 全工程実行関数の実装
  - [ ] `executeFullItineraryCreation()` 関数
  - [ ] 骨組み作成 → 詳細化 → 完成の自動実行
  - [ ] 各ステップの完了を待ってから次へ
- [ ] Phase 4.9との統合
  - [ ] 骨組み作成後、全日程を並列詳細化
  - [ ] `batchDetailAllDays()` を自動呼び出し
- [ ] エラーハンドリング
  - [ ] 途中でエラーが発生した場合は停止
  - [ ] ユーザーに通知し、手動モードに切り替え

##### 4.10.3 リアルタイム進捗表示
- [ ] フェーズステータスバー
  - [ ] `PhaseStatusBar` コンポーネント（しおり段階を示すステップインジケーター）
  - [ ] collecting → skeleton → detailing → completed の視覚化
  - [ ] 各フェーズの完了状態を表示（チェックマーク）
  - [ ] 現在のフェーズをハイライト（ローディングアニメーション）
  - [ ] 自動進行中は全体の進捗率も表示
- [ ] 自動モード通知
  - [ ] `AutoModeNotification` コンポーネント
  - [ ] 必須情報が揃った時の通知表示
- [ ] 全体進捗オーバーレイ
  - [ ] `FullProgressOverlay` コンポーネント（全画面進捗）
  - [ ] 「骨組み作成中...」「1日目詳細化中...」などの表示
  - [ ] プログレスバー（全体の進捗率）
  - [ ] 各ステップの完了マーク
- [ ] ストリーミング表示の統合
  - [ ] AIのレスポンスをリアルタイム表示
  - [ ] チャットボックスに各ステップの結果を追加
  - [ ] しおりプレビューもリアルタイム更新
- [ ] QuickActionsの廃止
  - [ ] 「次へ」ボタンを削除（自動モードでは不要）
  - [ ] PhaseStatusBarに置き換え

##### 4.10.4 ユーザー制御機能
- [ ] 自動進行の一時停止
  - [ ] `FullProgressOverlay`に「一時停止」ボタンを追加
  - [ ] 現在のステップを完了してから停止
  - [ ] 手動モードに切り替え可能
- [ ] 自動進行のキャンセル
  - [ ] `FullProgressOverlay`に「キャンセル」ボタンを追加
  - [ ] 確認ダイアログを表示
  - [ ] 部分的に作成されたしおりを保持
- [ ] モード切り替えUI
  - [ ] 設定パネルで「自動モード」「手動モード」を切り替え
  - [ ] `AutoModeNotification`に設定へのリンク

##### 4.10.5 設定とカスタマイズ
- [ ] ユーザー設定パネル
  - [ ] 自動進行モードのON/OFF
  - [ ] 自動進行の速度調整（待機時間）
  - [ ] 詳細化の並列数設定
- [ ] デフォルト動作の設定
  - [ ] 初回ユーザーは手動モード
  - [ ] 「次回から自動で作成」チェックボックス
  - [ ] LocalStorageに保存

**実装順序**:
1. **4.10.1**: トリガーシステム（自動進行の判定）
2. **4.10.2**: 一気通貫実行エンジン（全工程の自動実行）
3. **4.10.3**: 進捗表示UI（リアルタイムフィードバック）
4. **4.10.4**: ユーザー制御（一時停止・キャンセル）
5. **4.10.5**: 設定UI（カスタマイズ）

**期待される効果**:
- ✅ ボタンを押す回数が激減（0-1回で完成）
- ✅ 必須情報を伝えるだけで、あとはAIにお任せ
- ✅ Phase 4.9と組み合わせて超高速生成
- ✅ ユーザーは進捗を見守るだけ（Netflix風のUX）

**ユーザーフロー比較**:

**現在（手動モード）**:
```
1. ユーザー: 「東京に3泊4日で」
2. [ボタン押下] → 骨組み作成
3. [ボタン押下] → 1日目詳細化
4. [ボタン押下] → 2日目詳細化
5. [ボタン押下] → 3日目詳細化
6. [ボタン押下] → 4日目詳細化
7. 完成！
```

**改善後（自動モード）**:
```
1. ユーザー: 「東京に3泊4日で」
2. [自動実行開始]
   - 骨組み作成中...
   - 1-4日目を並列詳細化中...
3. 完成！（待つだけ）
```

**詳細**: [docs/PHASE4_10_AUTO_EXECUTION.md](./docs/PHASE4_10_AUTO_EXECUTION.md)

**詳細**: [docs/PHASE4_INCREMENTAL_PLANNING.md](./docs/PHASE4_INCREMENTAL_PLANNING.md)

### Phase 5: しおり機能統合（Week 8-10）
**目的**: しおりの詳細表示、一時保存、PDF出力を統合的に実装

#### 5.1 しおりコンポーネントの詳細実装
- [ ] タイトル・サマリーコンポーネント
- [ ] 日程表コンポーネント
- [ ] 観光スポット詳細カード
- [ ] 地図統合（Google Maps API）
- [ ] リアルタイム更新機能
- [ ] 編集機能の追加
- [ ] しおりテンプレートの実装

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

### BUG-001: JSON削除バグ修正 ✅ **完了** (別ブランチで対応済み)
**発生状況**: AIからのレスポンスに生のJSONブロックが表示される

**修正内容**:
- [x] `lib/ai/prompts.ts` の `parseAIResponse` 関数を修正
  - JSON抽出後、メッセージ部分からJSONブロック全体を完全に削除
  - すべてのJSONブロックを検出（複数対応）
  - 各行をトリムして空行を削除
  - 前後の余分な空白・改行を削除
- [x] エッジケース対応
  - 複数のJSONブロックが含まれる場合の処理
  - JSONブロックの前後にメッセージがない場合のデフォルトメッセージ
  - 不正なJSON形式の場合のエラーハンドリング（元のメッセージを保持）
- [x] テスト
  - JSON含むレスポンスの表示確認
  - JSON除外後のメッセージ整形確認
  - ユーザーに表示されるメッセージにJSONが含まれていないことを確認

**修正結果**: 技術的な詳細がユーザーに表示されず、クリーンなUI実現

**実装ブランチ**: `cursor/resolve-bug-bug-001-238b` (既にマージ済み)  
**関連コミット**: ae8ac7b, 9122843, 426188f

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

**開発状況**: ✅ Phase 1, 2, 3 完了・統合済み → 次は Phase 3.5（UI/UX改善・バグ修正）

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

**次の実装**: 
- **Phase 4.6** - しおりマージロジックの改善
- **Phase 4.7** - テスト・デバッグ
- **Phase 3.5** - UI/UX改善（マークダウンレンダリング）
- **Phase 5** - しおり機能統合（詳細実装 + 一時保存 + PDF出力）
- **Phase 6** - Claude API統合
- **Phase 7** - UI最適化・レスポンシブ対応（リサイザー + モバイル）

**実装済みPhase**: 
- ✅ Phase 1, 2, 3（基礎・認証・AI統合）
- ✅ Phase 4.1, 4.2, 4.3, 4.4, 4.5（段階的旅程構築システム - 基礎）
- ✅ Phase 4.8.1, 4.8.2, 4.8.3, 4.8.4（フェーズ移動処理の半自動化 - 完了）
- ✅ Phase 4.9.1, 4.9.2（並列日程作成 - 基礎完了）
- ✅ BUG-001（JSON削除バグ修正）

**実装予定の追加機能**:
- ⬜ Phase 4.9.3, 4.9.4, 4.9.5（並列化のUI・エラーハンドリング・最適化）
- 🔥 Phase 4.10（一気通貫作成モード）← **最優先**
- ⬜ Phase 4.6（しおりマージロジックの改善）
- ⬜ Phase 4.7（テスト・デバッグ）

**最終更新**: 2025-10-07

**詳細ドキュメント**:
- [Phase 3 統合完了レポート](./docs/PHASE3_INTEGRATION_COMPLETE.md)
- [API ドキュメント](./PHASE3_API_DOCUMENTATION.md)
