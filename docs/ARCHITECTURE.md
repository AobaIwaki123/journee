# アーキテクチャガイド

**作成日**: 2025-01-10  
**最終更新**: Phase 1-12完了後  
**対象**: 開発者・メンテナー

---

## 概要

Journeeは、**クリーンアーキテクチャ**に基づいたReact/Next.jsアプリケーションです。
Phase 1-12のリファクタリングにより、以下の原則を達成しました：

1. **単一責任の原則** - 1モジュール = 1責務
2. **関心の分離** - Store (状態) / Hooks (ロジック) / Components (UI)
3. **依存性の逆転** - 上位レイヤーは下位レイヤーに依存しない
4. **テスタビリティ** - 各レイヤーを独立してテスト可能

---

## レイヤー構造

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Components - UI表示のみ)              │
│                                         │
│  - chat/, itinerary/, layout/,          │
│    settings/, ui/                       │
└─────────────────────────────────────────┘
             ↓ 依存
┌─────────────────────────────────────────┐
│        Application Layer                │
│  (Custom Hooks - ビジネスロジック)      │
│                                         │
│  - lib/hooks/chat/                      │
│  - lib/hooks/itinerary/                 │
│  - lib/hooks/settings/                  │
│  - lib/hooks/ai/                        │
└─────────────────────────────────────────┘
             ↓ 依存
┌─────────────────────────────────────────┐
│         Domain Layer                    │
│  (Store Slices - 状態管理)              │
│                                         │
│  - lib/store/chat/                      │
│  - lib/store/ai/                        │
│  - lib/store/settings/                  │
│  - lib/store/ui/                        │
│  - lib/store/layout/                    │
│  - lib/store/itinerary/ (5 slices)      │
└─────────────────────────────────────────┘
             ↓ 依存
┌─────────────────────────────────────────┐
│      Infrastructure Layer               │
│  (Utils, API, DB - 外部サービス)        │
│                                         │
│  - lib/utils/                           │
│  - lib/ai/                              │
│  - lib/db/                              │
└─────────────────────────────────────────┘
```

---

## Store構造（9個のスライス）

### 1. Chat Store (`useChatStore`)
**責務**: チャット機能の状態管理

```typescript
interface ChatStore {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessage: string;
  editingMessageId: string | null;
  messageDraft: string;
  abortController: AbortController | null;
  
  // Actions
  addMessage, clearMessages, deleteMessage
  startEditingMessage, saveEditedMessage, cancelEditingMessage
  setLoading, setStreaming, setStreamingMessage
  setAbortController, abortAIResponse
}
```

**使用箇所**: MessageInput, MessageList, ChatBox, ResetButton

---

### 2. AI Store (`useAIStore`)
**責務**: AI設定の管理

```typescript
interface AIStore {
  selectedModel: AIModelId;
  claudeApiKey: string;
  geminiApiKey: string;
  
  // Actions
  setSelectedModel, setClaudeApiKey, removeClaudeApiKey
  initializeFromStorage
}
```

**使用箇所**: AISelector, AISettings, APIKeyModal, MessageInput, MessageList

---

### 3. Settings Store (`useSettingsStore`)
**責務**: アプリケーション設定

```typescript
interface SettingsStore {
  settings: AppSettings;
  
  // Actions
  updateSettings, updateGeneralSettings, updateSoundSettings
  resetToDefaults, initializeFromStorage
}
```

**使用箇所**: GeneralSettings, SoundSettings, MessageInput, MessageList

---

### 4. UI Store (`useUIStore`)
**責務**: UI状態（トースト、保存状態、エラー）

```typescript
interface UIStore {
  toasts: ToastMessage[];
  isSaving: boolean;
  lastSaveTime: Date | null;
  storageInitialized: boolean;
  error: string | null;
  
  // Actions
  addToast, removeToast, clearToasts
  setSaving, setLastSaveTime
  setError, clearError
  setStorageInitialized
}
```

**使用箇所**: 全コンポーネント（toastは20箇所以上で使用）

---

### 5. Layout Store (`useLayoutStore`)
**責務**: レイアウト状態

```typescript
interface LayoutStore {
  chatPanelWidth: number;
  mobileActiveTab: 'chat' | 'itinerary';
  isMobileMenuOpen: boolean;
  
  // Actions
  setChatPanelWidth, setMobileActiveTab
  setMobileMenuOpen, toggleMobileMenu
  initializeFromStorage
}
```

**使用箇所**: ResizableLayout, ResizablePanel, MobileLayout

---

### 6-10. Itinerary Stores（5個のスライス）

#### 6. `useItineraryStore`
**責務**: しおり基本情報

```typescript
interface ItineraryStore {
  currentItinerary: ItineraryData | null;
  setItinerary, updateItinerary
}
```

#### 7. `useSpotStore`
**責務**: スポット操作

```typescript
interface SpotStore {
  addSpot, updateSpot, deleteSpot
  reorderSpots, moveSpot
}
```

#### 8. `useItineraryUIStore`
**責務**: UI状態（フィルタ・ソート）

```typescript
interface ItineraryUIStore {
  filter: ItineraryFilter;
  sort: ItinerarySort;
  setFilter, setSort, resetFilters
}
```

#### 9. `useItineraryProgressStore`
**責務**: 進捗管理

```typescript
interface ItineraryProgressStore {
  planningPhase: ItineraryPhase;
  currentDetailingDay: number | null;
  requirementsChecklist: RequirementChecklistItem[];
  isAutoProgressing: boolean;
  
  setPlanningPhase, setCurrentDetailingDay
  proceedToNextStep, resetPlanning
  updateChecklist, shouldTriggerAutoProgress
}
```

#### 10. `useItineraryHistoryStore`
**責務**: 履歴管理

```typescript
interface ItineraryHistoryStore {
  history: HistoryState;
  undo, redo, canUndo, canRedo
  clearHistory, addToHistory
}
```

---

## Custom Hooks（15個）

### Chat Hooks (2個)
- `useChatMessage` - メッセージ送信・編集・削除
- `useChatHistory` - 履歴管理・検索

### AI Hooks (1個)
- `useAIRequest` - 統一されたAI呼び出し

### Settings Hooks (1個)
- `useAppSettings` - 設定管理・エクスポート

### Itinerary Hooks (9個)
- `useItineraryEditor` - しおり編集
- `useSpotEditor` - スポット編集
- `useItinerarySave` - 保存・読み込み
- `useItineraryPublish` - 公開・共有
- `useItineraryPDF` - PDF生成
- `useItineraryList` - 一覧管理
- `useItineraryHistory` - 履歴操作
- `usePhaseTransition` - フェーズ遷移
- `useAIProgress` - AI進行管理

### Map Hooks (5個)
- `useGoogleMapsLoader` - Google Maps API読み込み
- `useMapInstance` - 地図インスタンス
- `useMapMarkers` - マーカー表示
- `useMapRoute` - ルート描画
- `usePullToRefresh` - Pull-to-Refresh

---

## データフロー

### 1. ユーザー入力 → AI応答

```
User Input (MessageInput)
  ↓
useChatMessage.sendMessage()
  ↓
sendChatMessageStream (API Client)
  ↓
/api/chat (Route Handler)
  ↓
Gemini/Claude API
  ↓
Streaming Response
  ↓
useChatStore (messages更新)
useItineraryStore (itinerary更新)
  ↓
MessageList (表示)
ItineraryPreview (表示)
```

### 2. しおり保存

```
User Click (SaveButton)
  ↓
useItinerarySave.save()
  ↓
ログイン状態チェック
  ├─ ログイン → /api/itinerary/save (DB)
  └─ 未ログイン → LocalStorage
  ↓
useItineraryStore (itinerary更新)
useUIStore (lastSaveTime更新)
  ↓
SaveStatus (表示更新)
```

### 3. しおり公開

```
User Click (ShareButton)
  ↓
useItineraryPublish.publish()
  ↓
/api/itinerary/publish (Route Handler)
  ↓
Supabase (DB保存)
  ↓
useItineraryStore (publicSlug更新)
  ↓
ShareButton (URL表示)
```

---

## コンポーネント構成

### Chat機能
```
ChatBox
├── MessageList (メモ化)
│   ├── MessageSkeleton
│   └── Message items (ReactMarkdown)
└── MessageInput
    └── AISelector
```

### Itinerary機能
```
ItineraryPreview (メモ化)
├── PhaseStatusBar
├── ItineraryContentArea
│   ├── ViewModeSwitcher
│   ├── ItineraryToolbar
│   │   ├── SaveButton
│   │   ├── ShareButton
│   │   ├── ResetButton
│   │   └── PDFExportButton
│   ├── ItineraryHeader
│   │   └── EditableTitle
│   ├── ItinerarySummary (メモ化)
│   ├── ScheduleListView
│   │   └── DaySchedule (メモ化)
│   │       ├── DayScheduleHeader
│   │       ├── SpotList
│   │       │   └── SpotCard (メモ化)
│   │       ├── EmptyDayMessage
│   │       └── AddSpotForm
│   │           └── SpotFormFields
│   └── MapView (メモ化)
└── EmptyItinerary
```

---

## パフォーマンス最適化

### メモ化戦略

#### React.memo適用済み (10個)
- MessageList
- ItinerarySummary
- ItineraryPreview
- DaySchedule
- SpotCard
- MapView
- PDFExportButton
- PublicItineraryView
- ItineraryCard
- ShareButton（一部）

#### useMemo適用
- メッセージフィルタリング（MessageList）
- しおり統計計算（ItinerarySummary）
- スポット位置計算（MapView）
- マーカーデータ準備（MapView）

#### useCallback適用
- イベントハンドラー（全Hook）
- API呼び出し（全Hook）
- ストア更新（全Hook）

---

## 状態の永続化

### LocalStorage管理

**保存されるデータ**:
```json
{
  "journee-storage": {
    "state": {
      "currentItinerary": {...}
    },
    "version": 0
  },
  "journee-chat-panel-width": 50,
  "journee-claude-api-key": "encrypted_key",
  "journee-selected-ai": "gemini",
  "journee-settings": {...}
}
```

**初期化フロー**:
```
StorageInitializer
  ↓
useAIStore.initializeFromStorage()
useSettingsStore.initializeFromStorage()
useLayoutStore.initializeFromStorage()
  ↓
各Storeが個別に初期化
```

---

## テスト戦略

### Unit Tests
- **Hooks**: 90%カバレッジ目標
  - useItineraryEditor.test.ts ✅
  - useSpotEditor.test.ts ✅
  - その他Hooks（Phase 13.1で追加）

- **Stores**: 80%カバレッジ目標
  - useItineraryStore.test.ts ✅
  - その他Stores（Phase 13.1で追加）

### E2E Tests
- full-itinerary-creation.spec.ts
- comment-feature.spec.ts
- map-toggle.spec.ts
- public-pdf-export.spec.ts

---

## セキュリティ

### APIキー管理
- LocalStorageに暗号化保存
- useAIStoreで集中管理
- 削除機能の提供

### 認証
- NextAuth.js (Google OAuth)
- middleware.tsで保護されたルート
- セッションベース認証

### データ保護
- クライアントサイド検証
- サーバーサイド検証
- XSS対策（ReactMarkdown sanitize）

---

## パフォーマンス

### 初期ロード
- コード分割: 自動（Next.js App Router）
- 遅延読み込み: 重いコンポーネント
- 画像最適化: Next.js Image

### ランタイム
- React.memo: 10コンポーネント
- useMemo: 計算結果キャッシュ
- useCallback: 関数安定化

### バンドルサイズ
- Tree Shaking: 有効
- Dynamic Import: PDF, Map
- 依存関係最小化

---

## 今後の拡張

### 短期
1. テストカバレッジ90%達成
2. E2Eテストシナリオ拡充
3. パフォーマンス計測

### 中期
1. オフライン対応（PWA）
2. リアルタイム同期
3. マルチユーザー対応

### 長期
1. AI機能拡張
2. 地図機能強化
3. 多言語対応

---

**メンテナンス**: このドキュメントは定期的に更新してください  
**質問・提案**: GitHub Issuesまで
