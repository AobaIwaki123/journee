<!-- 0e7868ee-5a6f-4055-bb3a-bee03cbd8d4f aa38adfa-a4f7-48db-a391-bb6b08fffdab -->
# Gemini 2.5 Flash対応とチャット履歴DB保存実装 - 再構成版

## 📊 実装状況サマリー

### ✅ 完了したフェーズ

| Phase | 内容 | 状態 |

|-------|------|------|

| Phase 1 | Gemini 2.5 Flash モデル追加 | ✅ 完了 |

| Phase 2 | DBスキーマ更新（暗号化対応） | ✅ 完了 |

| Phase 3 | チャット履歴リポジトリ作成 | ✅ 完了 |

| Phase 4 | チャット履歴保存API | ✅ 完了 |

| Phase 5 | チャットAPI統合（自動保存） | ⚠️ 80%完了 |

### ❌ 未実装のフェーズ

| Phase | 内容 | 状態 | 優先度 |

|-------|------|------|--------|

| Phase 5 (残り) | チャット履歴保存バグ修正 | ❌ 未実装 | 🔴 高 |

| Phase 6 | AIプロンプト改善とトークン管理 | ❌ 未実装 | 🔴 高 |

| Phase 7 | フロントエンド統合 | ❌ 未実装 | 🔴 高 |

| Phase 8 | 環境変数設定 | ⚠️ 部分的 | 🟡 中 |

| Phase 9 | テストとドキュメント更新 | ❌ 未実装 | 🟢 低 |

---

## 🎯 残実装項目の詳細

## Phase 4: ユーザーによる追加課題のため情報が少ない課題

- チャット画面にチャット履歴のリセット機能が欲しい
- 理由: 今回の変更により会話履歴が全て送られるようになってしまうため、不要な履歴は削除できる方がユーザー体験が良い
- 仕様
  - 削除ボタンを押すと、UI上および内部的なチャット履歴保持情報も削除され、次のチャット送信時に確実に何もコンテキストがない状態で会話を始められる
  - 但し、すでにDBに保存されてしまったチャットまで削除する必要はない。UI上から削除され、コンテキストに載らないことが何よりも重要
- レイアウト
  - チャットボックスの右下にホバーさせる

### Phase 5（残り）: チャット履歴保存問題の修正

**現状:**

- `app/api/itinerary/load/route.ts` は、しおりデータのみを返している
- チャット履歴は取得されていない
- 🚨 **重大な問題**: チャット履歴が保存されない（しおりIDがない場合）

**チャット履歴保存問題の詳細:**

#### 問題の原因
`app/api/chat/route.ts` (行272, 325, 420, 536) では、以下のコードでチャット履歴を保存:

```typescript
if (updatedItinerary?.id) {
  await saveMessage(updatedItinerary.id, { ... });
}
```

**問題点:**
- チャット開始時、しおりはまだ保存されていない
- `currentItinerary.id` が `undefined`
- → `saveMessage()` が呼ばれず、チャット履歴が保存されない

**必要な実装:**

#### 5.1 チャット履歴保存の修正（チャットAPI側）

**ファイル:** `app/api/chat/route.ts`

```typescript
// 行272, 325, 420, 536 のsaveMessage呼び出し部分を修正

// ❌ 現在（エラーが握りつぶされる + しおりIDがないと保存されない）
if (updatedItinerary?.id) {
  await saveMessage(updatedItinerary.id, { ... });
}

// ✅ 改善（エラーログ追加 + ID不在時の警告）
if (updatedItinerary?.id) {
  const saveResult = await saveMessage(updatedItinerary.id, {
    role: 'user',
    content: message,
    timestamp: new Date(),
  });

  if (!saveResult.success) {
    console.error('Failed to save user message:', saveResult.error);
  }
} else {
  console.warn('Itinerary ID not found. Chat history will be saved on itinerary save.');
}
```

#### 5.2 Zustandストアに一時保存フラグを追加

**ファイル:** `lib/store/useStore.ts`

```typescript
interface AppState {
  // ... 既存の定義 ...

  // 追加: しおりがまだ未保存かどうか
  isItineraryUnsaved: boolean;
  setItineraryUnsaved: (unsaved: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // ...
  isItineraryUnsaved: true, // 初期状態は未保存
  setItineraryUnsaved: (unsaved) => set({ isItineraryUnsaved: unsaved }),
}));
```

#### 5.3 しおり保存時にチャット履歴も一括保存

**ファイル:** `components/itinerary/SaveButton.tsx` または `lib/utils/api-client.ts`

```typescript
// しおりを保存するヘルパー関数
export async function saveItineraryWithChatHistory(
  itinerary: ItineraryData,
  messages: Message[]
): Promise<ItineraryData> {
  const isFirstSave = !itinerary.id;

  // 1. しおりを保存
  const response = await fetch('/api/itinerary/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itinerary),
  });

  if (!response.ok) {
    throw new Error('Failed to save itinerary');
  }

  const savedItinerary = await response.json();

  // 2. 初回保存の場合、チャット履歴も一括保存
  if (isFirstSave && messages.length > 0) {
    const chatHistoryResponse = await fetch('/api/chat/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itineraryId: savedItinerary.id,
        messages,
      }),
    });

    if (!chatHistoryResponse.ok) {
      console.error('Failed to save chat history');
    }

    // 保存フラグを更新
    useStore.getState().setItineraryUnsaved(false);
  }

  return savedItinerary;
}
```

#### 5.4 SaveButtonコンポーネントの更新

**ファイル:** `components/itinerary/SaveButton.tsx`

```typescript
const handleSave = async () => {
  const { currentItinerary, messages } = useStore.getState();

  if (!currentItinerary) return;

  setLoading(true);
  try {
    // ✅ チャット履歴も一緒に保存
    const savedItinerary = await saveItineraryWithChatHistory(
      currentItinerary,
      messages
    );

    // ストアを更新
    useStore.getState().setItinerary(savedItinerary);

    showToast('しおりとチャット履歴を保存しました', 'success');
  } catch (error) {
    console.error('Save error:', error);
    showToast('保存に失敗しました', 'error');
  } finally {
    setLoading(false);
  }
};
```

**優先度:** 🔴 高（フロントエンド統合に必須、かつ現在のバグ修正）

**デバッグガイド参照:** `.cursor/plans/chat-history-debug-guide.md` に詳細なデバッグ手順を記載

---

### Phase 6: AIプロンプト改善とトークン管理 - 完全未実装

**現状:**

- `lib/ai/gemini.ts`: `.slice(-10)` で最新10件のみ送信
- `lib/ai/claude.ts`: `.slice(-10)` で最新10件のみ送信
- トークン管理ユーティリティが存在しない
- 自動要約機能が存在しない

**必要な実装:**

#### 6.1 トークン管理ユーティリティ

**新規ファイル:** `lib/ai/token-manager.ts`

```typescript
import type { Message } from '@/types/chat';

/**
 * トークン数の推定（GPT-3/4のトークナイザー相当）
 * 日本語: 約1文字=2トークン
 * 英語: 約1単語=1.3トークン
 */
export function estimateTokens(text: string): number {
  // 簡易推定: 文字数 * 2（日本語が多い想定）
  return Math.ceil(text.length * 2);
}

/**
 * チャット履歴の総トークン数を計算
 */
export function calculateTotalTokens(messages: Message[]): number {
  return messages.reduce((total, msg) => {
    return total + estimateTokens(msg.content);
  }, 0);
}

/**
 * トークン制限内に収める
 * Gemini: 100万トークン
 * Claude: 20万トークン
 */
export function limitChatHistoryByTokens(
  messages: Message[],
  maxTokens: number = 100000 // デフォルト: 10万トークン
): Message[] {
  const result: Message[] = [];
  let currentTokens = 0;

  // 最新メッセージから逆順で追加
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = estimateTokens(msg.content);

    if (currentTokens + msgTokens > maxTokens) {
      break; // トークン制限に達したら終了
    }

    result.unshift(msg);
    currentTokens += msgTokens;
  }

  return result;
}

/**
 * 要約が必要か判定（閾値: 5万トークン）
 */
export function shouldSummarize(messages: Message[]): boolean {
  const totalTokens = calculateTotalTokens(messages);
  return totalTokens > 50000;
}

/**
 * 要約対象のメッセージ範囲を決定
 * - 最新10件は残す
 * - それより前を要約対象とする
 */
export function getSummaryRange(messages: Message[]): { start: number; end: number } {
  if (messages.length <= 10) {
    return { start: 0, end: 0 }; // 要約不要
  }

  return {
    start: 0,
    end: messages.length - 10, // 最新10件を除く
  };
}
```

#### 6.2 自動要約機能

**新規ファイル:** `lib/ai/summarizer.ts`

```typescript
import type { Message } from '@/types/chat';
import type { AIModelId } from '@/types/ai';
import { GeminiClient } from './gemini';
import { ClaudeClient } from './claude';

/**
 * 要約専用プロンプト
 * 情報欠落を最小化するため、以下を保持:
 * 1. ユーザーの要望と制約条件
 * 2. 既に決定した内容
 * 3. 重要な提案とフィードバック
 * 4. 文脈情報（計画段階、進捗状況）
 */
const SUMMARY_PROMPT = `以下のチャット履歴を要約してください。

**要約時に必ず含める情報:**
1. **旅行の基本情報**: 目的地、期間、予算、人数
2. **ユーザーの要望と制約**: 特別なリクエスト、避けたいこと、好み
3. **既に決定した内容**: 確定した旅行先、日程、観光スポット、宿泊施設
4. **重要な提案とフィードバック**: AIが提案してユーザーが気に入った内容、却下された提案とその理由
5. **現在の計画段階**: どの段階まで進んでいるか（情報収集中、骨組み作成中、詳細化中など）

**要約形式:**
- 簡潔かつ具体的に
- 箇条書きで構造化
- 重要な数値や固有名詞は省略しない
- 時系列を保持

**チャット履歴:**
`;

/**
 * チャット履歴を要約
 * Gemini Flash（高速・低コスト）を使用
 */
export async function summarizeChatHistory(
  messages: Message[],
  modelId: AIModelId = 'gemini-flash',
  claudeApiKey?: string
): Promise<string> {
  // 要約対象のメッセージをテキストに変換
  const chatText = messages
    .map((msg) => `${msg.role === 'user' ? 'ユーザー' : 'AI'}: ${msg.content}`)
    .join('\n\n');

  const prompt = `${SUMMARY_PROMPT}\n\n${chatText}`;

  try {
    if (modelId === 'claude' && claudeApiKey) {
      // Claude使用
      const claude = new ClaudeClient(claudeApiKey);
      const response = await claude.chat(prompt, []);
      return response.message;
    } else {
      // Gemini Flash使用（デフォルト）
      const gemini = new GeminiClient('gemini-flash');
      const response = await gemini.chat(prompt, []);
      return response.message;
    }
  } catch (error) {
    console.error('Summarization error:', error);
    // エラー時は簡易要約を返す
    return `過去の会話（${messages.length}件）が要約されました。詳細は省略されています。`;
  }
}

/**
 * 要約結果をassistantメッセージとして生成
 */
export function createSummaryMessage(summary: string): Message {
  return {
    id: `summary-${Date.now()}`,
    role: 'assistant',
    content: `📝 **過去の会話の要約**\n\n${summary}`,
    timestamp: new Date(),
  };
}
```

#### 6.3 チャット履歴圧縮

**新規ファイル:** `lib/ai/chat-compressor.ts`

```typescript
import type { Message } from '@/types/chat';
import type { AIModelId } from '@/types/ai';
import { shouldSummarize, getSummaryRange, calculateTotalTokens } from './token-manager';
import { summarizeChatHistory, createSummaryMessage } from './summarizer';

/**
 * チャット履歴を圧縮（要約）
 * 
 * 動作:
 * 1. トークン数が閾値（5万）を超えたら要約トリガー
 * 2. 最新N件（10件）を残し、それより前を要約
 * 3. 要約結果を1つのメッセージに圧縮
 * 4. [要約メッセージ, 最新N件] の構成で返す
 */
export async function compressChatHistory(
  messages: Message[],
  modelId: AIModelId,
  claudeApiKey?: string
): Promise<{ compressed: Message[]; didCompress: boolean }> {
  // 要約が必要かチェック
  if (!shouldSummarize(messages)) {
    return { compressed: messages, didCompress: false };
  }

  // 要約対象範囲を取得
  const { start, end } = getSummaryRange(messages);

  if (end <= start) {
    return { compressed: messages, didCompress: false };
  }

  try {
    // 要約対象のメッセージ
    const toSummarize = messages.slice(start, end);
    const recentMessages = messages.slice(end);

    console.log(`Summarizing ${toSummarize.length} messages (keeping ${recentMessages.length} recent)`);

    // 要約実行
    const summary = await summarizeChatHistory(toSummarize, modelId, claudeApiKey);
    const summaryMessage = createSummaryMessage(summary);

    // 圧縮後のメッセージリスト
    const compressed = [summaryMessage, ...recentMessages];

    console.log(`Compression complete. Total tokens: ${calculateTotalTokens(messages)} → ${calculateTotalTokens(compressed)}`);

    return { compressed, didCompress: true };
  } catch (error) {
    console.error('Compression failed:', error);
    // エラー時は圧縮せずに返す
    return { compressed: messages, didCompress: false };
  }
}
```

#### 6.4 GeminiとClaudeの更新

**ファイル:** `lib/ai/gemini.ts`

```typescript
import { limitChatHistoryByTokens } from './token-manager';

// buildPrompt メソッド内
private buildPrompt(
  userMessage: string,
  chatHistory: ChatMessage[],
  currentItinerary?: ItineraryData,
  planningPhase: ItineraryPhase = 'initial',
  currentDetailingDay?: number | null
): string {
  // ...

  // ❌ 削除: chatHistory.slice(-10)
  // ✅ 変更: トークン制限内の全履歴を送信
  if (chatHistory.length > 0) {
    const limitedHistory = limitChatHistoryByTokens(chatHistory, 100000); // Gemini: 10万トークン
    const historyText = formatChatHistory(
      limitedHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))
    );
    prompt += `## 会話履歴\n${historyText}\n\n`;
  }

  // ...
}
```

**ファイル:** `lib/ai/claude.ts`

```typescript
import { limitChatHistoryByTokens } from './token-manager';

// buildPrompt メソッド内
private buildPrompt(
  userMessage: string,
  chatHistory: ChatMessage[],
  currentItinerary?: ItineraryData
): { systemPrompt: string; userPrompt: string } {
  // ...

  // ❌ 削除: chatHistory.slice(-10)
  // ✅ 変更: トークン制限内の全履歴を送信
  if (chatHistory.length > 0) {
    const limitedHistory = limitChatHistoryByTokens(chatHistory, 50000); // Claude: 5万トークン
    const historyText = formatChatHistory(
      limitedHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))
    );
    userPrompt += `## 会話履歴\n${historyText}\n\n`;
  }

  // ...
}
```

**優先度:** 🔴 高（会話の文脈保持に重要）

---

### Phase 7: フロントエンド統合 - 完全未実装

**現状:**

- Zustandストアにチャット履歴の自動保存・復元ロジックがない
- メッセージ送信前の自動圧縮がない

**必要な実装:**

#### 7.1 Zustandストアの拡張

**ファイル:** `lib/store/useStore.ts`

```typescript
// AppState インターフェースに追加
interface AppState {
  // ... 既存の定義 ...

  // ✅ 追加: チャット履歴DB統合
  loadChatHistory: (itineraryId: string) => Promise<void>;
  saveChatHistoryToDb: (itineraryId: string) => Promise<boolean>;
  compressAndSaveChatHistory: (itineraryId: string) => Promise<void>;
}

// useStore 実装に追加
export const useStore = create<AppState>((set, get) => ({
  // ... 既存の実装 ...

  // ✅ チャット履歴の読み込み
  loadChatHistory: async (itineraryId: string) => {
    try {
      const response = await fetch(`/api/chat/history?itineraryId=${itineraryId}`);
      
      if (!response.ok) {
        console.error('Failed to load chat history');
        return;
      }

      const data = await response.json();
      
      if (data.success && data.messages) {
        // メッセージをストアに設定
        set({ messages: data.messages });
      }
    } catch (error) {
      console.error('Load chat history error:', error);
    }
  },

  // ✅ チャット履歴の保存
  saveChatHistoryToDb: async (itineraryId: string) => {
    const { messages } = get();
    
    if (!itineraryId || messages.length === 0) {
      return false;
    }

    try {
      const response = await fetch('/api/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itineraryId,
          messages,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Save chat history error:', error);
      return false;
    }
  },

  // ✅ チャット履歴の圧縮と保存
  compressAndSaveChatHistory: async (itineraryId: string) => {
    const { messages, selectedAI, claudeApiKey } = get();

    // トークン数をチェック
    if (messages.length < 20) {
      // メッセージ数が少ない場合はスキップ
      return;
    }

    try {
      // クライアント側で圧縮APIを呼び出し
      const response = await fetch('/api/chat/compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          modelId: selectedAI,
          claudeApiKey,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.didCompress && data.compressed) {
          // 圧縮されたメッセージでストアを更新
          set({ messages: data.compressed });

          // DBに保存
          await get().saveChatHistoryToDb(itineraryId);

          // ユーザーに通知
          get().addToast('チャット履歴が長くなったため、自動的に要約されました', 'info');
        }
      }
    } catch (error) {
      console.error('Compress chat history error:', error);
    }
  },
}));
```

#### 7.3 メッセージ送信前の自動圧縮

**ファイル:** `components/chat/MessageInput.tsx`

```typescript
const handleSend = async () => {
  const { 
    currentItinerary, 
    compressAndSaveChatHistory, 
    messages 
  } = useStore.getState();

  if (!currentItinerary?.id) return;

  // ✅ 追加: 送信前にチャット履歴を圧縮（必要に応じて）
  if (messages.length > 20) {
    await compressAndSaveChatHistory(currentItinerary.id);
  }

  // 既存のメッセージ送信処理
  // ...
};
```

#### 7.4 チャット履歴圧縮API

**新規ファイル:** `app/api/chat/compress/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { compressChatHistory } from '@/lib/ai/chat-compressor';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, modelId, claudeApiKey } = await req.json();

    // 圧縮実行
    const result = await compressChatHistory(messages, modelId, claudeApiKey);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Compress chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to compress chat history' },
      { status: 500 }
    );
  }
}
```

**優先度:** 🔴 高（ユーザー体験に直結）

---

### Phase 8: 環境変数設定 - 部分的完了

**現状:**

- `lib/db/chat-repository.ts` で `CHAT_ENCRYPTION_KEY` または `NEXTAUTH_SECRET` を使用
- `.env.example` ファイルが存在しない

**必要な実装:**

#### 8.1 .env.example 作成

**新規ファイル:** `.env.example`

```bash
# .env.example - 環境変数テンプレート

# =========================================
# 認証（NextAuth.js）
# =========================================
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# =========================================
# AI API
# =========================================
GEMINI_API_KEY=your-gemini-api-key

# =========================================
# データベース（Supabase）
# =========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# =========================================
# チャット履歴暗号化
# =========================================
# チャット履歴暗号化キー（未設定の場合はNEXTAUTH_SECRETを使用）
# 推奨: openssl rand -base64 32
CHAT_ENCRYPTION_KEY=${NEXTAUTH_SECRET}

# =========================================
# アプリケーション設定
# =========================================
NODE_ENV=development
LOG_LEVEL=debug
```

**優先度:** 🟡 中（ドキュメント整備）

---

### Phase 9: テストとドキュメント更新 - 完全未実装

**必要な実装:**

#### 9.1 E2Eテスト

**新規ファイル:** `e2e/chat-history-db.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('チャット履歴DB保存', () => {
  test('メッセージがDBに保存される', async ({ page }) => {
    // テストロジック
  });

  test('しおり読み込み時に履歴が復元される', async ({ page }) => {
    // テストロジック
  });

  test('モデル切り替え時も履歴が保持される', async ({ page }) => {
    // テストロジック
  });
});
```

**新規ファイル:** `e2e/chat-auto-summary.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('チャット履歴自動要約', () => {
  test('トークン閾値超過時に自動要約が実行される', async ({ page }) => {
    // テストロジック
  });

  test('要約後のメッセージ数が削減される', async ({ page }) => {
    // テストロジック
  });

  test('要約内容が妥当である', async ({ page }) => {
    // テストロジック
  });
});
```

#### 9.2 ドキュメント作成

**新規ファイル:** `docs/CHAT_HISTORY.md`

```markdown
# チャット履歴管理

## 概要
チャット履歴をしおりに紐づけてSupabaseに保存し、暗号化・要約機能を提供します。

## 機能
- サーバーサイド暗号化（pgcrypto）
- 自動要約（トークン閾値超過時）
- リアルタイム自動保存
- しおり読み込み時の履歴復元

## 実装詳細
...
```

#### 9.3 API.md 更新

**ファイル:** `docs/API.md`

```markdown
## チャット履歴API

### チャット履歴保存

**POST /api/chat/history**

### チャット履歴取得

**GET /api/chat/history?itineraryId={id}**

### チャット履歴圧縮

**POST /api/chat/compress**
```

**優先度:** 🟢 低（機能実装後に実施）

---

## 📋 推奨実装順序

### 🔴 最優先（Phase 5残り：バグ修正 + 基本機能完成）

1. ✅ **Phase 5.1**: チャットAPI側のエラーログ改善
2. ✅ **Phase 5.2**: Zustandストアに `isItineraryUnsaved` フラグ追加
3. ✅ **Phase 5.3**: しおり保存時のチャット履歴一括保存ヘルパー実装
4. ✅ **Phase 5.4**: SaveButtonコンポーネントの更新
5. ✅ **Phase 5.5**: `itinerary/load` APIの更新（チャット履歴取得追加）
6. ✅ **Phase 7.1**: Zustandストアにチャット履歴関連アクション追加

**目的:**
- **バグ修正**: しおり未保存時にチャット履歴が保存されない問題を解決

**参考:** `.cursor/plans/chat-history-debug-guide.md` に詳細なデバッグ手順を記載

---

### 🟡 次に実装（Phase 6）

4. ✅ **Phase 6.1**: トークンマネージャー実装
5. ✅ **Phase 6.2**: 自動要約機能実装
6. ✅ **Phase 6.3**: チャット履歴圧縮機能実装
7. ✅ **Phase 6.4**: GeminiとClaudeの更新（全履歴送信対応）
8. ✅ **Phase 7.3**: メッセージ送信前の自動圧縮
9. ✅ **Phase 7.4**: チャット履歴圧縮API作成

**目的:** トークン増大対策と文脈保持の強化

---

### 🟢 最後に実装（Phase 8, 9）

10. ✅ **Phase 8.1**: `.env.example` 作成
11. ✅ **Phase 9.1**: E2Eテスト作成
12. ✅ **Phase 9.2**: ドキュメント作成
13. ✅ **Phase 9.3**: API.md 更新

**目的:** ドキュメント整備と品質保証

---

## 🎯 完了時の動作イメージ

### ユーザー体験

1. **チャット開始**

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - ユーザーがメッセージを送信
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - メッセージはリアルタイムでDBに暗号化保存

2. **しおり読み込み**

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - しおりを開くとチャット履歴も自動復元
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - 以前の会話の続きから開始可能

3. **長時間の会話**

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - チャット履歴が長くなると自動的に要約
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - トークン制限内で文脈を保持
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - ユーザーには「要約されました」と通知

4. **モデル切り替え**

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - GeminiとClaudeを切り替えても履歴は保持
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - モデルごとのトークン制限に応じて最適化

---

## ✅ チェックリスト

### 実装前の確認

- [x] Phase 1-4 が完了していることを確認
- [x] `lib/db/chat-repository.ts` が正常に動作すること
- [x] `app/api/chat/history/route.ts` が正常に動作すること
- [x] Supabaseの暗号化関数が有効であること

### 実装後の確認

#### Phase 5-7

- [ ] 🚨 **バグ修正確認**: しおり未保存でもチャット履歴が保存される（しおり保存時に一括保存）
- [ ] チャットAPI側で適切なエラーログが出力される
- [ ] しおり初回保存時にチャット履歴が一括保存される
- [ ] メッセージ送信後、DBに保存される（しおりIDが存在する場合）
- [ ] トークン数が閾値を超えると自動要約される
- [ ] 要約後のメッセージ数が削減される
- [ ] AIに全履歴（トークン制限内）が送信される

#### Phase 8-9

- [ ] `.env.example` が作成されている
- [ ] E2Eテストが通過する
- [ ] `docs/CHAT_HISTORY.md` が作成されている
- [ ] `docs/API.md` が更新されている

---

## 📝 注意事項

### トークン推定の精度

- 現在の実装は簡易推定（文字数 * 2）
- より正確な推定が必要な場合は `tiktoken` などのライブラリを使用
- 日本語と英語で推定方法を変更する必要がある

### 要約の品質

- Gemini Flash を使用した要約は高速だが精度は中程度
- 重要な情報が欠落しないようプロンプトを調整
- 必要に応じてGemini Proを使用

### パフォーマンス

- チャット履歴の圧縮はバックグラウンドで実行
- ユーザーの入力をブロックしない
- 圧縮失敗時は元の履歴を保持

### セキュリティ

- 暗号化キーは環境変数で管理
- クライアント側に平文を保存しない
- APIキーをクライアントに露出しない

---

## 🔗 関連ドキュメント

- [lib/db/chat-repository.ts](mdc:lib/db/chat-repository.ts) - チャット履歴リポジトリ
- [lib/db/schema-chat-encryption.sql](mdc:lib/db/schema-chat-encryption.sql) - 暗号化スキーマ
- [app/api/chat/history/route.ts](mdc:app/api/chat/history/route.ts) - チャット履歴API
- [lib/ai/gemini.ts](mdc:lib/ai/gemini.ts) - Geminiクライアント
- [lib/ai/claude.ts](mdc:lib/ai/claude.ts) - Claudeクライアント
- [lib/store/useStore.ts](mdc:lib/store/useStore.ts) - Zustandストア

---

**このプランに従って実装することで、チャット履歴のDB保存と自動要約機能が完成します。**
