# Phase 8: コンポーネント構成によるUI再構築

**作成日**: 2025-01-10  
**対象**: ItineraryPreview の巨大なreturnブロックをコンポーネント分割

## 概要

ItineraryPreview.tsx (222行) は現在、すべてのUIロジックがreturnブロックに集約されており、コメントで区切られています。これを意味のある小さなコンポーネントに分割し、組み合わせることで構成可能にします。

---

## 現状の問題

### ItineraryPreview.tsx の構造
```tsx
export const ItineraryPreview: React.FC = () => {
  // 状態取得 (15行)
  
  // 空状態の条件分岐 (22行)
  if (!currentItinerary) {
    return <div>...</div>; // 大量のJSX
  }
  
  // メイン表示 (150行のJSX)
  return (
    <>
      {/* Toast Container */}
      {/* Phase 4.10.3: 自動進行中の進捗表示 */}
      {/* メインコンテンツ（スクロール可能） */}
        {/* Header */}
        {/* Content */}
          {/* Action Buttons & View Mode Switcher */}
          {/* Summary */}
          {/* Map View */}
          {/* Days (Schedule View) */}
          {/* PDF Export Button */}
    </>
  );
};
```

### 問題点
1. **巨大なreturn**: 150行以上のJSX
2. **条件分岐が複雑**: viewMode、hasLocations、schedule.lengthなど
3. **再利用不可**: すべてが一体化
4. **テスト困難**: 単体でテストできない
5. **コメント依存**: 構造をコメントで示している

---

## コンポーネント分割計画

### 分割するコンポーネント (7個)

#### 1. EmptyItineraryState
**責務**: しおりがない場合の表示

**props**:
```tsx
interface EmptyItineraryStateProps {
  // なし（EmptyItineraryを使用）
}
```

**使用箇所**: 46-68行

---

#### 2. ViewModeSwitcher
**責務**: スケジュール/地図の表示モード切り替え

**props**:
```tsx
interface ViewModeSwitcherProps {
  viewMode: 'schedule' | 'map';
  onViewModeChange: (mode: 'schedule' | 'map') => void;
}
```

**使用箇所**: 107-134行

**UI**:
```tsx
<div className="flex items-center gap-2">
  <button>スケジュール</button>
  <button>地図</button>
</div>
```

---

#### 3. ItineraryActionButtons
**責務**: Share/Save/Resetボタンの表示

**props**:
```tsx
interface ItineraryActionButtonsProps {
  // なし（個別のボタンコンポーネントを使用）
}
```

**使用箇所**: 136-151行

**UI**:
```tsx
<div className="flex flex-wrap gap-2 md:gap-3">
  <ShareButton />
  <SaveButton />
  <ResetButton />
</div>
```

---

#### 4. ItineraryToolbar
**責務**: ViewModeSwitcherとActionButtonsの配置管理

**props**:
```tsx
interface ItineraryToolbarProps {
  hasLocations: boolean;
  viewMode: 'schedule' | 'map';
  onViewModeChange: (mode: 'schedule' | 'map') => void;
}
```

**使用箇所**: 100-155行

**構成**:
```tsx
<div className="mb-6">
  {hasLocations ? (
    <>
      <ViewModeSwitcher />
      <ItineraryActionButtons />
    </>
  ) : (
    <ItineraryActionButtons />
  )}
</div>
```

---

#### 5. ScheduleListView
**責務**: 日程リストの表示

**props**:
```tsx
interface ScheduleListViewProps {
  schedule: DaySchedule[];
  editable: boolean;
}
```

**使用箇所**: 176-191行

**UI**:
```tsx
<div className="space-y-6">
  {schedule.map((day, index) => (
    <DaySchedule
      key={day.day}
      day={day}
      dayIndex={index}
      editable={editable}
    />
  ))}
</div>
```

---

#### 6. EmptyScheduleMessage
**責務**: スケジュールが空の場合のメッセージ

**props**:
```tsx
interface EmptyScheduleMessageProps {
  // なし
}
```

**使用箇所**: 193-200行

**UI**:
```tsx
<div className="bg-white rounded-lg shadow-sm p-6 md:p-12 text-center">
  <p className="text-gray-600 text-base md:text-lg font-medium mb-2">
    スケジュールがまだ作成されていません
  </p>
  <p className="text-sm text-gray-500">
    AIチャットで「〇日目の詳細を教えて」と聞いてみましょう
  </p>
</div>
```

---

#### 7. ItineraryContentArea
**責務**: メインコンテンツエリアの構成（Toolbar, Summary, Map/Schedule, PDF Export）

**props**:
```tsx
interface ItineraryContentAreaProps {
  itinerary: ItineraryData;
  viewMode: 'schedule' | 'map';
  hasLocations: boolean;
  onViewModeChange: (mode: 'schedule' | 'map') => void;
}
```

**使用箇所**: 94-210行

**構成**:
```tsx
<div className="flex-1 overflow-y-auto bg-gray-50">
  <ItineraryHeader itinerary={itinerary} editable={true} />
  
  <div className="p-4 md:p-6 max-w-5xl mx-auto">
    {schedule.length > 0 && (
      <ItineraryToolbar
        hasLocations={hasLocations}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />
    )}
    
    {viewMode === 'schedule' && schedule.length > 0 && (
      <ItinerarySummary itinerary={itinerary} />
    )}
    
    {viewMode === 'map' && hasLocations && (
      <MapView days={schedule} />
    )}
    
    {viewMode === 'schedule' && (
      schedule.length > 0 ? (
        <ScheduleListView schedule={schedule} editable={true} />
      ) : (
        <EmptyScheduleMessage />
      )
    )}
    
    {viewMode === 'schedule' && schedule.length > 0 && (
      <div className="mt-10 mb-6 flex justify-center">
        <PDFExportButton itinerary={itinerary} />
      </div>
    )}
  </div>
</div>
```

---

## ディレクトリ構造

### 新規作成ファイル

```
components/itinerary/
  ├── preview/                     # 新規ディレクトリ
  │   ├── ViewModeSwitcher.tsx     # 表示モード切り替え
  │   ├── ItineraryActionButtons.tsx  # アクションボタン群
  │   ├── ItineraryToolbar.tsx     # ツールバー
  │   ├── ScheduleListView.tsx     # スケジュールリスト
  │   ├── EmptyScheduleMessage.tsx # 空メッセージ
  │   ├── ItineraryContentArea.tsx # コンテンツエリア
  │   └── index.ts                 # エクスポート
  └── ItineraryPreview.tsx         # メインコンポーネント（簡素化）
```

---

## 改善後の ItineraryPreview.tsx

### Before (222行)
```tsx
export const ItineraryPreview: React.FC = () => {
  const { currentItinerary } = useItineraryStore();
  const { planningPhase, isAutoProgressing, autoProgressState } = useItineraryProgressStore();
  const [viewMode, setViewMode] = useState<ViewMode>("schedule");
  const hasLocations = /* ... */;
  
  if (!currentItinerary) {
    return <div>{/* 22行のJSX */}</div>;
  }
  
  return (
    <>
      <ToastContainer />
      <div className="h-full flex flex-col bg-gray-50 relative">
        {/* 150行のJSX */}
      </div>
    </>
  );
};
```

### After (推定70行)
```tsx
export const ItineraryPreview: React.FC = () => {
  const { currentItinerary } = useItineraryStore();
  const { isAutoProgressing, autoProgressState } = useItineraryProgressStore();
  const [viewMode, setViewMode] = useState<ViewMode>("schedule");
  
  const hasLocations = currentItinerary?.schedule.some(
    day => day.spots.some(spot => spot.location?.lat && spot.location?.lng)
  ) || false;
  
  // 空状態
  if (!currentItinerary) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <EmptyItinerary />
      </div>
    );
  }
  
  return (
    <>
      <ToastContainer />
      
      <div className="h-full flex flex-col bg-gray-50 relative">
        {/* 自動進行中の進捗表示 */}
        {isAutoProgressing && autoProgressState && (
          <div className="hidden md:block">
            <PhaseStatusBar state={autoProgressState} />
          </div>
        )}
        
        {/* メインコンテンツ */}
        <ItineraryContentArea
          itinerary={currentItinerary}
          viewMode={viewMode}
          hasLocations={hasLocations}
          onViewModeChange={setViewMode}
        />
      </div>
    </>
  );
};
```

---

## 期待効果

### コード品質
- **ItineraryPreview**: 222行 → **70行** (-152行 / -68%)
- **平均コンポーネント**: 50-80行（適切なサイズ）
- **最大コンポーネント**: 120行以下

### 保守性
- **責務の明確化**: 1コンポーネント = 1責務
- **再利用可能**: 各コンポーネントは独立
- **テスト容易**: 個別にテスト可能

### 開発体験
- **可読性向上**: コメント不要、名前で意味が明確
- **変更の局所化**: 該当コンポーネントのみ変更
- **組み合わせ自由**: 柔軟な構成が可能

---

## 実装順序

### Step 1: 小さいコンポーネントから作成 (30分)
1. ViewModeSwitcher.tsx
2. ItineraryActionButtons.tsx
3. EmptyScheduleMessage.tsx
4. ScheduleListView.tsx

### Step 2: 中規模コンポーネント作成 (30分)
5. ItineraryToolbar.tsx

### Step 3: 大規模コンポーネント作成 (30分)
6. ItineraryContentArea.tsx

### Step 4: ItineraryPreview 再構成 (30分)
7. ItineraryPreview.tsx の簡素化

### Step 5: テスト (30分)
8. ビルド確認
9. 動作確認
10. コミット

**合計所要時間**: 約2.5時間

---

## コンポーネント構成図

```
ItineraryPreview
  ├── ToastContainer
  ├── PhaseStatusBar (条件付き)
  └── ItineraryContentArea
       ├── ItineraryHeader
       ├── ItineraryToolbar (条件付き)
       │    ├── ViewModeSwitcher (条件付き)
       │    └── ItineraryActionButtons
       ├── ItinerarySummary (条件付き)
       ├── MapView (条件付き)
       ├── ScheduleListView OR EmptyScheduleMessage
       └── PDFExportButton (条件付き)
```

---

## 成功基準

### 定量的基準
- ✅ ItineraryPreview: 222行 → 70行以下
- ✅ 新規コンポーネント: 7個
- ✅ 平均コンポーネントサイズ: 50-80行
- ✅ コメント行数: 50%削減

### 定性的基準
- ✅ 各コンポーネントの責務が明確
- ✅ propsインターフェースが適切
- ✅ 再利用可能
- ✅ テスト可能

---

**作成日**: 2025-01-10  
**ステータス**: 📝 仕様確定  
**次のステップ**: 実装開始
