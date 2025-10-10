# しおりへの番号表示実装計画

## 概要

**フィードバック内容**: しおりの方にmapの番号と対応する数字を表示してほしいです。

**目的**: 地図上のマーカー番号と、しおりのスポットリストの番号を対応させて表示し、ユーザーが地図としおりを見比べやすくする。

---

## 現状分析

### 実装済みの機能

1. **地図マーカーの番号表示**
   - `lib/hooks/useMapMarkers.ts`で実装済み
   - マーカーには番号（1, 2, 3...）が表示される
   - 番号付けモード: `"global"`（全体通し番号）または`"perDay"`（日ごとの番号）

2. **番号計算ロジック**
   - `lib/utils/map-utils.ts`の`prepareMarkerData`関数
   - 各スポットに`globalIndex`と`dayIndex`を計算
   - 時刻順にソート済み

3. **現在の設定**
   - `ItineraryPreview.tsx`では`numberingMode="perDay"`を使用
   - つまり、各日程ごとに1から番号が振られる

### 未実装の部分

- **しおりのスポットカードに番号が表示されていない**
  - `SpotCard.tsx`: 読み取り専用カード（公開しおり用）
  - `EditableSpotCard.tsx`: 編集可能カード（メイン画面用）
  - `DaySchedule.tsx`: 日程表示コンポーネント

---

## 実装方針

### 1. 番号表示の基本デザイン

#### 視覚的な目標
- 地図マーカーと同じ番号を、スポットカードの左上に表示
- 番号バッジは円形で、日ごとに色を変える
- レスポンシブ対応（モバイルでも見やすい）

#### デザイン仕様
```
┌──────────────────────────────────────┐
│  [番号]                              │
│    ①   [カテゴリアイコン]            │
│         スポット名                    │
│         説明文...                     │
│         時刻、場所、費用              │
└──────────────────────────────────────┘
```

- 番号バッジ:
  - 位置: カードの左上（カテゴリアイコンの上）
  - サイズ: 幅28px × 高さ28px（モバイル: 24px）
  - 形状: 円形
  - 背景色: 日ごとに色を変える（`getDayColor`関数を使用）
  - 文字色: 白
  - フォント: 14px、太字（モバイル: 12px）

### 2. コンポーネント修正

#### 2.1 `SpotCard.tsx`（読み取り専用カード）

**追加props**:
```typescript
interface SpotCardProps {
  spot: TouristSpot;
  markerNumber?: number; // 地図マーカー番号
  dayNumber?: number;    // 日程番号（色決定用）
}
```

**表示ロジック**:
- `markerNumber`がある場合のみ番号バッジを表示
- `dayNumber`から色を取得（`getDayColor`）

#### 2.2 `EditableSpotCard.tsx`（編集可能カード）

**追加props**:
```typescript
interface EditableSpotCardProps {
  spot: TouristSpot;
  dayIndex: number;
  spotIndex: number;
  markerNumber?: number; // 地図マーカー番号
  dayNumber?: number;    // 日程番号（色決定用）
}
```

**表示ロジック**:
- `SpotCard`と同様に番号バッジを表示
- 編集モード時は番号バッジを非表示（または薄く表示）

#### 2.3 `DaySchedule.tsx`（日程表示）

**修正内容**:
1. `prepareMarkerData`を利用して各スポットの番号を計算
2. `SpotCard` / `EditableSpotCard`に番号を渡す

**実装例**:
```typescript
import { prepareMarkerData } from '@/lib/utils/map-utils';

// コンポーネント内で番号を計算
const markerData = useMemo(() => {
  const currentDay = { ...day, day: dayIndex + 1 };
  return prepareMarkerData([currentDay], undefined, 'perDay');
}, [day, dayIndex]);
```

---

## 実装の優先順位

### Phase 1: 基本実装（必須）
1. ✅ `SpotCard.tsx`に番号バッジを追加
2. ✅ `EditableSpotCard.tsx`に番号バッジを追加
3. ✅ `DaySchedule.tsx`で番号を計算して渡す

### Phase 2: UX改善（推奨）
4. 番号クリックで地図にフォーカス（地図が開いている場合）
5. ホバー時のアニメーション効果
6. 番号の色を統一（地図マーカーと完全一致）

### Phase 3: 設定機能（オプション）
7. 番号表示のON/OFF切り替え
8. 番号付けモードの切り替え（`global` / `perDay`）

---

## 実装詳細

### ファイル修正一覧

#### 1. `components/itinerary/SpotCard.tsx`

**変更点**:
- propsに`markerNumber?: number`と`dayNumber?: number`を追加
- 番号バッジのJSX追加
- `getDayColor`をインポート

#### 2. `components/itinerary/EditableSpotCard.tsx`

**変更点**:
- propsに`markerNumber?: number`と`dayNumber?: number`を追加
- 番号バッジのJSX追加
- `getDayColor`をインポート

#### 3. `components/itinerary/DaySchedule.tsx`

**変更点**:
- `prepareMarkerData`をインポート
- 各スポットの番号を計算
- `SpotCard` / `EditableSpotCard`に番号を渡す

#### 4. `components/itinerary/PublicItineraryView.tsx`（公開しおり）

**変更点**:
- `DaySchedule`と同様に番号を計算して表示

---

## テストシナリオ

### 1. 基本表示テスト
- [ ] スポットカードに番号が表示される
- [ ] 番号は地図マーカーと一致する
- [ ] 各日程で1から番号が振られる（`perDay`モード）

### 2. 色の一貫性テスト
- [ ] Day 1は青（#3b82f6）
- [ ] Day 2は緑（#10b981）
- [ ] Day 3は黄色（#f59e0b）
- [ ] Day 4は赤（#ef4444）
- [ ] Day 5は紫（#8b5cf6）
- [ ] Day 6以降は色がループする

### 3. レスポンシブテスト
- [ ] モバイル画面で番号が見やすい
- [ ] タブレット画面で問題なく表示
- [ ] デスクトップ画面で最適なサイズ

### 4. 位置情報なしスポットのテスト
- [ ] 位置情報がないスポットには番号を表示しない
- [ ] 位置情報があるスポットのみ番号を振る

### 5. 複数日程のテスト
- [ ] Day 1の番号: 1, 2, 3...
- [ ] Day 2の番号: 1, 2, 3...（`perDay`モード）
- [ ] 全体通し番号: 1, 2, 3, 4, 5...（`global`モード）

---

## 実装時の注意事項

### 1. パフォーマンス
- `prepareMarkerData`の計算結果を`useMemo`でメモ化
- 不要な再計算を避ける

### 2. 一貫性
- 地図マーカーとしおりの番号が必ず一致すること
- 番号付けモード（`global` / `perDay`）を統一

### 3. アクセシビリティ
- 番号バッジにaria-labelを追加
- キーボードナビゲーション対応

### 4. エッジケース
- 位置情報がないスポット: 番号を表示しない
- スポットが0件の日: 何も表示しない
- 時刻がないスポット: IDでソート

---

## UI/UXの詳細設計

### 番号バッジのスタイル（Tailwind CSS）

```tsx
{markerNumber && (
  <div
    className="absolute -top-2 -left-2 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-md z-10"
    style={{ backgroundColor: getDayColor(dayNumber || 1) }}
    aria-label={`スポット番号${markerNumber}`}
  >
    {markerNumber}
  </div>
)}
```

### レイアウト調整

- カードの`position: relative`を維持
- 番号バッジは`position: absolute`で配置
- カテゴリアイコンとの重なりを避ける

---

## リリース後の改善案

### 1. インタラクション強化
- 番号クリックで地図の該当マーカーをハイライト
- 地図マーカークリックで該当スポットカードにスクロール

### 2. カスタマイズ機能
- 設定画面で番号表示のON/OFF
- 番号付けモードの切り替え（ユーザー設定）

### 3. デザイン改善
- 番号バッジのアニメーション（フェードイン）
- ホバー時の拡大効果

---

## 完了条件

- [x] 実装計画の策定
- [ ] `SpotCard.tsx`の実装
- [ ] `EditableSpotCard.tsx`の実装
- [ ] `DaySchedule.tsx`の実装
- [ ] `PublicItineraryView.tsx`の実装
- [ ] 全テストシナリオのパス
- [ ] レスポンシブ対応の確認
- [ ] コードレビュー
- [ ] ドキュメント更新

---

## 見積もり

- **実装時間**: 2-3時間
- **テスト時間**: 1時間
- **合計**: 3-4時間

---

## 参考資料

- [地図マーカー実装](lib/hooks/useMapMarkers.ts)
- [番号計算ロジック](lib/utils/map-utils.ts)
- [スポットカード](components/itinerary/SpotCard.tsx)
- [編集可能スポットカード](components/itinerary/EditableSpotCard.tsx)
