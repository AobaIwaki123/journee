# Phase 4: 段階的旅程構築システム - 使用ガイド

## 📖 概要

Phase 4では、ユーザーが一度に全てを決めるのではなく、**段階的に**旅程を構築できるシステムを実装しています。

このガイドでは、Phase 4.1および4.2で実装された機能の使用方法を説明します。

---

## 🎯 段階的構築フロー

### 全体の流れ

```
1️⃣ [Initial] 初期状態
   ↓
2️⃣ [Collecting] 基本情報収集
   - 行き先は？
   - 期間は？
   - 誰と行く？
   - 興味は？
   ↓
3️⃣ [Skeleton] 骨組み作成
   - 1日目: 浅草・スカイツリー周辺
   - 2日目: 渋谷・原宿エリア
   - 3日目: お台場・豊洲エリア
   ↓
4️⃣ [Detailing] 日程詳細化（1日ずつ）
   - 1日目の詳細化
     → 浅草寺 (10:00-11:00)
     → スカイツリー (12:00-14:00)
     → ...
   - 2日目の詳細化
     → 明治神宮 (09:00-10:30)
     → 原宿竹下通り (11:00-12:30)
     → ...
   - 3日目の詳細化
     → ...
   ↓
5️⃣ [Completed] 完成
```

---

## 🔧 実装済み機能（Phase 4.1 & 4.2）

### Phase 4.1: 型定義の拡張

#### 追加された型

**`DayStatus`** - 各日の進捗状態
```typescript
type DayStatus = "draft" | "skeleton" | "detailed" | "completed";
```

**`ItineraryPhase`** - しおり全体のフェーズ
```typescript
type ItineraryPhase = 
  | "initial"      // 初期状態
  | "collecting"   // 基本情報収集中
  | "skeleton"     // 骨組み作成中
  | "detailing"    // 日程詳細化中
  | "completed";   // 完成
```

#### 拡張されたインターフェース

**`DaySchedule`**
```typescript
interface DaySchedule {
  // ... 既存プロパティ ...
  status?: DayStatus;    // この日の進捗状態
  theme?: string;        // この日のテーマ
}
```

**`ItineraryData`**
```typescript
interface ItineraryData {
  // ... 既存プロパティ ...
  phase?: ItineraryPhase;   // 現在のフェーズ
  currentDay?: number;      // 現在詳細化中の日
}
```

---

### Phase 4.2: 状態管理の拡張

#### Zustandストアに追加された状態

```typescript
// 状態
planningPhase: ItineraryPhase;           // 現在のフェーズ
currentDetailingDay: number | null;      // 現在詳細化中の日

// 操作
setPlanningPhase(phase);                 // フェーズを設定
setCurrentDetailingDay(day);             // 詳細化中の日を設定
proceedToNextStep();                     // 次のステップへ進む
resetPlanning();                         // リセット
```

---

## 💻 コード例

### 1. フェーズの取得と表示

```typescript
import { useStore } from '@/lib/store/useStore';

export function PlanningStatus() {
  const { planningPhase, currentDetailingDay, currentItinerary } = useStore();

  const phaseLabels: Record<ItineraryPhase, string> = {
    initial: '準備中',
    collecting: '基本情報の収集',
    skeleton: '骨組みの作成',
    detailing: '日程の詳細化',
    completed: '完成',
  };

  return (
    <div className="planning-status">
      <h3>現在の状態: {phaseLabels[planningPhase]}</h3>
      
      {planningPhase === 'detailing' && currentDetailingDay && (
        <p>
          {currentDetailingDay} / {currentItinerary?.duration || 0} 日目を作成中
        </p>
      )}
    </div>
  );
}
```

---

### 2. 次へボタンの実装

```typescript
import { useStore } from '@/lib/store/useStore';

export function NextStepButton() {
  const { planningPhase, proceedToNextStep } = useStore();

  const buttonLabels: Record<ItineraryPhase, string> = {
    initial: '情報収集を開始',
    collecting: '骨組みを作成',
    skeleton: '詳細化を開始',
    detailing: '次の日へ',
    completed: '完成',
  };

  const isDisabled = planningPhase === 'completed';

  return (
    <button
      onClick={proceedToNextStep}
      disabled={isDisabled}
      className="next-step-button"
    >
      {buttonLabels[planningPhase]}
    </button>
  );
}
```

---

### 3. フェーズに応じたプロンプト選択（Phase 4.3で実装予定）

```typescript
import { useStore } from '@/lib/store/useStore';

export function ChatInput() {
  const { planningPhase, messages, currentItinerary } = useStore();

  const handleSend = async (message: string) => {
    let systemPrompt = '';

    switch (planningPhase) {
      case 'collecting':
        systemPrompt = '基本情報を収集してください';
        break;
      case 'skeleton':
        systemPrompt = '各日の骨組み（テーマ・エリア）を作成してください';
        break;
      case 'detailing':
        systemPrompt = `${currentItinerary?.currentDay}日目の詳細を作成してください`;
        break;
    }

    // AIにメッセージ送信
    await sendMessage(message, systemPrompt);
  };

  return (
    <input
      onSubmit={(e) => {
        e.preventDefault();
        handleSend(e.target.value);
      }}
    />
  );
}
```

---

### 4. 進捗インジケーター（Phase 4.4で実装予定）

```typescript
import { useStore } from '@/lib/store/useStore';

export function PlanningProgressBar() {
  const { planningPhase, currentItinerary, currentDetailingDay } = useStore();

  const getProgress = (): number => {
    switch (planningPhase) {
      case 'initial':
        return 0;
      case 'collecting':
        return 20;
      case 'skeleton':
        return 40;
      case 'detailing':
        if (!currentItinerary || !currentDetailingDay) return 60;
        const totalDays = currentItinerary.duration || 1;
        const progressPerDay = 40 / totalDays;
        return 40 + progressPerDay * currentDetailingDay;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{ width: `${getProgress()}%` }}
      />
      <span>{Math.round(getProgress())}%</span>
    </div>
  );
}
```

---

## 🧪 動作確認方法

### 1. ブラウザコンソールで手動テスト

開発者ツールを開き、以下を実行:

```javascript
// Zustandストアを取得
const store = useStore.getState();

// 初期状態を確認
console.log('Phase:', store.planningPhase);
console.log('Day:', store.currentDetailingDay);

// フェーズを進める
store.proceedToNextStep();
console.log('After 1st step:', store.planningPhase);
// 期待: "collecting"

store.proceedToNextStep();
console.log('After 2nd step:', store.planningPhase);
// 期待: "skeleton"

store.proceedToNextStep();
console.log('After 3rd step:', store.planningPhase, store.currentDetailingDay);
// 期待: "detailing", 1

// しおりがある場合、次の日へ
store.proceedToNextStep();
console.log('After 4th step:', store.planningPhase, store.currentDetailingDay);
// 期待: "detailing", 2

// リセット
store.resetPlanning();
console.log('After reset:', store.planningPhase);
// 期待: "initial"
```

---

### 2. Reactコンポーネント内でのテスト

```typescript
import { useStore } from '@/lib/store/useStore';

export function TestComponent() {
  const {
    planningPhase,
    currentDetailingDay,
    proceedToNextStep,
    resetPlanning,
  } = useStore();

  return (
    <div>
      <p>Phase: {planningPhase}</p>
      <p>Day: {currentDetailingDay || 'N/A'}</p>
      
      <button onClick={proceedToNextStep}>
        次へ
      </button>
      
      <button onClick={resetPlanning}>
        リセット
      </button>
    </div>
  );
}
```

---

## 🚀 今後の実装予定

### Phase 4.3: プロンプトシステムの改善
- フェーズに応じた適切なプロンプトを生成
- `createSkeletonPrompt`: 骨組み作成用
- `createDayDetailPrompt`: 日程詳細化用
- `createNextStepPrompt`: 次のステップ誘導用

### Phase 4.4: UIコンポーネントの追加
- `PlanningProgress`: 進捗インジケーター
- `QuickActions`: 「次へ」ボタン
- `ItineraryPreview`: プログレス表示統合

### Phase 4.5: APIの拡張
- チャットAPIにフェーズ判定ロジック
- 自動進行のトリガー実装

### Phase 4.6: しおりマージロジックの改善
- 骨組み段階のマージ処理
- 日程詳細化のマージ処理

### Phase 4.7: テスト・デバッグ
- 各フェーズの動作確認
- エッジケースのテスト

---

## 📌 重要なポイント

1. **段階的な進行**: ユーザーは自分のペースで旅程を構築できる
2. **明確な進捗**: どこまで進んだか一目でわかる
3. **柔軟性**: 途中で戻ったり、修正したりできる
4. **AI最適化**: フェーズに応じた適切なAI応答

---

## 🔗 関連ドキュメント

- [Phase 4.1 実装レポート](./PHASE4_1_TYPE_EXTENSIONS.md)
- [Phase 4.2 実装レポート](./PHASE4_2_STATE_MANAGEMENT.md)
- [Phase 4 計画書](../README.md#phase-4-段階的旅程構築システムweek-6-7--)

---

**最終更新**: 2025-10-07  
**実装状況**: Phase 4.1 & 4.2 完了 ✅