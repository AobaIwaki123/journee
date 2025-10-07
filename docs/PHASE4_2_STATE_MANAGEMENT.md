# Phase 4.2: 状態管理の拡張 - 実装完了レポート

## 📋 実装概要

Phase 4「段階的旅程構築システム」の第二段階として、Zustand状態管理の拡張を実装しました。

**実施日**: 2025-10-07  
**対象フェーズ**: Phase 4.2  
**主な変更ファイル**: `lib/store/useStore.ts`

---

## ✅ 実装内容

### 1. 新しい状態の追加

#### 1.1 プランニングフェーズ状態

```typescript
// Phase 4: Planning phase state
planningPhase: ItineraryPhase;
currentDetailingDay: number | null;
setPlanningPhase: (phase: ItineraryPhase) => void;
setCurrentDetailingDay: (day: number | null) => void;
proceedToNextStep: () => void;
resetPlanning: () => void;
```

**追加された状態**:
- `planningPhase`: 現在のプランニングフェーズ（初期値: `'initial'`）
- `currentDetailingDay`: 現在詳細化中の日（初期値: `null`）

**追加された操作**:
- `setPlanningPhase(phase)`: フェーズを手動で設定
- `setCurrentDetailingDay(day)`: 詳細化中の日を手動で設定
- `proceedToNextStep()`: 次のステップへ自動的に進む（重要）
- `resetPlanning()`: プランニング状態をリセット

---

### 2. `proceedToNextStep()` 関数の詳細

この関数は、段階的旅程構築の核となるロジックです。

#### 2.1 フェーズ遷移ロジック

```typescript
proceedToNextStep: () =>
  set((state) => {
    const { planningPhase, currentItinerary, currentDetailingDay } = state;
    let newPhase: ItineraryPhase = planningPhase;
    let newDetailingDay: number | null = currentDetailingDay;
    let updates: Partial<ItineraryData> = {};

    switch (planningPhase) {
      case 'initial':
        // 初期状態 → 情報収集フェーズへ
        newPhase = 'collecting';
        break;

      case 'collecting':
        // 情報収集完了 → 骨組み作成フェーズへ
        newPhase = 'skeleton';
        break;

      case 'skeleton':
        // 骨組み完了 → 詳細化フェーズへ（1日目から開始）
        newPhase = 'detailing';
        newDetailingDay = 1;
        updates.phase = 'detailing';
        updates.currentDay = 1;
        break;

      case 'detailing':
        // 詳細化中 → 次の日へ、または完成へ
        if (currentItinerary && currentDetailingDay !== null) {
          const totalDays = currentItinerary.duration || currentItinerary.schedule.length;
          if (currentDetailingDay < totalDays) {
            // 次の日へ
            newDetailingDay = currentDetailingDay + 1;
            updates.currentDay = newDetailingDay;
          } else {
            // 全ての日が完了 → 完成フェーズへ
            newPhase = 'completed';
            newDetailingDay = null;
            updates.phase = 'completed';
            updates.currentDay = undefined;
            updates.status = 'completed';
          }
        }
        break;

      case 'completed':
        // 完成済み → 何もしない
        break;
    }

    return {
      planningPhase: newPhase,
      currentDetailingDay: newDetailingDay,
      currentItinerary: state.currentItinerary
        ? { ...state.currentItinerary, ...updates }
        : null,
    };
  }),
```

#### 2.2 フェーズ遷移図

```
[initial]
   ↓ proceedToNextStep()
[collecting] ← 基本情報収集（行き先、期間、興味など）
   ↓ proceedToNextStep()
[skeleton] ← 骨組み作成（各日のテーマ・エリア決定）
   ↓ proceedToNextStep()
[detailing: day 1] ← 1日目の詳細化
   ↓ proceedToNextStep()
[detailing: day 2] ← 2日目の詳細化
   ↓ proceedToNextStep()
[detailing: day 3] ← 3日目の詳細化
   ↓ proceedToNextStep()
[completed] ← 完成
```

---

### 3. `resetPlanning()` 関数

新しいしおりを作成する際にプランニング状態をリセットします。

```typescript
resetPlanning: () =>
  set({
    planningPhase: 'initial',
    currentDetailingDay: null,
  }),
```

**使用シーン**:
- 新しいしおりを作成するとき
- しおりを最初からやり直すとき
- ホームページに戻るとき

---

## 🎯 使用例

### 3.1 基本的な使用方法

```typescript
import { useStore } from '@/lib/store/useStore';

function MyComponent() {
  const { planningPhase, currentDetailingDay, proceedToNextStep } = useStore();

  return (
    <div>
      <p>現在のフェーズ: {planningPhase}</p>
      {currentDetailingDay && (
        <p>詳細化中の日: {currentDetailingDay}日目</p>
      )}
      <button onClick={proceedToNextStep}>
        次へ
      </button>
    </div>
  );
}
```

### 3.2 フェーズごとの条件分岐

```typescript
function ChatInput() {
  const { planningPhase, proceedToNextStep } = useStore();

  const handleSend = async (message: string) => {
    // フェーズに応じた処理
    switch (planningPhase) {
      case 'collecting':
        // 基本情報を収集するプロンプトを使用
        break;
      case 'skeleton':
        // 骨組み作成プロンプトを使用
        break;
      case 'detailing':
        // 詳細化プロンプトを使用
        break;
    }

    // メッセージ送信後、適切なタイミングで次へ
    if (shouldProceedToNext) {
      proceedToNextStep();
    }
  };
}
```

### 3.3 進捗表示コンポーネント（Phase 4.4で実装予定）

```typescript
function PlanningProgress() {
  const { planningPhase, currentDetailingDay, currentItinerary } = useStore();

  const phaseLabels = {
    initial: '準備中',
    collecting: '基本情報収集',
    skeleton: '骨組み作成',
    detailing: '日程詳細化',
    completed: '完成',
  };

  return (
    <div className="planning-progress">
      <h3>{phaseLabels[planningPhase]}</h3>
      {planningPhase === 'detailing' && currentDetailingDay && (
        <p>
          {currentDetailingDay} / {currentItinerary?.duration || 0} 日目
        </p>
      )}
    </div>
  );
}
```

---

## 🧪 テスト

### テストシナリオ

テストシナリオは `lib/store/__tests__/phase-transitions.test.ts` に定義されています。

#### シナリオ1: 初期状態から情報収集へ
- **初期フェーズ**: `initial`
- **実行**: `proceedToNextStep()`
- **期待結果**: `collecting`

#### シナリオ2: 情報収集から骨組み作成へ
- **初期フェーズ**: `collecting`
- **実行**: `proceedToNextStep()`
- **期待結果**: `skeleton`

#### シナリオ3: 骨組み作成から詳細化へ
- **初期フェーズ**: `skeleton`
- **実行**: `proceedToNextStep()`
- **期待結果**: `detailing`, `currentDetailingDay = 1`

#### シナリオ4: 詳細化中の日の進行
- **初期フェーズ**: `detailing`, `currentDetailingDay = 1`
- **旅程日数**: 3日
- **実行**: `proceedToNextStep()`
- **期待結果**: `detailing`, `currentDetailingDay = 2`

#### シナリオ5: 最終日完了後の完成フェーズへの遷移
- **初期フェーズ**: `detailing`, `currentDetailingDay = 3`
- **旅程日数**: 3日
- **実行**: `proceedToNextStep()`
- **期待結果**: `completed`, `currentDetailingDay = null`

#### シナリオ6: 完成フェーズでの変化なし
- **初期フェーズ**: `completed`
- **実行**: `proceedToNextStep()`
- **期待結果**: `completed`（変化なし）

### 手動テスト方法

ブラウザの開発者ツールで以下を実行:

```javascript
// Zustandストアにアクセス（devtoolsが有効な場合）
const store = useStore.getState();

// 初期状態を確認
console.log('Initial phase:', store.planningPhase);
// 出力: "initial"

// フェーズを進める
store.proceedToNextStep();
console.log('After 1st step:', store.planningPhase);
// 出力: "collecting"

// さらに進める
store.proceedToNextStep();
console.log('After 2nd step:', store.planningPhase);
// 出力: "skeleton"

// リセット
store.resetPlanning();
console.log('After reset:', store.planningPhase);
// 出力: "initial"
```

---

## 🎯 期待される効果

### 1. ユーザー体験の向上
- ユーザーは**段階的に**旅程を構築できる
- 「次へ」ボタンで**直感的に**進められる
- 現在の進捗が**明確に**わかる

### 2. AI統合の最適化
- フェーズに応じた**適切なプロンプト**を選択できる
- ユーザーの進捗に合わせた**パーソナライズされた提案**

### 3. 開発者体験の向上
- フェーズ管理が**一元化**され、コードが整理される
- 状態遷移ロジックが**明確**で、バグが減る

---

## 🔄 次のステップ（Phase 4.3以降）

### Phase 4.3: プロンプトシステムの改善
- [ ] `INCREMENTAL_SYSTEM_PROMPT` の作成（段階的構築用システムプロンプト）
- [ ] `createSkeletonPrompt` 関数（骨組み作成用プロンプト）
- [ ] `createDayDetailPrompt` 関数（日程詳細化用プロンプト）
- [ ] `createNextStepPrompt` 関数（次のステップ誘導プロンプト）

### Phase 4.4: UIコンポーネントの追加
- [ ] `PlanningProgress` コンポーネント（進捗インジケーター）
- [ ] `QuickActions` コンポーネント（「次へ」ボタン）
- [ ] `ItineraryPreview` にプログレス表示を統合

### Phase 4.5: APIの拡張
- [ ] チャットAPIにフェーズ判定ロジックを追加
- [ ] 自動進行のトリガー実装（「次へ」の検出）

---

## 📁 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `lib/store/useStore.ts` | ✅ プランニングフェーズ状態を追加<br>✅ `proceedToNextStep`, `resetPlanning` 関数を実装 |
| `lib/store/__tests__/phase-transitions.test.ts` | ✅ テストシナリオと手動テスト手順を定義 |
| `docs/PHASE4_2_STATE_MANAGEMENT.md` | ✅ 実装レポート作成 |

---

## 📌 重要なポイント

1. **イミュータブル**: すべての状態更新は不変性を保つ
2. **型安全**: TypeScriptの型チェックで安全性を確保
3. **段階的実装**: Phase 4.3以降で実際のプロンプト・UI実装を行う
4. **テスト容易性**: ロジックが明確で、テストしやすい設計

---

**Phase 4.2 完了**: ✅  
**次のフェーズ**: Phase 4.3（プロンプトシステムの改善）