# Phase 4: 段階的旅程構築システム

## 📋 概要

従来の「一度のリクエストで完全な旅程を生成する」アプローチから、「複数回のリクエストで段階的に旅程を構築する」アプローチに変更します。これにより、AIの負荷を分散し、より精度の高い旅程を作成できます。

## 🎯 目的

1. **AI負荷の分散**: 一度に大量の情報を生成するのではなく、段階的に生成
2. **精度の向上**: 各段階で焦点を絞ることで、より詳細で正確な情報を提供
3. **UXの改善**: 進捗が可視化され、ユーザーが構築プロセスを理解しやすい
4. **柔軟性の向上**: 各段階でユーザーの修正・調整を受け付けられる

## 🏗 アーキテクチャ

### 構築フロー

```
【Phase 1: 基本情報収集】
ユーザー入力: "3月に2泊3日で京都旅行に行きたい"
        ↓
AIが確認: 行き先、期間、人数、興味などを確認
        ↓

【Phase 2: 骨組み作成】
AIが生成: 各日の大まかなテーマを決定
出力例:
  1日目: 京都到着・東山エリア散策
  2日目: 嵐山・竹林エリア
  3日目: 金閣寺エリア・帰路
        ↓
（ユーザーに確認を求める）
        ↓

【Phase 3: 1日目詳細化】
AIが生成: 1日目の具体的なスポット、時間、移動手段
出力例:
  10:00 清水寺（90分）
  12:00 昼食・おばんざい（60分）
  14:00 八坂神社（45分）
  ...
        ↓
（ユーザーに確認を求める）
        ↓

【Phase 4: 2日目詳細化】
（以下同様に各日を詳細化）
        ↓

【Phase 5: 最終調整】
全体のバランス調整、予算確認、最終確認
```

### データ構造の拡張

#### 1. 日程の状態管理

```typescript
// types/itinerary.ts に追加

export type DayStatus = 'draft' | 'skeleton' | 'detailed' | 'completed';

export interface DaySchedule {
  day: number;
  date?: string;
  title?: string;
  status: DayStatus;  // 新規追加
  theme?: string;     // 新規追加: その日のテーマ（骨組み段階で設定）
  spots: TouristSpot[];
  totalDistance?: number;
  totalCost?: number;
}

export type ItineraryPhase = 
  | 'initial'         // 初期状態（まだ何も作成されていない）
  | 'collecting'      // 基本情報収集中
  | 'skeleton'        // 骨組み作成中
  | 'detailing'       // 詳細化中
  | 'completed';      // 完成

export interface ItineraryData {
  id: string;
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  summary?: string;
  schedule: DaySchedule[];
  totalBudget?: number;
  status: 'draft' | 'completed' | 'archived';
  phase: ItineraryPhase;  // 新規追加
  currentDay?: number;     // 新規追加: 現在詳細化中の日
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2. 状態管理の拡張

```typescript
// lib/store/useStore.ts に追加

interface AppState {
  // ... 既存の状態 ...
  
  // Phase 4: 段階的構築の状態
  planningPhase: ItineraryPhase;
  currentDetailingDay: number | null;
  setPlanningPhase: (phase: ItineraryPhase) => void;
  setCurrentDetailingDay: (day: number | null) => void;
  
  // 次のステップを自動的に進める
  proceedToNextStep: () => void;
}
```

### プロンプト戦略

#### 1. システムプロンプトの改善

```typescript
// lib/ai/prompts.ts

export const INCREMENTAL_SYSTEM_PROMPT = `あなたは旅行計画のエキスパートAIアシスタントです。
ユーザーと対話しながら、段階的に最適な旅のしおりを作成します。

【段階的構築のプロセス】
旅程の作成は以下の段階で進めます：

1. **基本情報収集**: 
   - 行き先、期間、人数、興味、予算を確認
   - 不明な情報は質問して確認

2. **骨組み作成**:
   - 各日の大まかなテーマ（エリア・コンセプト）を決定
   - 日ごとの概要のみを提示（詳細なスポットはまだ含めない）
   - ユーザーに確認を求める

3. **日程の詳細化**（1日ずつ）:
   - 1日ごとに具体的な観光スポット、時間、移動手段を提案
   - 各スポットの詳細情報（所要時間、費用、説明）を追加
   - ユーザーに確認を求めてから次の日に進む

4. **最終調整**:
   - 全体のバランス確認
   - 予算の最終調整
   - ユーザーの要望反映

【重要な指示】
- 現在どの段階にいるかを常に意識する
- 骨組み段階では詳細なスポット情報を出力しない
- 詳細化段階では1日ずつ集中して作成する
- 各段階の終わりにユーザーの確認を求める
- ユーザーが修正を求めたら、その段階に戻って調整する

【現在の段階】: {{CURRENT_PHASE}}
【現在作成中の日】: {{CURRENT_DAY}}
`;
```

#### 2. 段階別プロンプト

```typescript
// lib/ai/prompts.ts

/**
 * 骨組み作成プロンプト
 */
export function createSkeletonPrompt(
  destination: string,
  duration: number,
  interests?: string[]
): string {
  return `以下の情報をもとに、旅行の骨組み（各日のテーマ）を作成してください：

- 行き先: ${destination}
- 期間: ${duration}日間
${interests ? `- 興味: ${interests.join(', ')}` : ''}

【出力形式】
各日の大まかなテーマ（エリア・コンセプト）のみを以下の形式で出力してください：

\`\`\`json
{
  "title": "旅行のタイトル",
  "destination": "${destination}",
  "duration": ${duration},
  "summary": "旅行全体の概要",
  "schedule": [
    {
      "day": 1,
      "title": "1日目のタイトル",
      "theme": "1日目のテーマ（エリアやコンセプト）",
      "status": "skeleton",
      "spots": []
    }
  ],
  "phase": "skeleton",
  "status": "draft"
}
\`\`\`

**重要**: この段階では具体的な観光スポットは含めず、各日のテーマのみを提案してください。
詳細な観光スポットは次の段階で1日ずつ作成します。

このプランでよろしければ、1日目から順番に詳細な観光スポットを追加していきます。
変更したい点があれば教えてください。`;
}

/**
 * 日程詳細化プロンプト
 */
export function createDayDetailPrompt(
  itinerary: ItineraryData,
  dayNumber: number
): string {
  const day = itinerary.schedule.find(d => d.day === dayNumber);
  
  return `現在作成中の旅行の${dayNumber}日目の詳細を作成してください：

【旅行情報】
- 行き先: ${itinerary.destination}
- 期間: ${itinerary.duration}日間
- ${dayNumber}日目のテーマ: ${day?.theme || '未定'}

【他の日程の概要】
${itinerary.schedule
  .filter(d => d.day !== dayNumber)
  .map(d => `${d.day}日目: ${d.theme || d.title}`)
  .join('\n')}

【出力形式】
${dayNumber}日目の具体的な観光スポット、時間配分、移動手段を以下の形式で出力してください：

\`\`\`json
{
  "schedule": [
    {
      "day": ${dayNumber},
      "title": "${dayNumber}日目のタイトル",
      "theme": "${day?.theme}",
      "status": "detailed",
      "spots": [
        {
          "id": "spot-${dayNumber}-1",
          "name": "観光スポット名",
          "description": "詳細な説明（3-5文）",
          "scheduledTime": "10:00",
          "duration": 90,
          "category": "sightseeing",
          "estimatedCost": 500,
          "notes": "アクセス方法やおすすめポイント"
        }
      ],
      "totalCost": 5000
    }
  ],
  "phase": "detailing",
  "currentDay": ${dayNumber}
}
\`\`\`

**重要事項**:
- 移動時間を考慮した現実的なスケジュールにしてください
- 食事の時間を適切に確保してください
- 各スポットの説明は具体的に（見どころ、特徴など）
- アクセス方法や注意事項をnotesに記載してください

この日程でよろしければ、次の日に進みます。
変更したい点があれば教えてください。`;
}

/**
 * 次のステップへの誘導プロンプト
 */
export function createNextStepPrompt(
  currentPhase: ItineraryPhase,
  itinerary?: ItineraryData
): string {
  switch (currentPhase) {
    case 'skeleton':
      return '\n\nこの骨組みでよろしければ、1日目の詳細な観光スポットを作成します。\n「1日目の詳細を教えて」または「次へ」と入力してください。';
    
    case 'detailing':
      const currentDay = itinerary?.currentDay || 1;
      const totalDays = itinerary?.duration || 1;
      
      if (currentDay < totalDays) {
        return `\n\nこの日程でよろしければ、${currentDay + 1}日目の詳細を作成します。\n「${currentDay + 1}日目の詳細を教えて」または「次へ」と入力してください。`;
      } else {
        return '\n\n全ての日程が完成しました！\n最終確認をして、必要に応じて調整します。変更したい点があれば教えてください。';
      }
    
    default:
      return '';
  }
}
```

### UIの改善

#### 1. 進捗インジケーター

```typescript
// components/itinerary/PlanningProgress.tsx

interface PlanningProgressProps {
  phase: ItineraryPhase;
  totalDays: number;
  currentDay: number | null;
  schedule: DaySchedule[];
}

export const PlanningProgress: React.FC<PlanningProgressProps> = ({
  phase,
  totalDays,
  currentDay,
  schedule,
}) => {
  const getPhaseLabel = (phase: ItineraryPhase): string => {
    switch (phase) {
      case 'initial': return '準備中';
      case 'collecting': return '情報収集中';
      case 'skeleton': return '骨組み作成中';
      case 'detailing': return '詳細化中';
      case 'completed': return '完成';
    }
  };

  const getDayStatus = (day: number): 'pending' | 'in-progress' | 'completed' => {
    const daySchedule = schedule.find(s => s.day === day);
    if (!daySchedule || daySchedule.status === 'draft') return 'pending';
    if (daySchedule.status === 'skeleton') return 'in-progress';
    if (daySchedule.status === 'detailed' || daySchedule.status === 'completed') return 'completed';
    return 'pending';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">作成進捗</h3>
        <span className="text-sm font-medium text-blue-600">
          {getPhaseLabel(phase)}
        </span>
      </div>

      {phase === 'detailing' && (
        <div className="space-y-2">
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
            const status = getDayStatus(day);
            return (
              <div key={day} className="flex items-center space-x-3">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${status === 'completed' ? 'bg-green-500 text-white' :
                    status === 'in-progress' ? 'bg-blue-500 text-white' :
                    'bg-gray-200 text-gray-600'}
                `}>
                  {status === 'completed' ? '✓' : day}
                </div>
                <div className="flex-1">
                  <div className={`h-2 rounded-full ${
                    status === 'completed' ? 'bg-green-500' :
                    status === 'in-progress' ? 'bg-blue-500 animate-pulse' :
                    'bg-gray-200'
                  }`} />
                </div>
                <span className="text-sm text-gray-600">
                  {status === 'completed' ? '完了' :
                   status === 'in-progress' ? '作成中' :
                   '未作成'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {phase === 'skeleton' && (
        <div className="text-sm text-gray-600">
          旅行の骨組みを作成しています...
        </div>
      )}

      {phase === 'completed' && (
        <div className="flex items-center space-x-2 text-green-600">
          <span className="text-2xl">✓</span>
          <span className="font-medium">旅程が完成しました！</span>
        </div>
      )}
    </div>
  );
};
```

#### 2. クイックアクションボタン

```typescript
// components/itinerary/QuickActions.tsx

interface QuickActionsProps {
  phase: ItineraryPhase;
  currentDay: number | null;
  totalDays: number;
  onProceedNext: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  phase,
  currentDay,
  totalDays,
  onProceedNext,
}) => {
  const getActionLabel = (): string => {
    if (phase === 'skeleton') return '1日目を詳細化';
    if (phase === 'detailing' && currentDay && currentDay < totalDays) {
      return `${currentDay + 1}日目を詳細化`;
    }
    if (phase === 'detailing' && currentDay === totalDays) {
      return '最終確認へ';
    }
    return '次へ';
  };

  const shouldShowAction = phase === 'skeleton' || 
    (phase === 'detailing' && currentDay && currentDay <= totalDays);

  if (!shouldShowAction) return null;

  return (
    <div className="mt-4">
      <button
        onClick={onProceedNext}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium 
                   hover:bg-blue-700 transition-colors duration-200
                   flex items-center justify-center space-x-2"
      >
        <span>{getActionLabel()}</span>
        <span>→</span>
      </button>
    </div>
  );
};
```

### API の変更

#### チャットAPIの拡張

```typescript
// app/api/chat/route.ts

export async function POST(req: Request) {
  try {
    const { message, history, currentItinerary } = await req.json();
    
    // 現在のフェーズを判定
    const phase = currentItinerary?.phase || 'initial';
    const currentDay = currentItinerary?.currentDay || null;
    
    // フェーズに応じたシステムプロンプトを選択
    let systemPrompt = INCREMENTAL_SYSTEM_PROMPT
      .replace('{{CURRENT_PHASE}}', phase)
      .replace('{{CURRENT_DAY}}', currentDay ? `${currentDay}日目` : 'なし');
    
    // フェーズに応じた追加プロンプト
    if (phase === 'skeleton' && message.toLowerCase().includes('次')) {
      // 骨組みが承認されたら、1日目の詳細化に進む
      systemPrompt += '\n' + createDayDetailPrompt(currentItinerary, 1);
    } else if (phase === 'detailing' && message.toLowerCase().includes('次')) {
      // 現在の日が承認されたら、次の日の詳細化に進む
      const nextDay = (currentDay || 0) + 1;
      if (nextDay <= currentItinerary.duration) {
        systemPrompt += '\n' + createDayDetailPrompt(currentItinerary, nextDay);
      }
    }
    
    // ... 残りの実装は既存のコードと同様 ...
  } catch (error) {
    // ... エラーハンドリング ...
  }
}
```

## 📝 実装タスク

### 4.1 型定義の拡張
- [ ] `DayStatus` 型の追加
- [ ] `ItineraryPhase` 型の追加
- [ ] `DaySchedule` に `status`, `theme` プロパティ追加
- [ ] `ItineraryData` に `phase`, `currentDay` プロパティ追加

### 4.2 状態管理の拡張
- [ ] `useStore.ts` に新しい状態を追加
- [ ] `planningPhase`, `currentDetailingDay` の状態管理
- [ ] `proceedToNextStep` 関数の実装

### 4.3 プロンプトシステムの改善
- [ ] `INCREMENTAL_SYSTEM_PROMPT` の作成
- [ ] `createSkeletonPrompt` 関数の実装
- [ ] `createDayDetailPrompt` 関数の実装
- [ ] `createNextStepPrompt` 関数の実装

### 4.4 UIコンポーネントの追加
- [ ] `PlanningProgress` コンポーネントの実装
- [ ] `QuickActions` コンポーネントの実装
- [ ] `ItineraryPreview` にプログレス表示を統合

### 4.5 APIの拡張
- [ ] チャットAPIにフェーズ判定ロジックを追加
- [ ] 自動進行のトリガー実装（「次へ」の検出）
- [ ] レスポンスパース処理の改善

### 4.6 しおりマージロジックの改善
- [ ] 骨組み段階のマージ処理
- [ ] 日程詳細化のマージ処理（既存の日を保持）
- [ ] フェーズ遷移の自動検出

### 4.7 テスト・デバッグ
- [ ] 骨組み作成のテスト
- [ ] 日程詳細化のテスト（複数日）
- [ ] ユーザー介入（修正要求）のテスト
- [ ] エラーハンドリングのテスト

## 🎨 期待されるUX

### 初回利用時

```
ユーザー: "3月に2泊3日で京都旅行に行きたい"

AI: "素敵ですね！京都への2泊3日の旅行ですね。
     少し詳しく教えてください：
     - 何名で行かれますか？
     - 興味のあることは？（寺社、グルメ、自然など）"

ユーザー: "2人で、寺社とグルメに興味があります"

AI: "承知しました！それでは、京都2泊3日の旅程の骨組みを作成します。

     【旅程の骨組み】
     1日目: 京都到着・東山エリア散策
       清水寺周辺の寺社巡りと京料理を楽しむ日
     
     2日目: 嵐山・竹林エリア
       自然豊かな嵐山でリラックス、精進料理体験
     
     3日目: 金閣寺エリア・帰路
       京都観光のハイライトと最後のグルメ

     このプランでよろしければ、1日目の詳細な観光スポットを作成します。
     「次へ」と入力するか、修正したい点があれば教えてください。"

ユーザー: "次へ"

AI: "1日目の詳細な観光スポットを作成します！

     【1日目: 京都到着・東山エリア散策】
     
     10:00 清水寺（90分）
       - 世界遺産の名刹、清水の舞台からの絶景
       - 拝観料: 400円/人
       
     12:00 昼食: おばんざいランチ（60分）
       - 清水寺近くの京料理レストラン
       - 予算: 2,000円/人
       
     ...（以下続く）

     この日程でよろしければ、2日目の詳細を作成します。"
```

## 🚀 実装順序

1. **Week 1**: 型定義・状態管理の拡張（4.1, 4.2）
2. **Week 1-2**: プロンプトシステムの改善（4.3）
3. **Week 2**: UIコンポーネントの実装（4.4）
4. **Week 2**: API統合・マージロジック（4.5, 4.6）
5. **Week 2**: テスト・デバッグ（4.7）

## 📈 成功指標

- [ ] 骨組み作成から完成まで、ユーザーが迷わず進められる
- [ ] 各段階でユーザーが修正を加えられる
- [ ] AIの生成精度が向上する（段階的に焦点を絞るため）
- [ ] 大規模な旅程（5日以上）でも安定して動作する

---

**更新日**: 2025-10-07  
**ステータス**: 設計完了・実装待ち

