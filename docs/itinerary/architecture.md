# アーキテクチャ概要

## 現状のアーキテクチャ

### レイヤー構造

```
┌─────────────────────────────────────────┐
│   Presentation Layer (Components)      │
│   - 26個のUIコンポーネント               │
│   - 直接Zustandストアを操作              │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│   State Management (Zustand)            │
│   - useStore.ts (1200+ lines)           │
│   - 全てのロジックが集中                 │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│   Data Layer                            │
│   - API Routes (7 endpoints)            │
│   - Database Repository                 │
│   - LocalStorage Utils                  │
└─────────────────────────────────────────┘
```

### ディレクトリ構造

```
journee/
├── components/itinerary/      # 26個のコンポーネント
│   ├── ItineraryPreview.tsx
│   ├── ItineraryHeader.tsx
│   ├── DaySchedule.tsx
│   ├── SpotCard.tsx
│   ├── EditableSpotCard.tsx
│   ├── SaveButton.tsx
│   ├── ShareButton.tsx
│   ├── PDFExportButton.tsx
│   └── ... (18 more)
│
├── lib/
│   ├── store/
│   │   └── useStore.ts          # 1200+ lines, 全てのロジック
│   ├── hooks/                   # カスタムHooksが少ない
│   │   ├── useGoogleMapsLoader.ts
│   │   ├── useMapInstance.ts
│   │   └── ... (地図関連のみ)
│   ├── utils/                   # ユーティリティ関数
│   │   ├── storage.ts
│   │   ├── pdf-generator.ts
│   │   ├── budget-utils.ts
│   │   └── time-utils.ts
│   ├── db/
│   │   └── itinerary-repository.ts
│   └── ai/
│       └── prompts.ts
│
├── app/api/itinerary/          # 7個のAPIルート
│   ├── save/route.ts
│   ├── load/route.ts
│   ├── list/route.ts
│   ├── delete/route.ts
│   ├── publish/route.ts
│   ├── unpublish/route.ts
│   └── [id]/comments/route.ts
│
└── types/
    └── itinerary.ts            # 型定義
```

---

## 問題点と課題

### 1. 状態管理の肥大化
- ✅ `useStore.ts` が1200行以上で複雑
- ✅ しおり関連のアクションが20個以上集中
- ✅ チャット、UI、設定など他の機能も混在

### 2. カスタムHooksの不足
- ✅ 地図関連以外のHooksがほとんど存在しない
- ✅ コンポーネントが直接ストアを操作
- ✅ ロジックの再利用性が低い

### 3. コンポーネントの細分化
- ✅ 26個のコンポーネントが機能別に分散
- ✅ 依存関係が複雑
- ✅ `SpotCard` と `EditableSpotCard` でロジック重複

### 4. 責務の重複
- ✅ `ItineraryCard.tsx` が2箇所に存在（`components/itinerary/` と `components/mypage/`）
- ✅ 保存ロジックが `SaveButton.tsx` と `AutoSave.tsx` で重複

### 5. 型定義の肥大化
- ✅ `ItineraryData` が20+フィールドで複雑
- ✅ 責務が明確でない

---

## 理想的なアーキテクチャ

### レイヤー構造（改善版）

```
┌─────────────────────────────────────────┐
│   Presentation Layer                    │
│   - Simplified Components (15個)        │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│   Custom Hooks Layer (NEW!)            │
│   - useItineraryEditor                  │
│   - useItinerarySave                    │
│   - useItineraryPublish                 │
│   - useItineraryPDF                     │
│   - useItineraryList                    │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│   State Management (Sliced)             │
│   - useItineraryStore                   │
│   - useItineraryUIStore                 │
│   - useItineraryProgressStore           │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│   Data Layer                            │
│   - API Client                          │
│   - Database Repository                 │
│   - LocalStorage Utils                  │
└─────────────────────────────────────────┘
```

### 提案する新しいディレクトリ構造

```
lib/hooks/
├── itinerary/
│   ├── useItineraryEditor.ts      # 編集ロジック
│   ├── useItinerarySave.ts        # 保存ロジック
│   ├── useItineraryPublish.ts     # 公開ロジック
│   ├── useItineraryPDF.ts         # PDF生成ロジック
│   ├── useItineraryList.ts        # 一覧取得・フィルター
│   ├── useSpotEditor.ts           # スポット編集
│   └── useItineraryHistory.ts     # Undo/Redo
```

---

## まとめ

### 現状の課題
1. ✅ 1200行の巨大ストア
2. ✅ カスタムHooksの不足
3. ✅ コンポーネントの細分化と重複
4. ✅ ロジックの再利用性が低い

### 改善後の構成
1. ✅ 7つの新しいカスタムHooks
2. ✅ ストアを5つのスライスに分割
3. ✅ コンポーネント数を20個以下に削減
4. ✅ 明確な責務分離

---

**最終更新日**: 2025-01-10

