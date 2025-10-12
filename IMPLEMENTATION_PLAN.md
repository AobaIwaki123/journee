# 実装計画: Gemini 2.5 Flash追加とデフォルト変更

## 概要

ユーザーからのフィードバックに基づき、Gemini 2.5 Flashモデルを追加し、デフォルトのAIモデルとして設定します。既存のGeminiモデルはGemini 2.5 Proとして明確化します。

## 背景・目的

ユーザーから「Gemini 2.5 Flashを追加し、デフォルトにしてほしい」という要望があり、より高速なレスポンスが期待できるGemini 2.5 Flashを導入し、デフォルトとすることでユーザー体験の向上を目指します。

## 変更内容

### 1. 型定義の更新: `types/ai.ts`

**現状:**
```typescript
export type AIModelId = 'gemini' | 'claude';
```

**変更後:**
```typescript
export type AIModelId = 'gemini-pro' | 'gemini-flash' | 'claude';
```

**理由:** 2つのGeminiモデルを区別するため、IDを`gemini-pro`と`gemini-flash`に分割します。

---

### 2. モデル設定の更新: `lib/ai/models.ts`

**現状:**
```typescript
export const AI_MODELS: Record<AIModelId, AIModelConfig> = {
  gemini: {
    id: "gemini",
    displayName: "Gemini 2.5 Pro",
    modelName: "gemini-2.5-pro",
    // ...
  },
  // ...
}

export const DEFAULT_AI_MODEL: AIModelId = "gemini";
```

**変更後:**
```typescript
export const AI_MODELS: Record<AIModelId, AIModelConfig> = {
  'gemini-pro': {
    id: "gemini-pro",
    displayName: "Gemini 2.5 Pro",
    modelName: "gemini-2.5-pro",
    provider: "google",
    description: "Googleの高性能AI。精度重視",
    requiresApiKey: false,
    maxTokens: 1048576,
    enabled: true,
    icon: "🤖",
  },
  'gemini-flash': {
    id: "gemini-flash",
    displayName: "Gemini 2.5 Flash",
    modelName: "gemini-2.5-flash",
    provider: "google",
    description: "Googleの高速AI。速度重視、環境変数で設定済み",
    requiresApiKey: false,
    maxTokens: 1048576,
    enabled: true,
    icon: "⚡",
  },
  claude: {
    id: "claude",
    displayName: "Claude 4.5 Sonnet",
    modelName: "claude-sonnet-4-5-20250929",
    provider: "anthropic",
    description: "Anthropicの高性能AI。要APIキー登録",
    requiresApiKey: true,
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    maxTokens: 4096,
    enabled: true,
    icon: "🧠",
  },
} as const;

export const DEFAULT_AI_MODEL: AIModelId = "gemini-flash";
```

**理由:** 
- Gemini ProとFlashを別々のエントリとして定義
- デフォルトを`gemini-flash`に変更
- アイコンで視覚的に区別（Pro: 🤖, Flash: ⚡）

---

### 3. Geminiクライアントの修正: `lib/ai/gemini.ts`

**現状:**
```typescript
export class GeminiClient {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    this.client = new GoogleGenerativeAI(key);
    // モデル設定から取得
    const modelName = getModelName('gemini');
    this.model = this.client.getGenerativeModel({ model: modelName });
  }
  // ...
}
```

**変更後:**
```typescript
export class GeminiClient {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private modelId: AIModelId;

  constructor(apiKey?: string, modelId: AIModelId = 'gemini-flash') {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    this.client = new GoogleGenerativeAI(key);
    this.modelId = modelId;
    
    // モデルIDからモデル名を取得
    const modelName = getModelName(modelId);
    this.model = this.client.getGenerativeModel({ model: modelName });
  }
  // ...
}
```

**シングルトンの調整:**
```typescript
/**
 * モデルIDごとのGeminiクライアントインスタンスを管理
 */
const geminiClientInstances: Map<AIModelId, GeminiClient> = new Map();

/**
 * Geminiクライアントを取得
 */
export function getGeminiClient(apiKey?: string, modelId: AIModelId = 'gemini-flash'): GeminiClient {
  // モデルIDごとにインスタンスを管理
  if (!geminiClientInstances.has(modelId)) {
    geminiClientInstances.set(modelId, new GeminiClient(apiKey, modelId));
  }
  return geminiClientInstances.get(modelId)!;
}
```

**ヘルパー関数の更新:**
```typescript
export async function sendGeminiMessage(
  message: string,
  chatHistory?: ChatMessage[],
  currentItinerary?: ItineraryData,
  apiKey?: string,
  planningPhase?: ItineraryPhase,
  currentDetailingDay?: number | null,
  modelId?: AIModelId
): Promise<{
  message: string;
  itinerary?: ItineraryData;
}> {
  const client = getGeminiClient(apiKey, modelId);
  return client.chat(message, chatHistory, currentItinerary, planningPhase, currentDetailingDay);
}

export async function* streamGeminiMessage(
  message: string,
  chatHistory?: ChatMessage[],
  currentItinerary?: ItineraryData,
  apiKey?: string,
  planningPhase?: ItineraryPhase,
  currentDetailingDay?: number | null,
  modelId?: AIModelId
): AsyncGenerator<string, void, unknown> {
  const client = getGeminiClient(apiKey, modelId);
  yield* client.chatStream(message, chatHistory, currentItinerary, planningPhase, currentDetailingDay);
}
```

**理由:** 
- コンストラクタでモデルIDを受け取り、適切なモデルを初期化
- モデルIDごとにインスタンスを管理（ProとFlashで別々のインスタンス）
- デフォルトは`gemini-flash`

---

### 4. APIルートの修正: `app/api/chat/route.ts`

**現状:**
```typescript
// Geminiのストリーミング/非ストリーミングレスポンス
if (stream) {
  return handleGeminiStreamingResponse(
    enhancedMessage,
    chatHistory,
    currentItinerary,
    planningPhase,
    currentDetailingDay
  );
}

// 非ストリーミングレスポンス
return handleGeminiNonStreamingResponse(
  enhancedMessage,
  chatHistory,
  currentItinerary,
  planningPhase,
  currentDetailingDay
);
```

**変更後:**
```typescript
// Geminiのストリーミング/非ストリーミングレスポンス
if (stream) {
  return handleGeminiStreamingResponse(
    enhancedMessage,
    chatHistory,
    currentItinerary,
    planningPhase,
    currentDetailingDay,
    selectedModel // モデルIDを渡す
  );
}

// 非ストリーミングレスポンス
return handleGeminiNonStreamingResponse(
  enhancedMessage,
  chatHistory,
  currentItinerary,
  planningPhase,
  currentDetailingDay,
  selectedModel // モデルIDを渡す
);
```

**ハンドラー関数の更新:**
```typescript
async function handleGeminiNonStreamingResponse(
  message: string,
  chatHistory: any[],
  currentItinerary: any,
  planningPhase: any,
  currentDetailingDay: any,
  modelId: AIModelId // 追加
) {
  try {
    const result = await sendGeminiMessage(
      message,
      chatHistory,
      currentItinerary,
      undefined,
      planningPhase,
      currentDetailingDay,
      modelId // 渡す
    );
    // ...
  }
}

async function handleGeminiStreamingResponse(
  message: string,
  chatHistory: any[],
  currentItinerary: any,
  planningPhase: any,
  currentDetailingDay: any,
  modelId: AIModelId // 追加
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullResponse = "";
        for await (const chunk of streamGeminiMessage(
          message,
          chatHistory,
          currentItinerary,
          undefined,
          planningPhase,
          currentDetailingDay,
          modelId // 渡す
        )) {
          // ...
        }
        // ...
      }
    }
  });
  // ...
}
```

**理由:** 選択されたGeminiモデル（ProまたはFlash）をクライアント初期化時に渡すことで、正しいモデルを使用

---

### 5. 既存ユーザーの設定マイグレーション

**場所:** `lib/store/useStore.ts` または `lib/utils/storage.ts`

既存ユーザーが`'gemini'`を選択している場合の処理:

```typescript
// ストア初期化時またはLocalStorage読み込み時
const storedModel = localStorage.getItem('selectedAI');
let selectedAI: AIModelId;

if (storedModel === 'gemini') {
  // 旧'gemini'を新デフォルト'gemini-flash'にマイグレーション
  selectedAI = 'gemini-flash';
  localStorage.setItem('selectedAI', 'gemini-flash');
} else if (storedModel && isValidModelId(storedModel)) {
  selectedAI = storedModel as AIModelId;
} else {
  selectedAI = DEFAULT_AI_MODEL; // 'gemini-flash'
}
```

**理由:** 既存ユーザーが混乱しないよう、旧`gemini`を新デフォルト`gemini-flash`に自動移行

---

### 6. UIコンポーネントの確認

**対象:** `components/chat/AISelector.tsx`

現在のAISelectorが`AI_MODELS`を動的に読み込んでいるか確認。

**期待される動作:**
- Gemini 2.5 Pro（🤖）
- Gemini 2.5 Flash（⚡）※デフォルト選択
- Claude 4.5 Sonnet（🧠）

特に変更不要（`AI_MODELS`を参照しているため自動的に反映される想定）。

---

## 影響範囲

### 変更が必要なファイル
1. ✅ `types/ai.ts` - 型定義の拡張
2. ✅ `lib/ai/models.ts` - モデル設定追加とデフォルト変更
3. ✅ `lib/ai/gemini.ts` - クライアント初期化の修正
4. ✅ `app/api/chat/route.ts` - モデルID引き渡し
5. ✅ `lib/store/useStore.ts` または storage系 - マイグレーション処理

### 確認が必要なファイル
- `components/chat/AISelector.tsx` - UI表示の確認（変更不要の想定）
- `lib/store/useStore.ts` - selectedAIの型チェック

### 影響を受けないファイル
- `lib/ai/claude.ts` - Claudeは変更なし
- `lib/ai/prompts.ts` - プロンプトロジックは変更なし

---

## テスト計画

### 手動テスト
1. **モデル選択のテスト**
   - AISelectorでGemini Pro、Gemini Flash、Claudeを選択できることを確認
   - デフォルトでGemini Flashが選択されていることを確認

2. **チャット機能のテスト**
   - Gemini Proを選択してメッセージ送信
   - Gemini Flashを選択してメッセージ送信
   - 両方とも正常に応答が返ることを確認

3. **ストリーミングのテスト**
   - Gemini ProとFlashでストリーミング応答が正しく動作することを確認

4. **マイグレーションのテスト**
   - LocalStorageに`selectedAI: 'gemini'`を手動設定
   - ページリロード後、`gemini-flash`に自動移行されることを確認

### 自動テスト
- 型チェック: `npm run type-check`
- Lint: `npm run lint`
- ビルド: `npm run build`

---

## リスクと対応

### リスク1: 既存ユーザーの混乱
**対応:** 旧`gemini`を自動的に`gemini-flash`にマイグレーション

### リスク2: API呼び出しの互換性
**対応:** モデル名は`gemini-2.5-pro`と`gemini-2.5-flash`で、Google APIで正式にサポートされているため問題なし

### リスク3: 型エラー
**対応:** 段階的に型定義→モデル設定→実装の順で変更し、各段階で型チェック実行

---

## ロールアウト計画

1. ✅ 実装計画の作成・レビュー
2. ⬜ 型定義の更新
3. ⬜ モデル設定の更新
4. ⬜ Geminiクライアントの修正
5. ⬜ APIルートの修正
6. ⬜ マイグレーション処理の追加
7. ⬜ 型チェック・Lint・ビルド確認
8. ⬜ Pull Request作成
9. ⬜ レビュー・マージ
10. ⬜ デプロイ

---

## 参考資料

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini 2.5 Pro vs Flash](https://ai.google.dev/gemini-api/docs/models/gemini)
- [プロジェクト構造](mdc:.cursor/rules/project-structure.mdc)
- [AI統合パターン](mdc:.cursor/rules/ai-integration.mdc)

---

## 補足: モデルの特徴

### Gemini 2.5 Pro
- **特徴:** 高精度、複雑なタスクに強い
- **用途:** 詳細な旅程作成、複雑な質問への対応
- **速度:** やや遅い

### Gemini 2.5 Flash
- **特徴:** 高速、コスト効率が良い
- **用途:** 一般的な会話、シンプルな旅程作成
- **速度:** 高速

ユーザーがデフォルトでFlashを使用し、必要に応じてProに切り替えることで、最適なUXを提供します。
