# Journee リリース履歴

このドキュメントは、Journeeプロジェクトでこれまでに実装された機能の詳細を記録しています。

## 📦 リリース一覧

### Version 0.9.0 (Phase 9 - 進行中)
**リリース日**: 開発中  
**ステータス**: 🔄 進行中

#### 改善点
- React.memo による不要な再レンダリングの削減
- useMemo/useCallback の最適化
- コード分割の実装
- 画像遅延読み込みの実装

#### バグ修正
- （進行中のため随時更新）

---

### Version 0.8.0 (Phase 8 - データベース統合)
**リリース日**: 2025-09-15  
**ステータス**: ✅ 完了

#### 新機能
- **Supabase統合**
  - PostgreSQLデータベースの設定
  - Row Level Security (RLS) による安全なデータアクセス
  - リアルタイムデータ同期
- **データマイグレーション**
  - LocalStorageからSupabaseへの自動移行機能
  - マイグレーションプロンプトUI
  - データバックアップ機能
- **しおりCRUD API**
  - `POST /api/itinerary` - しおり作成
  - `GET /api/itinerary` - しおり一覧取得
  - `GET /api/itinerary/[id]` - しおり詳細取得
  - `PUT /api/itinerary/[id]` - しおり更新
  - `DELETE /api/itinerary/[id]` - しおり削除
- **共有API**
  - `POST /api/itinerary/[id]/share` - 公開URL発行
  - `PUT /api/itinerary/[id]/share` - 共有設定更新
  - `DELETE /api/itinerary/[id]/share` - 公開停止

#### 改善点
- データ永続化の信頼性向上
- 複数デバイス間でのデータ同期
- セキュリティの強化（RLS）

#### 技術仕様
- データベース: Supabase (PostgreSQL)
- スキーマ: `schema.sql`
- SQLファンクション: `functions.sql`
- ORM: Supabase Client

#### 主要ファイル
- `lib/db/supabase.ts`
- `lib/db/schema.sql`
- `lib/db/functions.sql`
- `lib/db/itinerary-repository.ts`
- `lib/db/migration.ts`
- `app/api/itinerary/route.ts`
- `app/api/itinerary/[id]/route.ts`
- `app/api/itinerary/[id]/share/route.ts`

---

### Version 0.7.0 (Phase 7 - UI最適化)
**リリース日**: 2025-05-20  
**ステータス**: ✅ 完了

#### 新機能
- **リサイザー実装**
  - チャット/しおりの分割比率を自由に調整
  - ドラッグ操作による直感的なリサイズ
  - 設定の保存（LocalStorage）
- **モバイル最適化**
  - タブ切り替えUI（チャット ⇔ しおり）
  - タッチ操作の最適化
  - モバイル専用メニュー
  - レスポンシブデザインの強化
- **PWA対応**
  - アプリとしてインストール可能
  - オフライン閲覧対応
  - manifest.json 設定

#### 改善点
- デスクトップでの作業効率向上
- モバイルでのユーザビリティ向上
- オフライン環境での利用可能性

#### 技術仕様
- リサイザー: カスタムReactコンポーネント
- モバイル検出: `window.innerWidth`
- PWA: Next.js標準機能

#### 主要ファイル
- `components/layout/ResizableLayout.tsx`
- `components/layout/DesktopLayout.tsx`
- `components/layout/MobileLayout.tsx`
- `components/layout/MobileTabSwitcher.tsx`
- `components/layout/MobileMenu.tsx`
- `public/manifest.json`

---

### Version 0.6.0 (Phase 6 - Claude API統合)
**リリース日**: 2025-04-10  
**ステータス**: ✅ 完了

#### 新機能
- **Claude API統合**
  - Claude 3.5 Sonnet対応
  - ストリーミングレスポンス
  - エラーハンドリング
- **AIモデル選択機能**
  - Gemini / Claude の切り替え
  - モデルごとの特性を活かしたプロンプト最適化
  - UI上でのリアルタイム切り替え
- **APIキー管理**
  - クライアント側での暗号化保存
  - 設定画面でのAPIキー登録
  - APIキーの検証機能

#### 改善点
- AIの選択肢が増え、より柔軟な対話が可能に
- ユーザーが好みのAIモデルを選択可能
- APIキーのセキュアな管理

#### 技術仕様
- Claude API: Anthropic Messages API
- 暗号化: Web Crypto API
- ストレージ: LocalStorage（暗号化済み）

#### 主要ファイル
- `lib/ai/claude.ts`
- `lib/ai/models.ts`
- `components/chat/AISelector.tsx`
- `components/settings/AISettings.tsx`
- `components/settings/APIKeyModal.tsx`

---

### Version 0.5.0 (Phase 5 - しおり機能統合)
**リリース日**: 2025-03-05  
**ステータス**: ✅ 完了

#### 新機能

##### Phase 5.1: コンポーネント実装
- **しおりプレビュー表示**
  - リアルタイムプレビュー
  - 日程カード表示
  - スポットカード表示
- **インライン編集機能**
  - タイトル編集
  - スポット情報編集
  - リアルタイム保存
- **Undo/Redo機能**
  - 編集履歴の管理
  - ショートカットキー対応（Ctrl+Z / Ctrl+Shift+Z）
- **ドラッグ&ドロップ**
  - スポットの並び替え
  - 日程間の移動
  - 直感的な操作

##### Phase 5.2: 一時保存機能
- **自動保存**
  - 5分間隔の定期保存
  - 変更時のデバウンス保存
  - 保存状態の視覚的フィードバック
- **LocalStorage保存**
  - ユーザーIDをキーとした保存
  - データ構造の最適化

##### Phase 5.3: PDF出力機能
- **PDF生成**
  - 美しいレイアウト
  - 日本語フォント対応
  - A4サイズ最適化
- **プレビュー機能**
  - 出力前のプレビュー
  - レイアウト調整
- **印刷対応**
  - ブラウザ印刷機能
  - PDF保存

##### Phase 5.4: マイページ・設定
- **マイページ**
  - ユーザープロフィール表示
  - ユーザー統計（作成したしおり数など）
  - クイックアクション
- **しおり一覧**
  - 作成したしおり一覧
  - フィルタリング機能
  - ソート機能
- **設定ページ**
  - 一般設定
  - AI設定
  - アカウント設定

##### Phase 5.5: 公開・共有機能
- **公開URL発行**
  - ユニークなスラッグ生成
  - 公開/非公開の切り替え
- **Read-only閲覧ページ**
  - 共有リンク経由での閲覧
  - 編集不可のビュー
- **共有ボタン**
  - リンクコピー
  - 将来的なSNS共有対応

#### 改善点
- しおりの視覚的な美しさの向上
- 編集操作の直感性向上
- データ保存の信頼性向上

#### 主要ファイル
- `components/itinerary/ItineraryPreview.tsx`
- `components/itinerary/DaySchedule.tsx`
- `components/itinerary/SpotCard.tsx`
- `components/itinerary/EditableSpotCard.tsx`
- `components/itinerary/EditableTitle.tsx`
- `components/itinerary/UndoRedoButtons.tsx`
- `components/itinerary/PDFExportButton.tsx`
- `components/itinerary/PDFPreviewModal.tsx`
- `components/itinerary/ShareButton.tsx`
- `components/layout/AutoSave.tsx`
- `app/mypage/page.tsx`
- `app/settings/page.tsx`
- `app/share/[slug]/page.tsx`

---

### Version 0.4.0 (Phase 4 - 段階的旅程構築システム)
**リリース日**: 2025-02-15  
**ステータス**: ✅ 完了

#### 新機能

##### Phase 4.1: 型定義の拡張
- `DayStatus` 型（draft/skeleton/detailed/completed）
- `ItineraryPhase` 型（initial/collecting/skeleton/detailing/completed）
- しおりデータ構造の拡張

##### Phase 4.2: 状態管理の拡張
- Zustand ストアのフェーズ対応
- `planningPhase` 状態管理
- `currentDetailingDay` 状態管理
- `proceedToNextStep()` アクション

##### Phase 4.3: プロンプトシステムの改善
- フェーズごとのプロンプトテンプレート
- システムプロンプトの最適化
- JSON出力フォーマットの厳格化

##### Phase 4.4: UIコンポーネントの追加
- `PlanningProgress.tsx` - 進捗表示
- `QuickActions.tsx` - 次のステップへの移行
- `PhaseStatusBar.tsx` - フェーズ状態表示

##### Phase 4.5: APIの拡張
- フェーズ対応のチャットAPI
- ストリーミング中のフェーズ管理

##### Phase 4.6: しおりマージロジック改善
- 部分更新の最適化
- データ整合性の保証

##### Phase 4.7: テスト・デバッグ
- ユニットテスト追加
- E2Eテストの実装

##### Phase 4.8: フェーズ移動処理の半自動化
- 情報抽出システム（extractors.ts）
- チェックリスト設定（checklist-config.ts）
- 充足度判定ロジック

##### Phase 4.9: 日程作成処理の並列化
- 並列実行エンジン（sequential-itinerary-builder.ts）
- ストリーミング管理の最適化

#### 改善点
- しおり作成プロセスの段階化による使いやすさ向上
- 情報収集の効率化
- 処理速度の向上（並列化）

#### 技術仕様
- フェーズ管理: Zustand状態管理
- 並列処理: Promise.allSettled
- データマージ: カスタムロジック

#### 主要ファイル
- `types/itinerary.ts`
- `lib/store/useStore.ts`
- `lib/requirements/extractors.ts`
- `lib/requirements/checklist-config.ts`
- `lib/execution/sequential-itinerary-builder.ts`
- `components/itinerary/PlanningProgress.tsx`
- `components/itinerary/QuickActions.tsx`
- `components/itinerary/PhaseStatusBar.tsx`

---

### Version 0.3.0 (Phase 3 - AI統合)
**リリース日**: 2025-01-20  
**ステータス**: ✅ 完了

#### 新機能
- **Google Gemini API統合**
  - gemini-2.0-flash-exp モデル
  - ストリーミングレスポンス対応
  - JSON形式のレスポンス処理
- **チャット機能**
  - リアルタイムメッセージング
  - AIレスポンスのストリーミング表示
  - メッセージ履歴管理
  - エラーハンドリング
- **プロンプトシステム**
  - 構造化されたプロンプトテンプレート
  - しおり生成用プロンプト
  - レスポンスパース処理

#### 改善点
- AIとの対話による直感的なしおり作成
- リアルタイムフィードバック

#### 技術仕様
- AI: Google Gemini API
- ストリーミング: Server-Sent Events (SSE)
- プロンプト: テンプレート化

#### 主要ファイル
- `lib/ai/gemini.ts`
- `lib/ai/prompts.ts`
- `app/api/chat/route.ts`
- `components/chat/ChatBox.tsx`
- `components/chat/MessageList.tsx`
- `components/chat/MessageInput.tsx`

---

### Version 0.2.0 (Phase 2 - 認証システム)
**リリース日**: 2024-12-30  
**ステータス**: ✅ 完了

#### 新機能
- **NextAuth.js統合**
  - Google OAuth認証
  - JWT戦略
  - セッション管理
- **認証ミドルウェア**
  - 保護されたルートの自動チェック
  - 未認証時のリダイレクト
- **認証UI**
  - ログインボタン
  - ユーザーメニュー
  - ログアウト機能

#### 改善点
- ユーザー認証によるデータ保護
- 個人ごとのしおり管理

#### 技術仕様
- 認証: NextAuth.js v4
- プロバイダー: Google OAuth
- セッション: JWT

#### 主要ファイル
- `lib/auth/auth-options.ts`
- `lib/auth/session.ts`
- `middleware.ts`
- `app/api/auth/[...nextauth]/route.ts`
- `components/auth/AuthProvider.tsx`
- `components/auth/LoginButton.tsx`
- `components/auth/UserMenu.tsx`

---

### Version 0.1.0 (Phase 1 - 基礎構築)
**リリース日**: 2024-12-15  
**ステータス**: ✅ 完了

#### 新機能
- **プロジェクト初期構築**
  - Next.js 14 (App Router) セットアップ
  - TypeScript設定
  - Tailwind CSS設定
- **基本的なルーティング**
  - メインページ
  - ログインページ
  - プライバシーポリシー
  - 利用規約
- **基本的なUI**
  - ヘッダーナビゲーション
  - ローディングスピナー
  - エラー通知

#### 技術仕様
- フレームワーク: Next.js 14
- 言語: TypeScript
- スタイリング: Tailwind CSS

#### 主要ファイル
- `app/page.tsx`
- `app/layout.tsx`
- `app/login/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `components/layout/Header.tsx`
- `components/ui/LoadingSpinner.tsx`
- `components/ui/ErrorNotification.tsx`

---

## 📊 機能一覧（累積）

### 認証・ユーザー管理
- ✅ Google OAuth ログイン
- ✅ セッション管理
- ✅ ユーザープロフィール
- ✅ マイページ

### AI機能
- ✅ Gemini APIによるチャット
- ✅ Claude APIによるチャット
- ✅ AIモデル切り替え
- ✅ ストリーミングレスポンス
- ✅ フェーズ対応プロンプト

### しおり作成
- ✅ 段階的旅程構築（5フェーズ）
- ✅ リアルタイムプレビュー
- ✅ 情報抽出・充足度判定
- ✅ 並列処理による高速化

### しおり編集
- ✅ インライン編集
- ✅ Undo/Redo
- ✅ ドラッグ&ドロップ
- ✅ スポット追加・削除

### データ管理
- ✅ Supabase（PostgreSQL）統合
- ✅ 自動保存（デバウンス）
- ✅ LocalStorageからのマイグレーション
- ✅ データバックアップ

### しおり管理
- ✅ しおり一覧
- ✅ フィルタリング・ソート
- ✅ 削除機能
- ✅ 公開・共有機能

### 出力・共有
- ✅ PDF出力
- ✅ PDF プレビュー
- ✅ 公開URLの発行
- ✅ Read-only閲覧ページ

### UI/UX
- ✅ レスポンシブデザイン
- ✅ リサイザー（デスクトップ）
- ✅ タブ切り替え（モバイル）
- ✅ PWA対応
- ✅ オフライン対応

### 設定
- ✅ 一般設定
- ✅ AI設定（モデル選択、APIキー管理）
- ✅ アカウント設定

---

## 🔗 関連ドキュメント

- [実装計画（PLAN.md）](./PLAN.md)
- [API仕様（API.md）](./API.md)
- [バグ・改善点（BUG.md）](./BUG.md)
- [クイックスタート（QUICK_START.md）](./QUICK_START.md)

---

**最終更新**: 2025-10-09

