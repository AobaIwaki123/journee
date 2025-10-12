# チャット履歴が保存されない問題 - デバッグガイド

## 🔍 問題の原因

現在の実装では、**チャット履歴は以下の条件でのみ保存されます:**

```typescript
// app/api/chat/route.ts (行272, 325, 420, 536)
if (updatedItinerary?.id) {
  await saveMessage(updatedItinerary.id, { ... });
}
```

つまり、**しおりにIDが存在する場合のみ**保存されます。

---

## 🚨 保存されない主な原因

### 1. ❌ **しおりが未保存でIDがない** (最も可能性が高い)

#### 問題
- チャット開始時、しおりはまだ保存されていない
- `currentItinerary.id` が `undefined`
- → `saveMessage()` が呼ばれない

#### 確認方法
```typescript
// ブラウザのコンソールで確認
const store = useStore.getState();
console.log('Current Itinerary:', store.currentItinerary);
console.log('Has ID?:', !!store.currentItinerary?.id);
```

#### 解決策
→ **後述の「推奨解決策」を参照**

---

### 2. ❌ **暗号化関数がDBに存在しない**

#### 問題
- `lib/db/schema-chat-encryption.sql` が Supabase で実行されていない
- `encrypt_chat_message()` 関数が存在しない
- → `saveMessage()` がエラーになる（ログに出力される）

#### 確認方法
Supabase SQL Editor で以下を実行:

```sql
-- 暗号化関数が存在するか確認
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'encrypt_chat_message';
```

**期待される結果:**
```
routine_name
encrypt_chat_message
```

もし結果が空なら、関数が存在しない。

#### 解決策
Supabase SQL Editor で以下を実行:

```bash
# ローカルの schema-chat-encryption.sql の内容をコピー
cat lib/db/schema-chat-encryption.sql
```

→ Supabase SQL Editor に貼り付けて実行

---

### 3. ❌ **chat_messages テーブルが存在しない**

#### 確認方法
Supabase Table Editor または SQL Editor で確認:

```sql
SELECT * FROM chat_messages LIMIT 1;
```

**期待される結果:**
- テーブルが存在する（データがなくてもOK）

**エラーが出る場合:**
- テーブルが存在しない

#### 解決策
`lib/db/schema-chat-encryption.sql` を実行してテーブルを作成

---

### 4. ❌ **環境変数が未設定**

#### 問題
- `CHAT_ENCRYPTION_KEY` または `NEXTAUTH_SECRET` が設定されていない
- → `getEncryptionKey()` がエラーをスローする

#### 確認方法
`.env.local` を確認:

```bash
grep "NEXTAUTH_SECRET" .env.local
grep "CHAT_ENCRYPTION_KEY" .env.local
```

**期待される結果:**
```
NEXTAUTH_SECRET=your-secret-key
```

または

```
CHAT_ENCRYPTION_KEY=your-encryption-key
```

#### 解決策
`.env.local` に追加:

```bash
# NEXTAUTH_SECRETが既に設定されている場合は不要
# なければ以下を追加
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

---

### 5. ❌ **Supabase接続エラー**

#### 問題
- Supabase の URL または Anon Key が間違っている
- ネットワークエラー

#### 確認方法
ブラウザの開発者ツール → Console で確認:

```
Failed to save chat history: ...
```

または Network タブで Supabase へのリクエストを確認

---

## 🛠️ デバッグ手順

### ステップ1: コンソールログの確認

#### 1.1 サーバーログを確認

ターミナルで Next.js の起動ログを確認:

```bash
npm run dev
```

チャット送信後、以下のログが出ていないか確認:

```
Encryption error: ...
Insert error: ...
Failed to save chat history: ...
saveMessage error: ...
```

#### 1.2 ブラウザコンソールを確認

開発者ツール → Console で以下を実行:

```javascript
// しおりのIDを確認
const store = useStore.getState();
console.log('Itinerary ID:', store.currentItinerary?.id);

// メッセージを送信後、APIレスポンスを確認
// Network タブ → /api/chat → Response を確認
```

---

### ステップ2: データベースの確認

#### 2.1 Supabase にログイン

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. SQL Editor を開く

#### 2.2 テーブルの存在確認

```sql
-- chat_messages テーブルが存在するか
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'chat_messages';
```

#### 2.3 暗号化関数の存在確認

```sql
-- 暗号化関数が存在するか
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN ('encrypt_chat_message', 'decrypt_chat_message');
```

**期待される結果:**
```
routine_name          | routine_type
encrypt_chat_message  | FUNCTION
decrypt_chat_message  | FUNCTION
```

#### 2.4 拡張機能の確認

```sql
-- pgcrypto拡張が有効か
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';
```

**期待される結果:**
```
extname   | ...
pgcrypto  | ...
```

---

### ステップ3: 手動でのデータ挿入テスト

Supabase SQL Editor で以下を実行:

```sql
-- 暗号化してメッセージを挿入
INSERT INTO chat_messages (
  itinerary_id, 
  role, 
  encrypted_content, 
  is_encrypted
)
VALUES (
  'test-itinerary-id',
  'user',
  encrypt_chat_message('テストメッセージ', 'test-key'),
  true
);

-- 挿入されたか確認
SELECT * FROM chat_messages WHERE itinerary_id = 'test-itinerary-id';
```

**期待される結果:**
- データが正常に挿入される

**エラーが出る場合:**
- 関数が存在しないか、テーブルが存在しない

---

## ✅ 推奨解決策

現在の実装では、**しおりが保存されていない場合にチャット履歴も保存されない**という問題があります。

以下の解決策があります:

### 解決策B: チャット履歴を一時保存し、しおり保存時に紐付ける（本格対応）

**概要:**
1. チャット履歴をメモリに保持
2. しおりが初めて保存されたタイミングで、チャット履歴をDBに一括保存
3. それ以降はリアルタイム保存

**実装手順:**

#### B.1 Zustandストアに一時保存フラグを追加

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

#### B.2 しおり保存時にチャット履歴も一括保存

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
  
  const savedItinerary = await response.json();
  
  // 2. 初回保存の場合、チャット履歴も一括保存
  if (isFirstSave && messages.length > 0) {
    await fetch('/api/chat/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itineraryId: savedItinerary.id,
        messages,
      }),
    });
  }
  
  return savedItinerary;
}
```

#### B.3 チャットAPI側の修正（エラーハンドリング改善）

**ファイル:** `app/api/chat/route.ts`

```typescript
// 行272, 325, 420, 536 のsaveMessage呼び出し部分を修正

// ❌ 現在（エラーが握りつぶされる）
if (updatedItinerary?.id) {
  await saveMessage(updatedItinerary.id, { ... });
}

// ✅ 改善（エラーをログ出力）
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
  console.warn('Itinerary ID not found. Chat history not saved.');
}
```

---

## 📋 実装チェックリスト

### データベース準備

- [ ] Supabaseにログイン
- [ ] `lib/db/schema-chat-encryption.sql` を実行
- [ ] `chat_messages` テーブルが作成されたことを確認
- [ ] 暗号化関数が存在することを確認

### 環境変数確認

- [ ] `.env.local` に `NEXTAUTH_SECRET` が設定されている
- [ ] 開発サーバーを再起動（環境変数を読み込むため）

### しおりIDの確保

#### 解決策B（本格的）
- [ ] Zustandストアに一時保存フラグを追加
- [ ] しおり保存時にチャット履歴を一括保存
- [ ] チャットAPI側のログ出力を改善

---

## 🎯 推奨アプローチ

**後で、解決策B（本格対応）に移行:**

1. UX改善: 「保存」ボタンを押すまでDBに保存しない
2. チャット履歴はメモリに保持
3. しおり保存時に一括でDBに保存

---

## 🔧 即座に試せるデバッグコマンド

### 1. ブラウザコンソールで実行

```javascript
// しおりIDを確認
const store = useStore.getState();
console.log('Itinerary:', store.currentItinerary);
console.log('Has ID?:', !!store.currentItinerary?.id);
console.log('Messages:', store.messages);
```

### 2. サーバーログを確認

```bash
# 開発サーバーを起動してログを確認
npm run dev

# チャットを送信後、以下のログが出ていないか確認:
# - "Encryption error:"
# - "Insert error:"
# - "Failed to save chat history:"
```

### 3. Supabaseで手動確認

```sql
-- chat_messages テーブルの全データを確認
SELECT * FROM chat_messages;

-- 暗号化関数をテスト
SELECT encrypt_chat_message('test', 'key');
```

---

## 📞 次のステップ

以下の情報を確認してください:

1. **しおりにIDがあるか?**
   - ブラウザコンソールで `useStore.getState().currentItinerary?.id` を確認

2. **暗号化関数が存在するか?**
   - Supabase SQL Editor で確認

3. **サーバーログにエラーが出ているか?**
   - ターミナルで確認

これらの情報を共有していただければ、具体的な修正コードを提供します！

