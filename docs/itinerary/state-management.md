# 状態管理仕様

## 現状のストア構成（`lib/store/useStore.ts`）

### しおり関連のステート

```typescript
interface AppState {
  // === しおり本体 ===
  currentItinerary: ItineraryData | null;
  
  // === フェーズ管理 ===
  planningPhase: ItineraryPhase;  // initial, collecting, skeleton, detailing, completed
  currentDetailingDay: number | null;
  
  // === 履歴（Undo/Redo） ===
  history: {
    past: ItineraryData[];
    present: ItineraryData | null;
    future: ItineraryData[];
  };
  
  // === UI状態 ===
  itineraryFilter: ItineraryFilter;
  itinerarySort: ItinerarySort;
  
  // === チェックリスト・進捗 ===
  requirementsChecklist: RequirementChecklistItem[];
  checklistStatus: ChecklistStatus | null;
  buttonReadiness: ButtonReadiness | null;
  
  // === 自動進行モード ===
  autoProgressMode: boolean;
  autoProgressSettings: AutoProgressSettings;
  isAutoProgressing: boolean;
  autoProgressState: AutoProgressState | null;
}
```

---

## しおり操作のアクション（20個）

### 基本操作

```typescript
// しおりの設定（新規作成・読み込み）
setItinerary(itinerary: ItineraryData | null): void

// しおりの更新（部分更新）
updateItinerary(updates: Partial<ItineraryData>): void

// タイトル更新
updateItineraryTitle(title: string): void

// 行き先更新
updateItineraryDestination(destination: string): void
```

**使用例**:
```typescript
const { setItinerary, updateItineraryTitle } = useStore();

// 新規作成
setItinerary({
  id: generateId(),
  title: '京都旅行',
  destination: '京都',
  schedule: [],
  status: 'draft',
  createdAt: new Date(),
  updatedAt: new Date(),
});

// タイトル更新
updateItineraryTitle('京都紅葉巡り');
```

---

### スポット操作

```typescript
// スポット更新
updateSpot(
  dayIndex: number, 
  spotId: string, 
  updates: Partial<TouristSpot>
): void

// スポット削除
deleteSpot(dayIndex: number, spotId: string): void

// スポット追加
addSpot(dayIndex: number, spot: TouristSpot): void

// スポットの並び替え（同じ日内）
reorderSpots(
  dayIndex: number, 
  startIndex: number, 
  endIndex: number
): void

// スポットの移動（異なる日間）
moveSpot(
  fromDayIndex: number, 
  toDayIndex: number, 
  spotId: string
): void
```

**使用例**:
```typescript
const { addSpot, updateSpot, deleteSpot, reorderSpots } = useStore();

// スポット追加
addSpot(0, {
  id: generateId(),
  name: '清水寺',
  description: '京都を代表する寺院',
  category: 'sightseeing',
  scheduledTime: '09:00',
  duration: 120,
  estimatedCost: 400,
});

// スポット更新
updateSpot(0, 'spot-123', {
  scheduledTime: '10:00',
  estimatedCost: 500,
});

// スポット削除
deleteSpot(0, 'spot-123');

// 並び替え（ドラッグ&ドロップ）
reorderSpots(0, 2, 0); // 2番目→0番目へ
```

---

### フェーズ管理

```typescript
// フェーズを設定
setPlanningPhase(phase: ItineraryPhase): void

// 詳細化中の日を設定
setCurrentDetailingDay(day: number | null): void

// 次のステップへ進む
proceedToNextStep(): void

// プランニングをリセット
resetPlanning(): void
```

**フェーズ遷移フロー**:
```
initial → collecting → skeleton → detailing → completed
```

**使用例**:
```typescript
const { planningPhase, proceedToNextStep } = useStore();

// 現在のフェーズ確認
console.log(planningPhase); // 'collecting'

// 次のステップへ
proceedToNextStep(); // → 'skeleton'
```

---

### 公開設定

```typescript
// しおりを公開
publishItinerary(
  settings: PublicItinerarySettings
): Promise<PublishResult>

// しおりを非公開化
unpublishItinerary(): Promise<UnpublishResult>

// 公開設定を更新
updatePublicSettings(
  settings: Partial<PublicItinerarySettings>
): void
```

**使用例**:
```typescript
const { publishItinerary, unpublishItinerary } = useStore();

// 公開
const result = await publishItinerary({
  isPublic: true,
  allowPdfDownload: true,
  customMessage: 'ぜひ参考にしてください！',
});

console.log(result.publicUrl); // https://journee.app/share/abc123

// 非公開化
await unpublishItinerary();
```

---

### フィルター・ソート

```typescript
// フィルター設定
setItineraryFilter(filter: ItineraryFilter): void

// ソート設定
setItinerarySort(sort: ItinerarySort): void

// フィルターリセット
resetItineraryFilters(): void
```

**使用例**:
```typescript
const { setItineraryFilter, setItinerarySort } = useStore();

// フィルター: 完成済みのしおりのみ
setItineraryFilter({
  status: 'completed',
  destination: '京都',
});

// ソート: 更新日降順
setItinerarySort({
  field: 'updatedAt',
  order: 'desc',
});
```

---

### 履歴（Undo/Redo）

```typescript
// 元に戻す
undo(): void

// やり直す
redo(): void

// 元に戻せるか確認
canUndo(): boolean

// やり直せるか確認
canRedo(): boolean
```

**使用例**:
```typescript
const { undo, redo, canUndo, canRedo } = useStore();

// 編集を元に戻す
if (canUndo()) {
  undo();
}

// やり直す
if (canRedo()) {
  redo();
}
```

---

## 🎯 改善提案: ストアのスライス分割

現状の巨大な `useStore.ts` (1200行)を機能別に分割：

### 1. `useItineraryStore` - しおり本体

```typescript
// lib/store/itinerary/useItineraryStore.ts
interface ItineraryStore {
  currentItinerary: ItineraryData | null;
  setItinerary: (itinerary: ItineraryData | null) => void;
  updateItinerary: (updates: Partial<ItineraryData>) => void;
  updateItineraryTitle: (title: string) => void;
  updateItineraryDestination: (destination: string) => void;
}

export const useItineraryStore = create<ItineraryStore>((set) => ({
  currentItinerary: null,
  setItinerary: (itinerary) => set({ currentItinerary: itinerary }),
  updateItinerary: (updates) => set((state) => ({
    currentItinerary: state.currentItinerary 
      ? { ...state.currentItinerary, ...updates, updatedAt: new Date() }
      : null
  })),
  // ...
}));
```

---

### 2. `useSpotStore` - スポット管理

```typescript
// lib/store/itinerary/useSpotStore.ts
interface SpotStore {
  updateSpot: (dayIndex: number, spotId: string, updates: Partial<TouristSpot>) => void;
  deleteSpot: (dayIndex: number, spotId: string) => void;
  addSpot: (dayIndex: number, spot: TouristSpot) => void;
  reorderSpots: (dayIndex: number, startIndex: number, endIndex: number) => void;
  moveSpot: (fromDayIndex: number, toDayIndex: number, spotId: string) => void;
}

export const useSpotStore = create<SpotStore>((set, get) => ({
  // スポット操作の実装
}));
```

---

### 3. `useItineraryUIStore` - UI状態

```typescript
// lib/store/itinerary/useItineraryUIStore.ts
interface ItineraryUIStore {
  filter: ItineraryFilter;
  sort: ItinerarySort;
  setFilter: (filter: ItineraryFilter) => void;
  setSort: (sort: ItinerarySort) => void;
  resetFilters: () => void;
}

export const useItineraryUIStore = create<ItineraryUIStore>((set) => ({
  filter: { status: 'all' },
  sort: { field: 'updatedAt', order: 'desc' },
  setFilter: (filter) => set({ filter }),
  setSort: (sort) => set({ sort }),
  resetFilters: () => set({
    filter: { status: 'all' },
    sort: { field: 'updatedAt', order: 'desc' },
  }),
}));
```

---

### 4. `useItineraryProgressStore` - 進捗管理

```typescript
// lib/store/itinerary/useItineraryProgressStore.ts
interface ItineraryProgressStore {
  planningPhase: ItineraryPhase;
  currentDetailingDay: number | null;
  setPlanningPhase: (phase: ItineraryPhase) => void;
  setCurrentDetailingDay: (day: number | null) => void;
  proceedToNextStep: () => void;
  resetPlanning: () => void;
}

export const useItineraryProgressStore = create<ItineraryProgressStore>((set, get) => ({
  planningPhase: 'initial',
  currentDetailingDay: null,
  setPlanningPhase: (phase) => set({ planningPhase: phase }),
  setCurrentDetailingDay: (day) => set({ currentDetailingDay: day }),
  proceedToNextStep: () => {
    // フェーズ遷移ロジック
  },
  resetPlanning: () => set({
    planningPhase: 'initial',
    currentDetailingDay: null,
  }),
}));
```

---

### 5. `useItineraryHistoryStore` - 履歴管理

```typescript
// lib/store/itinerary/useItineraryHistoryStore.ts
interface ItineraryHistoryStore {
  past: ItineraryData[];
  present: ItineraryData | null;
  future: ItineraryData[];
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

export const useItineraryHistoryStore = create<ItineraryHistoryStore>((set, get) => ({
  past: [],
  present: null,
  future: [],
  undo: () => {
    const { past, present } = get();
    if (past.length === 0) return;
    
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    set({
      past: newPast,
      present: previous,
      future: present ? [present, ...get().future] : get().future,
    });
  },
  redo: () => {
    const { future, present } = get();
    if (future.length === 0) return;
    
    const next = future[0];
    const newFuture = future.slice(1);
    
    set({
      past: present ? [...get().past, present] : get().past,
      present: next,
      future: newFuture,
    });
  },
  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
  clearHistory: () => set({ past: [], future: [] }),
}));
```

---

## 使用例：スライス化後

### コンポーネントでの使用

```tsx
// Before: 巨大なストアから全て取得
import { useStore } from '@/lib/store/useStore';

function ItineraryEditor() {
  const {
    currentItinerary,
    updateItineraryTitle,
    addSpot,
    undo,
    canUndo
  } = useStore();
  // ...
}
```

```tsx
// After: 必要なストアのみをインポート
import { useItineraryStore } from '@/lib/store/itinerary/useItineraryStore';
import { useSpotStore } from '@/lib/store/itinerary/useSpotStore';
import { useItineraryHistoryStore } from '@/lib/store/itinerary/useItineraryHistoryStore';

function ItineraryEditor() {
  const { currentItinerary, updateItineraryTitle } = useItineraryStore();
  const { addSpot } = useSpotStore();
  const { undo, canUndo } = useItineraryHistoryStore();
  // ...
}
```

---

## メリット

### 1. 責務の明確化
- 各ストアが単一の責務を持つ
- コードの見通しが良くなる

### 2. パフォーマンス向上
- 必要な部分だけ購読
- 不要な再レンダリングを防ぐ

### 3. テストの容易性
- 小さな単位でテスト可能
- モックが簡単

### 4. 保守性の向上
- 変更箇所が特定しやすい
- チーム開発がスムーズ

---

**最終更新日**: 2025-01-10

