# Phase 4.5: APIの拡張 - 実装完了レポート

## 📋 実装概要

Phase 4「段階的旅程構築システム」の第五段階として、チャットAPIにフェーズ判定ロジックと「次へ」キーワード検出を追加し、Phase 4で作成したプロンプト関数を統合しました。また、BUG-001（JSON削除バグ）も修正しました。

**実施日**: 2025-10-07  
**対象フェーズ**: Phase 4.5 & BUG-001  
**主な変更ファイル**: `app/api/chat/route.ts`, `lib/ai/gemini.ts`, `lib/ai/prompts.ts`

---

## ✅ 実装内容

### 1. API型定義の拡張

#### 1.1 ChatAPIRequest に Phase 4 フィールドを追加

**ファイル**: `types/api.ts`

```typescript
export interface ChatAPIRequest {
  message: string;
  chatHistory?: ChatMessage[];
  currentItinerary?: ItineraryData;
  model?: AIModel;
  claudeApiKey?: string;
  stream?: boolean;
  // Phase 4.5: 新規追加
  planningPhase?: ItineraryPhase;
  currentDetailingDay?: number | null;
}
```

---

### 2. BUG-001修正: parseAIResponse 関数の改善

#### 2.1 問題

AIからのレスポンスに生のJSONブロック（```json ... ```）が表示されていた。

#### 2.2 修正内容

**ファイル**: `lib/ai/prompts.ts`

```typescript
export function parseAIResponse(response: string): {
  message: string;
  itineraryData: Partial<ItineraryData> | null;
} {
  const match = response.match(JSON_EXTRACTION_REGEX);
  
  if (!match) {
    return {
      message: response.trim(),
      itineraryData: null,
    };
  }

  // JSONデータをパース
  let itineraryData: Partial<ItineraryData> | null = null;
  try {
    const jsonString = match[1];
    itineraryData = JSON.parse(jsonString) as Partial<ItineraryData>;
  } catch (error) {
    console.error('Failed to parse itinerary JSON:', error);
  }

  // ✅ JSONブロック全体を削除してクリーンなメッセージを抽出
  let cleanMessage = response.replace(/```json[\s\S]*?```/g, '').trim();
  
  // 余分な空白行を削除（3行以上の連続した改行を2行に）
  cleanMessage = cleanMessage.replace(/\n{3,}/g, '\n\n');
  
  // 前後の空白を削除
  cleanMessage = cleanMessage.trim();
  
  // メッセージが空の場合はデフォルトメッセージ
  if (!cleanMessage) {
    cleanMessage = itineraryData 
      ? 'しおりを更新しました。' 
      : 'メッセージを受け取りました。';
  }
  
  return {
    message: cleanMessage,
    itineraryData,
  };
}
```

**修正ポイント**:
- JSONブロック全体を正規表現で削除: `/```json[\s\S]*?```/g`
- 余分な空白行を削除
- メッセージが空の場合のデフォルトメッセージを設定

---

### 3. Gemini クライアントの拡張

#### 3.1 プロンプト構築メソッドの更新

**ファイル**: `lib/ai/gemini.ts`

フェーズに応じた適切なプロンプトを生成するように更新：

```typescript
private buildPrompt(
  userMessage: string,
  chatHistory: ChatMessage[],
  currentItinerary?: ItineraryData,
  planningPhase: ItineraryPhase = 'initial',
  currentDetailingDay?: number | null
): string {
  // 1. フェーズに応じたシステムプロンプトを選択
  let prompt = getSystemPromptForPhase(planningPhase) + "\n\n";

  // 2. チャット履歴を追加
  if (chatHistory.length > 0) {
    const historyText = formatChatHistory(/* ... */);
    prompt += `## 会話履歴\n${historyText}\n\n`;
  }

  // 3. 現在のしおりデータを追加
  if (currentItinerary) {
    const itineraryContext = createUpdatePrompt(currentItinerary);
    prompt += `## ${itineraryContext}\n\n`;
  }

  // 4. フェーズ別の追加プロンプト
  let phaseSpecificPrompt = '';
  
  switch (planningPhase) {
    case 'skeleton':
      if (currentItinerary) {
        phaseSpecificPrompt = createSkeletonPrompt(currentItinerary);
      }
      break;
      
    case 'detailing':
      if (currentItinerary && currentDetailingDay) {
        phaseSpecificPrompt = createDayDetailPrompt(currentItinerary, currentDetailingDay);
      }
      break;
  }
  
  if (phaseSpecificPrompt) {
    prompt += `## ${phaseSpecificPrompt}\n\n`;
  }

  // 5. ユーザーのメッセージを追加
  prompt += `## ユーザーの新しいメッセージ\n${userMessage}\n\n`;
  
  // 6. フェーズに応じた応答指示
  if (planningPhase === 'skeleton') {
    prompt += `骨組み作成フェーズでは、各日のテーマ・エリアを決定し、JSON形式で出力してください。具体的な観光スポット名はまだ出さないでください。`;
  } else if (planningPhase === 'detailing') {
    prompt += `${currentDetailingDay}日目の詳細なスケジュールを作成し、実在する観光スポット、時間、費用を含めてJSON形式で出力してください。`;
  } else {
    prompt += `親切に応答してください。必要に応じて旅のしおりデータをJSON形式で出力してください。`;
  }

  return prompt;
}
```

**ポイント**:
- Phase 4.3 で作成したプロンプト関数を使用
- フェーズごとに適切なシステムプロンプトとタスク指示を生成
- 骨組みフェーズでは具体的なスポット名を出さないよう指示

---

### 4. チャットAPIの拡張

#### 4.1 「次へ」キーワードの検出

**ファイル**: `app/api/chat/route.ts`

```typescript
function detectNextStepKeyword(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  const nextKeywords = [
    '次へ', '次に', '次', 'つぎ',
    '進む', '進んで',
    '次のステップ', '次の段階',
    'next',
  ];
  
  return nextKeywords.some(keyword => lowerMessage.includes(keyword));
}
```

**検出されたキーワード**:
- 日本語: 次へ、次に、次、つぎ、進む、進んで、次のステップ、次の段階
- 英語: next

#### 4.2 フェーズ情報の処理

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatAPIRequest;
    const {
      message,
      chatHistory = [],
      currentItinerary,
      model = 'gemini',
      claudeApiKey,
      stream = false,
      planningPhase = 'initial',  // ← Phase 4.5
      currentDetailingDay,         // ← Phase 4.5
    } = body;

    // 「次へ」キーワードの検出
    const isNextStepTrigger = detectNextStepKeyword(message);
    let enhancedMessage = message;
    
    if (isNextStepTrigger) {
      // 次のステップ誘導プロンプトを追加
      const nextStepPrompt = createNextStepPrompt(planningPhase, currentItinerary);
      if (nextStepPrompt) {
        enhancedMessage = `${message}\n\n【システムからの補足】\n${nextStepPrompt}`;
      }
    }

    // ストリーミングレスポンスの場合
    if (stream) {
      return handleStreamingResponse(
        enhancedMessage,
        chatHistory,
        currentItinerary,
        planningPhase,        // ← Phase 4.5
        currentDetailingDay   // ← Phase 4.5
      );
    }
    
    // ...
  }
}
```

**ポイント**:
- 「次へ」が検出された場合、次のステップ誘導プロンプトを自動追加
- フェーズ情報をGemini APIに渡して適切なプロンプトを生成

---

### 5. APIクライアントの更新

#### 5.1 sendChatMessageStream の拡張

**ファイル**: `lib/utils/api-client.ts`

```typescript
export async function* sendChatMessageStream(
  message: string,
  chatHistory?: ChatMessage[],
  currentItinerary?: ItineraryData,
  planningPhase?: ItineraryPhase,        // ← Phase 4.5
  currentDetailingDay?: number | null    // ← Phase 4.5
): AsyncGenerator<ChatStreamChunk, void, unknown> {
  yield* chatApiClient.sendMessageStream(message, {
    chatHistory,
    currentItinerary,
    planningPhase,
    currentDetailingDay,
  });
}
```

---

### 6. フロントエンドの更新

#### 6.1 MessageInput の拡張

**ファイル**: `components/chat/MessageInput.tsx`

```typescript
export const MessageInput: React.FC = () => {
  // Phase 4.5: プランニングフェーズ状態を取得
  const planningPhase = useStore((state) => state.planningPhase);
  const currentDetailingDay = useStore((state) => state.currentDetailingDay);

  const handleSubmit = async (e: React.FormEvent) => {
    // ...
    
    // Phase 4.5: フェーズ情報を含めてストリーミングレスポンスを処理
    for await (const chunk of sendChatMessageStream(
      userMessage.content,
      chatHistory,
      currentItinerary || undefined,
      planningPhase,              // ← Phase 4.5
      currentDetailingDay         // ← Phase 4.5
    )) {
      // ...
    }
  };
}
```

---

## 🎯 実装された機能フロー

### 1. ユーザーが「次へ」と入力した場合

```
[ユーザー] "次へ"
    ↓
[MessageInput] フェーズ情報を含めてAPI送信
    ↓
[Chat API] 「次へ」キーワードを検出
    ↓
[Chat API] createNextStepPrompt() で誘導プロンプトを追加
    ↓
[Gemini Client] フェーズに応じたシステムプロンプトを選択
    ↓
[Gemini API] AIが次のステップに進むよう応答
    ↓
[parseAIResponse] JSONブロックを削除してクリーンなメッセージ抽出
    ↓
[フロントエンド] クリーンなメッセージとしおりデータを表示
```

### 2. skeleton フェーズでの骨組み作成

```
[ユーザー] "骨組みを作成して"
    ↓
[MessageInput] planningPhase: 'skeleton' を送信
    ↓
[Gemini Client] INCREMENTAL_SYSTEM_PROMPT + createSkeletonPrompt() を使用
    ↓
[Gemini API] 各日のテーマのみを提案（具体的なスポット名なし）
    ↓
[parseAIResponse] JSONからテーマ情報を抽出
    ↓
[フロントエンド] DaySchedule に「骨組み」バッジとテーマを表示
```

### 3. detailing フェーズでの日程詳細化

```
[ユーザー] "1日目の詳細を作成して"
    ↓
[MessageInput] planningPhase: 'detailing', currentDetailingDay: 1 を送信
    ↓
[Gemini Client] INCREMENTAL_SYSTEM_PROMPT + createDayDetailPrompt(itinerary, 1) を使用
    ↓
[Gemini API] 1日目の具体的なスポット、時間、費用を提案
    ↓
[parseAIResponse] JSONから詳細スケジュールを抽出
    ↓
[フロントエンド] SpotCard でスポット詳細を表示
```

---

## 🐛 BUG-001 修正の詳細

### 修正前

```
ユーザーへの表示:
"東京の3日間の旅程を考えました。

1日目は浅草・スカイツリー周辺を...

```json
{
  "title": "東京3泊4日の旅",
  "schedule": [...]
}
```"
```

### 修正後

```
ユーザーへの表示:
"東京の3日間の旅程を考えました。

1日目は浅草・スカイツリー周辺を..."
```

JSONブロックは完全に削除され、クリーンなメッセージのみ表示されます。

---

## 📊 フェーズ別プロンプトの使い分け

| フェーズ | システムプロンプト | 追加プロンプト | AI の振る舞い |
|---------|------------------|--------------|-------------|
| **initial** | SYSTEM_PROMPT | なし | 通常の対話 |
| **collecting** | INCREMENTAL_SYSTEM_PROMPT | なし | 基本情報をヒアリング |
| **skeleton** | INCREMENTAL_SYSTEM_PROMPT | createSkeletonPrompt | テーマのみ提案（スポット名なし） |
| **detailing** | INCREMENTAL_SYSTEM_PROMPT | createDayDetailPrompt | 具体的なスポット・時間・費用を提案 |
| **completed** | INCREMENTAL_SYSTEM_PROMPT | なし | 微調整のみ |

---

## 🧪 テスト方法

### 1. 「次へ」キーワードの検出テスト

ブラウザの開発者ツールで以下を実行:

```javascript
// MessageInput に「次へ」と入力
// → APIに送信されるリクエストを確認（Network タブ）
{
  "message": "次へ\n\n【システムからの補足】\n【情報収集】\nまだ基本情報が不足しています...",
  "planningPhase": "collecting",
  // ...
}
```

### 2. skeleton フェーズのテスト

```javascript
const store = useStore.getState();

// skeletonフェーズに設定
store.setPlanningPhase('skeleton');

// チャットで「骨組みを作成して」と送信
// → AIは各日のテーマのみを提案（具体的なスポット名なし）
```

### 3. detailing フェーズのテスト

```javascript
const store = useStore.getState();

// detailingフェーズに設定
store.setPlanningPhase('detailing');
store.setCurrentDetailingDay(1);

// チャットで「1日目の詳細を作成して」と送信
// → AIは1日目の具体的なスケジュールを提案
```

### 4. BUG-001 修正のテスト

チャットでしおりを作成し、AIの応答にJSONブロックが表示されないことを確認。

---

## 🎯 期待される効果

### 1. AI応答の品質向上
- ✅ フェーズに応じた適切な粒度の提案
- ✅ 段階を飛ばさない一貫性のある対話
- ✅ ユーザーの意図を正確に理解

### 2. ユーザー体験の向上
- ✅ 「次へ」と入力するだけで次のステップへ進める
- ✅ JSONブロックが表示されず、クリーンなUI
- ✅ フェーズごとに適切な情報が表示される

### 3. 開発者体験の向上
- ✅ プロンプト管理が一元化
- ✅ 各フェーズのロジックが明確
- ✅ テストが容易

---

## 📁 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `types/api.ts` | ✅ ChatAPIRequest に planningPhase, currentDetailingDay を追加 |
| `lib/ai/prompts.ts` | ✅ parseAIResponse を改善（BUG-001修正） |
| `lib/ai/gemini.ts` | ✅ buildPrompt メソッドにフェーズ別プロンプトを統合 |
| `app/api/chat/route.ts` | ✅ 「次へ」キーワード検出とフェーズ情報処理を追加 |
| `lib/utils/api-client.ts` | ✅ sendChatMessageStream にフェーズ情報を追加 |
| `components/chat/MessageInput.tsx` | ✅ フェーズ情報をAPIに送信 |
| `docs/PHASE4_5_API_EXTENSIONS.md` | ✅ 実装レポート作成 |
| `README.md` | ✅ Phase 4.5 & BUG-001 を完了としてマーク |

---

## 🔄 次のステップ（Phase 4.6以降）

### Phase 4.6: しおりマージロジックの改善
- [ ] 骨組み段階のマージ処理（theme, statusの保持）
- [ ] 日程詳細化のマージ処理（既存の日を保持）
- [ ] フェーズ情報のマージ処理

### Phase 4.7: テスト・デバッグ
- [ ] 骨組み作成のE2Eテスト
- [ ] 日程詳細化のE2Eテスト（複数日）
- [ ] ユーザー介入（修正要求）のテスト
- [ ] エッジケースの確認

---

## 📌 重要なポイント

1. **フェーズ判定の自動化**: フェーズ情報をAPIに渡すことで、AIが適切なプロンプトを使用
2. **「次へ」キーワードの検出**: ユーザーが簡単に次のステップへ進める
3. **JSONブロックの完全削除**: クリーンなUIでユーザー体験向上
4. **段階的なプロンプト**: フェーズごとに異なるタスクを明確に指示

---

**Phase 4.5 完了**: ✅  
**BUG-001 修正完了**: ✅  
**進捗**: Phase 4.1, 4.2, 4.3, 4.4, 4.5 完了（5/7）  
**次のフェーズ**: Phase 4.6（しおりマージロジックの改善）

**関連ドキュメント**:
- [Phase 4.1 型定義の拡張](./PHASE4_1_TYPE_EXTENSIONS.md)
- [Phase 4.2 状態管理の拡張](./PHASE4_2_STATE_MANAGEMENT.md)
- [Phase 4.3 プロンプトシステム](./PHASE4_3_PROMPT_SYSTEM.md)
- [Phase 4.4 UIコンポーネント](./PHASE4_4_UI_COMPONENTS.md)
- [Phase 4 使用ガイド](./PHASE4_USAGE_GUIDE.md)