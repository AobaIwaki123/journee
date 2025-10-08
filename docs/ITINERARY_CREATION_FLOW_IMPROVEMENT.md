# しおり作成フローの改善計画

## 概要

本ドキュメントは、現在のしおり作成フローを分析し、UXを大幅に改善するための実装計画を定義します。

## フローとメソッドの連なり

### 現在のフロー（As-Is）

#### 1. ユーザー起動 → 初期化

```
User Action: アプリを開く
  ↓
App.tsx
  └─ useStore.initializeFromStorage()
       └─ loadChatPanelWidth()
       └─ loadSelectedAI()
       └─ loadAutoProgressMode()
       └─ loadAppSettings()
       └─ loadCurrentItinerary() from localStorage
  ↓
ChatBox mounted
  └─ messages: []
  └─ planningPhase: 'initial'
```

#### 2. ユーザーメッセージ送信

```
User Action: 「京都に3日間行きたい」と入力
  ↓
MessageInput.handleSubmit()
  ├─ useStore.addMessage(userMessage)
  ├─ useStore.setLoading(true)
  ├─ useStore.setStreaming(true)
  └─ sendChatMessageStream()
       ↓
       POST /api/chat
         ├─ body: { message, chatHistory, currentItinerary, planningPhase: 'initial' }
         └─ model: 'gemini'
       ↓
       route.ts.POST()
         ├─ detectNextStepKeyword(message) → false
         ├─ handleGeminiStreamingResponse()
         └─ streamGeminiMessage()
              ↓
              gemini.ts.streamGeminiMessage()
                ├─ buildSystemPrompt(planningPhase: 'initial')
                │    └─ SYSTEM_PROMPT + INCREMENTAL_SYSTEM_PROMPT
                ├─ buildConversationHistory()
                └─ generativeModel.generateContentStream()
                     ↓
                     for await (chunk of response.stream)
                       └─ yield chunk.text()
       ↓
       Client: MessageInput
         └─ for await (chunk of sendChatMessageStream())
              ├─ if (chunk.type === 'message')
              │    └─ useStore.appendStreamingMessage(chunk.content)
              ├─ if (chunk.type === 'itinerary')
              │    └─ useStore.setItinerary(chunk.itinerary)
              └─ if (chunk.type === 'done')
                   ├─ useStore.addMessage(assistantMessage)
                   ├─ useStore.setStreaming(false)
                   └─ useStore.setLoading(false)
```

**問題点**:
- LLMは受動的に応答するだけ
- フェーズは`initial`のまま（自動遷移なし）
- 情報抽出が行われない
- ユーザーが次に何をすべきか不明確

#### 3. 「次へ」ボタンクリック（現在のフロー）

```
User Action: QuickActionsの「次へ」ボタンをクリック
  ↓
QuickActions.handleNextStep()
  ├─ if (buttonReadiness.level === 'not_ready')
  │    └─ setShowWarning(true) → ユーザーに警告表示
  └─ else: proceedAndSendMessage()
       ↓
       useStore.proceedToNextStep()
         ├─ switch (planningPhase)
         │    case 'initial': → planningPhase = 'collecting'
         │    case 'collecting': → planningPhase = 'skeleton'
         │    case 'skeleton': → planningPhase = 'detailing', currentDay = 1
         │    case 'detailing': → currentDay++
         └─ updateItinerary({ phase, currentDay })
       ↓
       sendChatMessageStream('次へ', ...)
         ↓
         POST /api/chat
           ├─ detectNextStepKeyword('次へ') → true
           ├─ enhancedMessage = message + createNextStepPrompt()
           └─ streamGeminiMessage(enhancedMessage, ..., newPhase)
                ↓
                gemini.ts
                  ├─ buildSystemPrompt(planningPhase: 'skeleton')
                  │    └─ INCREMENTAL_SYSTEM_PROMPT + skeletonInstructions
                  └─ generateContentStream()
       ↓
       LLM generates skeleton with themes
       ↓
       parseAIResponse(fullResponse)
         └─ Extract { message, itineraryData }
       ↓
       mergeItineraryData(currentItinerary, itineraryData)
         ├─ Merge schedule with status: 'skeleton'
         └─ Preserve existing data
       ↓
       useStore.setItinerary(mergedItinerary)
```

**問題点**:
- ユーザーが手動で「次へ」を押す必要がある
- 情報収集が不十分でも進める
- LLMが自発的に質問しない
- 骨組み作成の品質が情報量に依存

#### 4. 情報抽出（現在の実装）

```
useEffect in QuickActions
  └─ updateChecklist()
       ↓
       useStore.updateChecklist()
         ├─ getRequirementsForPhase(planningPhase)
         │    └─ PHASE_REQUIREMENTS[planningPhase].items
         ├─ for each item:
         │    └─ item.extractor(messages, currentItinerary)
         │         ├─ extractDestination() → 正規表現で「京都」を抽出
         │         ├─ extractDuration() → 正規表現で「3日間」を抽出
         │         ├─ extractBudget() → null
         │         ├─ extractTravelers() → null
         │         └─ extractInterests() → []
         ├─ calculateChecklistStatus(items)
         │    ├─ requiredFilled = 2/2
         │    ├─ optionalFilled = 0/3
         │    └─ completionRate = 66%
         └─ determineButtonReadiness(status, phase)
              └─ level: 'partial', label: '骨組みを作成'
```

**問題点**:
- 正規表現ベースで精度が低い
- 抽出結果がLLMにフィードバックされない
- LLMが不足情報を尋ねるロジックがない

---

### あるべきフロー（To-Be）

#### 1. ユーザー起動 → 初期化（変更なし）

```
User Action: アプリを開く
  ↓
App.tsx
  └─ useStore.initializeFromStorage()
  ↓
ChatBox mounted
  └─ messages: []
  └─ planningPhase: 'initial'
  └─ conversationManager: new ConversationManager('initial')
```

#### 2. ウェルカムメッセージの自動送信

```
useEffect in ChatBox (planningPhase === 'initial' && messages.length === 0)
  ↓
  sendInitialGreeting()
    ├─ greeting = INITIAL_GREETING
    ├─ useStore.addMessage(assistantMessage: greeting)
    └─ useStore.setPlanningPhase('collecting_basic')
```

**新規メソッド**:
- `sendInitialGreeting()` - 初回ウェルカムメッセージ

#### 3. ユーザーメッセージ送信 → 自動情報抽出

```
User Action: 「京都に3日間行きたい」と入力
  ↓
MessageInput.handleSubmit()
  ├─ useStore.addMessage(userMessage)
  ├─ useStore.setLoading(true)
  └─ sendChatMessageStream()
       ↓
       POST /api/chat
         ├─ body: { message, chatHistory, currentItinerary, planningPhase: 'collecting_basic' }
         └─ model: 'gemini'
       ↓
       route.ts.POST()
         ├─ extractInformationFromMessage(message) // 🆕 新規
         │    ├─ extractDestination() → '京都'
         │    ├─ extractDuration() → 3
         │    ├─ extractBudget() → null
         │    ├─ extractTravelers() → null
         │    └─ extractInterests() → []
         ├─ updateExtractionCache(extractedInfo) // 🆕 新規
         ├─ calculateCompletionStatus() // 🆕 新規
         │    └─ { requiredFilled: true, optionalFilled: 0/5 }
         └─ handleGeminiStreamingResponse()
              ↓
              gemini.ts.streamGeminiMessage()
                ├─ buildSystemPrompt(planningPhase: 'collecting_basic')
                │    └─ INCREMENTAL_SYSTEM_PROMPT
                │         + extractedInformation
                │         + completionStatus
                ├─ buildConversationContext() // 🆕 拡張
                │    └─ Include extraction results
                └─ generativeModel.generateContentStream()
       ↓
       LLM Response: 「かしこまりました！京都に3日間の旅ですね。」
       ↓
       Client: MessageInput
         └─ for await (chunk of sendChatMessageStream())
              ├─ useStore.appendStreamingMessage(chunk.content)
              └─ if (chunk.type === 'done')
                   ├─ checkAutoTransition() // 🆕 新規
                   └─ if (requiredInfoComplete)
                        └─ autoTransitionToDetailedCollection() // 🆕 新規
```

**新規メソッド**:
- `extractInformationFromMessage()` - リアルタイム情報抽出
- `updateExtractionCache()` - 抽出結果のキャッシング
- `calculateCompletionStatus()` - 充足度計算
- `checkAutoTransition()` - 自動遷移判定
- `autoTransitionToDetailedCollection()` - 自動フェーズ遷移

#### 4. 自動フェーズ遷移 → 詳細情報収集開始

```
autoTransitionToDetailedCollection()
  ↓
  useStore.setPlanningPhase('collecting_detailed')
  ↓
  conversationManager.initialize('collecting_detailed') // 🆕 新規
    ├─ loadQuestionQueue(planningPhase)
    │    └─ [travelers, interests, budget, pace, specific_spots]
    ├─ loadAskedQuestions(chatHistory)
    └─ prioritizeQuestions(extractionCache)
  ↓
  sendNextQuestion() // 🆕 新規
    ├─ nextQuestion = conversationManager.getNextQuestion()
    │    └─ { category: 'travelers', question: '誰と行かれますか？...' }
    ├─ buildQuestionPrompt(nextQuestion, context)
    └─ sendChatMessageStream(questionPrompt, ...)
         ↓
         POST /api/chat
           ├─ conversationManager.getPromptHint()
           │    └─ 「次に聞くべき質問: 誰と行かれますか？」
           └─ streamGeminiMessage(..., promptHint)
                ↓
                LLM Response: 「誰と行かれますか？（一人旅、カップル...）」
```

**新規クラス・メソッド**:
- `ConversationManager` クラス
  - `initialize(phase)` - 会話フロー初期化
  - `loadQuestionQueue(phase)` - 質問キューの読み込み
  - `getNextQuestion()` - 次の質問を取得
  - `markAsAsked(category)` - 質問済みマーク
  - `getPromptHint()` - LLMへのヒント生成
- `sendNextQuestion()` - 次の質問を送信

#### 5. ユーザー応答 → 情報更新 → 次の質問

```
User Action: 「彼女と二人で行きます」と入力
  ↓
MessageInput.handleSubmit()
  ↓
  sendChatMessageStream()
    ↓
    POST /api/chat
      ├─ extractInformationFromMessage('彼女と二人で行きます')
      │    └─ extractTravelers() → { count: 2, type: 'couple' }
      ├─ updateExtractionCache({ travelers: 'couple' })
      ├─ conversationManager.markAsAsked('travelers')
      ├─ calculateCompletionStatus()
      │    └─ { requiredFilled: true, optionalFilled: 1/5 }
      └─ handleGeminiStreamingResponse()
           ↓
           buildSystemPrompt()
             ├─ currentExtractionState
             └─ nextQuestionHint = conversationManager.getPromptHint()
                  └─ 「次: どんなことに興味がありますか？」
           ↓
           LLM Response: 
             「楽しそうですね！カップル旅行ですね。
              どんなことに興味がありますか？（観光、グルメ...）」
    ↓
    Client receives response
      ├─ updateUI with completionStatus
      │    └─ Checklist: travelers ✅
      └─ continue conversation loop
```

#### 6. 情報収集完了 → 骨組み作成ボタンアクティブ化

```
POST /api/chat (after multiple exchanges)
  ├─ extractInformationFromMessage(latestMessage)
  ├─ updateExtractionCache()
  ├─ calculateCompletionStatus()
  │    └─ { requiredFilled: true, optionalFilled: 4/5, completionRate: 90% }
  └─ if (completionRate >= 80%) // 🆕 閾値判定
       ├─ conversationManager.allQuestionsAsked() → true
       └─ suggestNextPhase() // 🆕 新規
            ↓
            LLM Response: 
              「ありがとうございます！
               十分な情報が揃いました。
               それでは、各日の骨組みを作成しましょう。
               「骨組みを作成」ボタンを押してください。」
  ↓
  Client updates UI
    ├─ buttonReadiness.level = 'ready'
    ├─ buttonReadiness.animate = true (pulse)
    └─ buttonReadiness.label = '骨組みを作成 ✨'
```

**新規メソッド**:
- `suggestNextPhase()` - 次のフェーズを提案

#### 7. 骨組み作成ボタンクリック

```
User Action: QuickActionsの「骨組みを作成」ボタンをクリック
  ↓
QuickActions.handleNextStep()
  └─ proceedAndSendMessage()
       ↓
       useStore.proceedToNextStep()
         └─ planningPhase = 'skeleton'
       ↓
       sendChatMessageStream('骨組みを作成してください', ...)
         ↓
         POST /api/chat
           ├─ buildSystemPrompt(planningPhase: 'skeleton')
           │    ├─ INCREMENTAL_SYSTEM_PROMPT
           │    └─ Include all extractedInformation // 🆕 強化
           │         ├─ destination: '京都'
           │         ├─ duration: 3
           │         ├─ travelers: 'couple'
           │         ├─ interests: ['寺社巡り', 'グルメ']
           │         ├─ budget: 50000
           │         └─ pace: 'relaxed'
           └─ streamGeminiMessage()
                ↓
                LLM generates skeleton with rich context
                  ├─ Day 1: 東山エリア - 歴史と文化（寺社巡り重視）
                  ├─ Day 2: 嵐山・金閣寺 - 自然と絶景
                  └─ Day 3: 祇園・河原町 - グルメ満喫
       ↓
       mergeItineraryData()
       ↓
       useStore.setItinerary(mergedItinerary)
```

**改善点**:
- 全ての収集情報がLLMに渡される
- 骨組みの品質が大幅に向上
- ユーザーの希望が正確に反映される

#### 8. 日程詳細化（並列処理）

```
User Action: 「日程の詳細化」ボタンをクリック
  ↓
QuickActions.handleNextStep()
  └─ proceedAndSendMessage()
       ↓
       useStore.proceedToNextStep()
         └─ planningPhase = 'detailing', currentDay = 1
       ↓
       if (autoProgressMode && autoProgressSettings.enabled)
         └─ startParallelDetailing() // 🆕 Phase 4.9
              ↓
              parallelItineraryBuilder.buildAll() // 🆕 新規
                ├─ tasks = schedule.map(day => ({
                │    day: day.day,
                │    theme: day.theme,
                │    extractedInfo,
                │    preferences
                │  }))
                ├─ maxConcurrency = 3
                └─ Promise.allSettled(
                     tasks.map(task => buildDayDetail(task))
                   )
                     ↓
                     for each day (parallel):
                       POST /api/chat/day-detail // 🆕 新規エンドポイント
                         ├─ buildDayDetailPrompt(day, theme, preferences)
                         └─ streamGeminiMessage()
                              ↓
                              Generate spots, times, costs
                       ↓
                       onProgress(dayNumber, spotGenerated)
                         └─ updateDayProgress(dayNumber, progress)
       ↓
       Client: Real-time progress display
         ├─ Day 1: [████████░░] 80% (4/5 spots)
         ├─ Day 2: [██████░░░░] 60% (3/5 spots)
         └─ Day 3: [███░░░░░░░] 30% (2/5 spots)
       ↓
       All days completed
         ├─ useStore.setPlanningPhase('completed')
         └─ showCompletionMessage()
```

**新規クラス・メソッド**:
- `ParallelItineraryBuilder` クラス
  - `buildAll(tasks, options)` - 並列実行
  - `buildDayDetail(task)` - 1日の詳細生成
  - `onProgress(callback)` - 進捗コールバック
- `/api/chat/day-detail` - 日程詳細化専用エンドポイント

---

### メソッド定義対比表

| カテゴリ | 現在（As-Is） | あるべき姿（To-Be） | 変更内容 |
|---------|--------------|-------------------|----------|
| **初期化** | `initializeFromStorage()` | `initializeFromStorage()`<br>`sendInitialGreeting()` | ウェルカムメッセージ追加 |
| **情報抽出** | `updateChecklist()`<br>（手動、useEffect内） | `extractInformationFromMessage()`<br>`updateExtractionCache()`<br>`calculateCompletionStatus()` | リアルタイム、サーバー側で実行 |
| **会話管理** | なし | `ConversationManager.initialize()`<br>`getNextQuestion()`<br>`markAsAsked()`<br>`getPromptHint()` | 🆕 新規追加 |
| **フェーズ遷移** | `proceedToNextStep()`<br>（手動、ボタンクリック） | `checkAutoTransition()`<br>`autoTransitionToDetailedCollection()`<br>`suggestNextPhase()` | 自動判定、提案機能追加 |
| **質問送信** | なし | `sendNextQuestion()`<br>`buildQuestionPrompt()` | 🆕 新規追加 |
| **プロンプト生成** | `buildSystemPrompt(phase)`<br>（基本のみ） | `buildSystemPrompt(phase)`<br>+ `extractedInformation`<br>+ `conversationContext`<br>+ `nextQuestionHint` | コンテキストの充実化 |
| **並列処理** | なし | `ParallelItineraryBuilder.buildAll()`<br>`buildDayDetail()`<br>`onProgress()` | 🆕 Phase 4.9連携 |
| **進捗表示** | `getProgress()`<br>（フェーズのみ） | `getProgress()`<br>`updateDayProgress()`<br>`calculateOverallProgress()` | 日ごとの詳細表示 |
| **ボタン制御** | `determineButtonReadiness()` | `determineButtonReadiness()`<br>+ 動的アニメーション<br>+ 自動遷移提案 | UX強化 |

---

### データフロー対比

#### 現在のデータフロー

```
User Input (text)
  ↓
MessageInput
  ↓
sendChatMessageStream()
  ↓
POST /api/chat
  ├─ message: string
  ├─ chatHistory: Message[]
  ├─ currentItinerary: ItineraryData
  └─ planningPhase: string
  ↓
gemini.ts
  └─ generateContentStream()
  ↓
LLM Response (text + JSON)
  ↓
parseAIResponse()
  ├─ message: string
  └─ itineraryData: Partial<ItineraryData>
  ↓
mergeItineraryData()
  ↓
useStore.setItinerary()
  ↓
UI Update
```

**問題**: 情報の一方通行、LLMが情報不足を認識できない

#### あるべきデータフロー

```
User Input (text)
  ↓
MessageInput
  ↓
extractInformationFromMessage() // サーバー側
  ├─ destination: string | null
  ├─ duration: number | null
  ├─ travelers: object | null
  ├─ interests: string[]
  ├─ budget: number | null
  └─ ...
  ↓
updateExtractionCache() // 累積
  └─ ExtractionCache {
       destination: '京都',
       duration: 3,
       travelers: { count: 2, type: 'couple' },
       interests: ['寺社巡り', 'グルメ'],
       budget: 50000,
       lastUpdated: timestamp
     }
  ↓
calculateCompletionStatus()
  └─ CompletionStatus {
       requiredFilled: true,
       optionalFilled: 4/5,
       completionRate: 90%,
       missingRequired: [],
       missingOptional: ['pace']
     }
  ↓
ConversationManager.getPromptHint()
  └─ PromptHint {
       extractedInfo: ExtractionCache,
       completionStatus: CompletionStatus,
       nextQuestion: Question | null,
       shouldTransition: boolean
     }
  ↓
buildSystemPrompt(phase, promptHint)
  └─ Enhanced System Prompt with context
  ↓
sendChatMessageStream()
  ↓
POST /api/chat
  ├─ message: string
  ├─ chatHistory: Message[]
  ├─ currentItinerary: ItineraryData
  ├─ planningPhase: string
  └─ 🆕 extractionContext: {
       cache: ExtractionCache,
       status: CompletionStatus,
       hint: PromptHint
     }
  ↓
gemini.ts with full context
  └─ generateContentStream()
  ↓
LLM Response (contextual, guided)
  ↓
parseAIResponse()
  ├─ message: string
  ├─ itineraryData: Partial<ItineraryData>
  └─ 🆕 extractedInfo: Partial<ExtractionCache>
  ↓
mergeItineraryData() + updateExtractionCache()
  ↓
useStore.setItinerary() + updateChecklist()
  ↓
UI Update (rich feedback)
  ├─ Checklist update
  ├─ Progress bar
  ├─ Button state
  └─ Next question display
```

**改善**: 双方向、コンテキスト保持、LLMが状況を理解

## 現在のフローの課題

### 1. 情報収集プロセスの問題点

**現状**:
- `collecting`フェーズで基本情報（行き先、日数）を収集
- ユーザーが自発的に情報を入力する必要がある
- LLMが受動的で、不足情報を積極的に尋ねない
- 情報が不足していても次のフェーズに進めてしまう

**問題**:
- ユーザーが何を入力すべきか分からない
- 情報が不足したまま骨組み作成に進むと品質が低下
- LLMの対話能力が活かされていない

### 2. フェーズ遷移の問題点

**現状**:
- collecting → skeleton への遷移が急すぎる
- 情報収集が不十分なまま骨組み作成に進む
- LLMによる情報の深掘りが不足

**問題**:
- 骨組みの品質が情報量に左右される
- ユーザーの希望が十分に反映されない可能性
- やり直しが発生しやすい

### 3. UI/UXの問題点

**現状**:
- 「次へ」ボタンの意味が不明確
- 情報充足度の表示が分かりにくい
- どの情報が必須/任意か判断しづらい

**問題**:
- ユーザーが次に何をすべきか迷う
- フローの進捗が見えづらい
- 不足情報の追加が促されない

## 改善されたフローの設計

### フェーズ定義の見直し

```typescript
export type ItineraryPhase =
  | "initial"              // 初期状態（ウェルカムメッセージ）
  | "collecting_basic"     // 基本情報収集（行き先、日数）【必須】
  | "collecting_detailed"  // 詳細情報収集（興味、予算、同行者など）【LLM主導】
  | "skeleton"            // 骨組み作成（各日のテーマ決定）
  | "detailing"           // 日程詳細化（具体的なスポット追加）
  | "completed";          // 完成
```

### フェーズ1: 初期状態 (initial)

**目的**: ユーザーをウェルカムし、フローを説明

**AI動作**:
```typescript
const INITIAL_GREETING = `
こんにちは！一緒に素敵な旅のしおりを作りましょう。

まず、以下の基本情報を教えてください：
1. どこへ行きますか？（行き先）
2. 何日間の旅行ですか？（日数）

例：「京都に3泊4日で行きたい」「沖縄に2日間」
`;
```

**UI状態**:
- チェックリスト: 行き先（未入力）、日数（未入力）
- 「次へ」ボタン: 無効（グレーアウト）
- ヘルプテキスト: 「行き先と日数を教えてください」

**遷移条件**:
- 行き先 AND 日数が入力されたら自動的に`collecting_detailed`へ

### フェーズ2: 基本情報収集 (collecting_basic)

**目的**: 必須情報（行き先、日数）を確実に収集

**AI動作**:
```typescript
// ユーザーが「京都に3日間」と入力したら
const BASIC_INFO_CONFIRMATION = `
かしこまりました！京都に3日間の旅ですね。

それでは、もう少し詳しくお聞きしてもいいですか？
`;
```

**抽出システム**:
- `lib/requirements/extractors.ts`を強化
- 行き先、日数を正規表現 + LLM判定で抽出
- 抽出結果をリアルタイムでチェックリストに反映

**UI状態**:
- チェックリスト: 
  - ✅ 行き先: 京都
  - ✅ 日数: 3日間
- 「次へ」ボタン: アクティブ（緑色、パルス）
- ヘルプテキスト: 「基本情報が揃いました！さらに詳しく教えてください」

**遷移**:
- 自動的に`collecting_detailed`へ移行（ボタンクリック不要）
- または「詳しく教えてください」ボタンで明示的に遷移

### フェーズ3: 詳細情報収集 (collecting_detailed) 【新規追加】

**目的**: LLM主導で情報を深掘りし、高品質なしおり作成のための情報を収集

**AI動作**（対話型）:

```typescript
const DETAILED_INFO_QUESTIONS = [
  {
    category: 'travelers',
    question: '誰と行かれますか？（一人旅、カップル、家族、友人など）',
    followUp: '楽しそうですね！',
  },
  {
    category: 'interests',
    question: 'どんなことに興味がありますか？（観光、グルメ、自然、歴史、ショッピングなど）',
    followUp: (interests) => `${interests}がお好きなんですね！具体的に訪れたい場所はありますか？`,
  },
  {
    category: 'budget',
    question: 'ご予算の目安はありますか？（交通費・宿泊費を除いた現地での支出）',
    followUp: '承知しました！その予算内で最適なプランを考えますね。',
  },
  {
    category: 'pace',
    question: '旅行のペースはどうされたいですか？（のんびり派、アクティブ派など）',
    followUp: null,
  },
  {
    category: 'specific_spots',
    question: '絶対に行きたい場所や、やりたいことはありますか？',
    followUp: null,
  },
];
```

**対話フロー**:

1. **質問の自動提示**
   ```
   AI: 「誰と行かれますか？（一人旅、カップル、家族、友人など）」
   ユーザー: 「彼女と二人で行きます」
   AI: 「楽しそうですね！カップル旅行ですね。
        どんなことに興味がありますか？（観光、グルメ、自然、歴史など）」
   ユーザー: 「寺社巡りとグルメを楽しみたいです」
   AI: 「寺社巡りとグルメがお好きなんですね！
        京都には素敵なお寺がたくさんあります。
        具体的に訪れたい場所はありますか？」
   ```

2. **不足情報の検出と追加質問**
   ```typescript
   function detectMissingInfo(checklist: ChecklistItem[]): string[] {
     const missing = [];
     
     if (!checklist.find(item => item.id === 'budget')?.value) {
       missing.push('予算');
     }
     
     if (!checklist.find(item => item.id === 'interests')?.value) {
       missing.push('興味・テーマ');
     }
     
     return missing;
   }
   
   // LLMプロンプトに追加
   if (missing.length > 0) {
     prompt += `\n\n【重要】以下の情報がまだ不足しています：
     ${missing.map(m => `- ${m}`).join('\n')}
     
     これらについても自然な会話の流れで質問してください。`;
   }
   ```

3. **情報充足度の可視化**
   ```tsx
   <RequirementsChecklist
     items={[
       { id: 'destination', label: '行き先', status: 'filled', value: '京都' },
       { id: 'duration', label: '日数', status: 'filled', value: '3日間' },
       { id: 'travelers', label: '同行者', status: 'filled', value: 'カップル' },
       { id: 'interests', label: '興味', status: 'filled', value: '寺社巡り、グルメ' },
       { id: 'budget', label: '予算', status: 'empty', required: false },
       { id: 'pace', label: 'ペース', status: 'empty', required: false },
     ]}
   />
   ```

**システム実装**:

```typescript
// lib/ai/conversation-manager.ts (新規)
export class ConversationManager {
  private questionQueue: Question[];
  private askedQuestions: Set<string>;
  
  constructor(phase: ItineraryPhase, checklist: ChecklistItem[]) {
    this.questionQueue = this.buildQuestionQueue(phase, checklist);
    this.askedQuestions = new Set();
  }
  
  /**
   * 次に質問すべき項目を取得
   */
  getNextQuestion(): Question | null {
    const unanswered = this.questionQueue.filter(
      q => !this.askedQuestions.has(q.category)
    );
    
    return unanswered[0] || null;
  }
  
  /**
   * 質問済みとしてマーク
   */
  markAsAsked(category: string): void {
    this.askedQuestions.add(category);
  }
  
  /**
   * システムプロンプトに追加する質問ヒント
   */
  getPromptHint(): string {
    const nextQuestion = this.getNextQuestion();
    
    if (!nextQuestion) {
      return '全ての必要な情報が揃いました。次のフェーズへ進む準備ができています。';
    }
    
    return `
【次に聞くべき質問】
${nextQuestion.question}

※自然な会話の流れで質問してください。
※ユーザーの回答を受けて、適切なフォローアップをしてください。
    `;
  }
}
```

**UI状態**:
- チェックリスト: リアルタイム更新
  - ✅ 行き先: 京都
  - ✅ 日数: 3日間
  - ✅ 同行者: カップル
  - ✅ 興味: 寺社巡り、グルメ
  - ⭕ 予算: 未設定（任意）
  - ⭕ ペース: 未設定（任意）
- 進捗バー: 必須項目 100%、任意項目 50%
- 「骨組みを作成」ボタン: 
  - 必須項目が揃ったらアクティブ（緑色、パルス）
  - 任意項目が不足していても進める
  - ホバー時に「任意: 予算、ペースを追加するとより良いプランになります」
- 「スキップして次へ」ボタン: 必須情報が揃ったら表示

**遷移条件**:
- 必須情報（行き先、日数）が揃っている
- ユーザーが「骨組みを作成」ボタンをクリック
- または、LLMが十分な情報を得たと判断した場合に提案

### フェーズ4: 骨組み作成 (skeleton)

**目的**: 収集した情報を基に各日のテーマを決定

**変更点**:
- `collecting_detailed`で収集した豊富な情報を活用
- より具体的で魅力的なテーマを生成
- ユーザーの希望を最大限に反映

**AI動作**:
```typescript
const SKELETON_CREATION_PROMPT = `
収集した情報：
- 行き先: ${destination}
- 日数: ${duration}日間
- 同行者: ${travelers}
- 興味: ${interests.join(', ')}
- 予算: ${budget || '指定なし'}
- 希望スポット: ${specificSpots || 'なし'}

この情報を基に、各日のテーマを決定してください。

【骨組み作成のポイント】
1. ユーザーの興味を優先する
2. エリアや移動効率を考慮する
3. 各日に明確なテーマを設定する
4. 具体的なスポット名は次のフェーズで決定する

出力形式：
1日目: [エリア名] - [テーマ]（例: 東山エリア - 歴史と文化を感じる）
2日目: [エリア名] - [テーマ]
...
`;
```

**UI状態**:
- 骨組みプレビュー表示
- 各日のテーマカード
- 「詳細化を開始」ボタン

**遷移**:
- ユーザーが骨組みを確認・修正
- 「詳細化を開始」ボタンで`detailing`へ

### フェーズ5: 日程詳細化 (detailing)

**目的**: 各日の具体的なスポット、時間、予算を決定

**変更点**:
- Phase 4.9の並列処理を活用
- 1日ずつではなく、全日程を並列で詳細化（高速化）
- リアルタイムプログレス表示

**AI動作**:
```typescript
// 各日を並列で詳細化
const detailTasks = schedule.map(day => ({
  day: day.day,
  theme: day.theme,
  userPreferences: {
    interests,
    budget: dailyBudget,
    pace,
  },
}));

// 並列実行（Phase 4.9）
await parallelDetailItinerary(detailTasks, {
  maxConcurrency: 3,
  onProgress: (completed, total) => {
    updateProgress(completed / total * 100);
  },
});
```

**UI状態**:
- 全体プログレスバー（0-100%）
- 各日のカード:
  - ローディング中: スピナー
  - 完了: チェックマーク + プレビュー
  - エラー: リトライボタン
- リアルタイム更新

**遷移**:
- 全ての日の詳細化が完了したら`completed`へ自動遷移

### フェーズ6: 完成 (completed)

**目的**: しおりの最終確認と共有

**機能**:
- PDF出力
- 共有リンク生成
- 編集継続オプション

## 実装計画

### Phase 1: フェーズ定義の拡張（優先度: 高）

**タスク**:
1. `types/itinerary.ts`の`ItineraryPhase`型を拡張
2. `collecting_detailed`フェーズを追加
3. 状態管理（Zustand）を更新

**ファイル**:
- `types/itinerary.ts`
- `lib/store/useStore.ts`

**見積もり**: 2時間

### Phase 2: 詳細情報収集システムの実装（優先度: 高）

**タスク**:
1. 質問キュー管理システム作成
2. 対話マネージャーの実装
3. システムプロンプトの拡張

**ファイル**:
- `lib/ai/conversation-manager.ts` (新規)
- `lib/ai/prompts.ts`
- `lib/requirements/question-queue.ts` (新規)

**見積もり**: 8時間

### Phase 3: 情報抽出システムの強化（優先度: 高）

**タスク**:
1. 既存の`extractors.ts`を拡張
2. LLMベースの情報抽出を追加
3. リアルタイム抽出とキャッシング

**ファイル**:
- `lib/requirements/extractors.ts`
- `lib/requirements/extraction-cache.ts` (新規)

**見積もり**: 6時間

### Phase 4: UIコンポーネントの改善（優先度: 中）

**タスク**:
1. `PlanningProgress`コンポーネントの拡張
2. 新しいチェックリストUIの実装
3. プログレスバーとアニメーション

**ファイル**:
- `components/itinerary/PlanningProgress.tsx`
- `components/itinerary/RequirementsChecklist.tsx` (新規)
- `components/itinerary/DetailingProgress.tsx` (新規)

**見積もり**: 8時間

### Phase 5: QuickActionsの再設計（優先度: 中）

**タスク**:
1. フェーズごとのボタンロジック改善
2. 動的スタイリングとアニメーション
3. 自動遷移のトリガー実装

**ファイル**:
- `components/itinerary/QuickActions.tsx`

**見積もり**: 4時間

### Phase 6: API統合とプロンプト改善（優先度: 高）

**タスク**:
1. `collecting_detailed`フェーズ用プロンプト作成
2. 質問生成ロジックの実装
3. レスポンスパース処理の改善

**ファイル**:
- `lib/ai/prompts.ts`
- `lib/ai/gemini.ts`
- `app/api/chat/route.ts`

**見積もり**: 6時間

### Phase 7: テストとデバッグ（優先度: 中）

**タスク**:
1. 各フェーズの遷移テスト
2. エッジケースの処理
3. UXの最終調整

**見積もり**: 4時間

## 総見積もり時間

- **必須（優先度: 高）**: 22時間
- **推奨（優先度: 中）**: 16時間
- **合計**: 38時間

## 成功指標

### 定量指標

1. **情報収集率**: 任意項目の入力率が30%以上向上
2. **フロー完了率**: しおり作成完了率が50%以上向上
3. **やり直し率**: フェーズを戻る回数が50%削減
4. **作成時間**: しおり作成にかかる時間が20%短縮

### 定性指標

1. **ユーザー満足度**: 「何をすべきか明確だった」と回答する割合が80%以上
2. **しおり品質**: 生成されたしおりの実用性が高いと評価される
3. **対話体験**: LLMとの対話が自然で楽しいと感じる

## リスクと対策

### リスク1: LLMの質問生成が不適切

**対策**:
- 質問テンプレートのフォールバック
- 事前定義された質問リストの用意
- ユーザーフィードバックによる改善

### リスク2: 情報抽出の精度

**対策**:
- 正規表現とLLM判定の併用
- ユーザーによる確認・修正機能
- 抽出失敗時の再質問

### リスク3: UIの複雑化

**対策**:
- シンプルで直感的なデザイン
- プログレッシブディスクロージャー
- ヘルプテキストとツールチップ

## 実装の優先順位

### 第1段階（MVP）
1. フェーズ定義の拡張
2. 基本的な質問キューシステム
3. 簡易版UIの実装

### 第2段階（機能拡充）
4. 対話マネージャーの完全実装
5. リアルタイム情報抽出
6. 詳細なプログレス表示

### 第3段階（最適化）
7. 並列処理の統合
8. アニメーションとトランジション
9. パフォーマンス最適化

## 参考資料

- [Phase 4: 段階的旅程構築システム](./phase4-rule.md)
- [Phase 4.8: フェーズ移動処理の半自動化](./phase4-8-rule.md)
- [Phase 4.9: 日程作成処理の並列化](./phase4-9-rule.md)
- [状態管理ガイド](./state-management-rule.md)

## まとめ

本改善計画により、以下を実現します：

1. **ユーザー主導 → LLM主導への転換**
   - ユーザーが情報を探す必要なし
   - LLMが適切なタイミングで質問

2. **段階的な情報収集**
   - 必須情報 → 詳細情報 → 骨組み → 詳細化
   - 各段階で品質を向上

3. **透明性の向上**
   - 進捗が常に可視化
   - 次にすべきことが明確
   - 不足情報が一目瞭然

4. **高速化**
   - 並列処理による詳細化
   - 無駄な待ち時間の削減

この計画に沿って実装することで、ユーザーにとって直感的で楽しいしおり作成体験を提供できます。
