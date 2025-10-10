# リファクタリング計画

## Phase 1: カスタムHooksの作成（優先度：高）

**目的**: ロジックをストアから分離し、再利用性を高める

### タスク一覧

#### 1. `useItineraryEditor` の実装
- **ファイル**: `lib/hooks/itinerary/useItineraryEditor.ts`
- **内容**: しおりの基本編集操作
- **期待効果**: コンポーネントのシンプル化

#### 2. `useSpotEditor` の実装
- **ファイル**: `lib/hooks/itinerary/useSpotEditor.ts`
- **内容**: スポット操作（CRUD + 並び替え）
- **期待効果**: ロジックの再利用性向上

#### 3. `useItinerarySave` の実装
- **ファイル**: `lib/hooks/itinerary/useItinerarySave.ts`
- **内容**: 保存ロジック（DB/LocalStorage）
- **期待効果**: SaveButton、AutoSaveで共通利用

#### 4. `useItineraryPublish` の実装
- **ファイル**: `lib/hooks/itinerary/useItineraryPublish.ts`
- **内容**: 公開・共有ロジック
- **期待効果**: ShareButtonのシンプル化

#### 5. `useItineraryPDF` の実装
- **ファイル**: `lib/hooks/itinerary/useItineraryPDF.ts`
- **内容**: PDF生成ロジック
- **期待効果**: PDFExportButtonのシンプル化

#### 6. `useItineraryList` の実装
- **ファイル**: `lib/hooks/itinerary/useItineraryList.ts`
- **内容**: 一覧取得・フィルター・ソート
- **期待効果**: ItineraryListページのシンプル化

#### 7. `useItineraryHistory` の実装
- **ファイル**: `lib/hooks/itinerary/useItineraryHistory.ts`
- **内容**: Undo/Redo管理
- **期待効果**: 履歴管理の明確化

### 期待効果
- ✅ コンポーネントがシンプルになる
- ✅ テストが容易になる
- ✅ ロジックの再利用が可能
- ✅ ストアの行数削減（1200行 → 800行程度）

---

## Phase 2: コンポーネントの統合（優先度：中）

**目的**: 重複コンポーネントを統合し、保守性を向上

### タスク一覧

#### 1. `SpotCard` + `EditableSpotCard` を統合

**現状**:
- `SpotCard.tsx` - 読み取り専用（200行）
- `EditableSpotCard.tsx` - 編集可能（377行）

**統合後**:
```tsx
// components/itinerary/SpotCard.tsx
interface SpotCardProps {
  spot: TouristSpot;
  editable?: boolean;
  dayIndex?: number;
  spotIndex?: number;
  onEdit?: (updates: Partial<TouristSpot>) => void;
  onDelete?: () => void;
}
```

**期待効果**:
- コンポーネント数: 26個 → 25個
- 重複コード削減: 約300行

---

#### 2. `ItineraryCard` の共通化

**現状**:
- `components/itinerary/ItineraryCard.tsx`
- `components/mypage/ItineraryCard.tsx`

**統合後**:
```tsx
// components/itinerary/ItineraryCard.tsx
interface ItineraryCardProps {
  itinerary: ItineraryListItem;
  variant?: 'default' | 'compact';
  showActions?: boolean;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
}
```

**期待効果**:
- コンポーネント数: 25個 → 24個
- 保守性向上

---

#### 3. `SaveButton` のロジック移動

**現状**:
- `SaveButton.tsx` にロジックが直接実装

**改善後**:
```tsx
export const SaveButton: React.FC = () => {
  const { save, isSaving } = useItinerarySave();
  
  return (
    <button onClick={() => save('overwrite')} disabled={isSaving}>
      {isSaving ? '保存中...' : '保存'}
    </button>
  );
};
```

**期待効果**:
- ロジックとUIの分離
- 他のコンポーネントでも再利用可能

---

### 期待効果
- ✅ コンポーネント数: 26個 → 20個以下
- ✅ 重複コード削減: 約500行
- ✅ 一貫したUI

---

## Phase 3: ストアのスライス分割（優先度：中）

**目的**: 巨大化したストアを機能別に分割

### タスク一覧

#### 1. `useItineraryStore` - しおり本体
- **ファイル**: `lib/store/itinerary/useItineraryStore.ts`
- **内容**: currentItinerary、基本操作
- **行数**: 約200行

#### 2. `useSpotStore` - スポット管理
- **ファイル**: `lib/store/itinerary/useSpotStore.ts`
- **内容**: スポット CRUD + 並び替え
- **行数**: 約150行

#### 3. `useItineraryUIStore` - UI状態
- **ファイル**: `lib/store/itinerary/useItineraryUIStore.ts`
- **内容**: フィルター、ソート
- **行数**: 約100行

#### 4. `useItineraryProgressStore` - 進捗管理
- **ファイル**: `lib/store/itinerary/useItineraryProgressStore.ts`
- **内容**: planningPhase、フェーズ遷移
- **行数**: 約150行

#### 5. `useItineraryHistoryStore` - 履歴管理
- **ファイル**: `lib/store/itinerary/useItineraryHistoryStore.ts`
- **内容**: Undo/Redo
- **行数**: 約100行

### ディレクトリ構造

```
lib/store/
├── itinerary/
│   ├── useItineraryStore.ts
│   ├── useSpotStore.ts
│   ├── useItineraryUIStore.ts
│   ├── useItineraryProgressStore.ts
│   └── useItineraryHistoryStore.ts
├── chat/
│   └── useChatStore.ts
├── settings/
│   └── useSettingsStore.ts
└── useStore.ts  # 統合用（後方互換性）
```

### 期待効果
- ✅ コードの見通しが良くなる
- ✅ 責務が明確になる
- ✅ パフォーマンス向上（必要な部分のみ再レンダリング）
- ✅ 各ストアが200行以下

---

## Phase 4: 型定義の整理（優先度：低）

**目的**: 肥大化した型定義を分割

### タスク一覧

#### 1. `ItineraryData` を分割

**現状**:
```typescript
interface ItineraryData {
  // 20+フィールドが1つに集約
}
```

**改善後**:
```typescript
// Core data
interface ItineraryCoreData {
  id: string;
  title: string;
  destination: string;
  schedule: DaySchedule[];
}

// Metadata
interface ItineraryMetadata {
  createdAt: Date;
  updatedAt: Date;
  status: ItineraryStatus;
  userId?: string;
}

// Public settings
interface ItineraryPublicSettings {
  isPublic: boolean;
  publicSlug?: string;
  publishedAt?: Date;
  viewCount?: number;
  allowPdfDownload: boolean;
  customMessage?: string;
}

// Combined
type ItineraryData = ItineraryCoreData & 
                     ItineraryMetadata & 
                     ItineraryPublicSettings;
```

#### 2. `DaySchedule` の簡素化

**現状**: 10+フィールド

**改善後**: 必須フィールドとオプショナルを明確に分離

#### 3. `TouristSpot` のバリデーションルール定義

**新規作成**: `types/itinerary-validation.ts`

```typescript
export const SPOT_VALIDATION_RULES = {
  name: {
    required: true,
    maxLength: 100
  },
  description: {
    required: false,
    maxLength: 500
  },
  scheduledTime: {
    required: false,
    pattern: /^([01]\d|2[0-3]):([0-5]\d)$/
  },
  // ...
};
```

### 期待効果
- ✅ 型の責務が明確になる
- ✅ 必要な部分だけインポート可能
- ✅ バリデーションが容易

---

## Phase 5: テストの追加（優先度：高）

**目的**: リファクタリング後の品質保証

### タスク一覧

#### 1. カスタムHooksのユニットテスト
- `useItineraryEditor.test.ts`
- `useSpotEditor.test.ts`
- `useItinerarySave.test.ts`
- など7ファイル

#### 2. ユーティリティ関数のユニットテスト
- `storage.test.ts`
- `pdf-generator.test.ts`
- `budget-utils.test.ts`
- など8ファイル

#### 3. コンポーネントの統合テスト
- `SpotCard.test.tsx`
- `ItineraryCard.test.tsx`
- `SaveButton.test.tsx`
- など主要コンポーネント

#### 4. E2Eテストの追加
- しおり作成フロー
- 保存・読み込みフロー
- 公開・共有フロー
- PDF出力フロー

### テストカバレッジ目標
- **ユニットテスト**: 80%以上
- **統合テスト**: 主要コンポーネント全て
- **E2Eテスト**: 主要フロー全て

### 期待効果
- ✅ バグの早期発見
- ✅ リファクタリングの安全性向上
- ✅ ドキュメントとしての役割

---

## 実装スケジュール

### Week 1-2: Phase 1（カスタムHooks作成）
- Day 1-2: `useItineraryEditor`
- Day 3-4: `useSpotEditor`
- Day 5-6: `useItinerarySave`
- Day 7-8: `useItineraryPublish`
- Day 9-10: `useItineraryPDF`、`useItineraryList`、`useItineraryHistory`

### Week 3: Phase 5（テスト追加）
- Day 1-3: Hooksのユニットテスト
- Day 4-5: ユーティリティ関数のテスト
- Day 6-7: E2Eテスト追加

### Week 4: Phase 2（コンポーネント統合）
- Day 1-2: SpotCard統合
- Day 3-4: ItineraryCard統合
- Day 5-6: その他コンポーネント整理
- Day 7: テスト追加

### Week 5: Phase 3（ストア分割）
- Day 1-2: スライス設計・準備
- Day 3-5: 各スライス実装
- Day 6-7: 移行・テスト

### Week 6: Phase 4（型定義整理）
- Day 1-3: 型定義分割
- Day 4-5: バリデーションルール追加
- Day 6-7: 移行・テスト

---

## 優先順位

1. **Phase 1**: カスタムHooks作成（最優先）
2. **Phase 5**: テスト追加（品質保証）
3. **Phase 2**: コンポーネント統合
4. **Phase 3**: ストア分割
5. **Phase 4**: 型定義整理

---

## まとめ

### 現状
- **コンポーネント**: 26個
- **ストア**: 1200行
- **カスタムHooks**: 地図関連のみ

### 改善後
- **コンポーネント**: 20個以下
- **ストア**: 5つのスライスに分割（各200行以下）
- **カスタムHooks**: 7個追加
- **テストカバレッジ**: 80%以上

---

**最終更新日**: 2025-01-10

