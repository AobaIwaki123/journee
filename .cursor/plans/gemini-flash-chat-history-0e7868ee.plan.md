<!-- 0e7868ee-5a6f-4055-bb3a-bee03cbd8d4f aa38adfa-a4f7-48db-a391-bb6b08fffdab -->
# Gemini 2.5 Flash対応とチャット履歴DB保存実装

## 概要
- Gemini 2.5 Flash モデルを追加
- チャット履歴をしおりに紐づけてDBに保存（リアルタイム自動保存）
- サーバーサイド暗号化（pgcrypto）を実装
- モデル切り替えでも堅牢に動作する設計
- 全チャット履歴をAIに送信（トークン制限考慮）
- **トークン増大対策: 自動要約機能**

## 実装方針
- **保存タイミング**: メッセージ送信後、即座にDBに保存
- **管理単位**: しおりに紐づけて保存（`chat_messages.itinerary_id`）
- **暗号化**: サーバーサイドで暗号化（pgcrypto）
- **共有対応**: 将来的な共有時のチャット履歴添付機能を見据える
- **トークン管理**: 閾値超過時、自動的に要約して情報欠落を最小化

---

## Phase 1: Gemini 2.5 Flash モデル追加

### 1.1 モデル設定の更新

**`lib/ai/models.ts`**
- Gemini 2.5 Flash を追加
- `gemini-flash` ID で識別

### 1.2 型定義の更新

**`types/ai.ts`**
```typescript
export type AIModelId = "gemini" | "gemini-flash" | "claude";
```

### 1.3 Geminiクライアントのモデル動的選択対応

**`lib/ai/gemini.ts`**
- コンストラクタで`modelId`を受け取る
- モデルごとにインスタンスを生成

### 1.4 UI更新

**`components/chat/AISelector.tsx`**
- Gemini 2.5 Flash を選択肢に追加

---

## Phase 2: DBスキーマ更新（暗号化対応）

### 2.1 スキーママイグレーション

**`lib/db/schema-chat-encryption.sql`** (新規作成)
- `encrypted_content` カラム追加
- `is_encrypted` フラグ追加
- 暗号化/復号化関数定義
- 既存データマイグレーション関数

### 2.2 DB型定義の更新

**`types/database.ts`**
- `chat_messages` テーブル型に暗号化フィールド追加

---

## Phase 3: チャット履歴リポジトリ作成

### 3.1 リポジトリ実装

**`lib/db/chat-repository.ts`** (新規作成)

主要メソッド:
- `saveMessage()`: 暗号化してメッセージ保存
- `saveMessages()`: 一括保存
- `getChatHistory()`: 復号化して履歴取得
- `deleteChatHistory()`: 履歴削除

---

## Phase 4: チャット履歴保存API

### 4.1 API Route作成

**`app/api/chat/history/route.ts`** (新規作成)
- `POST /api/chat/history`: メッセージ保存
- `GET /api/chat/history?itineraryId={id}`: 履歴取得

---

## Phase 5: チャットAPI統合（自動保存）

### 5.1 チャットAPIの更新

**`app/api/chat/route.ts`**
- メッセージ送信後、自動的にDBに保存
- ストリーミング版も対応

### 5.2 しおり読み込み時のチャット履歴取得

**`app/api/itinerary/load/route.ts`**
- しおりと一緒にチャット履歴も返す

---

## Phase 6: AIプロンプト改善とトークン管理

### 6.1 チャット履歴の制限緩和

**`lib/ai/gemini.ts`**, **`lib/ai/claude.ts`**
- 最新10件 → 全履歴送信（トークン制限内）

### 6.2 トークン管理ユーティリティ

**`lib/ai/token-manager.ts`** (新規作成)

```typescript
/**
 * トークン数の推定
 */
export function estimateTokens(text: string): number;

/**
 * チャット履歴の総トークン数を計算
 */
export function calculateTotalTokens(messages: Message[]): number;

/**
 * トークン制限内に収める
 */
export function limitChatHistoryByTokens(
  messages: Message[],
  maxTokens: number = 100000
): Message[];

/**
 * 要約が必要か判定（閾値: 5万トークン）
 */
export function shouldSummarize(messages: Message[]): boolean;

/**
 * 要約対象のメッセージ範囲を決定
 */
export function getSummaryRange(messages: Message[]): { start: number; end: number };
```

### 6.3 自動要約機能（トークン増大対策）

**`lib/ai/summarizer.ts`** (新規作成)

#### 要約専用プロンプト設計

情報欠落を最小化するため、以下を保持：
1. **ユーザーの要望と制約条件**
   - 旅行の目的地、期間、予算
   - 特別なリクエスト
   - 避けたいこと

2. **既に決定した内容**
   - 確定した旅行先、日程
   - 選択された観光スポット
   - 決定した宿泊施設や交通手段

3. **重要な提案とフィードバック**
   - AIが提案し、ユーザーが気に入った内容
   - 却下された提案とその理由

4. **文脈情報**
   - 計画段階、進捗状況

#### 主要関数

```typescript
/**
 * チャット履歴を要約
 * Gemini Flash（高速・低コスト）を使用
 */
export async function summarizeChatHistory(
  messages: Message[],
  modelId: AIModelId,
  claudeApiKey?: string
): Promise<string>;

/**
 * 要約結果をassistantメッセージとして生成
 */
export function createSummaryMessage(summary: string): Message;
```

### 6.4 チャット履歴圧縮

**`lib/ai/chat-compressor.ts`** (新規作成)

```typescript
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
): Promise<{ compressed: Message[]; didCompress: boolean }>;
```

---

## Phase 7: フロントエンド統合

### 7.1 Zustandストアの更新

**`lib/store/useStore.ts`**
- チャット履歴の自動保存
- しおり読み込み時のチャット履歴復元

### 7.2 チャットAPIクライアント更新

**`lib/utils/api-client.ts`** または新規ファイル

メッセージ送信前にトークン数チェックと圧縮:

```typescript
// メッセージ送信前
const currentMessages = useStore.getState().messages;
const { compressed, didCompress } = await compressChatHistory(
  currentMessages,
  selectedModel,
  claudeApiKey
);

if (didCompress) {
  // 圧縮後のメッセージでストアを更新
  useStore.getState().setMessages(compressed);
  
  // 圧縮されたことをユーザーに通知（オプション）
  useStore.getState().addToast({
    message: 'チャット履歴が長くなったため、自動的に要約されました',
    type: 'info',
  });
}

// その後、通常のメッセージ送信
```

---

## Phase 8: 環境変数設定

**`.env.local`**
```bash
# チャット履歴暗号化キー
CHAT_ENCRYPTION_KEY=${NEXTAUTH_SECRET}
```

---

## Phase 9: テストとドキュメント更新

### 9.1 E2Eテスト

**`e2e/chat-history-db.spec.ts`** (新規作成)
- チャットメッセージの保存
- しおり読み込み時の履歴復元
- モデル切り替え時の動作

**`e2e/chat-auto-summary.spec.ts`** (新規作成)
- トークン閾値超過時の自動要約
- 要約後のメッセージ数削減確認
- 要約内容の妥当性確認

### 9.2 ドキュメント更新

**`docs/CHAT_HISTORY.md`** (新規作成)
- チャット履歴の保存方式
- 暗号化の仕組み
- 自動要約機能の説明
- API仕様

**`docs/API.md`**
- `/api/chat/history` エンドポイント追加

---

## チェックリ