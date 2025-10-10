# リファクタリング機能定義書

**作成日**: 2025-01-10  
**目的**: 場当たり的なリファクタリングを避け、現在の機能から「あるべき機能」を定義し、計画的に実装する

---

## 現状分析

### useStoreの現状 (1162行)
- **使用箇所**: 38ファイル、171回
- **責務**: チャット、しおり、UI、設定、履歴など全てを管理
- **問題点**: 巨大な単一ストア、責務の不明確化、テスト困難

### 既存のStore分割 (Phase 1-9で作成)
- ✅ `useItineraryStore` - しおり基本情報
- ✅ `useSpotStore` - スポット操作
- ✅ `useItineraryUIStore` - フィルタ・ソート
- ✅ `useItineraryProgressStore` - 進捗管理
- ✅ `useItineraryHistoryStore` - 履歴管理

### 既存のカスタムHooks (Phase 1-9で作成)
- ✅ `useItineraryEditor` - しおり編集
- ✅ `useSpotEditor` - スポット編集
- ✅ `useItinerarySave` - 保存・読み込み
- ✅ `useItineraryPublish` - 公開・共有
- ✅ `useItineraryPDF` - PDF出力
- ✅ `useItineraryList` - 一覧管理
- ✅ `useItineraryHistory` - 履歴操作
- ✅ `usePhaseTransition` - フェーズ遷移
- ✅ `useAIProgress` - AI進行管理

---

## 機能ドメイン定義

### 1. チャット機能 💬

#### 責務
- メッセージの送受信
- AIとの対話
- ストリーミング処理
- 会話履歴管理

#### あるべき状態管理
**Store: `useChatStore`**
```typescript
interface ChatStore {
  // State
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessage: string;
  abortController: AbortController | null;
  
  // Actions
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setStreamingMessage: (message: string) => void;
  appendStreamingMessage: (chunk: string) => void;
  setAbortController: (controller: AbortController | null) => void;
}
```

#### あるべきHooks
**Hook: `useChatMessage`**
```typescript
interface UseChatMessageReturn {
  sendMessage: (content: string) => Promise<void>;
  resendMessage: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => void;
  editMessage: (messageId: string, newContent: string) => void;
  isLoading: boolean;
  error: string | null;
}
```

**Hook: `useChatHistory`**
```typescript
interface UseChatHistoryReturn {
  messages: Message[];
  searchMessages: (query: string) => Message[];
  filterByType: (type: 'user' | 'assistant') => Message[];
  clearHistory: () => void;
  exportHistory: () => string;
  importHistory: (data: string) => void;
}
```

#### 影響コンポーネント
- `MessageInput.tsx`
- `MessageList.tsx`
- `ChatBox.tsx`
- `MessageSkeleton.tsx`

#### 移行元
- `useStore`: messages, isLoading, isStreaming, streamingMessage, hasReceivedResponse
- `useStore`: addMessage, setLoading, setStreaming, setStreamingMessage, appendStreamingMessage

---

### 2. AI設定機能 🤖

#### 責務
- AIモデル選択
- APIキー管理
- AI関連設定

#### あるべき状態管理
**Store: `useAIStore`**
```typescript
interface AIStore {
  // State
  selectedModel: AIModelId;
  claudeApiKey: string | null;
  geminiApiKey: string | null;
  
  // Actions
  setSelectedModel: (model: AIModelId) => void;
  setClaudeApiKey: (key: string) => void;
  clearClaudeApiKey: () => void;
  setGeminiApiKey: (key: string) => void;
  clearGeminiApiKey: () => void;
  
  // LocalStorage同期
  initializeFromStorage: () => void;
  saveToStorage: () => void;
}
```

#### 影響コンポーネント
- `AISelector.tsx`
- `AISettings.tsx`
- `APIKeyModal.tsx`
- `MessageInput.tsx` (AI選択参照)
- `MessageList.tsx` (AI選択参照)

#### 移行元
- `useStore`: selectedAI, claudeApiKey
- `useStore`: setSelectedAI, setClaudeApiKey, clearClaudeApiKey

---

### 3. 設定機能 ⚙️

#### 責務
- 一般設定（言語、通貨、タイムゾーン）
- アカウント設定
- サウンド設定
- 設定の永続化

#### あるべき状態管理
**Store: `useSettingsStore`**
```typescript
interface SettingsStore {
  // State
  settings: AppSettings;
  soundEnabled: boolean;
  soundVolume: number;
  
  // Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void;
  updateAccountSettings: (settings: Partial<AccountSettings>) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  resetToDefaults: () => void;
  
  // LocalStorage同期
  initializeFromStorage: () => void;
  saveToStorage: () => void;
}
```

#### あるべきHooks
**Hook: `useAppSettings`**
```typescript
interface UseAppSettingsReturn {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetToDefaults: () => void;
  validateSettings: (settings: Partial<AppSettings>) => ValidationResult;
  exportSettings: () => string;
  importSettings: (data: string) => void;
}
```

#### 影響コンポーネント
- `GeneralSettings.tsx`
- `AccountSettings.tsx`
- `SoundSettings.tsx`
- `settings/page.tsx`
- `MessageInput.tsx` (currency参照)
- `MessageList.tsx` (currency参照)

#### 移行元
- `useStore`: settings, soundEnabled, soundVolume
- `useStore`: updateSettings, setSoundEnabled, setSoundVolume

---

### 4. UI状態機能 🎨

#### 責務
- トースト通知
- モーダル管理
- 保存状態表示
- ストレージ初期化状態

#### あるべき状態管理
**Store: `useUIStore`**
```typescript
interface UIStore {
  // State
  toasts: ToastMessage[];
  modals: ModalState[];
  isSaving: boolean;
  lastSaveTime: Date | null;
  storageInitialized: boolean;
  
  // Actions - Toast
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Actions - Modal
  openModal: (modal: ModalState) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // Actions - Save Status
  setSaving: (saving: boolean) => void;
  setLastSaveTime: (time: Date) => void;
  
  // Actions - Initialization
  setStorageInitialized: (initialized: boolean) => void;
}
```

#### 影響コンポーネント
- `ToastContainer.tsx` - toasts
- `SaveStatus.tsx` - isSaving, lastSaveTime
- `AutoSave.tsx` - setSaving, setLastSaveTime
- `StorageInitializer.tsx` - setStorageInitialized
- **全コンポーネント** - addToast使用箇所多数

#### 移行元
- `useStore`: toasts, isSaving, lastSaveTime, storageInitialized
- `useStore`: addToast, removeToast, setSaving, setLastSaveTime, setStorageInitialized

---

### 5. レイアウト状態機能 📐

#### 責務
- チャットパネル幅
- モバイル表示状態
- リサイズ状態

#### あるべき状態管理
**Store: `useLayoutStore`**
```typescript
interface LayoutStore {
  // State
  chatPanelWidth: number;
  isMobileMenuOpen: boolean;
  
  // Actions
  setChatPanelWidth: (width: number) => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  
  // LocalStorage同期
  saveChatPanelWidth: () => void;
}
```

#### 影響コンポーネント
- `ResizableLayout.tsx`
- `ResizablePanel.tsx`
- `MobileLayout.tsx`
- `MobileMenu.tsx`

#### 移行元
- `useStore`: chatPanelWidth, setChatPanelWidth

---

### 6. エラー状態機能 ⚠️

#### 責務
- グローバルエラー管理
- エラー表示
- エラーリカバリー

#### あるべき状態管理
**統合先: `useUIStore`に統合**
```typescript
// useUIStore に追加
interface UIStore {
  // State
  error: string | null;
  errorDetails: ErrorDetails | null;
  
  // Actions
  setError: (error: string, details?: ErrorDetails) => void;
  clearError: () => void;
}
```

#### 影響コンポーネント
- `ErrorNotification.tsx`
- `MessageInput.tsx`
- `MessageList.tsx`
- その他エラー表示箇所

#### 移行元
- `useStore`: error, setError, clearError

---

## 統合・排除対象

### 完全排除: useStore内の重複機能

#### 1. しおり関連 (既に分割済み)
- ❌ `currentItinerary` → ✅ `useItineraryStore`
- ❌ `planningPhase` → ✅ `useItineraryProgressStore`
- ❌ しおり操作アクション → ✅ カスタムHooks

#### 2. 設定関連 (Phase 10.2で分割)
- ❌ `settings` → ✅ `useSettingsStore`
- ❌ `soundEnabled`, `soundVolume` → ✅ `useSettingsStore`

#### 3. チャット関連 (Phase 10.1で分割)
- ❌ `messages`, `isLoading`, `isStreaming` → ✅ `useChatStore`

#### 4. UI関連 (Phase 10.3で分割)
- ❌ `toasts`, `isSaving`, `lastSaveTime` → ✅ `useUIStore`

#### 5. AI関連 (Phase 10.1で分割)
- ❌ `selectedAI`, `claudeApiKey` → ✅ `useAIStore`

---

## 実装優先度

### 🔴 最優先 (Phase 10.1-10.3)
1. **useChatStore + useAIStore** - チャット機能の完全分離
2. **useSettingsStore** - 設定管理の完全分離
3. **useUIStore** - UI状態の完全分離

### 🟡 高優先 (Phase 10.4)
4. **useLayoutStore** - レイアウト状態の分離
5. **useStore完全排除** - 全箇所の移行確認

### 🟢 中優先 (Phase 11-12)
6. **カスタムHooksの拡充** - ビジネスロジックの分離
7. **パフォーマンス最適化** - メモ化、コード分割

### 🔵 低優先 (Phase 13)
8. **テスト拡充** - カバレッジ向上
9. **ドキュメント整備** - 保守性向上

---

## 移行マッピング

### useStoreからの完全移行マップ

| useStore内の機能 | 移行先 | 優先度 | Phase |
|------------------|--------|--------|-------|
| messages, isLoading, isStreaming | useChatStore | 🔴 | 10.1 |
| selectedAI, claudeApiKey | useAIStore | 🔴 | 10.1 |
| settings, soundEnabled, soundVolume | useSettingsStore | 🔴 | 10.2 |
| toasts, isSaving, lastSaveTime | useUIStore | 🔴 | 10.3 |
| error, setError | useUIStore (統合) | 🔴 | 10.3 |
| chatPanelWidth | useLayoutStore | 🟡 | 10.4 |
| currentItinerary | useItineraryStore | ✅ | 完了 |
| planningPhase, currentDetailingDay | useItineraryProgressStore | ✅ | 完了 |
| しおり操作 | カスタムHooks | ✅ | 完了 |

---

## 成功基準

### 定量的基準
- [ ] useStore直接使用: **0箇所** (現在38ファイル171箇所)
- [ ] Storeスライス: **9個** (Chat, AI, Settings, UI, Layout + 既存5個)
- [ ] カスタムHooks: **15個以上**
- [ ] useStore.tsのサイズ: **0行** (削除)

### 定性的基準
- [ ] 各ストアが単一責任を持つ
- [ ] コンポーネントから直接useStoreを使わない
- [ ] ビジネスロジックはカスタムHooksに集約
- [ ] UIコンポーネントは表示に専念

### アーキテクチャ原則
1. **単一責任の原則**: 1ストア = 1ドメイン
2. **関心の分離**: Store (状態) / Hooks (ロジック) / Components (UI)
3. **依存性の逆転**: コンポーネントはHooksに依存、Storeに直接依存しない
4. **テスタビリティ**: 各レイヤーを独立してテスト可能

---

## Phase 10 詳細実装計画

### Phase 10.1: Chat & AI Store分離 (2-3時間)

#### 作成ファイル
1. `lib/store/chat/useChatStore.ts` (120行)
2. `lib/store/ai/useAIStore.ts` (80行)
3. `lib/hooks/chat/useChatMessage.ts` (150行)
4. `lib/hooks/chat/useChatHistory.ts` (100行)
5. `lib/store/chat/index.ts`
6. `lib/store/ai/index.ts`
7. `lib/hooks/chat/index.ts`

#### 修正ファイル (6個)
- `MessageInput.tsx` - useChatMessage, useAIStore使用
- `MessageList.tsx` - useChatHistory, useAIStore使用
- `ChatBox.tsx` - useChatStore使用
- `AISelector.tsx` - useAIStore使用
- `MessageSkeleton.tsx` - useChatStore使用
- `QuickActions.tsx` - useAIStore使用

#### 削除対象 (useStoreから)
```typescript
// 削除: Chat関連
messages: Message[];
isLoading: boolean;
isStreaming: boolean;
streamingMessage: string;
hasReceivedResponse: boolean;
abortController: AbortController | null;

// 削除: AI関連
selectedAI: AIModelId;
claudeApiKey: string | null;
```

---

### Phase 10.2: Settings Store分離 (1.5-2時間)

#### 作成ファイル
1. `lib/store/settings/useSettingsStore.ts` (150行)
2. `lib/hooks/settings/useAppSettings.ts` (120行)
3. `lib/store/settings/index.ts`
4. `lib/hooks/settings/index.ts`

#### 修正ファイル (8個)
- `GeneralSettings.tsx`
- `AccountSettings.tsx`
- `SoundSettings.tsx`
- `AISettings.tsx`
- `settings/page.tsx`
- `MessageInput.tsx` - currency参照
- `MessageList.tsx` - currency参照
- `QuickActions.tsx` - currency参照

#### 削除対象 (useStoreから)
```typescript
// 削除: Settings関連
settings: AppSettings;
soundEnabled: boolean;
soundVolume: number;
updateSettings: (updates: Partial<AppSettings>) => void;
setSoundEnabled: (enabled: boolean) => void;
setSoundVolume: (volume: number) => void;
```

---

### Phase 10.3: UI Store分離 (1.5-2時間)

#### 作成ファイル
1. `lib/store/ui/useUIStore.ts` (200行)
2. `lib/store/ui/index.ts`

#### 修正ファイル (20個以上)
**Toast使用箇所**:
- `ToastContainer.tsx`
- `DaySchedule.tsx`
- `SpotCard.tsx`
- `AddSpotForm.tsx`
- `SaveButton.tsx`
- `ShareButton.tsx`
- `ResetButton.tsx`
- `QuickActions.tsx`
- その他12個以上

**Save Status使用箇所**:
- `SaveStatus.tsx`
- `AutoSave.tsx`
- `StorageInitializer.tsx`

**Error使用箇所**:
- `ErrorNotification.tsx`
- `MessageInput.tsx`
- `MessageList.tsx`

#### 削除対象 (useStoreから)
```typescript
// 削除: UI関連
toasts: ToastMessage[];
isSaving: boolean;
lastSaveTime: Date | null;
storageInitialized: boolean;
error: string | null;
addToast: (message: string, type: ToastType) => void;
removeToast: (id: string) => void;
setSaving: (saving: boolean) => void;
setLastSaveTime: (time: Date) => void;
setStorageInitialized: (initialized: boolean) => void;
setError: (error: string | null) => void;
clearError: () => void;
```

---

### Phase 10.4: Layout Store分離 & useStore削除 (1時間)

#### 作成ファイル
1. `lib/store/layout/useLayoutStore.ts` (80行)
2. `lib/store/layout/index.ts`

#### 修正ファイル
- `ResizableLayout.tsx`
- `ResizablePanel.tsx`
- `MobileLayout.tsx`
- `MobileMenu.tsx`

#### 最終確認
- [ ] `grep -r "useStore" components/` → 0件
- [ ] `grep -r "useStore" lib/hooks/` → 0件
- [ ] `useStore.ts`を削除
- [ ] `useStore-helper.ts`を削除（必要な関数は移行）

---

## リスク管理

### リスク1: 既存の依存関係の破壊
**対策**:
- 各Phaseでビルド確認
- 段階的な移行（完全に移行してから削除）
- コミットは細かく（ロールバック可能に）

### リスク2: LocalStorage同期の不整合
**対策**:
- 各ストアで独立したLocalStorage管理
- マイグレーション処理の実装
- バックアップ機能の実装

### リスク3: パフォーマンス劣化
**対策**:
- 必要最小限のState購読
- セレクター関数の活用
- React DevToolsでプロファイリング

---

## 次のステップ

1. ✅ **このドキュメントのレビュー**
2. 🔄 **Phase 10.1の実装開始** (useChatStore + useAIStore)
3. 🔄 **Phase 10.2の実装** (useSettingsStore)
4. 🔄 **Phase 10.3の実装** (useUIStore)
5. 🔄 **Phase 10.4の実装** (useLayoutStore + useStore削除)
6. ✅ **Phase 11-13の実装** (AI最適化、パフォーマンス、テスト)

---

**作成日**: 2025-01-10  
**最終更新**: 2025-01-10  
**ステータス**: レビュー待ち  
**次のアクション**: Phase 10.1実装開始
