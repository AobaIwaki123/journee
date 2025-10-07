# バグ修正: QuickActionsのパラメータ順序エラー

## 📋 概要

`QuickActions`コンポーネントで発生していた「Unsupported AI model: skeleton」エラーを修正しました。

**修正日**: 2025-10-07  
**影響範囲**: Phase 4の「次へ」ボタン機能  
**重要度**: 🔴 Critical（機能が動作しない）

---

## 🐛 エラー内容

### エラーメッセージ
```
Error in handleNextStep: Error: Unsupported AI model: skeleton
    at ChatAPIClient.sendMessageStream (api-client.ts:105:13)
    at async sendChatMessageStream (api-client.ts:192:3)
    at async proceedAndSendMessage (QuickActions.tsx:152:24)
    at async handleNextStep (QuickActions.tsx:112:5)
```

### 発生状況
- Phase 4の「次へ」ボタンをクリックした際に発生
- `planningPhase`が`'skeleton'`の時に特に顕著

---

## 🔍 原因分析

### 根本原因
`sendChatMessageStream`関数の呼び出し時、パラメータの順序が間違っていた。

### 詳細
`lib/utils/api-client.ts`の`sendChatMessageStream`関数の型定義：

```typescript
export async function* sendChatMessageStream(
  message: string,                        // 1. メッセージ
  chatHistory?: ChatMessage[],            // 2. チャット履歴
  currentItinerary?: ItineraryData,       // 3. 現在のしおり
  model?: AIModelId,                      // 4. AIモデル（gemini / claude）
  claudeApiKey?: string,                  // 5. Claude APIキー
  planningPhase?: ItineraryPhase,         // 6. プランニングフェーズ
  currentDetailingDay?: number | null     // 7. 現在詳細化中の日
): AsyncGenerator<ChatStreamChunk, void, unknown>
```

### 問題のあった呼び出し（修正前）

```typescript
// components/itinerary/QuickActions.tsx (152行目)
for await (const chunk of sendChatMessageStream(
  '次へ',                                 // ✅ 1. message
  chatHistory,                            // ✅ 2. chatHistory
  useStore.getState().currentItinerary,   // ✅ 3. currentItinerary
  newPhase,                               // ❌ 4. model（実際は ItineraryPhase 型）
  newDetailingDay                         // ❌ 5. claudeApiKey（実際は number 型）
)) {
```

**問題点**:
- `newPhase`（例: `'skeleton'`）が `model`（AIModelId型）のパラメータ位置に渡されていた
- `newDetailingDay`が `claudeApiKey`（string型）のパラメータ位置に渡されていた
- `selectedAI`と`claudeApiKey`が全く渡されていなかった

### エラーが発生する理由

1. `newPhase = 'skeleton'`（ItineraryPhase型）
2. これが`model`パラメータに渡される
3. APIクライアントが`'skeleton'`をAIモデルIDとして解釈
4. `'skeleton'`は`'gemini'`でも`'claude'`でもないため、エラー

---

## ✅ 修正内容

### 修正後のコード

```typescript
// components/itinerary/QuickActions.tsx

// 1. useStoreから selectedAI と claudeApiKey を取得
export const QuickActions: React.FC = () => {
  const {
    // ... 既存の状態
    // Phase 6: AI model selection
    selectedAI,      // 追加
    claudeApiKey,    // 追加
  } = useStore();

  // ...

  // 2. 正しいパラメータ順序で呼び出し
  for await (const chunk of sendChatMessageStream(
    '次へ',                                 // 1. message
    chatHistory,                            // 2. chatHistory
    useStore.getState().currentItinerary,   // 3. currentItinerary
    selectedAI,                             // 4. model ← 修正
    claudeApiKey,                           // 5. claudeApiKey ← 修正
    newPhase,                               // 6. planningPhase ← 修正
    newDetailingDay                         // 7. currentDetailingDay ← 修正
  )) {
    // ...
  }
}
```

---

## 🧪 テストケース

### 修正前（エラー発生）

| ケース | planningPhase | 結果 |
|--------|--------------|------|
| 1. 骨組み作成 | `'collecting'` → `'skeleton'` | ❌ エラー: `Unsupported AI model: skeleton` |
| 2. 日程詳細化 | `'skeleton'` → `'detailing'` | ❌ エラー: `Unsupported AI model: detailing` |

### 修正後（正常動作）

| ケース | planningPhase | selectedAI | 結果 |
|--------|--------------|-----------|------|
| 1. 骨組み作成 | `'collecting'` → `'skeleton'` | `'gemini'` | ✅ 正常動作 |
| 2. 日程詳細化 | `'skeleton'` → `'detailing'` | `'gemini'` | ✅ 正常動作 |
| 3. Claude使用 | `'collecting'` → `'skeleton'` | `'claude'` | ✅ 正常動作（APIキー必要） |

---

## 📊 影響範囲

### 修正されたファイル
- `components/itinerary/QuickActions.tsx`

### 影響を受ける機能
- ✅ Phase 4の「次へ」ボタン
- ✅ 段階的旅程構築システム
- ✅ AIモデル選択（Gemini / Claude）

### 影響を受けない機能
- ✅ `MessageInput.tsx`の通常チャット（既に正しく実装済み）
- ✅ その他の機能

---

## 🔄 類似コードの確認

### MessageInput.tsx（問題なし）

```typescript
// components/chat/MessageInput.tsx (62行目)
for await (const chunk of sendChatMessageStream(
  userMessage.content,                    // ✅ 1. message
  chatHistory,                            // ✅ 2. chatHistory
  currentItinerary || undefined,          // ✅ 3. currentItinerary
  selectedAI,                             // ✅ 4. model
  claudeApiKey || undefined,              // ✅ 5. claudeApiKey
  planningPhase,                          // ✅ 6. planningPhase
  currentDetailingDay                     // ✅ 7. currentDetailingDay
)) {
  // ...
}
```

**結論**: `MessageInput.tsx`は最初から正しい順序で実装されていた。

---

## 💡 再発防止策

### 1. TypeScriptの型チェック強化
現在、`sendChatMessageStream`のパラメータはすべてオプショナル（`?`）のため、型エラーが発生しない。

**改善案**:
```typescript
// より厳密な型定義（将来的な改善案）
export type SendMessageStreamParams = {
  message: string;
  chatHistory?: ChatMessage[];
  currentItinerary?: ItineraryData;
  model?: AIModelId;
  claudeApiKey?: string;
  planningPhase?: ItineraryPhase;
  currentDetailingDay?: number | null;
};

export async function* sendChatMessageStream(
  params: SendMessageStreamParams
): AsyncGenerator<ChatStreamChunk, void, unknown> {
  // ...
}
```

### 2. コメント追加
パラメータの順序を明示的にコメント（今回追加済み）：

```typescript
// パラメータ順序: message, chatHistory, currentItinerary, model, claudeApiKey, planningPhase, currentDetailingDay
for await (const chunk of sendChatMessageStream(
  '次へ',
  chatHistory,
  itinerary,
  selectedAI,
  claudeApiKey,
  newPhase,
  newDetailingDay
)) {
  // ...
}
```

### 3. 単体テスト
`QuickActions`コンポーネントの単体テストを追加（Phase 9で実装予定）

---

## 🚀 次のステップ

1. ✅ **修正完了**: `QuickActions.tsx`のパラメータ順序を修正
2. ✅ **テスト**: 「次へ」ボタンが正常動作することを確認
3. ⬜ **Phase 9**: 単体テストを追加して再発を防止

---

**修正コミット**: 1eb2e21  
**関連ドキュメント**:
- [lib/utils/api-client.ts](../lib/utils/api-client.ts)
- [Phase 4.5 実装レポート](./PHASE4_5_API_EXTENSIONS.md)