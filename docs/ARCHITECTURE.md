# Journee アーキテクチャガイド

**最終更新**: 2025-01-10 (Phase 10-13完了後)  
**対象**: 開発者・コントリビューター

---

## 概要

Journeeは、AIとともに旅のしおりを作成するWebアプリケーションです。
Phase 1-13の大規模リファクタリングを経て、クリーンで保守性の高いアーキテクチャに到達しました。

---

## アーキテクチャ原則

### 1. ドメイン駆動設計 (DDD)
各ドメイン（チャット、AI、設定、UI、レイアウト、しおり）が独立したStoreとHooksを持つ

### 2. 単一責任の原則 (SRP)
- 1 Store = 1 ドメイン
- 1 Hook = 1 ビジネスロジック
- 1 Component = 1 UI責務

### 3. 関心の分離 (SoC)
```
Store (状態)
  ↓
Hooks (ロジック)
  ↓
Components (UI)
```

### 4. テスト駆動
各レイヤーを独立してテスト可能

---

## Store構造 (9個のスライス)

### チャット・AI系 (2個)

#### useChatStore (178行)
**責務**: チャット機能の状態管理

**State**:
- `messages: Message[]` - メッセージ履歴
- `isLoading: boolean` - ローディング状態
- `isStreaming: boolean` - ストリーミング中
- `streamingMessage: string` - ストリーミングメッセージ
- `editingMessageId: string | null` - 編集中メッセージID
- `abortController: AbortController | null` - AI応答キャンセル用

**Actions**:
- `addMessage`, `clearMessages`, `deleteMessage`
- `startEditingMessage`, `saveEditedMessage`, `cancelEditingMessage`
- `setLoading`, `setStreaming`, `appendStreamingMessage`
- `abortAIResponse`

---

#### useAIStore (72行)
**責務**: AI設定の状態管理

**State**:
- `selectedModel: AIModelId` - 選択中のAIモデル
- `claudeApiKey: string` - Claude APIキー
- `geminiApiKey: string` - Gemini APIキー（将来用）

**Actions**:
- `setSelectedModel`, `setClaudeApiKey`, `removeClaudeApiKey`
- `initializeFromStorage` - LocalStorage同期

---

### 設定系 (1個)

#### useSettingsStore (88行)
**責務**: アプリケーション設定の管理

**State**:
- `settings: AppSettings` - 全設定
  - `general: { currency }` - 通貨設定
  - `sound: { enabled, volume }` - サウンド設定

**Actions**:
- `updateSettings`, `updateGeneralSettings`, `updateSoundSettings`
- `resetToDefaults`, `initializeFromStorage`

---

### UI系 (1個)

#### useUIStore (82行)
**責務**: UI状態・通知・エラーの管理

**State**:
- `toasts: ToastMessage[]` - トースト通知
- `isSaving: boolean` - 保存中フラグ
- `lastSaveTime: Date | null` - 最終保存時刻
- `storageInitialized: boolean` - 初期化完了
- `error: string | null` - エラーメッセージ

**Actions**:
- `addToast`, `removeToast`, `clearToasts`
- `setSaving`, `setLastSaveTime`
- `setError`, `clearError`
- `setStorageInitialized`

---

### レイアウト系 (1個)

#### useLayoutStore (65行)
**責務**: レイアウト状態の管理

**State**:
- `chatPanelWidth: number` - チャットパネル幅（30-70%）
- `mobileActiveTab: 'chat' | 'itinerary'` - モバイルタブ
- `isMobileMenuOpen: boolean` - モバイルメニュー状態

**Actions**:
- `setChatPanelWidth`, `setMobileActiveTab`
- `setMobileMenuOpen`, `toggleMobileMenu`
- `initializeFromStorage`

---

### しおり系 (5個)

#### useItineraryStore (103行)
**責務**: しおり基本情報の管理

**State**:
- `currentItinerary: ItineraryData | null` - 現在のしおり

**Actions**:
- `setItinerary`, `updateItinerary`

---

#### useSpotStore (195行)
**責務**: スポット操作

**Actions**:
- `addSpot`, `updateSpot`, `deleteSpot`
- `reorderSpots`, `moveSpot`

---

#### useItineraryUIStore (71行)
**責務**: しおりUIの状態管理

**State**:
- `filter: ItineraryFilter` - フィルター条件
- `sort: ItinerarySort` - ソート条件

**Actions**:
- `setFilter`, `setSort`, `resetFilters`

---

#### useItineraryProgressStore (218行)
**責務**: プランニング進捗の管理

**State**:
- `planningPhase: ItineraryPhase` - 現在のフェーズ
- `currentDetailingDay: number | null` - 詳細化中の日
- `requirementsChecklist: RequirementChecklistItem[]` - チェックリスト
- `autoProgressMode: boolean` - 自動進行モード
- `isAutoProgressing: boolean` - 自動進行中

**Actions**:
- `setPlanningPhase`, `setCurrentDetailingDay`
- `proceedToNextStep`, `resetPlanning`
- `updateChecklist`, `shouldTriggerAutoProgress`

---

#### useItineraryHistoryStore (85行)
**責務**: 履歴管理（Undo/Redo）

**State**:
- `history: HistoryState` - 履歴スタック
  - `past: ItineraryData[]`
  - `present: ItineraryData | null`
  - `future: ItineraryData[]`

**Actions**:
- `undo`, `redo`, `canUndo`, `canRedo`
- `clearHistory`, `addToHistory`

---

## カスタムHooks構造 (15個)

### チャット系 (2個)

#### useChatMessage (180行)
**責務**: メッセージ送受信ロジック

**機能**:
- `sendMessage` - AIへメッセージ送信
- `resendMessage` - メッセージ再送
- `deleteMessage` - メッセージ削除
- `editMessage` - メッセージ編集
- ストリーミング処理
- エラーハンドリング

**依存Store**: useChatStore, useAIStore, useUIStore, useItineraryStore, useItineraryProgressStore

---

#### useChatHistory (61行)
**責務**: メッセージ履歴管理

**機能**:
- `searchMessages` - メッセージ検索
- `filterByType` - タイプ別フィルタ
- `clearHistory` - 履歴クリア
- `exportHistory` - エクスポート
- `importHistory` - インポート

**依存Store**: useChatStore

---

### 設定系 (1個)

#### useAppSettings (56行)
**責務**: 設定管理

**機能**:
- `updateSettings` - 設定更新
- `updateGeneralSettings` - 一般設定更新
- `updateSoundSettings` - サウンド設定更新
- `resetToDefaults` - デフォルトに戻す
- `exportSettings` - エクスポート
- `importSettings` - インポート

**依存Store**: useSettingsStore

---

### しおり系 (9個)

#### useItineraryEditor (100行)
**責務**: しおり編集

**機能**:
- `updateTitle`, `updateDestination` - 基本情報更新
- `update` - 任意のフィールド更新
- `reset` - リセット
- `undo`, `redo` - 履歴操作

**依存Store**: useItineraryStore, useItineraryHistoryStore, useUIStore

---

#### useSpotEditor (183行)
**責務**: スポット編集

**機能**:
- `addSpot`, `updateSpot`, `deleteSpot` - CRUD操作
- `reorderSpots` - 並び替え
- `moveSpot` - 日間移動
- `validateSpot` - バリデーション

**依存Store**: useSpotStore, useItineraryStore

---

#### useItinerarySave (321行)
**責務**: 保存・読み込み・削除

**機能**:
- `save` - しおり保存（DB / LocalStorage自動選択）
- `load` - しおり読み込み
- `deleteItinerary` - しおり削除
- 自動保存機能

**依存Store**: useItineraryStore, useUIStore

---

#### useItineraryPublish (226行)
**責務**: 公開・共有

**機能**:
- `publish` - しおり公開
- `unpublish` - 非公開化
- `updateSettings` - 公開設定更新
- `copyPublicUrl` - URL コピー
- `shareViaWebApi` - Web Share API共有

**依存Store**: useItineraryStore, useUIStore

---

#### useItineraryPDF (115行)
**責務**: PDF出力

**機能**:
- `generatePDF` - PDF生成
- `showPreview` - プレビュー表示
- プログレス表示

**依存**: jsPDF, html2canvas

---

#### useItineraryList (105行)
**責務**: しおり一覧管理

**機能**:
- `refresh` - 一覧取得
- `deleteItinerary` - しおり削除
- フィルター・ソート連携

**依存Store**: useItineraryUIStore, useUIStore

---

#### useItineraryHistory (42行)
**責務**: 履歴操作

**機能**:
- `undo`, `redo` - 元に戻す/やり直す
- `canUndo`, `canRedo` - 可否チェック
- `clearHistory` - 履歴クリア

**依存Store**: useItineraryHistoryStore

---

#### usePhaseTransition (158行)
**責務**: フェーズ遷移管理

**機能**:
- フェーズ遷移ロジック
- ボタン表示制御
- チェックリスト管理

**依存Store**: useItineraryProgressStore

---

#### useAIProgress (195行)
**責務**: AI進行管理

**機能**:
- `proceedAndSendMessage` - フェーズ進行 + AI呼び出し
- 自動進行フロー
- ストリーミング処理

**依存Store**: 全Store

---

### AI系 (1個)

#### useAIRequest (191行)
**責務**: AI呼び出し統一化

**機能**:
- 統一されたAI呼び出しインターフェース
- 自動リトライ
- プログレス表示
- エラーハンドリング

**依存Store**: useAIStore, useChatStore, useUIStore

---

## コンポーネント構造 (50個)

### 階層
```
app/
├─ page.tsx (メインページ)
├─ login/
├─ mypage/
├─ settings/
└─ share/[slug]/

components/
├─ auth/ (3個) - 認証
├─ chat/ (5個) - チャット
├─ itinerary/ (28個) - しおり
│  ├─ preview/ (6個) - プレビュー
│  ├─ day-schedule/ (3個) - 日程
│  ├─ spot-form/ (1個) - スポットフォーム
│  ├─ public/ (2個) - 公開ビュー
│  ├─ card/ (3個) - カード
│  └─ pdf/ (0個) - PDF用
├─ layout/ (6個) - レイアウト
├─ settings/ (4個) - 設定
├─ ui/ (8個) - 共通UI
└─ comments/ (3個) - コメント
```

---

## データフロー

### メッセージ送信フロー
```
User Input (MessageInput)
  ↓
useChatMessage.sendMessage()
  ↓
useChatStore (messages, streaming)
  ↓
sendChatMessageStream() (API)
  ↓
AI Response (streaming)
  ↓
useChatStore.appendStreamingMessage()
  ↓
MessageList (リアルタイム表示)
  ↓
useItineraryStore.setItinerary() (しおり更新)
  ↓
ItineraryPreview (しおり表示)
```

### しおり保存フロー
```
User Action (SaveButton)
  ↓
useItinerarySave.save()
  ↓
  ├─ ログイン時: API → Database
  └─ 未ログイン時: LocalStorage
  ↓
useItineraryStore.setItinerary()
  ↓
useUIStore (toast, saveStatus)
```

---

## 状態管理戦略

### Store分割の基準
1. **ドメインの独立性**: チャット ≠ しおり
2. **変更頻度**: UI状態 vs しおりデータ
3. **依存関係**: 循環参照を避ける

### LocalStorage同期
各Storeが独立して同期:
- useAIStore → AIキー・モデル選択
- useSettingsStore → アプリ設定
- useLayoutStore → レイアウト設定
- useItineraryStore → しおりデータ

### パフォーマンス最適化
- **セレクター関数**: 必要な状態のみ購読
- **React.memo**: 高頻度レンダリングコンポーネント
- **useMemo**: 重い計算処理
- **useCallback**: イベントハンドラ

---

## API設計

### エンドポイント構造
```
/api/
├─ auth/ - 認証
├─ chat/ - AI チャット
├─ itinerary/
│  ├─ save/ - 保存
│  ├─ load/ - 読み込み
│  ├─ list/ - 一覧
│  ├─ delete/ - 削除
│  ├─ publish/ - 公開
│  └─ unpublish/ - 非公開化
├─ user/me/ - ユーザー情報
└─ health/ - ヘルスチェック
```

### ストリーミングAPI
Server-Sent Events (SSE) による双方向通信:
```typescript
for await (const chunk of sendChatMessageStream(...)) {
  if (chunk.type === 'message') {
    // メッセージチャンク
  } else if (chunk.type === 'itinerary') {
    // しおりデータ
  } else if (chunk.type === 'error') {
    // エラー
  }
}
```

---

## テスト戦略

### ユニットテスト
- **Hooks**: 各カスタムHook（90%カバレッジ目標）
- **Stores**: 各Store（80%カバレッジ目標）
- **Utils**: ユーティリティ関数（95%カバレッジ目標）

### E2Eテスト (Playwright)
- フルフロー: test入力 → しおり作成 → 保存 → 公開
- エラーリカバリー
- パフォーマンス
- レスポンシブ

---

## ディレクトリ構造（詳細）

```
/workspace/
├─ app/ - Next.js App Router
│  ├─ page.tsx
│  ├─ layout.tsx
│  ├─ api/
│  ├─ login/
│  ├─ mypage/
│  ├─ settings/
│  └─ share/[slug]/
│
├─ components/
│  ├─ auth/ (3個)
│  ├─ chat/ (5個)
│  ├─ itinerary/ (28個)
│  ├─ layout/ (6個)
│  ├─ settings/ (4個)
│  ├─ ui/ (8個)
│  └─ comments/ (3個)
│
├─ lib/
│  ├─ store/
│  │  ├─ chat/ - useChatStore
│  │  ├─ ai/ - useAIStore
│  │  ├─ settings/ - useSettingsStore
│  │  ├─ ui/ - useUIStore
│  │  ├─ layout/ - useLayoutStore
│  │  └─ itinerary/ - 5 stores
│  │
│  ├─ hooks/
│  │  ├─ chat/ (2個)
│  │  ├─ settings/ (1個)
│  │  ├─ ai/ (1個)
│  │  └─ itinerary/ (9個)
│  │
│  ├─ ai/
│  │  ├─ gemini.ts
│  │  ├─ claude.ts
│  │  ├─ prompts.ts
│  │  └─ prompt-templates/ (4個)
│  │
│  ├─ db/ - Supabase統合
│  ├─ utils/ - ユーティリティ
│  └─ execution/ - 実行ロジック
│
├─ types/ - TypeScript型定義
├─ docs/ - ドキュメント
├─ e2e/ - E2Eテスト
└─ k8s/ - Kubernetes設定
```

---

## 開発ワークフロー

### 1. 新機能追加
1. **ドメイン特定**: どのドメインに属するか
2. **Store拡張**: 必要に応じてStateとActionsを追加
3. **Hook作成**: ビジネスロジックをカプセル化
4. **Component作成**: UIに専念
5. **テスト作成**: Hook・Storeのテスト

### 2. バグ修正
1. **再現**: E2Eテストで再現
2. **原因特定**: どのレイヤーの問題か
3. **修正**: 該当レイヤーのみ修正
4. **テスト追加**: 再発防止

### 3. パフォーマンス改善
1. **計測**: React DevToolsでプロファイリング
2. **特定**: ボトルネックの特定
3. **最適化**: memo, useMemo, useCallback
4. **検証**: 再計測

---

## セキュリティ

### 認証
- NextAuth.js + Google OAuth
- JWT戦略
- HTTPOnly Cookie

### APIキー管理
- LocalStorageに暗号化保存
- 環境変数での管理
- クライアント側での暗号化

### CORS・CSP
- 適切なヘッダー設定
- XSS対策

---

## デプロイ戦略

### 環境
- **開発**: Docker Compose
- **本番**: Google Cloud Run / Kubernetes

### CI/CD
- GitHub Actions
- ArgoCD (Kubernetes)
- ブランチ環境分離

---

## パフォーマンス指標

### 目標
- **初期ロード**: <2秒 (LCP)
- **チャット応答**: <100ms
- **PDF生成**: <5秒（10ページ）
- **メモリ使用**: <100MB

### 最適化手法
- React.memo
- useMemo
- useCallback
- コード分割 (dynamic import)
- 画像最適化 (Next.js Image)

---

## トラブルシューティング

### Q: しおりが表示されない
**A**: useItineraryStoreとuseStoreの同期問題の可能性（Phase 9で解決済み）

### Q: ビルドエラー
**A**: `rm -rf .next && npm run build` でクリーンビルド

### Q: TypeScript エラー
**A**: 型定義を確認、Store・Hooksのインターフェース確認

---

**作成日**: 2025-01-10  
**最終更新**: 2025-01-10  
**メンテナ**: 開発チーム
