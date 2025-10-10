# コンポーネント一覧

## A. 表示系コンポーネント（閲覧専用）

| コンポーネント | パス | 役割 | 主な Props | 依存Hook |
|--------------|------|------|-----------|----------|
| `ItineraryPreview` | `components/itinerary/` | しおり全体のプレビュー表示 | `editable?: boolean` | `useStore` |
| `ItineraryHeader` | `components/itinerary/` | タイトル、行き先、期間表示 | `itinerary: ItineraryData`, `editable?: boolean` | `useStore` |
| `ItinerarySummary` | `components/itinerary/` | 概要・統計情報表示 | `itinerary: ItineraryData` | `useStore` |
| `DaySchedule` | `components/itinerary/` | 1日のスケジュール表示 | `day: DaySchedule`, `dayIndex: number`, `editable?: boolean` | `useStore` |
| `SpotCard` | `components/itinerary/` | スポット詳細表示（読み取り専用） | `spot: TouristSpot` | `useStore` |
| `EmptyItinerary` | `components/itinerary/` | 空のしおり説明画面 | なし | なし |
| `PublicItineraryView` | `components/itinerary/` | 公開しおり閲覧ビュー | `slug: string`, `itinerary: ItineraryData` | なし |
| `MapView` | `components/itinerary/` | Google Maps表示 | `days: DaySchedule[]`, `selectedDay?: number` | `useGoogleMapsLoader`, `useMapInstance` |
| `MapDaySelector` | `components/itinerary/map/` | 地図の日程選択UI | `days: DaySchedule[]`, `selectedDay?: number` | なし |

---

## B. 編集系コンポーネント（インタラクティブ）

| コンポーネント | パス | 役割 | 主な Props | 依存Hook |
|--------------|------|------|-----------|----------|
| `EditableSpotCard` | `components/itinerary/` | スポット編集可能カード | `spot: TouristSpot`, `dayIndex: number`, `spotIndex: number` | `useStore` |
| `EditableTitle` | `components/itinerary/` | タイトルインライン編集 | `value: string`, `className?: string` | `useStore` |
| `AddSpotForm` | `components/itinerary/` | スポット追加フォーム | `dayIndex: number` | `useStore` |

---

## C. アクション系コンポーネント（ボタン）

| コンポーネント | パス | 役割 | 主な機能 | 依存Hook |
|--------------|------|------|---------|----------|
| `SaveButton` | `components/itinerary/` | 保存ボタン | DB/LocalStorage保存、上書き/新規 | `useStore`, `useSession` |
| `ResetButton` | `components/itinerary/` | リセットボタン | しおりクリア + 確認ダイアログ | `useStore` |
| `ShareButton` | `components/itinerary/` | 共有ボタン | 公開設定、URL生成、コピー | `useStore` |
| `PDFExportButton` | `components/itinerary/` | PDF出力ボタン | jsPDFでPDF生成、プログレス表示 | なし |
| `PDFPreviewModal` | `components/itinerary/` | PDFプレビューモーダル | 出力前のプレビュー | なし |
| `QuickActions` | `components/itinerary/` | 次へ・リセットボタン群 | フェーズ遷移、AI呼び出し | `useStore` |

---

## D. 進捗・状態表示系コンポーネント

| コンポーネント | パス | 役割 | 表示内容 | 依存Hook |
|--------------|------|------|---------|----------|
| `PhaseStatusBar` | `components/itinerary/` | フェーズステータスバー | 骨組み→詳細化→完成の進捗 | なし |
| `PlanningProgress` | `components/itinerary/` | プランニング進捗 | パーセンテージ + フェーズアイコン | `useStore` |
| `MobilePlannerControls` | `components/itinerary/` | モバイル用コントロール | モバイルUIの操作ボタン | `useStore` |

---

## E. リスト・フィルター系コンポーネント

| コンポーネント | パス | 役割 | 主な機能 | 依存Hook |
|--------------|------|------|---------|----------|
| `ItineraryList` | `components/itinerary/` | しおり一覧表示 | ページネーション、フィルター適用 | `useStore` |
| `ItineraryCard` | `components/itinerary/` | しおりカード | サムネイル、タイトル、行き先表示 | なし |
| `ItineraryFilters` | `components/itinerary/` | フィルターUI | 行き先、日付、ステータス絞り込み | `useStore` |
| `ItinerarySortMenu` | `components/itinerary/` | ソートメニュー | 更新日、作成日、タイトルなどでソート | `useStore` |

---

## F. PDF専用レイアウト

| コンポーネント | パス | 役割 | 使用方法 | 依存Hook |
|--------------|------|------|---------|----------|
| `ItineraryPDFLayout` | `components/itinerary/` | PDF出力用レイアウト | 非表示DOMとしてレンダリング | なし |

---

## 🔧 リファクタリング提案

### 統合すべきコンポーネント

#### 1. SpotCard + EditableSpotCard → SpotCard（単一コンポーネント）

**現状**:
- `SpotCard.tsx` - 読み取り専用の表示
- `EditableSpotCard.tsx` - 編集可能な表示

**問題点**:
- ほぼ同じUIで重複コードが多い
- 表示ロジックが2箇所に分散

**提案**:
```tsx
interface SpotCardProps {
  spot: TouristSpot;
  editable?: boolean;  // ← 統合
  dayIndex?: number;
  spotIndex?: number;
  onEdit?: (updates: Partial<TouristSpot>) => void;
  onDelete?: () => void;
}

export const SpotCard: React.FC<SpotCardProps> = ({ 
  spot, 
  editable = false,
  ...
}) => {
  // 編集モード / 表示モードを内部で切り替え
  if (editable) {
    return <EditableMode ... />;
  }
  return <DisplayMode ... />;
};
```

**期待効果**:
- コンポーネント数: 26個 → 25個
- 重複コード削減: 約300行
- 一貫したUI

---

#### 2. ItineraryCard の共通化

**現状**:
- `components/itinerary/ItineraryCard.tsx`
- `components/mypage/ItineraryCard.tsx`
- → 2箇所に存在し、ほぼ同じコンポーネント

**問題点**:
- 保守性が低い（修正時に2箇所更新が必要）
- スタイルの不一致リスク

**提案**:
```tsx
// components/itinerary/ItineraryCard.tsx に統一
interface ItineraryCardProps {
  itinerary: ItineraryListItem;
  variant?: 'default' | 'compact';  // マイページ用は compact
  showActions?: boolean;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
}
```

**期待効果**:
- コンポーネント数: 25個 → 24個
- 保守性向上
- スタイルの一貫性

---

#### 3. SaveButton のロジックを useItinerarySave に移動

**現状**:
- `SaveButton.tsx` に保存ロジックが直接実装されている

**問題点**:
- ロジックの再利用ができない
- テストが困難

**提案**:
```tsx
// components/itinerary/SaveButton.tsx
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
- 他のコンポーネントでも保存ロジック再利用可能
- テストが容易

---

## まとめ

### 現状
- **合計**: 26個のコンポーネント
- **重複**: SpotCard 系、ItineraryCard 系
- **ロジック**: コンポーネント内に密結合

### 改善後
- **合計**: 20個以下のコンポーネント
- **統合**: SpotCard、ItineraryCard を共通化
- **分離**: ロジックをカスタムHooksに移動

---

**最終更新日**: 2025-01-10

