<!-- fb556f01-705e-4a50-8d8b-56ee36b587be 0cc16065-961a-495d-90d8-daeac8fddcca -->
# 非推奨の手動進捗システムを削除

## 概要

Phase 4の手動「次へ」ボタンによる段階的旅程構築システムを削除します。Phase 4.10で実装された自動しおり作成システム（`executeSequentialItineraryCreation`）により、手動でのフェーズ進行は不要になりました。約30ファイル以上、1000行以上のコードに影響する大規模削除作業です。

## Phase 1: 非推奨コンポーネント4ファイルを完全削除

削除対象：

1. **`components/itinerary/PhaseStatusBar.tsx`** (109行) - フェーズステータスバー、しおり作成の進捗を視覚的に表示
2. **`components/itinerary/PlanningProgress.tsx`** (175行) - 段階的旅程構築の進捗UI、フェーズラベルと進捗率表示
3. **`components/itinerary/QuickActions.tsx`** (403行) - 「次へ」ボタンとリセットボタン、段階的旅程構築のクイックアクション
4. **`lib/store/__tests__/phase-transitions.test.ts`** - 手動フェーズ遷移のテスト

## Phase 2: `lib/store/useStore.ts` からフェーズ状態を削除

### 削除する状態とアクション

- **134-138行**: `planningPhase: ItineraryPhase`, `setPlanningPhase`, `setCurrentDetailingDay`, `proceedToNextStep`, `resetPlanning` の型定義
- **452-455行**: 初期値 `planningPhase: "initial"`, `currentDetailingDay: null`, 初期化アクション
- **458-516行**: `proceedToNextStep` 関数全体を削除
  - 「初期状態 → 情報収集フェーズへ」
  - 「情報収集完了 → 骨組み作成フェーズへ」
  - 「骨組み完了 → 詳細化フェーズへ（1日目から開始）」
  - 「詳細化中 → 次の日へ、または完成へ」
  - 「全ての日が完了 → 完成フェーズへ」
- **519-526行**: `resetPlanning` 関数全体を削除 - 「プランニング状態をリセット」
- **544-570行**: `updateChecklist()` を簡素化 - `planningPhase` 依存を削除、基本的なバリデーションロジックは保持
- **616行**: `shouldTriggerAutoProgress()` 内の `if (state.planningPhase !== "collecting")` チェックを削除

### 保持するもの

- `isAutoProgressing`, `autoProgressState`, `autoProgressMode` - Phase 4.10自動進捗システム
- `requirementsChecklist`, `checklistStatus` - 要件チェックインフラ

## Phase 3: 型定義から `ItineraryPhase` を完全削除

### `types/itinerary.ts`

- **10-18行**: `ItineraryPhase` 型定義全体を削除
  ```typescript
  export type ItineraryPhase =
    | "initial"      // 初期状態（まだ何も決まっていない）
    | "collecting"   // 基本情報収集中（行き先、期間、興味など）
    | "skeleton"     // 骨組み作成中（各日のテーマ・エリアを決定）
    | "detailing"    // 日程の詳細化中（具体的な観光スポットと時間を決定）
    | "completed";   // 完成
  ```

- **136-138行**: `ItineraryData` から `phase?: ItineraryPhase` と `currentDay?: number` フィールドを削除

### `types/api.ts`

- **26行**: `ChatRequest` から `planningPhase?: ItineraryPhase` を削除
- **28行**: `currentDetailingDay?: number | null` を削除

## Phase 4: AI統合から `planningPhase` パラメータを削除

### `lib/ai/gemini.ts` (約250行)

- **50, 92, 129行**: `planningPhase?: ItineraryPhase` パラメータを削除
- **51, 93, 130行**: `currentDetailingDay?: number | null` パラメータを削除
- **62, 101, 133行**: フェーズパラメータの受け渡しを削除
- **155-186行**: フェーズ固有のプロンプトロジック全体を削除（switch文）
  - `planningPhase === 'skeleton'` 分岐
  - `planningPhase === 'detailing'` 分岐
  - 「骨組み作成フェーズでは、各日のテーマ・エリアを決定」
  - 「〇日目の詳細なスケジュールを作成」
- **223-224, 243-244行**: 公開関数から `planningPhase`, `currentDetailingDay` パラメータを削除

### `lib/ai/prompts.ts` (約600行)

- **498-530行**: `createNextStepPrompt()` 関数全体を削除
  - 「Phase 4.3: 次のステップ誘導用プロンプト」
  - 「現在のフェーズから次のフェーズへ進むよう促す」
  - 各フェーズごとの誘導メッセージ
- フェーズ固有のプロンプトテンプレートを検索して削除（"phase", "collecting", "skeleton", "detailing"）

### `app/api/chat/route.ts` (約600行)

- **4-5行**: 「Phase 4.5: フェーズ判定ロジックと「次へ」キーワード検出を追加」コメントを削除
- **127-128行**: `planningPhase = "initial"`, `currentDetailingDay` を分割代入から削除
- **159-167行**: 「次へ」キーワード検出ロジック全体を削除
  - `const isNextStepTrigger = detectNextStepKeyword(message);`
  - `const nextStepPrompt = createNextStepPrompt(...)`
- **209, 220行**: `planningPhase` パラメータ渡しを削除
- **246, 360行**: 関数シグネチャから `planningPhase` パラメータを削除
- **260, 381行**: `planningPhase` パラメータ渡しを削除
- **594-610行**: `detectNextStepKeyword()` 関数全体を削除
  - 「次へ」「次に」「進む」などのキーワード検出

## Phase 5: `lib/utils/api-client.ts` からフェーズ関連を削除

- **38-39行**: オプション型から `planningPhase?: ItineraryPhase`, `currentDetailingDay?: number | null` を削除
- **50-51行**: リクエストボディから `planningPhase`, `currentDetailingDay` を削除
- **81-82行**: ストリームオプション型から削除
- **94-95行**: ストリームリクエストボディから削除
- **194-195行**: 関数パラメータから `planningPhase`, `currentDetailingDay` を削除
- **204-205行**: 関数呼び出しから削除

## Phase 6: チャットコンポーネントからフェーズ参照を削除

### `components/chat/MessageInput.tsx` (約260行)

- **45-46行**: `useStore` から `planningPhase`, `currentDetailingDay` を削除
- **121-122行**: API呼び出しパラメータから `planningPhase`, `currentDetailingDay` を削除
- **169行**: 自動進捗トリガー条件から `planningPhase` 参照を削除

### `components/chat/MessageList.tsx` (約280行)

- **78-79行**: `useStore` から `planningPhase`, `currentDetailingDay` を削除
- **158-159行**: API呼び出しパラメータから `planningPhase`, `currentDetailingDay` を削除

## Phase 7: しおりコンポーネントから削除済みコンポーネント使用を削除

### `components/itinerary/ItineraryPreview.tsx` (約221行)

- **7-9行**: インポート削除 - `QuickActions`, `PhaseStatusBar`, `PlanningProgress`
- **28行**: `useStore` から `planningPhase` を削除
- **46-48行**: コメントアウトされた `PlanningProgress` ブロックを削除
- **56-59行**: コメントアウトされた `QuickActions` ブロックを削除
- **72-76行**: `PhaseStatusBar` 条件付きレンダリングブロック全体を削除
- **79-82行**: コメントアウトされた `PlanningProgress` ブロックを削除
- **212-216行**: コメントアウトされた `QuickActions` ブロックを削除

### `components/itinerary/MobilePlannerControls.tsx` (約128行)

- **5-8行**: インポート削除 - `PlanningProgress`, `PLANNING_PHASE_LABELS`, `calculatePlanningProgress`, `QuickActions`, `PhaseStatusBar`, 関連ユーティリティ
- **13行**: `useStore` から `planningPhase` を削除
- **22行**: `currentPhase` 計算を削除
- **65-66行**: フェーズラベルロジックを削除
- **71行**: `planningPhase` を使用した進捗計算を削除
- **101-112行**: `PhaseStatusBar` / `PlanningProgress` / `QuickActions` の条件付きレンダリングブロック全体を削除

## Phase 8: 要件システムを簡素化

### `lib/requirements/checklist-utils.ts` (約120行)

ファイルは保持するが、フェーズ固有のUI要素を削除：

- **50, 53行**: `recommendedAction` の計算ロジックを削除（戻り値型は保持、バリデーション用）
- **74-115行**: `determineButtonReadiness()` を簡素化
  - フェーズ固有のボタンラベル生成を削除（「次へ」「進む」「完成」など）
  - フェーズ固有のツールチップメッセージ生成を削除
  - 基本的なチェックリスト検証ロジックは保持

## Phase 9: ドキュメント更新

### `docs/RELEASE.md`

- **134-148行**: Version 0.4.0 セクションに注記追加
  ```markdown
  ### Version 0.4.0 (Phase 4 - 段階的旅程構築) ✅ 完了 → ⚠️ 手動進行機能は廃止
  **注**: 手動フェーズ進行（「次へ」ボタン）はv0.11.0で廃止。Phase 4.10の自動しおり作成システムに置き換え。
  ```


### `.cursor/rules/project_structure.mdc`

削除されたコンポーネント参照を削除：

- `PhaseStatusBar.tsx` - フェーズステータスバー（廃止）
- `PlanningProgress.tsx` - 段階的旅程構築の進捗UI（廃止）
- `QuickActions.tsx` - 「次へ」ボタン（廃止）

自動システムの説明を追加：

- `lib/execution/sequential-itinerary-builder.ts` - 自動しおり作成エンジン（順次実行版）

### `.cursor/rules/security_and_performance.mdc`

- 手動フェーズ管理の記述を削除
- 自動進捗システムの説明は保持

## Phase 10: 検証とテスト

### 1. 型チェック

各主要変更後に実行：

```bash
npm run type-check
```

### 2. ビルドチェック

インポート切れがないことを確認：

```bash
npm run build
```

### 3. Lint

コード品質確認と自動修正：

```bash
npm run lint -- --fix
```

### 4. 検索検証

残存参照を検索して確認：

- `planningPhase` - 自動進捗システムのみで使用されているべき
- `ItineraryPhase` - 完全に削除されているべき
- 「次へ」 - UIテキストのみ、ロジックには存在しないべき
- `proceedToNextStep` - 完全に削除されているべき
- `QuickActions` - `components/mypage/QuickActions.tsx` のみ残存（別コンポーネント）

## 保持するファイル（変更しない）

### ✅ Phase 4.10 自動進捗システム

- `lib/execution/sequential-itinerary-builder.ts` - 順次実行版しおり作成エンジン
  - `AutoProgressState` 型
  - `executeSequentialItineraryCreation()` 関数
- ストア内の自動進捗関連：
  - `isAutoProgressing`, `autoProgressState`, `autoProgressMode`
  - `enableAutoProgress()`, `disableAutoProgress()`
  - `setIsAutoProgressing()`, `setAutoProgressState()`
  - `shouldTriggerAutoProgress()`

### ✅ 要件バリデーションシステム

- `lib/requirements/checklist-config.ts` - チェックリスト設定
- `lib/requirements/extractors.ts` - 情報抽出ロジック
- `lib/requirements/checklist-utils.ts` - バリデーションロジック（簡素化するが保持）

### ✅ 無関係なQuickActions

- `components/mypage/QuickActions.tsx` - マイページ用クイックアクション（フェーズ進行とは無関係）

## まとめ

### 全体的な影響

- **完全削除**: 4ファイル（約700行以上）
- **変更**: 約25ファイル
- **削除コード**: 合計約1000行以上
- **要件システム**: 簡素化するが基本機能は保持

### 主な削除項目

- **手動フェーズ進行**: 「次へ」ボタン、`proceedToNextStep()`, `resetPlanning()`
- **ItineraryPhase型**: `"initial" | "collecting" | "skeleton" | "detailing" | "completed"`
- **フェーズ固有プロンプト**: `createNextStepPrompt()`, フェーズ別システムプロンプト
- **フェーズ遷移テスト**: phase-transitions.test.ts
- **進捗UI**: PhaseStatusBar, PlanningProgress, QuickActions

### 削除後の状態

Phase 4.10の自動しおり作成システム（`executeSequentialItineraryCreation`）のみが残り、ユーザーは「次へ」ボタンを押すことなく、自動で完全なしおりが生成されます。

### To-dos

- [ ] 非推奨コンポーネント4ファイルを完全削除（PhaseStatusBar.tsx, PlanningProgress.tsx, QuickActions.tsx, phase-transitions.test.ts）
- [ ] lib/store/useStore.tsからフェーズ状態削除：planningPhase, proceedToNextStep, resetPlanning, updateChecklistの簡素化
- [ ] types/itinerary.tsとtypes/api.tsからItineraryPhase型とフェーズフィールドを完全削除
- [ ] AI統合からplanningPhase削除：lib/ai/gemini.ts, prompts.ts（createNextStepPrompt削除）, app/api/chat/route.ts（detectNextStepKeyword削除）
- [ ] lib/utils/api-client.tsからplanningPhaseとcurrentDetailingDayパラメータを完全削除
- [ ] チャットコンポーネントからフェーズ参照削除：MessageInput.tsx, MessageList.tsx
- [ ] しおりコンポーネントから削除済みコンポーネント使用を削除：ItineraryPreview.tsx, MobilePlannerControls.tsx
- [ ] lib/requirements/checklist-utils.tsを簡素化：フェーズ固有のボタンラベル/ツールチップ削除、バリデーションロジックは保持
- [ ] ドキュメント更新：docs/RELEASE.md（廃止注記追加）、.cursor/rules/project_structure.mdc、security_and_performance.mdc
- [ ] 検証とテスト：type-check, build, lint実行、planningPhase/ItineraryPhase/proceedToNextStep/「次へ」の残存参照を検索確認