# Phase 4.1: 型定義の拡張 - 実装完了レポート

## 📋 実装概要

Phase 4「段階的旅程構築システム」の第一段階として、型定義の拡張を実装しました。

**実施日**: 2025-10-07  
**対象フェーズ**: Phase 4.1  
**主な変更ファイル**: `types/itinerary.ts`

---

## ✅ 実装内容

### 1. 新しい型の追加

#### 1.1 `DayStatus` 型（各日の進捗状態）

```typescript
export type DayStatus = "draft" | "skeleton" | "detailed" | "completed";
```

**役割**:
- 各日の詳細化の進捗状態を管理
- しおりの段階的な作成プロセスをサポート

**状態の説明**:
- `draft`: 下書き状態（まだ何も決まっていない）
- `skeleton`: 骨組み状態（テーマ・エリアが決まった）
- `detailed`: 詳細化済み（具体的なスポット・時間が設定された）
- `completed`: 完成（この日の予定は確定）

---

#### 1.2 `ItineraryPhase` 型（しおり全体の作成フェーズ）

```typescript
export type ItineraryPhase =
  | "initial"      // 初期状態（まだ何も決まっていない）
  | "collecting"   // 基本情報収集中（行き先、期間、興味など）
  | "skeleton"     // 骨組み作成中（各日のテーマ・エリアを決定）
  | "detailing"    // 日程詳細化中（具体的なスポット・時間を追加）
  | "completed";   // 完成
```

**役割**:
- しおり全体の作成プロセスを管理
- AIアシスタントが適切なプロンプトを選択するための指標

**フェーズの説明**:
1. **initial**: 新規作成時の初期状態
2. **collecting**: 基本情報（行き先、期間、人数、興味）を収集中
3. **skeleton**: 各日の大まかなテーマ・エリアを決定中
4. **detailing**: 1日ずつ具体的な観光スポット、時間、移動手段を追加中
5. **completed**: すべての日程が詳細化され、旅程が完成

---

### 2. 既存インターフェースの拡張

#### 2.1 `DaySchedule` インターフェース

```typescript
export interface DaySchedule {
  day: number;
  date?: string;
  title?: string;
  spots: TouristSpot[];
  totalDistance?: number;
  totalCost?: number;
  /** Phase 4: この日の作成状態 */
  status?: DayStatus;
  /** Phase 4: この日のテーマ・コンセプト（骨組み作成時に使用） */
  theme?: string;
}
```

**追加プロパティ**:
- `status?: DayStatus`: この日の詳細化の進捗状態
- `theme?: string`: この日のテーマ・コンセプト（例: "浅草・スカイツリー周辺", "渋谷・原宿散策"）

**使用例**:
```typescript
const day1: DaySchedule = {
  day: 1,
  title: "東京観光1日目",
  theme: "浅草・スカイツリー周辺", // 骨組み段階で設定
  status: "skeleton", // 骨組みは決まったが、詳細はまだ
  spots: [] // 詳細化フェーズで追加
};
```

---

#### 2.2 `ItineraryData` インターフェース

```typescript
export interface ItineraryData {
  // ... 既存プロパティ ...
  /** Phase 4: 段階的作成システムの現在のフェーズ */
  phase?: ItineraryPhase;
  /** Phase 4: 現在詳細化中の日（detailingフェーズで使用） */
  currentDay?: number;
}
```

**追加プロパティ**:
- `phase?: ItineraryPhase`: 現在のしおり作成フェーズ
- `currentDay?: number`: 詳細化中の日（1日ずつ詳細化する際に使用）

**使用例**:
```typescript
const itinerary: ItineraryData = {
  id: "itinerary-1",
  title: "東京3泊4日の旅",
  destination: "東京",
  duration: 4,
  phase: "detailing", // 詳細化フェーズ
  currentDay: 2, // 現在2日目を詳細化中
  schedule: [
    { day: 1, status: "completed", theme: "浅草・スカイツリー", spots: [...] },
    { day: 2, status: "detailing", theme: "渋谷・原宿", spots: [] }, // 作成中
    { day: 3, status: "skeleton", theme: "お台場・豊洲", spots: [] },
    { day: 4, status: "draft", theme: "", spots: [] },
  ],
  // ... 他のプロパティ ...
};
```

---

## 🎯 期待される効果

### 1. 段階的な旅程作成が可能に
- ユーザーは一度に全てを決める必要がなく、**少しずつ旅程を構築**できる
- AIアシスタントが適切なタイミングで次のステップを提案

### 2. 進捗状況の可視化
- 各日の進捗状態が明確になり、**どの日が未完成か**一目で分かる
- ユーザーは自分のペースで計画を進められる

### 3. AI プロンプトの最適化
- 現在のフェーズに応じて、AIが**適切なプロンプトを選択**できる
- 例: `collecting`フェーズでは基本情報を尋ね、`detailing`フェーズでは具体的なスポットを提案

### 4. UX向上
- ユーザーが「どこまで進んだか」を把握しやすくなる
- 「次へ」ボタンで段階的に進められる直感的なUI（Phase 4.4で実装予定）

---

## 🔄 次のステップ（Phase 4.2以降）

### Phase 4.2: 状態管理の拡張
- [ ] Zustand ストアに `planningPhase`, `currentDetailingDay` の状態を追加
- [ ] `proceedToNextStep` 関数の実装（フェーズ遷移ロジック）

### Phase 4.3: プロンプトシステムの改善
- [ ] `INCREMENTAL_SYSTEM_PROMPT` の作成
- [ ] `createSkeletonPrompt` 関数（骨組み作成用）
- [ ] `createDayDetailPrompt` 関数（日程詳細化用）
- [ ] `createNextStepPrompt` 関数（次のステップ誘導）

### Phase 4.4: UIコンポーネントの追加
- [ ] `PlanningProgress` コンポーネント（進捗インジケーター）
- [ ] `QuickActions` コンポーネント（「次へ」ボタン）
- [ ] `ItineraryPreview` にプログレス表示を統合

### Phase 4.5: APIの拡張
- [ ] チャットAPIにフェーズ判定ロジックを追加
- [ ] 自動進行のトリガー実装

### Phase 4.6: しおりマージロジックの改善
- [ ] 骨組み段階のマージ処理
- [ ] 日程詳細化のマージ処理

### Phase 4.7: テスト・デバッグ
- [ ] 各フェーズの動作確認
- [ ] エッジケースのテスト

---

## 📁 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `types/itinerary.ts` | `DayStatus`, `ItineraryPhase` 型を追加<br>`DaySchedule` に `status`, `theme` プロパティ追加<br>`ItineraryData` に `phase`, `currentDay` プロパティ追加 |

---

## 🧪 型定義の動作確認

すべての型定義は正常に追加されました。既存のコードとの互換性も保たれています（新しいプロパティはすべてオプショナル）。

---

## 📌 重要なポイント

1. **後方互換性**: すべての新しいプロパティはオプショナル（`?`）なので、既存のコードに影響なし
2. **段階的実装**: Phase 4.2以降で実際のロジック・UI実装を行う
3. **型安全性**: TypeScriptの型チェックにより、今後の実装ミスを防ぐ

---

**Phase 4.1 完了**: ✅  
**次のフェーズ**: Phase 4.2（状態管理の拡張）