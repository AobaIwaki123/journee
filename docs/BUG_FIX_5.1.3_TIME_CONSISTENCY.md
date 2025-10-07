# Phase 5.1.3 バグ修正: 時刻と順番の整合性

**修正日**: 2025-10-07  
**ステータス**: ✅ 完了

## 🐛 報告されたバグ

### バグ1: 編集内容が即座にレンダリングされない
**症状**: スポット情報を編集しても、UIに即座に反映されない

**原因**: 
- `EditableSpotCard` コンポーネントで `editValues` を `useState` で管理
- `spot` propsが変更されても `editValues` が更新されていなかった

### バグ2: 時刻と順番の整合性が保たれない
**症状**: 
- 時刻を変更しても順番が変わらない
- 順番を変更しても時刻が変化しない

**原因**:
- スポットを時刻順に自動ソートする機能がなかった
- ドラッグ&ドロップ時に時刻を自動調整する機能がなかった

## ✅ 修正内容

### 1. EditableSpotCard の修正

**ファイル**: `components/itinerary/EditableSpotCard.tsx`

**変更内容**:
```typescript
// useEffectを追加してspot propsの変更を監視
useEffect(() => {
  setEditValues({
    name: spot.name,
    description: spot.description,
    scheduledTime: spot.scheduledTime || '',
    duration: spot.duration?.toString() || '',
    estimatedCost: spot.estimatedCost?.toString() || '',
    notes: spot.notes || '',
  });
}, [spot]);
```

**効果**:
- スポット情報が更新されると、編集フォームの初期値も自動更新
- 即座にUIに反映される

### 2. 時刻ユーティリティ関数の作成

**ファイル**: `lib/utils/time-utils.ts` (新規作成)

**機能**:

#### `timeToMinutes(time: string): number`
- HH:mm形式の時刻を分に変換
- 例: "09:30" → 570

#### `minutesToTime(minutes: number): string`
- 分をHH:mm形式に変換
- 例: 570 → "09:30"

#### `sortSpotsByTime(spots: TouristSpot[]): TouristSpot[]`
- スポットを時刻順にソート
- 時刻がないスポットは最後に配置

#### `adjustTimeAfterReorder(spots: TouristSpot[], movedIndex: number): TouristSpot[]`
- 並び替え後、移動したスポットの時刻を自動調整
- ロジック:
  - 前後のスポットに時刻がある場合 → その中間の時刻を設定
  - 前のスポットのみ時刻がある場合 → 前のスポットの終了時刻を設定
  - 次のスポットのみ時刻がある場合 → 次のスポットの開始時刻の前を設定

### 3. Zustand Store の修正

**ファイル**: `lib/store/useStore.ts`

**変更内容**:

#### `updateSpot` アクション
```typescript
// 時刻が変更された場合、時刻順にソート
if (updates.scheduledTime !== undefined) {
  daySchedule.spots = sortSpotsByTime(daySchedule.spots);
}
```

#### `addSpot` アクション
```typescript
// スポット追加後、時刻順にソート
daySchedule.spots = sortSpotsByTime(daySchedule.spots);
```

#### `reorderSpots` アクション
```typescript
// 並び替え後、移動したスポットの時刻を自動調整
const adjustedSpots = adjustTimeAfterReorder(spots, endIndex);
daySchedule.spots = adjustedSpots;
```

#### 全てのアクションにhistory更新を追加
- `updateItineraryTitle`
- `updateItineraryDestination`
- `updateSpot`
- `deleteSpot`
- `addSpot`
- `reorderSpots`

### 4. EditableTitle の修正

**ファイル**: `components/itinerary/EditableTitle.tsx`

**変更内容**:
- コメントを追加して、useEffectの目的を明確化

### 5. DaySchedule の通知メッセージ改善

**ファイル**: `components/itinerary/DaySchedule.tsx`

**変更内容**:
```typescript
addToast('スポットの順序を変更し、時刻を自動調整しました', 'info');
```

## 🎯 修正後の動作

### ケース1: 時刻を編集
1. スポットの時刻を変更
2. **自動的に時刻順に再配置される**
3. Toast通知「スポット情報を更新しました」

### ケース2: ドラッグ&ドロップで並び替え
1. スポットをドラッグして別の位置にドロップ
2. **前後のスポットの時刻を参考に、適切な時刻が自動設定される**
3. Toast通知「スポットの順序を変更し、時刻を自動調整しました」

### ケース3: スポットを追加
1. 新しいスポットを追加
2. **時刻を入力した場合、自動的に時刻順の位置に配置される**
3. Toast通知「スポットを追加しました」

## 🧪 テストケース

### テスト1: 時刻変更による自動ソート

**操作**:
1. スポットA (09:00), スポットB (10:00), スポットC (11:00) がある
2. スポットCの時刻を 09:30 に変更

**期待結果**:
- 順序が スポットA (09:00) → スポットC (09:30) → スポットB (10:00) に変わる

### テスト2: ドラッグ&ドロップによる時刻調整

**操作**:
1. スポットA (09:00, 60分), スポットB (11:00) がある
2. スポットBをスポットAの前にドラッグ

**期待結果**:
- スポットBの時刻が自動的に 08:00 に設定される（スポットAの60分前）

### テスト3: 中間位置へのドラッグ

**操作**:
1. スポットA (09:00), スポットB (11:00), スポットC (13:00) がある
2. スポットCをスポットAとBの間にドラッグ

**期待結果**:
- スポットCの時刻が自動的に 10:00 に設定される（09:00と11:00の中間）

### テスト4: 編集内容の即座反映

**操作**:
1. スポット名を「清水寺」から「金閣寺」に変更
2. 保存ボタンをクリック

**期待結果**:
- UIに即座に「金閣寺」と表示される
- 編集フォームを再度開いても「金閣寺」が表示される

## 📦 変更ファイル一覧

### 新規作成
```
lib/utils/
└── time-utils.ts          # 時刻ユーティリティ関数
```

### 更新
```
lib/store/
└── useStore.ts            # 時刻ソート・自動調整ロジック追加

components/itinerary/
├── EditableSpotCard.tsx   # useEffect追加
├── EditableTitle.tsx      # コメント追加
└── DaySchedule.tsx        # Toast通知改善

docs/
└── BUG_FIX_5.1.3_TIME_CONSISTENCY.md  # このファイル
```

## 🎉 まとめ

**修正内容**:
- ✅ 編集内容が即座にレンダリングされるようになった
- ✅ 時刻変更時に自動的に時刻順にソートされる
- ✅ ドラッグ&ドロップ時に時刻が自動調整される
- ✅ スポット追加時も時刻順に配置される
- ✅ すべての編集アクションでUndo/Redoが正常に動作する

**ユーザー体験の向上**:
- 時刻と順番の整合性が常に保たれる
- 手動で並び替える必要がない
- 直感的な操作でスケジュール管理が可能

---

**実装者**: Cursor AI  
**レビュー**: 未実施  
**最終更新**: 2025-10-07