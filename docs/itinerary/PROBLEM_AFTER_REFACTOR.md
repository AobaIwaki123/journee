# リファクタリング後の問題点

**作成日**: 2025-01-10  
**対象**: Phase 1〜5のリファクタリング完了後

## 概要

Phase 1〜5のリファクタリングにより、カスタムHooks、ストアスライス、型定義の整理、テストの追加を完了しました。しかし、既存コンポーネントの多くが新しいアーキテクチャを活用できていない問題が残っています。

## 統計情報

### コンポーネント数
- **しおり関連コンポーネント**: 24個
- **カスタムHooksを使用**: 2個（8%）
- **useStoreを直接使用**: 14個（58%）
- **ストアスライスを使用**: 0個（0%）

### カスタムHooks活用状況
- ✅ **活用済み**: SaveButton, SpotCard
- ❌ **未活用**: 残り22個のコンポーネント

### ストアスライス活用状況
- ❌ **全く活用されていない**: useItineraryStore, useSpotStore, useItineraryUIStore, useItineraryProgressStore, useItineraryHistoryStore

## 主要な問題点

### 1. カスタムHooksの活用不足 🔴 高優先度

#### 問題
Phase 1で作成した7つのカスタムHooksのうち、実際に活用されているのは2個のみ。

#### 影響
- せっかく作成したロジックの分離が機能していない
- コンポーネント内にビジネスロジックが残っている
- テストが困難
- コードの重複

#### 具体例

**ShareButton.tsx (368行)**
```tsx
// 現状: useStoreを直接使用
const publishItinerary = useStore((state) => state.publishItinerary);
const unpublishItinerary = useStore((state) => state.unpublishItinerary);

// 本来: useItineraryPublish を使うべき
const {
  publish,
  unpublish,
  copyPublicUrl,
  shareViaWebApi
} = useItineraryPublish(itineraryId);
```

**PublicItineraryView.tsx (332行)**
```tsx
// 現状: PDF生成ロジックを直接実装（97行目〜）
const handleDownloadPDF = async () => {
  // generateItineraryPDF を直接呼び出し
};

// 本来: useItineraryPDF を使うべき
const {
  generatePDF,
  isGenerating,
  progress
} = useItineraryPDF();
```

#### 未活用のカスタムHooks
1. ❌ `useItineraryEditor` - タイトル、行き先の編集に使えるはず
2. ❌ `useItinerarySave` - 保存ロジック（SaveButtonのみ使用）
3. ❌ `useItineraryPublish` - 公開・共有ロジック（未使用）
4. ❌ `useItineraryPDF` - PDF生成ロジック（未使用）
5. ❌ `useItineraryList` - 一覧表示ロジック（未使用）
6. ❌ `useItineraryHistory` - Undo/Redo（未使用）

---

### 2. ストアスライスへの移行不足 🔴 高優先度

#### 問題
Phase 3で作成した5つのストアスライスが全く活用されていない。14個のコンポーネントが依然として巨大な`useStore`を直接使用している。

#### 影響
- ストアのスライス分割の効果が得られていない
- 不必要な再レンダリングが発生
- コードの見通しが悪い
- パフォーマンス問題

#### 具体例

**QuickActions.tsx (406行)**
```tsx
// 現状: useStoreから多数の状態を取得
const {
  planningPhase,
  currentItinerary,
  proceedToNextStep,
  resetPlanning,
  messages,
  addMessage,
  setStreamingMessage,
  appendStreamingMessage,
  setItinerary,
  setLoading,
  setStreaming,
  setError,
  currentDetailingDay,
  buttonReadiness,
  checklistStatus,
  updateChecklist,
  selectedAI,
  claudeApiKey,
} = useStore(); // 18個の状態を一度に取得！

// 本来: 必要なストアスライスのみ使用
const { planningPhase, proceedToNextStep } = useItineraryProgressStore();
const { currentItinerary } = useItineraryStore();
const { selectedAI } = useSettingsStore();
```

#### useStoreを直接使用しているコンポーネント（14個）
1. DaySchedule.tsx
2. ItineraryList.tsx
3. PlanningProgress.tsx
4. MobilePlannerControls.tsx
5. AddSpotForm.tsx
6. ItineraryPreview.tsx
7. QuickActions.tsx
8. ResetButton.tsx
9. ShareButton.tsx
10. ItinerarySortMenu.tsx
11. EditableTitle.tsx
12. ItineraryFilters.tsx
13. SpotCard.tsx（一部）
14. SaveButton.tsx（一部）

---

### 3. QuickActionsの過剰な責務 🟡 中優先度

#### 問題
QuickActions.tsx が406行と巨大で、複数の責務を持っている。

#### 責務の内訳
1. **フェーズ遷移ロジック** (57〜90行)
2. **AI呼び出しロジック** (150〜250行)
3. **チェックリスト更新** (52〜54行)
4. **UI表示ロジック** (91〜149行、251〜406行)

#### 提案
以下に分割すべき：
- `usePhaseTransition` Hook - フェーズ遷移ロジック
- `useAIProgress` Hook - AI呼び出しと進捗管理
- QuickActionsコンポーネント - UIのみ

---

### 4. ShareButtonの過剰な責務 🟡 中優先度

#### 問題
ShareButton.tsx が368行で、公開設定と共有機能の両方を含む。

#### 責務の内訳
1. **公開設定UI** (モーダル、フォーム)
2. **公開/非公開ロジック** (36〜78行)
3. **URL共有機能** (88〜115行)
4. **設定更新ロジック** (80〜86行)

#### 提案
以下に分割すべき：
- `useItineraryPublish` Hookを使用（既に作成済み）
- `PublicSettingsModal` コンポーネント - 設定UI
- `ShareButtonSimple` コンポーネント - シンプルなボタン

---

### 5. 重複したPDF生成ロジック 🟡 中優先度

#### 問題
PDF生成ロジックが複数箇所に重複している。

#### 重複箇所
1. **PublicItineraryView.tsx** (96〜150行)
2. **PDFExportButton.tsx** （未確認だが可能性あり）

#### 提案
- `useItineraryPDF` Hookを活用（既に作成済み）
- PDF生成ロジックを一箇所に集約

---

### 6. EditableTitle, ItinerarySortMenu, ItineraryFiltersの小規模コンポーネント 🟢 低優先度

#### 問題
これらのコンポーネントは小規模だが、依然としてuseStoreを直接使用している。

#### 提案
- 必要な状態のみをpropsで受け取る
- または適切なストアスライスを使用

---

## 改善提案の優先順位

### Phase 6: カスタムHooksの活用（高優先度）

**目的**: 既存コンポーネントでカスタムHooksを活用

**タスク**:
1. ShareButton → useItineraryPublish を使用
2. PublicItineraryView → useItineraryPDF を使用
3. ItineraryList → useItineraryList を使用
4. その他のコンポーネントでも段階的に適用

**期待効果**:
- ロジックの一元管理
- テストの容易性向上
- コンポーネントのシンプル化

---

### Phase 7: ストアスライスへの移行（高優先度）

**目的**: useStoreからストアスライスへ移行

**タスク**:
1. QuickActions → useItineraryProgressStore を使用
2. DaySchedule → useSpotStore を使用
3. その他14個のコンポーネントを段階的に移行

**期待効果**:
- 不必要な再レンダリングの削減
- パフォーマンス向上
- コードの見通し向上

---

### Phase 8: QuickActionsのリファクタリング（中優先度）

**目的**: QuickActionsを分割

**タスク**:
1. `usePhaseTransition` Hook作成
2. `useAIProgress` Hook作成
3. QuickActionsをUIのみに

**期待効果**:
- 責務の明確化
- テスト容易性の向上
- 再利用性の向上

---

## メトリクス

### リファクタリング前後の比較

| 指標 | Phase 0 | Phase 5完了 | Phase 8完了（目標） |
|------|---------|-------------|-------------------|
| コンポーネント数 | 26個 | 24個 | 20個以下 |
| カスタムHooks活用率 | 0% | 8% | 80%以上 |
| ストアスライス活用率 | 0% | 0% | 80%以上 |
| 平均コンポーネントサイズ | 194行 | 194行 | 150行以下 |
| 最大コンポーネントサイズ | 428行 | 428行 | 250行以下 |

### 改善目標

#### 短期目標（Phase 6）
- [ ] カスタムHooks活用率: 8% → 50%
- [ ] ShareButtonでuseItineraryPublish使用
- [ ] PublicItineraryViewでuseItineraryPDF使用
- [ ] ItineraryListでuseItineraryList使用

#### 中期目標（Phase 7）
- [ ] ストアスライス活用率: 0% → 80%
- [ ] useStore直接使用を3個以下に削減
- [ ] 不必要な再レンダリングの削減

#### 長期目標（Phase 8）
- [ ] 平均コンポーネントサイズ: 150行以下
- [ ] 最大コンポーネントサイズ: 250行以下
- [ ] テストカバレッジ: 80%以上

---

## 詳細分析: コンポーネント別の問題点

### 🔴 高優先度の問題

#### 1. QuickActions.tsx (406行)
**問題**:
- AI呼び出しロジックを直接実装（150行以上）
- フェーズ遷移ロジック
- チェックリスト更新
- 18個の状態をuseStoreから取得

**責務**:
- ✅ UIの表示・イベントハンドリング
- ❌ AI通信ロジック（本来はHookに）
- ❌ フェーズ遷移ロジック（本来はストアに）
- ❌ チェックリスト評価（本来はストアに）

**提案**:
```tsx
// 新規Hook: usePhaseTransition
const {
  canProceed,
  proceedToNext,
  getButtonLabel,
  getTooltip
} = usePhaseTransition();

// 新規Hook: useAIProgress
const {
  triggerAIProgress,
  isProcessing,
  progressState
} = useAIProgress();
```

**期待効果**: 406行 → 150行以下

---

#### 2. ShareButton.tsx (368行)
**問題**:
- 公開設定のモーダルUI（200行以上）
- 公開/非公開ロジック
- URL共有機能
- useItineraryPublish Hookを使っていない

**責務**:
- ✅ 公開設定フォームのUI
- ❌ 公開ロジック（useItineraryPublish Hookに委譲すべき）
- ❌ useStoreを直接使用

**提案**:
```tsx
// 既存Hookを活用
const {
  publish,
  unpublish,
  copyPublicUrl,
  shareViaWebApi,
  isPublishing
} = useItineraryPublish(itineraryId);

// モーダルを分離
<PublicSettingsModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onPublish={publish}
/>
```

**期待効果**: 368行 → 150行 + 新規モーダル100行 = コンポーネント分離

---

#### 3. PublicItineraryView.tsx (332行)
**問題**:
- PDF生成ロジックを直接実装（54行）
- コメント表示
- 共有機能
- useItineraryPDF Hookを使っていない

**責務**:
- ✅ 公開しおりの表示UI
- ✅ コメント表示
- ❌ PDF生成ロジック（useItineraryPDF Hookに委譲すべき）
- ❌ 共有機能（重複実装）

**提案**:
```tsx
// 既存Hookを活用
const {
  generatePDF,
  isGenerating,
  progress
} = useItineraryPDF();
```

**期待効果**: 332行 → 250行以下

---

#### 4. ItineraryList.tsx (232行)
**問題**:
- データ取得ロジックを直接実装
- フィルター・ソートロジック
- ページネーションロジック
- useItineraryList Hookを使っていない

**責務**:
- ✅ しおり一覧の表示UI
- ❌ データ取得ロジック（useItineraryList Hookに委譲すべき）
- ❌ フィルター・ソートロジック（Hookに委譲すべき）

**提案**:
```tsx
// 既存Hookを活用
const {
  itineraries,
  isLoading,
  filter,
  setFilter,
  sort,
  setSort,
  deleteItinerary,
  refresh
} = useItineraryList();
```

**期待効果**: 232行 → 100行以下

---

### 🟡 中優先度の問題

#### 5. SpotCard.tsx (428行)
**問題**:
- editable/non-editableの両方のUIを含む
- 編集モードのフォームが200行以上

**責務**:
- ✅ スポット表示UI
- ✅ 編集フォームUI
- ✅ useSpotEditor Hookを使用（良い）
- ⚠️ 1コンポーネントが2つのモードを持ち、巨大化

**提案**:
```tsx
// 編集フォームを分離
<SpotEditForm
  spot={spot}
  onSave={handleSave}
  onCancel={handleCancel}
/>
```

**期待効果**: 428行 → 250行 + 編集フォーム150行 = 分離による見通し向上

---

#### 6. DaySchedule.tsx (301行)
**問題**:
- ドラッグ&ドロップロジック
- タイムライン表示
- ローディング・エラー表示
- useStoreを直接使用（useSpotStore を使うべき）

**責務**:
- ✅ 日程の表示UI
- ✅ ドラッグ&ドロップUI
- ❌ reorderSpotsをuseStoreから取得（useSpotStore を使うべき）

**提案**:
```tsx
// ストアスライスを使用
const { reorderSpots } = useSpotStore();
```

**期待効果**: useStoreへの依存削減

---

#### 7. ItineraryCard.tsx (296行)
**問題**:
- variant切り替えで2つのUIパターン
- 削除ロジックを直接実装
- useItineraryList Hook の deleteItinerary を使うべき

**責務**:
- ✅ しおりカードのUI
- ⚠️ 削除ロジックの重複実装

**提案**:
```tsx
// 削除ロジックをpropsで受け取る
interface ItineraryCardProps {
  onDelete?: (id: string) => Promise<void>;
}
```

**期待効果**: ロジックの一元管理

---

#### 8. AddSpotForm.tsx (241行)
**問題**:
- スポット追加ロジックを直接実装
- useStoreを直接使用
- useSpotEditor Hook を使うべき

**責務**:
- ✅ スポット追加フォームUI
- ❌ addSpotをuseStoreから取得（useSpotEditorを使うべき）

**提案**:
```tsx
// 既存Hookを活用
const { addSpot, validateSpot } = useSpotEditor();
```

**期待効果**: ロジック分離、バリデーション活用

---

### 🟢 軽微な問題

#### 9. ItineraryFilters.tsx (180行)
**問題**: useStoreを直接使用

**提案**: useItineraryUIStore を使用

---

#### 10. ItinerarySortMenu.tsx (80行)
**問題**: useStoreを直接使用

**提案**: useItineraryUIStore を使用

---

#### 11. EditableTitle.tsx (106行)
**問題**: useStoreを直接使用

**提案**: useItineraryEditor の updateTitle を使用

---

#### 12. ResetButton.tsx (99行)
**問題**: useStoreを直接使用

**提案**: useItineraryEditor または useItineraryProgressStore を使用

---

#### 13. PlanningProgress.tsx (174行)
**問題**: useStoreを直接使用

**提案**: useItineraryProgressStore を使用

---

#### 14. MobilePlannerControls.tsx (127行)
**問題**: useStoreを直接使用、QuickActionsを含む

**提案**: useItineraryProgressStore を使用

---

## 問題のカテゴリ別まとめ

### A. カスタムHooks未活用（22個のコンポーネント）
重要度の高い順：
1. 🔴 ShareButton → useItineraryPublish
2. 🔴 PublicItineraryView → useItineraryPDF
3. 🔴 ItineraryList → useItineraryList
4. 🟡 AddSpotForm → useSpotEditor
5. 🟡 EditableTitle → useItineraryEditor
6. 🟡 DaySchedule → useSpotEditor（一部）
7. 🟢 その他多数

### B. ストアスライス未活用（14個のコンポーネント）
移行すべきコンポーネント：
1. QuickActions → useItineraryProgressStore
2. DaySchedule → useSpotStore
3. AddSpotForm → useSpotStore
4. ItineraryFilters → useItineraryUIStore
5. ItinerarySortMenu → useItineraryUIStore
6. EditableTitle → useItineraryStore
7. PlanningProgress → useItineraryProgressStore
8. MobilePlannerControls → useItineraryProgressStore
9. ResetButton → useItineraryStore
10. その他

### C. 過剰な責務（3個のコンポーネント）
1. 🔴 QuickActions (406行) - 分割必須
2. 🔴 ShareButton (368行) - 分割推奨
3. 🟡 SpotCard (428行) - 分割検討

---

## useStore依存度ランキング

以下のコンポーネントはuseStoreへの依存が特に高く、優先的に移行すべきです：

| コンポーネント | useStore呼び出し回数 | 行数 | 優先度 |
|---------------|-------------------|------|-------|
| QuickActions.tsx | 18回 | 406行 | 🔴 最高 |
| AddSpotForm.tsx | 4回 | 241行 | 🟡 高 |
| ShareButton.tsx | 4回 | 368行 | 🔴 最高 |
| DaySchedule.tsx | 3回 | 301行 | 🟡 高 |
| ItineraryFilters.tsx | 3回 | 180行 | 🟢 中 |
| ItinerarySortMenu.tsx | 2回 | 80行 | 🟢 中 |
| EditableTitle.tsx | 2回 | 106行 | 🟢 低 |
| ResetButton.tsx | 2回 | 99行 | 🟢 低 |
| SpotCard.tsx | 2回 | 428行 | 🟡 高 |
| SaveButton.tsx | 2回 | 87行 | ✅ 一部移行済み |

---

## 重複実装の問題

### PDF生成ロジックの重複
**重複箇所**:
1. PublicItineraryView.tsx（96〜150行）
2. PDFExportButton.tsx（推定）

**解決策**: useItineraryPDF Hookに統一

### 公開・共有ロジックの重複
**重複箇所**:
1. ShareButton.tsx（36〜115行）
2. PublicItineraryView.tsx（61〜94行）

**解決策**: useItineraryPublish Hookに統一

### 削除ロジックの重複
**重複箇所**:
1. ItineraryCard.tsx（26〜53行）
2. ItineraryList.tsx（データ取得後の削除処理）

**解決策**: useItineraryList Hook の deleteItinerary に統一

---

## 参考資料

### 作成済みだが活用されていないもの

#### カスタムHooks（lib/hooks/itinerary/）
1. ✅ `useItineraryEditor.ts` (209行) - 作成済み、未活用
2. ✅ `useSpotEditor.ts` (172行) - 作成済み、SpotCardのみ使用
3. ✅ `useItinerarySave.ts` (303行) - 作成済み、SaveButtonのみ使用
4. ✅ `useItineraryPublish.ts` (188行) - 作成済み、未活用
5. ✅ `useItineraryPDF.ts` (105行) - 作成済み、未活用
6. ✅ `useItineraryList.ts` (231行) - 作成済み、未活用
7. ✅ `useItineraryHistory.ts` (100行) - 作成済み、未活用

#### ストアスライス（lib/store/itinerary/）
1. ✅ `useItineraryStore.ts` (106行) - 作成済み、未活用
2. ✅ `useSpotStore.ts` (232行) - 作成済み、未活用
3. ✅ `useItineraryUIStore.ts` (35行) - 作成済み、未活用
4. ✅ `useItineraryProgressStore.ts` (217行) - 作成済み、未活用
5. ✅ `useItineraryHistoryStore.ts` (105行) - 作成済み、未活用

#### 型定義（types/）
1. ✅ `itinerary-core.ts` (95行) - 作成済み、未活用
2. ✅ `day-schedule.ts` (68行) - 作成済み、未活用
3. ✅ `itinerary-validation.ts` (288行) - 作成済み、一部活用（useSpotEditorのみ）

---

## まとめ

Phase 1〜5のリファクタリングにより、**基盤は整った**が、**既存コンポーネントがその恩恵を受けていない**状態です。

### 問題の本質
- 新しいアーキテクチャと既存コンポーネントの**統合が不十分**
- カスタムHooksやストアスライスが**宝の持ち腐れ**状態
- リファクタリングの効果が**十分に発揮されていない**

### 次のステップ
1. **Phase 6**: カスタムHooksの活用（高優先度）
2. **Phase 7**: ストアスライスへの移行（高優先度）
3. **Phase 8**: 大規模コンポーネントの分割（中優先度）

これらを完了することで、本来の目的である「保守性の向上」「再利用性の向上」「テスト容易性の向上」「パフォーマンス向上」を実現できます。

---

## 具体的な改善ロードマップ

### Phase 6.1: 高優先度コンポーネントの移行（1週間）

#### Day 1-2: ShareButton のリファクタリング
- [ ] useItineraryPublish Hookを活用
- [ ] PublicSettingsModalコンポーネントを分離
- [ ] 368行 → 150行 + モーダル100行

#### Day 3-4: PublicItineraryView のリファクタリング  
- [ ] useItineraryPDF Hookを活用
- [ ] PDF生成ロジックを削除
- [ ] 332行 → 250行以下

#### Day 5-6: ItineraryList のリファクタリング
- [ ] useItineraryList Hookを活用
- [ ] データ取得・フィルター・ソートロジックを削除
- [ ] 232行 → 100行以下

#### Day 7: AddSpotForm のリファクタリング
- [ ] useSpotEditor Hookを活用
- [ ] バリデーションロジックを活用
- [ ] 241行 → 150行以下

---

### Phase 6.2: ストアスライスへの移行（1週間）

#### Day 1-2: QuickActions の移行
- [ ] useItineraryProgressStore を使用
- [ ] 18個の状態取得を整理

#### Day 3: DaySchedule, SpotCard の移行
- [ ] useSpotStore を使用
- [ ] スポット操作をストアスライス経由に

#### Day 4: フィルター・ソート系の移行
- [ ] useItineraryUIStore を使用
- [ ] ItineraryFilters, ItinerarySortMenu を移行

#### Day 5: その他の移行
- [ ] EditableTitle → useItineraryStore
- [ ] PlanningProgress → useItineraryProgressStore
- [ ] MobilePlannerControls → useItineraryProgressStore
- [ ] ResetButton → useItineraryStore

#### Day 6-7: テストとドキュメント更新

---

### Phase 6.3: 大規模コンポーネントの分割（オプション）

#### QuickActions の分割
```
QuickActions.tsx (406行)
  ↓
PhaseTransitionButton.tsx (150行)
  + usePhaseTransition Hook
AIProgressTrigger.tsx (100行)
  + useAIProgress Hook
```

#### SpotCard の分割
```
SpotCard.tsx (428行)
  ↓
SpotCard.tsx (250行) - 表示のみ
SpotEditForm.tsx (150行) - 編集フォーム
```

---

## 成功の判断基準

### Phase 6完了時の目標
- ✅ カスタムHooks活用率: 8% → 60%以上
- ✅ ストアスライス活用率: 0% → 80%以上
- ✅ useStore直接使用: 14個 → 3個以下
- ✅ 最大コンポーネントサイズ: 428行 → 300行以下
- ✅ テストカバレッジ: 現状 → 70%以上

### KPI（重要業績評価指標）
1. **コード品質**
   - 平均コンポーネントサイズ: 150行以下
   - 最大コンポーネントサイズ: 250行以下
   - Cyclomatic Complexity: 10以下

2. **アーキテクチャ**
   - カスタムHooks活用率: 80%以上
   - ストアスライス活用率: 80%以上
   - Props drilling深度: 3階層以下

3. **テスト**
   - ユニットテストカバレッジ: 80%以上
   - E2Eテストカバレッジ: 主要フロー100%
   - テスト実行時間: 10秒以内

4. **パフォーマンス**
   - 不必要な再レンダリング: 50%削減
   - 初期ロード時間: 現状維持または改善
   - バンドルサイズ: 現状維持または削減

---

## アーキテクチャ図

### 現状（Phase 5完了時）
```
Components (24個)
    ↓ 直接依存（14個）
useStore (1161行)
    ↓ 未活用
[カスタムHooks (7個)]  [ストアスライス (5個)]
```

### 目標（Phase 6完了時）
```
Components (24個)
    ↓ 活用（18個）
[カスタムHooks (7個)]
    ↓
[ストアスライス (5個)]
    ↓ 最小限の依存（3個）
useStore (1161行) ← チャット・設定系のみ
```

---

## 技術的負債の定量化

### 現在の技術的負債
- **重複コード**: 約300行（推定）
- **過剰な責務**: 3コンポーネント（合計1202行）
- **未活用のインフラ**: 12ファイル（合計1908行）
- **テスト不足**: カバレッジ推定30%

### 負債解消による期待効果
- **開発速度**: 新機能追加が30%高速化
- **バグ率**: 40%削減
- **保守コスト**: 50%削減
- **オンボーディング時間**: 新規開発者が3日→1日で理解可能

---

**最終更新日**: 2025-01-10  
**次回レビュー**: Phase 6完了後  
**担当**: リファクタリングチーム
