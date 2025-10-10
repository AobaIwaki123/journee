# Phase 7 仕様書: 大規模コンポーネント分割とユーティリティ統合

**作成日**: 2025-01-10  
**対象**: Phase 6.3完了後の追加改善

## 概要

Phase 6完了により基本的なアーキテクチャ統合は達成しましたが、以下の課題が残っています：

1. **大規模コンポーネント**: SpotCard (430行)、QuickActions (410行)
2. **重複したユーティリティ関数**: カテゴリ関連ヘルパー
3. **複雑なAI呼び出しロジック**: QuickActionsに150行以上
4. **編集フォームの肥大化**: SpotCardに200行以上

---

## 洗い出し結果

### コンポーネントサイズランキング（Phase 6.3完了時）

| 順位 | コンポーネント | 行数 | 問題 | 優先度 |
|------|---------------|------|------|--------|
| 1 | SpotCard.tsx | 430行 | 編集モード+表示モード混在 | 🔴 高 |
| 2 | QuickActions.tsx | 410行 | AI呼び出しロジック150行+ | 🔴 高 |
| 3 | ShareButton.tsx | 350行 | モーダルUI含む | 🟡 中 |
| 4 | DaySchedule.tsx | 305行 | D&Dロジック含む | 🟢 低 |
| 5 | PublicItineraryView.tsx | 296行 | 適切なサイズ | ✅ OK |
| 6 | ItineraryCard.tsx | 296行 | 適切なサイズ | ✅ OK |

### カスタムHooksサイズランキング

| 順位 | Hook | 行数 | 問題 | 優先度 |
|------|------|------|------|--------|
| 1 | useItinerarySave.ts | 320行 | 複数の責務混在 | 🟡 中 |
| 2 | useItineraryList.ts | 254行 | 適切なサイズ | ✅ OK |
| 3 | useItineraryPublish.ts | 226行 | 適切なサイズ | ✅ OK |
| 4 | useItineraryEditor.ts | 210行 | 適切なサイズ | ✅ OK |

### ストアスライスサイズランキング

| 順位 | ストア | 行数 | 問題 | 優先度 |
|------|--------|------|------|--------|
| 1 | useSpotStore.ts | 232行 | 適切なサイズ | ✅ OK |
| 2 | useItineraryProgressStore.ts | 217行 | 適切なサイズ | ✅ OK |

---

## 問題の詳細分析

### 🔴 問題1: SpotCard (430行) - 編集モードの肥大化

#### 責務の内訳
1. **カテゴリヘルパー関数** (36〜81行): 45行
2. **表示モードUI** (300〜430行): 130行
3. **編集モードUI** (173〜299行): 126行
4. **編集ロジック** (120〜170行): 50行

#### 重複実装
- `getCategoryLabel`, `getCategoryColor`, `getCategoryIcon`, `getCategoryGradient`
- ItineraryPDFLayout.tsxでも同様の関数が存在（getCategoryIconのみ）

#### 提案
```
SpotCard.tsx (430行)
  ↓
1. lib/utils/category-utils.ts (新規) - カテゴリヘルパー統合
2. components/itinerary/SpotEditForm.tsx (新規) - 編集フォーム分離
3. SpotCard.tsx (改善後) - 表示のみ 200行
```

---

### 🔴 問題2: QuickActions (410行) - AI呼び出しロジックの肥大化

#### 責務の内訳
1. **フェーズ遷移ヘルパー** (61〜113行): 52行
2. **AI呼び出しロジック** (137〜269行): 132行
3. **UIロジック** (315〜410行): 95行

#### 複雑性
- `proceedAndSendMessage` 関数が132行
- skeleton → detailing の特別処理
- チャット履歴管理
- ストリーミング処理

#### 提案
```
QuickActions.tsx (410行)
  ↓
1. lib/hooks/itinerary/usePhaseTransition.ts (新規) - フェーズ遷移管理
2. lib/hooks/itinerary/useAIProgress.ts (新規) - AI呼び出し管理
3. QuickActions.tsx (改善後) - UIのみ 150行
```

---

### 🟡 問題3: 重複したカテゴリヘルパー

#### 重複箇所
1. **SpotCard.tsx** (36〜81行)
   - `getCategoryLabel`: 観光、食事など日本語ラベル
   - `getCategoryColor`: Tailwindクラス
   - `getCategoryIcon`: Lucideアイコン
   - `getCategoryGradient`: グラデーション

2. **ItineraryPDFLayout.tsx** (35〜45行)
   - `getCategoryIcon`: 同様のアイコンマッピング

#### 提案
```tsx
// lib/utils/category-utils.ts (新規)
export const CATEGORY_LABELS: Record<string, string> = { ... };
export const CATEGORY_COLORS: Record<string, string> = { ... };
export const getCategoryLabel = (category?: string): string => { ... };
export const getCategoryColor = (category?: string): string => { ... };
export const getCategoryIcon = (category?: string): JSX.Element => { ... };
export const getCategoryGradient = (category?: string): string => { ... };
```

---

### 🟢 問題4: useItinerarySave (320行) - やや大きい

#### 責務の内訳
1. **保存処理** (save関数): 100行
2. **新規保存処理** (saveAs関数): 50行
3. **読み込み処理** (load関数): 70行
4. **削除処理** (deleteItinerary関数): 40行

#### 評価
- 各責務は明確
- 関連する操作がまとまっている
- **現状維持が適切**（分割不要）

---

## Phase 7 実装計画

### Phase 7.1: カテゴリヘルパーの統合 (高優先度)

**目的**: 重複したカテゴリヘルパー関数を統合

**タスク**:
1. `lib/utils/category-utils.ts` を新規作成
2. SpotCard.tsx から移動
3. ItineraryPDFLayout.tsx を更新
4. AddSpotForm.tsx も必要に応じて活用

**期待効果**:
- 重複コード削減: 約45行
- カテゴリ管理の一元化
- 保守性向上

---

### Phase 7.2: SpotCard の分割 (高優先度)

**目的**: 編集フォームを分離してSpotCardを簡素化

**新規ファイル**: `components/itinerary/SpotEditForm.tsx`

**interface**:
```tsx
interface SpotEditFormProps {
  spot: TouristSpot;
  dayIndex: number;
  onSave: (updates: Partial<TouristSpot>) => void;
  onCancel: () => void;
  currency?: string;
}
```

**責務**:
- スポット編集フォームのUIのみ
- バリデーションはuseSpotEditor Hookに委譲
- 保存処理は親コンポーネント（SpotCard）に委譲

**SpotCard.tsx の変更**:
```tsx
// Before (430行)
{isEditing && editable ? (
  // 126行の編集フォームUI
) : (
  // 130行の表示UI
)}

// After (250行)
{isEditing && editable ? (
  <SpotEditForm
    spot={spot}
    dayIndex={dayIndex}
    onSave={handleSave}
    onCancel={handleCancel}
    currency={currency}
  />
) : (
  // 130行の表示UI
)}
```

**期待効果**:
- SpotCard: 430行 → 250行
- SpotEditForm: 150行（新規）
- 見通し向上、テスト容易性向上

---

### Phase 7.3: QuickActions の分割 (高優先度)

**目的**: AI呼び出しロジックとフェーズ遷移ロジックを分離

#### 新規Hook 1: `usePhaseTransition.ts`

**責務**: フェーズ遷移とUI表示ロジック

```tsx
export interface UsePhaseTransitionReturn {
  planningPhase: ItineraryPhase;
  currentDetailingDay: number | null;
  buttonReadiness: ButtonReadiness | null;
  checklistStatus: ChecklistStatus | null;
  
  // UI helpers
  getButtonLabel: () => string;
  getTooltip: () => string;
  getHelpText: () => string | null;
  getButtonStyles: () => string;
  
  // Actions
  canProceed: () => boolean;
  showWarning: boolean;
  setShowWarning: (value: boolean) => void;
}

export function usePhaseTransition(): UsePhaseTransitionReturn {
  const {
    planningPhase,
    currentDetailingDay,
    buttonReadiness,
    checklistStatus,
  } = useItineraryProgressStore();
  
  const { currentItinerary } = useItineraryStore();
  const [showWarning, setShowWarning] = useState(false);
  
  // フェーズごとのボタンラベル
  const getButtonLabel = useCallback((): string => {
    switch (planningPhase) {
      case "initial": return "情報収集を開始";
      case "collecting": return "骨組みを作成";
      case "skeleton": return "日程の詳細化";
      case "detailing":
        if (!currentItinerary) return "次の日へ";
        const currentDay = currentItinerary.currentDay || 1;
        const totalDays = currentItinerary.duration || currentItinerary.schedule.length;
        return currentDay < totalDays ? "次の日へ" : "完成";
      case "completed": return "完成";
      default: return "次へ";
    }
  }, [planningPhase, currentItinerary]);
  
  // その他のヘルパー関数...
  
  return {
    planningPhase,
    currentDetailingDay,
    buttonReadiness,
    checklistStatus,
    getButtonLabel,
    getTooltip,
    getHelpText,
    getButtonStyles,
    canProceed,
    showWarning,
    setShowWarning,
  };
}
```

**期待効果**: 52行のヘルパーロジックを分離

---

#### 新規Hook 2: `useAIProgress.ts`

**責務**: AI呼び出しとストリーミング管理

```tsx
export interface UseAIProgressReturn {
  isProcessing: boolean;
  proceedAndSendMessage: () => Promise<void>;
}

export function useAIProgress(): UseAIProgressReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { planningPhase, proceedToNextStep } = useItineraryProgressStore();
  const { currentItinerary, setItinerary } = useItineraryStore();
  
  const {
    messages,
    addMessage,
    setStreamingMessage,
    appendStreamingMessage,
    setLoading,
    setStreaming,
    setError,
    selectedAI,
    claudeApiKey,
  } = useStore();
  
  const proceedAndSendMessage = useCallback(async () => {
    setIsProcessing(true);
    setLoading(true);
    setStreaming(true);
    setStreamingMessage("");
    setError(null);
    
    try {
      // 現在のフェーズを保存
      const currentPhase = planningPhase;
      
      // フェーズを進める
      proceedToNextStep();
      
      // AI呼び出しロジック（132行）
      // ...
      
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsProcessing(false);
      setLoading(false);
      setStreaming(false);
    }
  }, [planningPhase, currentItinerary, messages, selectedAI, claudeApiKey]);
  
  return {
    isProcessing,
    proceedAndSendMessage,
  };
}
```

**期待効果**: 132行のAI呼び出しロジックを分離

---

#### QuickActions.tsx (改善後)

```tsx
export const QuickActions: React.FC<QuickActionsProps> = ({
  className = "",
  showBorder = true,
}) => {
  // フェーズ遷移管理
  const {
    planningPhase,
    buttonReadiness,
    checklistStatus,
    getButtonLabel,
    getTooltip,
    getHelpText,
    getButtonStyles,
    showWarning,
    setShowWarning,
  } = usePhaseTransition();
  
  // AI進行管理
  const {
    isProcessing,
    proceedAndSendMessage,
  } = useAIProgress();
  
  const { resetPlanning } = useItineraryProgressStore();
  
  // UIロジックのみ（95行）
  return (
    <div className={containerClassName}>
      {/* 警告ダイアログ */}
      {showWarning && <WarningDialog />}
      
      {/* ヘルプテキスト */}
      {getHelpText() && <HelpText text={getHelpText()} />}
      
      {/* アクションボタン */}
      <div className="flex items-center space-x-2">
        <button
          onClick={proceedAndSendMessage}
          disabled={planningPhase === "completed" || isProcessing}
          title={buttonReadiness?.tooltip || getTooltip()}
          className={`...${getButtonStyles()}`}
        >
          {/* ボタンコンテンツ */}
        </button>
        
        {/* リセットボタン */}
        <button onClick={handleReset}>
          <RotateCcw />
        </button>
      </div>
    </div>
  );
};
```

**期待効果**: QuickActions 410行 → 150行以下

---

## 重複実装の統合

### カテゴリヘルパー関数の統合

#### 現状の重複
1. **SpotCard.tsx** (36〜81行)
   ```tsx
   const getCategoryLabel = (category?: string): string => { ... }
   const getCategoryColor = (category?: string): string => { ... }
   const getCategoryIcon = (category?: string) => { ... }
   const getCategoryGradient = (category?: string): string => { ... }
   ```

2. **ItineraryPDFLayout.tsx** (35〜45行)
   ```tsx
   const getCategoryIcon = (category: string) => { ... }
   ```

3. **AddSpotForm.tsx** (カテゴリ選択UI)
   - オプションのハードコーディング

#### 提案: lib/utils/category-utils.ts (新規)

```tsx
import React from 'react';
import { Camera, Utensils, Car, Hotel, Sparkles, ShoppingBag, Activity } from 'lucide-react';

// カテゴリ型定義
export type SpotCategory = 
  | 'sightseeing'
  | 'restaurant'
  | 'hotel'
  | 'shopping'
  | 'transport'
  | 'activity'
  | 'other';

// カテゴリ定義
export const CATEGORY_LABELS: Record<SpotCategory, string> = {
  sightseeing: '観光',
  restaurant: 'レストラン',
  hotel: '宿泊',
  shopping: 'ショッピング',
  transport: '移動',
  activity: 'アクティビティ',
  other: 'その他',
};

export const CATEGORY_COLORS: Record<SpotCategory, string> = {
  sightseeing: 'bg-blue-100 text-blue-700 border-blue-200',
  restaurant: 'bg-orange-100 text-orange-700 border-orange-200',
  hotel: 'bg-purple-100 text-purple-700 border-purple-200',
  shopping: 'bg-pink-100 text-pink-700 border-pink-200',
  transport: 'bg-green-100 text-green-700 border-green-200',
  activity: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

export const CATEGORY_GRADIENTS: Record<SpotCategory, string> = {
  sightseeing: 'from-blue-500 to-blue-600',
  restaurant: 'from-orange-500 to-orange-600',
  hotel: 'from-purple-500 to-purple-600',
  shopping: 'from-pink-500 to-pink-600',
  transport: 'from-green-500 to-green-600',
  activity: 'from-yellow-500 to-yellow-600',
  other: 'from-gray-500 to-gray-600',
};

export const CATEGORY_ICONS: Record<SpotCategory, React.ComponentType<{ className?: string }>> = {
  sightseeing: Camera,
  restaurant: Utensils,
  hotel: Hotel,
  shopping: ShoppingBag,
  transport: Car,
  activity: Activity,
  other: Sparkles,
};

// カテゴリ選択オプション
export const CATEGORY_OPTIONS: Array<{ value: SpotCategory; label: string }> = [
  { value: 'sightseeing', label: '観光' },
  { value: 'restaurant', label: 'レストラン' },
  { value: 'hotel', label: '宿泊' },
  { value: 'shopping', label: 'ショッピング' },
  { value: 'transport', label: '移動' },
  { value: 'activity', label: 'アクティビティ' },
  { value: 'other', label: 'その他' },
];

// ヘルパー関数
export function getCategoryLabel(category?: string): string {
  return category ? CATEGORY_LABELS[category as SpotCategory] || 'その他' : '';
}

export function getCategoryColor(category?: string): string {
  return category ? CATEGORY_COLORS[category as SpotCategory] || CATEGORY_COLORS.other : CATEGORY_COLORS.other;
}

export function getCategoryGradient(category?: string): string {
  return category ? CATEGORY_GRADIENTS[category as SpotCategory] || CATEGORY_GRADIENTS.other : CATEGORY_GRADIENTS.other;
}

export function getCategoryIcon(category?: string, className: string = 'w-5 h-5'): JSX.Element {
  const Icon = category ? CATEGORY_ICONS[category as SpotCategory] || CATEGORY_ICONS.other : CATEGORY_ICONS.other;
  return <Icon className={className} />;
}
```

**期待効果**: 
- 重複削減: 約50行
- 一元管理
- 拡張性向上

---

## 実装順序

### Step 1: カテゴリヘルパーの統合 (30分)
1. lib/utils/category-utils.ts 作成
2. SpotCard.tsx 更新
3. ItineraryPDFLayout.tsx 更新
4. AddSpotForm.tsx 更新

### Step 2: SpotEditForm の分離 (2時間)
1. components/itinerary/SpotEditForm.tsx 作成
2. SpotCard.tsx から編集UI移動
3. SpotCard.tsx 簡素化

### Step 3: usePhaseTransition Hook 作成 (1時間)
1. lib/hooks/itinerary/usePhaseTransition.ts 作成
2. QuickActions.tsx 更新

### Step 4: useAIProgress Hook 作成 (2時間)
1. lib/hooks/itinerary/useAIProgress.ts 作成
2. QuickActions.tsx 更新
3. QuickActions.tsx 簡素化

### Step 5: テスト (1時間)
1. ビルド確認
2. E2Eテスト実行
3. ドキュメント更新

**合計所要時間**: 約6.5時間

---

## 成功基準

### Phase 7 完了時の目標

| 指標 | Phase 6.3 | Phase 7 | 改善 |
|------|-----------|---------|------|
| 最大コンポーネントサイズ | 430行 | **250行** | -180行 |
| 平均コンポーネントサイズ | 194行 | **150行** | -44行 |
| 重複コード | 50行 | **0行** | -50行 |
| カスタムHooks数 | 7個 | **9個** | +2個 |
| ユーティリティ数 | 10個 | **11個** | +1個 |

### KPI
- ✅ SpotCard: 430行 → 250行以下
- ✅ QuickActions: 410行 → 150行以下
- ✅ カテゴリヘルパーの重複解消
- ✅ テストカバレッジ維持

---

## 影響範囲

### 変更ファイル (8個)

#### 新規作成 (3個)
1. lib/utils/category-utils.ts
2. components/itinerary/SpotEditForm.tsx
3. lib/hooks/itinerary/usePhaseTransition.ts
4. lib/hooks/itinerary/useAIProgress.ts

#### 更新 (4個)
1. components/itinerary/SpotCard.tsx
2. components/itinerary/QuickActions.tsx
3. components/itinerary/ItineraryPDFLayout.tsx
4. components/itinerary/AddSpotForm.tsx

### リスク
- **低**: 既存の動作を変更しない（ロジック移動のみ）
- **テスト**: E2Eテストで動作確認

---

## テスト計画

### ユニットテスト
1. category-utils.test.ts
   - getCategoryLabel のテスト
   - getCategoryColor のテスト
   - getCategoryIcon のテスト

2. usePhaseTransition.test.ts
   - getButtonLabel のテスト
   - getTooltip のテスト
   - フェーズ遷移のテスト

3. useAIProgress.test.ts
   - proceedAndSendMessage のテスト（モック）

### E2Eテスト
- スポット編集フロー
- フェーズ遷移フロー
- PDF出力フロー

---

## チェックリスト

### Phase 7.1: カテゴリヘルパー統合
- [ ] lib/utils/category-utils.ts 作成
- [ ] SpotCard.tsx 更新
- [ ] ItineraryPDFLayout.tsx 更新
- [ ] AddSpotForm.tsx 更新
- [ ] ビルド確認

### Phase 7.2: SpotEditForm 分離
- [ ] components/itinerary/SpotEditForm.tsx 作成
- [ ] SpotCard.tsx 簡素化
- [ ] ビルド確認
- [ ] E2Eテスト

### Phase 7.3: QuickActions 分割
- [ ] lib/hooks/itinerary/usePhaseTransition.ts 作成
- [ ] lib/hooks/itinerary/useAIProgress.ts 作成
- [ ] QuickActions.tsx 簡素化
- [ ] ビルド確認
- [ ] E2Eテスト

### Phase 7.4: テストとドキュメント
- [ ] ユニットテスト追加
- [ ] ドキュメント更新
- [ ] PHASE7_RESULTS.md 作成

---

**作成日**: 2025-01-10  
**ステータス**: 📝 仕様確定  
**次のステップ**: 実装開始
