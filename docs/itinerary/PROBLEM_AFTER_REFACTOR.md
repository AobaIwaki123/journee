# リファクタリング後の残存課題

**作成日**: 2025-01-10  
**最終更新日**: 2025-01-10 (Phase 6完了後)  
**対象**: Phase 6完了後の残存課題と追加改善提案

## 概要

Phase 1〜6のリファクタリングにより、カスタムHooks活用率46%、ストアスライス活用率54%を達成しました。基本的なアーキテクチャ統合は完了しましたが、さらなる改善の余地があります。

**Phase 6の成果詳細は [`PHASE6_RESULTS.md`](./PHASE6_RESULTS.md) を参照**

---

## 現状

### 統計情報 (Phase 6完了時)

| 指標 | Phase 5 | Phase 6 | 改善 |
|------|---------|---------|------|
| カスタムHooks活用率 | 8% | **46%** | +38pt |
| ストアスライス活用率 | 0% | **54%** | +54pt |
| useStore直接使用 | 14個 | **5個** | -9個 |
| 最大コンポーネント | 428行 | 410行 | -18行 |
| コード削減 | - | **-183行** | - |

---

## 残存課題

### 🔴 高優先度

#### 1. PDFExportButton - useItineraryPDF未活用

**現状**:
- PDF生成ロジックを直接実装
- PublicItineraryViewと重複したロジック

**問題**:
```tsx
// 現状: generateItineraryPDF を直接呼び出し
const handleDownloadPDF = async () => {
  const result = await generateItineraryPDF(elementId, {
    filename,
    quality: 0.95,
    margin: 10,
    onProgress: (p) => setProgress(p),
  });
};
```

**提案**:
```tsx
// useItineraryPDF Hook活用
const {
  generatePDF,
  isGenerating,
  progress
} = useItineraryPDF();

const handleDownloadPDF = async () => {
  await generatePDF(itinerary, elementId);
};
```

**期待効果**: 164行 → 120行以下、重複ロジック削減

---

#### 2. MobilePlannerControls - useStore直接使用

**現状**:
- useStoreから複数の状態を直接取得
- QuickActionsと同様のパターン

**問題**:
```tsx
const {
  planningPhase,
  currentItinerary,
  isAutoProgressing,
  autoProgressState,
} = useStore();
```

**提案**:
```tsx
const { planningPhase, isAutoProgressing, autoProgressState } = useItineraryProgressStore();
const { currentItinerary } = useItineraryStore();
```

**期待効果**: ストアスライス活用率向上、再レンダリング削減

---

#### 3. ItineraryPreview - useStore直接使用

**現状**:
- currentItinerary, planningPhaseなど複数の状態を取得

**問題**:
```tsx
const {
  currentItinerary,
  planningPhase,
  isAutoProgressing,
  autoProgressState,
} = useStore();
```

**提案**:
```tsx
const { currentItinerary } = useItineraryStore();
const { planningPhase, isAutoProgressing, autoProgressState } = useItineraryProgressStore();
```

**期待効果**: ストアスライス活用率向上

---

### 🟡 中優先度

#### 4. QuickActions - 依然として大きい (410行)

**問題**:
- AI呼び出しロジックを直接実装 (150行以上)
- フェーズ遷移ロジック
- UIロジック

**提案**:
新規Hook作成で分割：
- `usePhaseTransition`: フェーズ遷移とボタンラベル管理
- `useAIProgress`: AI呼び出しとストリーミング管理

**期待効果**: 410行 → 200行以下

---

#### 5. SpotCard - 大きすぎる (428行)

**問題**:
- 表示モードと編集モードの両方を含む
- 編集フォームが200行以上

**提案**:
編集フォームを分離：
```tsx
// SpotEditForm.tsx (新規)
export const SpotEditForm: React.FC<SpotEditFormProps> = ({
  spot,
  dayIndex,
  onSave,
  onCancel
}) => {
  // 編集ロジック
};

// SpotCard.tsx (簡略化)
{isEditing ? (
  <SpotEditForm
    spot={spot}
    dayIndex={dayIndex}
    onSave={handleSave}
    onCancel={handleCancel}
  />
) : (
  // 表示UI
)}
```

**期待効果**: 428行 → 250行 + 150行 = 見通し向上

---

### 🟢 低優先度

#### 6. その他の小規模改善
- SaveButton: addToastのみuseStoreを使用 → 独自のトースト管理検討
- その他コンポーネントのuseStore依存削減

---

## Phase 6.3 追加改善計画

### 目標
- **カスタムHooks活用率**: 46% → **55%**
- **ストアスライス活用率**: 54% → **65%**
- **useStore直接使用**: 5個 → **2個以下**

### タスク

#### Task 1: PDFExportButton の改善
- [ ] useItineraryPDF Hook活用
- [ ] 重複したPDF生成ロジック削除
- [ ] 164行 → 120行以下

#### Task 2: MobilePlannerControls の移行
- [ ] useItineraryProgressStore活用
- [ ] useItineraryStore活用
- [ ] useStore依存削減

#### Task 3: ItineraryPreview の移行
- [ ] useItineraryStore活用
- [ ] useItineraryProgressStore活用
- [ ] useStore依存削減

---

## Phase 7 (オプション) - 大規模コンポーネント分割

### QuickActions の分割

#### usePhaseTransition Hook (新規)
```tsx
export function usePhaseTransition() {
  const { planningPhase, currentItinerary } = useItineraryProgressStore();
  
  const getButtonLabel = (): string => {
    // ラベル生成ロジック
  };
  
  const getTooltip = (): string => {
    // ツールチップ生成ロジック
  };
  
  const getHelpText = (): string | null => {
    // ヘルプテキスト生成ロジック
  };
  
  return {
    planningPhase,
    getButtonLabel,
    getTooltip,
    getHelpText,
  };
}
```

#### useAIProgress Hook (新規)
```tsx
export function useAIProgress() {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const proceedAndSendMessage = async () => {
    // AI呼び出しロジック
  };
  
  return {
    isProcessing,
    proceedAndSendMessage,
  };
}
```

**期待効果**: QuickActions 410行 → 200行以下

---

### SpotCard の分割

#### SpotEditForm コンポーネント (新規)
```tsx
export const SpotEditForm: React.FC<SpotEditFormProps> = ({
  spot,
  dayIndex,
  onSave,
  onCancel,
}) => {
  // 編集フォームのみ
  return (
    <form>
      {/* 編集UI */}
    </form>
  );
};
```

**期待効果**: SpotCard 428行 → 250行 + SpotEditForm 150行

---

## 改善のロードマップ

### Phase 6.3 (推奨: 即時実施)
**期間**: 0.5日
**目標**: 残りの高優先度課題を解消

1. PDFExportButton の改善 (2時間)
2. MobilePlannerControls の移行 (1時間)
3. ItineraryPreview の移行 (1時間)

**期待効果**:
- カスタムHooks活用率: 46% → 55%
- ストアスライス活用率: 54% → 65%
- useStore直接使用: 5個 → 2個以下

---

### Phase 7 (オプション: 必要に応じて)
**期間**: 1日
**目標**: 大規模コンポーネントの分割

1. QuickActions の分割 (4時間)
2. SpotCard の分割 (4時間)

**期待効果**:
- 平均コンポーネントサイズ: 150行以下
- 最大コンポーネントサイズ: 250行以下
- 再利用性向上

---

## 成功基準

### Phase 6.3 完了時
- ✅ カスタムHooks活用率 55%以上
- ✅ ストアスライス活用率 65%以上
- ✅ useStore直接使用 2個以下
- ✅ PDF生成ロジックの重複解消

### Phase 7 完了時 (オプション)
- ✅ 平均コンポーネントサイズ 150行以下
- ✅ 最大コンポーネントサイズ 250行以下
- ✅ テストカバレッジ 70%以上

---

## 参考資料

- [Phase 6完了レポート](./PHASE6_RESULTS.md)
- [リファクタリング計画](./refactoring.md)
- [カスタムHooks仕様](./hooks.md)
- [状態管理仕様](./state-management.md)

---

**最終更新日**: 2025-01-10  
**次回レビュー**: Phase 6.3完了後  
**担当**: リファクタリングチーム
