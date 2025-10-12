# Journee リリース履歴

このドキュメントは、Journeeプロジェクトの実装済み機能を記録しています。

---

## 📦 リリース一覧

### Version 0.11.0 (Phase 12 - マップ連携機能) ✅ 完了
**リリース日**: 2025-10-12

#### 新機能
- **住所マップリンク機能**: 閲覧モードで住所をタップするとGoogle Mapsが開く
  - AddressLinkコンポーネントによるクリック可能な住所表示
  - Google Maps検索URLの自動生成
  - 新しいタブで地図を開く（モバイル・デスクトップ両対応）
  - セキュリティ対応（noopener, noreferrer）

#### 改善点
- SpotCardコンポーネントでの住所表示をリンク化
- アクセシビリティ向上（タイトル属性、適切なARIA）
- URLエンコーディングによる特殊文字対応

#### テスト
- E2Eテスト: `e2e/address-map-link.spec.ts`
- ユニットテスト: `components/itinerary/__tests__/AddressLink.test.tsx`

#### 主要ファイル
- `components/itinerary/AddressLink.tsx` (新規)
- `components/itinerary/SpotCard.tsx` (更新)

---

### Version 0.10.0 (Phase 10 - バグ修正とUX改善) ✅ 完了
**リリース日**: 2025-10-09

#### 新機能
- **閲覧ページPDF機能**: 公開しおりからPDF出力可能に
- **OGP画像動的生成**: SNS共有時のプレビュー画像自動生成（1200x630px）
- **しおり保存のDB統合**: SaveButton、StorageInitializerがSupabase対応

#### 改善点
- フィードバックフォームのコントラスト改善（WCAG 2.1 AA準拠）
- LocalStorageフォールバック実装（DB接続失敗時）

#### 主要ファイル
- `app/api/og/route.tsx`, `components/itinerary/PDFExportButton.tsx`
- `components/itinerary/SaveButton.tsx`, `components/layout/StorageInitializer.tsx`
- `e2e/itinerary-db-integration.spec.ts`

---

### Version 0.9.0 (Phase 9 - パフォーマンス改善) 🔄 進行中
**ステータス**: 進行中

#### 改善点
- React.memo による再レンダリング削減
- useMemo/useCallback の最適化
- コード分割・画像遅延読み込み

---

### Version 0.8.0 (Phase 8 - データベース統合) ✅ 完了
**リリース日**: 2025-09-15

#### 新機能
- **Supabase統合**: PostgreSQLデータベース、RLS、リアルタイム同期
- **データマイグレーション**: LocalStorage → Supabase自動移行
- **しおりCRUD API**: 
  - `POST /api/itinerary/save` - 保存
  - `GET /api/itinerary/load` - 読み込み
  - `GET /api/itinerary/list` - 一覧
  - `DELETE /api/itinerary/delete` - 削除
- **共有API**: 
  - `POST /api/itinerary/publish` - 公開
  - `POST /api/itinerary/unpublish` - 非公開化

#### 主要ファイル
- `lib/db/supabase.ts`, `lib/db/schema.sql`, `lib/db/itinerary-repository.ts`
- `app/api/itinerary/*`

---

### Version 0.7.0 (Phase 7 - UI最適化) ✅ 完了
**リリース日**: 2025-05-20

#### 新機能
- **リサイザー**: チャット/しおりの分割比率を自由調整
- **モバイル最適化**: タブ切り替えUI、タッチ操作最適化
- **PWA対応**: アプリインストール、オフライン閲覧

#### 主要ファイル
- `components/layout/ResizableLayout.tsx`, `components/layout/MobileLayout.tsx`
- `public/manifest.json`

---

### Version 0.6.0 (Phase 6 - Claude API統合) ✅ 完了
**リリース日**: 2025-04-10

#### 新機能
- **Claude API統合**: Claude 3.5 Sonnet対応、ストリーミング
- **AIモデル選択**: Gemini / Claude切り替え
- **APIキー管理**: 暗号化保存、検証機能

#### 主要ファイル
- `lib/ai/claude.ts`, `lib/ai/models.ts`
- `components/chat/AISelector.tsx`, `components/settings/AISettings.tsx`

---

### Version 0.5.0 (Phase 5 - しおり機能統合) ✅ 完了
**リリース日**: 2025-03-05

#### 新機能
- **しおりプレビュー**: リアルタイムプレビュー、日程・スポットカード
- **インライン編集**: タイトル・スポット情報編集
- **Undo/Redo**: 編集履歴管理、ショートカット対応
- **ドラッグ&ドロップ**: スポット並び替え、日程間移動
- **自動保存**: 5分間隔、変更時デバウンス
- **PDF出力**: 美しいレイアウト、日本語フォント対応
- **マイページ**: プロフィール、統計、しおり一覧
- **公開・共有**: ユニークURL発行、Read-only閲覧ページ

#### 主要ファイル
- `components/itinerary/*`, `components/layout/AutoSave.tsx`
- `app/mypage/page.tsx`, `app/share/[slug]/page.tsx`

---

### Version 0.4.0 (Phase 4 - 段階的旅程構築) ✅ 完了
**リリース日**: 2025-02-15

#### 新機能
- **フェーズ管理**: initial → collecting → skeleton → detailing → completed
- **プロンプト最適化**: フェーズごとのプロンプトテンプレート
- **進捗UI**: PlanningProgress, QuickActions, PhaseStatusBar
- **情報抽出システム**: 充足度判定、チェックリスト
- **並列処理**: 日程作成の高速化（Promise.allSettled）

#### 主要ファイル
- `lib/requirements/extractors.ts`, `lib/requirements/checklist-config.ts`
- `lib/execution/sequential-itinerary-builder.ts`
- `components/itinerary/PlanningProgress.tsx`

---

### Version 0.3.0 (Phase 3 - AI統合) ✅ 完了
**リリース日**: 2025-01-20

#### 新機能
- **Google Gemini API**: gemini-2.0-flash-exp、ストリーミング、JSON処理
- **チャット機能**: リアルタイムメッセージング、履歴管理
- **プロンプトシステム**: 構造化テンプレート、レスポンスパース

#### 主要ファイル
- `lib/ai/gemini.ts`, `lib/ai/prompts.ts`
- `app/api/chat/route.ts`, `components/chat/*`

---

### Version 0.2.0 (Phase 2 - 認証システム) ✅ 完了
**リリース日**: 2024-12-30

#### 新機能
- **NextAuth.js統合**: Google OAuth、JWT戦略、セッション管理
- **認証ミドルウェア**: 保護ルート自動チェック、未認証リダイレクト
- **認証UI**: ログインボタン、ユーザーメニュー

#### 主要ファイル
- `lib/auth/auth-options.ts`, `middleware.ts`
- `components/auth/*`

---

### Version 0.1.0 (Phase 1 - 基礎構築) ✅ 完了
**リリース日**: 2024-12-15

#### 新機能
- **プロジェクト初期構築**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **基本ルーティング**: メインページ、ログイン、プライバシーポリシー、利用規約
- **基本UI**: ヘッダー、ローディング、エラー通知

#### 主要ファイル
- `app/page.tsx`, `app/layout.tsx`
- `components/layout/Header.tsx`, `components/ui/*`

---

## 📊 機能一覧（累積）

### 認証・ユーザー管理
- ✅ Google OAuth、セッション管理、マイページ

### AI機能
- ✅ Gemini/Claude API、ストリーミング、フェーズ対応プロンプト

### しおり作成
- ✅ 段階的旅程構築（5フェーズ）、リアルタイムプレビュー、並列処理

### しおり編集
- ✅ インライン編集、Undo/Redo、ドラッグ&ドロップ

### データ管理
- ✅ Supabase統合、自動保存、LocalStorageマイグレーション

### しおり管理
- ✅ 一覧、フィルタリング・ソート、削除、公開・共有

### 出力・共有
- ✅ PDF出力、PDFプレビュー、公開URL、OGP画像動的生成

### UI/UX
- ✅ レスポンシブ、リサイザー、PWA、オフライン対応

---

## 🔗 関連ドキュメント

- [実装計画（PLAN.md）](./PLAN.md)
- [API仕様（API.md）](./API.md)
- [バグ・改善点（BUG.md）](./BUG.md)

---

**最終更新**: 2025-10-09
