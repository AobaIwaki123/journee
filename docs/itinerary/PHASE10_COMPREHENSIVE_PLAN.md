# Phase 10-13: 包括的リファクタリング計画

**作成日**: 2025-01-10  
**推定期間**: 8-12時間（自動実行）  
**目標**: アーキテクチャの完全な整理と最適化

---

## Phase 10: 完全なStore統合とHook化 🎯

**目標**: useStoreの直接使用を完全に排除し、すべてドメイン別スライスとカスタムHookに統合

### 10.1: チャット関連のStore分離 (2時間)

#### 新規作成: `lib/store/chat/useChatStore.ts`
```typescript
interface ChatStore {
  // State
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessage: string;
  selectedAI: AIModel;
  abortController: AbortController | null;
  
  // Actions
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setStreamingMessage: (message: string) => void;
  appendStreamingMessage: (chunk: string) => void;
  setSelectedAI: (ai: AIModel) => void;
  setAbortController: (controller: AbortController | null) => void;
}
```

#### 新規作成: `lib/hooks/chat/useChatMessage.ts`
- メッセージ送信ロジック
- ストリーミング処理
- エラーハンドリング

#### 新規作成: `lib/hooks/chat/useChatHistory.ts`
- メッセージ履歴管理
- ローカルストレージ連携
- メッセージ検索・フィルタ

#### 影響コンポーネント (4個)
- `MessageInput.tsx` - useChatMessage使用
- `MessageList.tsx` - useChatHistory使用
- `ChatBox.tsx` - useChatStore使用
- `AISelector.tsx` - useChatStore使用

---

### 10.2: 設定関連のStore分離 (1.5時間)

#### 新規作成: `lib/store/settings/useSettingsStore.ts`
```typescript
interface SettingsStore {
  // State
  general: GeneralSettings;
  ai: AISettings;
  account: AccountSettings;
  soundEnabled: boolean;
  soundVolume: number;
  
  // Actions
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void;
  updateAISettings: (settings: Partial<AISettings>) => void;
  updateAccountSettings: (settings: Partial<AccountSettings>) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  resetSettings: () => void;
}
```

#### 新規作成: `lib/hooks/settings/useAppSettings.ts`
- 設定読み込み・保存
- デフォルト値管理
- バリデーション

#### 影響コンポーネント (6個)
- `GeneralSettings.tsx`
- `AISettings.tsx`
- `AccountSettings.tsx`
- `SoundSettings.tsx`
- `MessageInput.tsx` (currency参照)
- `MessageList.tsx` (currency参照)

---

### 10.3: UI状態のStore分離 (1時間)

#### 新規作成: `lib/store/ui/useUIStore.ts`
```typescript
interface UIStore {
  // State
  toasts: Toast[];
  modals: ModalState[];
  isSaving: boolean;
  lastSaveTime: Date | null;
  storageInitialized: boolean;
  hasReceivedResponse: boolean;
  
  // Actions
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
  openModal: (modal: ModalState) => void;
  closeModal: (id: string) => void;
  setSaving: (saving: boolean) => void;
  setLastSaveTime: (time: Date) => void;
  setStorageInitialized: (initialized: boolean) => void;
  setHasReceivedResponse: (received: boolean) => void;
}
```

#### 影響コンポーネント (15個以上)
- ToastContainer
- SaveStatus
- AutoSave
- StorageInitializer
- その他すべてのaddToast使用箇所

---

### 10.4: useStore完全排除チェックリスト

**現在のuseStore直接使用箇所** (推定20-30箇所):

#### チャット関連 (6箇所)
- [x] MessageInput.tsx - 一部移行済み、残りを移行
- [x] MessageList.tsx - 一部移行済み、残りを移行
- [ ] ChatBox.tsx
- [ ] AISelector.tsx
- [ ] MessageSkeleton.tsx
- [ ] QuickActions.tsx - AI呼び出し部分

#### UI関連 (10箇所)
- [ ] ToastContainer.tsx
- [ ] SaveStatus.tsx
- [ ] AutoSave.tsx - 一部移行済み
- [ ] StorageInitializer.tsx - 一部移行済み
- [ ] Header.tsx
- [ ] MobileMenu.tsx
- [ ] DaySchedule.tsx - addToast
- [ ] SpotCard.tsx - addToast
- [ ] AddSpotForm.tsx - addToast
- [ ] その他Toast使用箇所

#### しおり関連 (4箇所)
- [ ] ResetButton.tsx - clearMessages
- [ ] EmptyItinerary.tsx
- [ ] PhaseStatusBar.tsx
- [ ] PlanningProgress.tsx

#### その他 (推定5-10箇所)
- すべてのコンポーネントをgrep検索して洗い出し

---

## Phase 11: AIロジックの完全リファクタリング 🤖

**目標**: AI呼び出しロジックの統一化とパフォーマンス向上

### 11.1: AI呼び出しの完全統合 (2時間)

#### リファクタリング対象
1. `lib/hooks/itinerary/useAIProgress.ts` - 拡張
2. `lib/hooks/chat/useChatMessage.ts` - 新規作成
3. `lib/ai/prompts.ts` - 整理
4. `lib/execution/sequential-itinerary-builder.ts` - 簡素化

#### 新規作成: `lib/hooks/ai/useAIRequest.ts`
```typescript
interface UseAIRequestOptions {
  model: AIModel;
  onChunk?: (chunk: string) => void;
  onComplete?: (result: any) => void;
  onError?: (error: Error) => void;
  autoRetry?: boolean;
  retryCount?: number;
}

function useAIRequest(options: UseAIRequestOptions) {
  const sendRequest = async (prompt: string) => {
    // 統一されたAI呼び出しロジック
  };
  
  return { sendRequest, isLoading, error, abort };
}
```

#### 改善点
- エラーハンドリングの統一
- リトライロジックの統合
- レート制限対応
- プログレス表示の統一

---

### 11.2: ストリーミング処理の最適化 (1.5時間)

#### 最適化項目
1. **チャンク処理の改善**
   - バッファリング戦略の最適化
   - UI更新頻度の調整
   - メモリ使用量の削減

2. **JSONパース処理の改善**
   - `lib/ai/prompts.ts`のparseAIResponse最適化
   - 部分的なJSONパース対応
   - エラーリカバリーの強化

3. **キャンセル処理の改善**
   - AbortControllerの適切な管理
   - クリーンアップ処理の徹底
   - メモリリーク防止

---

### 11.3: プロンプト管理の改善 (1時間)

#### 新規作成: `lib/ai/prompt-templates/`
```
lib/ai/prompt-templates/
├── gathering.ts      - 情報収集フェーズ
├── skeleton.ts       - 骨組み作成フェーズ
├── detailing.ts      - 詳細化フェーズ
├── review.ts         - レビューフェーズ
└── index.ts          - テンプレート管理
```

#### 改善点
- プロンプトのバージョン管理
- A/Bテスト対応
- 多言語対応の準備
- プロンプトの可視化・デバッグ

---

## Phase 12: パフォーマンス最適化 ⚡

**目標**: レンダリング最適化とコード分割

### 12.1: メモ化の徹底 (1.5時間)

#### 対象コンポーネント (優先度順)
1. **高頻度レンダリング**
   - MessageList.tsx
   - DaySchedule.tsx
   - SpotCard.tsx
   - ItineraryPreview.tsx

2. **重い計算処理**
   - ItinerarySummary.tsx (統計計算)
   - MapView.tsx (地図レンダリング)
   - PDFExportButton.tsx (PDF生成)

#### 実装内容
```typescript
// Before
export const MessageList: React.FC = () => {
  const messages = useChatStore(state => state.messages);
  // ...
}

// After
export const MessageList = memo(() => {
  const messages = useChatStore(state => state.messages);
  
  const sortedMessages = useMemo(
    () => messages.sort((a, b) => a.timestamp - b.timestamp),
    [messages]
  );
  
  const handleDelete = useCallback((id: string) => {
    deleteMessage(id);
  }, [deleteMessage]);
  
  // ...
});
```

---

### 12.2: コード分割の拡張 (1時間)

#### 動的インポート対象
1. **PDF関連**
   ```typescript
   const PDFExportButton = dynamic(() => 
     import('./PDFExportButton').then(mod => ({ default: mod.PDFExportButton })),
     { loading: () => <Loader2 className="animate-spin" /> }
   );
   ```

2. **地図関連**
   ```typescript
   const MapView = dynamic(() => import('./MapView'));
   ```

3. **モーダル関連**
   - PDFPreviewModal
   - ShareButton内のモーダル
   - 各種設定モーダル

4. **重いライブラリ**
   - ReactMarkdown
   - @hello-pangea/dnd
   - html2canvas
   - jsPDF

---

### 12.3: 仮想スクロール導入 (1.5時間)

#### 対象コンポーネント
1. **MessageList** (メッセージ数 > 50)
2. **ItineraryList** (しおり数 > 20)
3. **DaySchedule内のSpotList** (スポット数 > 20)

#### 実装
```typescript
import { VirtualList } from 'react-window';

export const MessageList = memo(() => {
  const messages = useChatStore(state => state.messages);
  
  if (messages.length > 50) {
    return (
      <VirtualList
        height={600}
        itemCount={messages.length}
        itemSize={120}
        width="100%"
      >
        {({ index, style }) => (
          <div style={style}>
            <MessageItem message={messages[index]} />
          </div>
        )}
      </VirtualList>
    );
  }
  
  // 通常のレンダリング
  return <div>{messages.map(msg => <MessageItem key={msg.id} message={msg} />)}</div>;
});
```

---

## Phase 13: テストとドキュメント 📝

**目標**: 品質保証とメンテナンス性向上

### 13.1: カスタムHooksの完全テスト (2時間)

#### テスト対象 (9個 + 新規)
1. useItineraryEditor.ts ✅ 既存
2. useSpotEditor.ts ✅ 既存
3. useItinerarySave.ts - 追加
4. useItineraryPublish.ts - 追加
5. useItineraryPDF.ts - 追加
6. useItineraryList.ts - 追加
7. useItineraryHistory.ts - 追加
8. usePhaseTransition.ts - 追加
9. useAIProgress.ts - 追加
10. useChatMessage.ts - 新規
11. useChatHistory.ts - 新規
12. useAppSettings.ts - 新規

#### テストカバレッジ目標
- **カスタムHooks**: 90%以上
- **Storeスライス**: 80%以上
- **ユーティリティ関数**: 95%以上

---

### 13.2: E2Eテストの拡充 (1.5時間)

#### 新規E2Eテスト
1. **フルフロー**
   - `e2e/full-itinerary-creation.spec.ts`
   - testコマンド → しおり作成 → 編集 → 保存 → 公開

2. **エラーリカバリー**
   - `e2e/error-recovery.spec.ts`
   - ネットワークエラー → リトライ → 成功

3. **パフォーマンス**
   - `e2e/performance.spec.ts`
   - 大量メッセージ → スクロール → レスポンシブ

4. **マルチデバイス**
   - `e2e/responsive.spec.ts`
   - PC → タブレット → スマホ

---

### 13.3: ドキュメント整備 (1時間)

#### 作成ドキュメント
1. **アーキテクチャガイド**
   - `docs/ARCHITECTURE.md`
   - Store構造、Hook設計、コンポーネント階層

2. **開発ガイドライン更新**
   - `docs/GUIDELINE.md`の刷新
   - Phase 10-13の成果反映

3. **API仕様書更新**
   - `docs/API.md`
   - 新規Hook、Storeの追加

4. **リファクタリング総括**
   - `docs/itinerary/REFACTORING_FINAL_SUMMARY.md`
   - Phase 1-13の全記録

---

## 実装順序とチェックポイント 📋

### 第1ステージ: Store統合 (4-5時間)
```
[Phase 10.1] チャットStore分離
  ↓ コミット
[Phase 10.2] 設定Store分離
  ↓ コミット
[Phase 10.3] UIStore分離
  ↓ コミット
[Phase 10.4] useStore排除確認
  ↓ ビルド確認・コミット
```

### 第2ステージ: AI最適化 (4-5時間)
```
[Phase 11.1] AI呼び出し統合
  ↓ コミット
[Phase 11.2] ストリーミング最適化
  ↓ コミット
[Phase 11.3] プロンプト管理改善
  ↓ ビルド確認・コミット
```

### 第3ステージ: パフォーマンス (4時間)
```
[Phase 12.1] メモ化の徹底
  ↓ コミット
[Phase 12.2] コード分割拡張
  ↓ コミット
[Phase 12.3] 仮想スクロール導入
  ↓ パフォーマンス計測・コミット
```

### 第4ステージ: 品質保証 (4-5時間)
```
[Phase 13.1] Hooksテスト
  ↓ テスト実行・コミット
[Phase 13.2] E2Eテスト拡充
  ↓ テスト実行・コミット
[Phase 13.3] ドキュメント整備
  ↓ 最終コミット
```

---

## 成功基準 ✅

### コード品質
- [ ] useStoreの直接使用: **0箇所** (現在2箇所)
- [ ] 平均コンポーネント行数: **<100行** (現在122行)
- [ ] カスタムHooks: **15個以上** (現在9個)
- [ ] Storeスライス: **9個以上** (現在6個)
- [ ] 総コード削減: **-2000行以上** (現在-1213行)

### パフォーマンス
- [ ] 初期ロード: **<2秒** (LCP)
- [ ] チャット応答: **<100ms** (入力→表示)
- [ ] PDF生成: **<5秒** (10ページ)
- [ ] メモリ使用: **<100MB** (通常使用時)

### テスト
- [ ] Hookテストカバレッジ: **>90%**
- [ ] Storeテストカバレッジ: **>80%**
- [ ] E2Eテスト: **10シナリオ以上**
- [ ] すべてのテストがパス

### ドキュメント
- [ ] ARCHITECTURE.md作成
- [ ] GUIDELINE.md更新
- [ ] API.md更新
- [ ] REFACTORING_FINAL_SUMMARY.md作成

---

## リスクと対策 ⚠️

### リスク1: 大規模な変更によるバグ混入
**対策**:
- 各Phaseごとにビルド確認
- 重要な機能のE2Eテスト
- 段階的なコミット (15-20個)

### リスク2: パフォーマンス悪化
**対策**:
- React.memo, useMemo, useCallbackの適切な使用
- 過度なメモ化の回避
- Chrome DevToolsでプロファイリング

### リスク3: テスト時間の長期化
**対策**:
- 並列テスト実行
- 重要なテストのみ優先実行
- CI/CDの活用

---

## タイムライン (自動実行想定)

| 時間 | フェーズ | タスク | チェックポイント |
|------|----------|--------|------------------|
| 0-1h | Phase 10.1 | チャットStore | ビルド✓ |
| 1-2.5h | Phase 10.2 | 設定Store | ビルド✓ |
| 2.5-3.5h | Phase 10.3 | UIStore | ビルド✓ |
| 3.5-4h | Phase 10.4 | useStore排除確認 | 全体テスト✓ |
| 4-6h | Phase 11.1 | AI統合 | ビルド✓ |
| 6-7.5h | Phase 11.2 | ストリーミング | ビルド✓ |
| 7.5-8.5h | Phase 11.3 | プロンプト管理 | ビルド✓ |
| 8.5-10h | Phase 12.1 | メモ化 | パフォーマンス計測 |
| 10-11h | Phase 12.2 | コード分割 | バンドルサイズ確認 |
| 11-12.5h | Phase 12.3 | 仮想スクロール | パフォーマンス計測 |
| 12.5-14.5h | Phase 13.1 | テスト | カバレッジ確認 |
| 14.5-16h | Phase 13.2 | E2E | テスト実行 |
| 16-17h | Phase 13.3 | ドキュメント | レビュー |

**推定合計時間**: 14-17時間

---

## 最終成果物 🎁

### コード
- ✨ **完全にクリーンなアーキテクチャ**
- 🎯 **useStoreの完全排除**
- 🚀 **50%以上のパフォーマンス向上**
- 📦 **20-30%のバンドルサイズ削減**

### ドキュメント
- 📘 **包括的なアーキテクチャガイド**
- 📗 **更新された開発ガイドライン**
- 📙 **完全なAPI仕様書**
- 📕 **リファクタリング総括レポート**

### テスト
- ✅ **90%以上のカバレッジ**
- ✅ **10以上のE2Eシナリオ**
- ✅ **継続的な品質保証基盤**

---

**作成者**: AI Assistant  
**レビュー待ち**: ユーザー様  
**実行予定**: レビュー後、自動実行開始  
**完了予定**: 14-17時間後
