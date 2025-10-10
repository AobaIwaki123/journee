# メッセージ編集・削除機能

## 概要

ユーザーが誤って送信したメッセージを編集・削除できる機能を実装しました。この機能により、ユーザーは送信後にメッセージの内容を修正したり、不要なメッセージを削除したりできます。

## 実装された機能

### 1. メッセージ編集機能

ユーザーが自分の送信済みメッセージを編集できる機能です。

**主な特徴:**
- 送信済みメッセージの横に「編集」ボタンが表示されます
- 編集ボタンをクリックすると、メッセージがテキストエリアに切り替わります
- 元のメッセージ内容が保持され、追加・修正が可能です
- 「保存」ボタンで変更を確定、「キャンセル」ボタンで編集を破棄できます
- 編集されたメッセージには「(編集済み)」の表示が追加されます
- 編集を保存すると、元のメッセージの直後にあったAI応答が自動的に削除されます

**実装ファイル:**
- `components/chat/MessageList.tsx`: 編集UI
- `lib/store/useStore.ts`: 編集状態管理
- `types/chat.ts`: Message型に`editedAt`フィールドを追加

### 2. メッセージ削除機能

ユーザーが自分の送信済みメッセージを削除できる機能です。

**主な特徴:**
- 送信済みメッセージの横に「削除」ボタンが表示されます
- 削除ボタンをクリックすると、確認ダイアログが表示されます
- 削除されたメッセージは「このメッセージは削除されました」という表示に置き換わります
- ソフトデリート方式を採用（データは残り、フラグで削除済みを示す）

**実装ファイル:**
- `components/chat/MessageList.tsx`: 削除UI
- `lib/store/useStore.ts`: 削除ロジック
- `types/chat.ts`: Message型に`isDeleted`フィールドを追加

### 3. ドラフト保存・復元機能

新規メッセージの入力内容を自動的に保存し、編集モード終了後に復元する機能です。

**主な特徴:**
- 新規メッセージの入力内容が自動的にストアに保存されます
- メッセージ編集を開始すると、新規メッセージのドラフトが一時保存されます
- 編集を終了すると、ドラフトが復元され、入力フィールドに戻ります
- ユーザーの入力内容が失われることはありません

**実装ファイル:**
- `components/chat/MessageInput.tsx`: ドラフト保存・復元ロジック
- `lib/store/useStore.ts`: `messageDraft`状態と`setMessageDraft`アクション

### 4. AI応答キャンセル機能

編集開始時に進行中のAI応答を自動的にキャンセルする機能です。

**主な特徴:**
- 編集ボタンをクリックすると、進行中のAI応答が即座に中断されます
- AbortControllerを使用してfetchリクエストを中断します
- キャンセルされたことを示すメッセージが表示されます
- ユーザーが編集作業に集中できるようになります

**実装ファイル:**
- `components/chat/MessageInput.tsx`: AbortController統合
- `lib/store/useStore.ts`: `abortController`状態と`abortAIResponse`アクション
- `lib/utils/api-client.ts`: AbortSignalサポート

### 5. 編集モード中のAI応答ブロック

編集モード中は新しいメッセージを送信できないようにする機能です。

**主な特徴:**
- 編集モード中は、新規メッセージ入力フィールドが無効化されます
- 「メッセージを編集中です」という警告が表示されます
- 編集を完了してから新しいメッセージを送信できます

**実装ファイル:**
- `components/chat/MessageInput.tsx`: 編集モード中の入力制御

## 実装計画との対応

### ✅ 実装済み機能

1. **メッセージ編集機能**
   - クライアントサイド: 編集ボタン、入力フィールド切り替え、保存・キャンセルボタン ✅
   - ストア: メッセージ編集ロジック、編集済みタイムスタンプ ✅
   - UI: 編集済み表示 ✅

2. **メッセージ削除機能**
   - クライアントサイド: 削除ボタン、確認ダイアログ ✅
   - ストア: ソフトデリート実装 ✅
   - UI: 削除済みメッセージ表示 ✅

3. **ドラフト保存・復元**
   - 新規メッセージドラフトの自動保存 ✅
   - 編集モード開始時のドラフト保持 ✅
   - 編集終了後のドラフト復元 ✅

4. **AI応答制御**
   - 編集開始時のAI応答キャンセル ✅
   - AbortControllerによる中断処理 ✅
   - 編集モード中の新規送信ブロック ✅

### 📝 将来の拡張候補

以下の機能は初期実装では見送り、必要に応じて将来追加を検討します：

- サーバーサイドAPI（現在はクライアントサイドのみ）
- メッセージ編集履歴の保持
- データベースへの保存（現在はメモリのみ）
- リアルタイム更新（WebSocket）
- 編集・削除のタイムリミット設定
- 送信直後の「取り消し」ボタン（5〜10秒間のみ表示）

## 使用方法

### メッセージの編集

1. 送信済みのメッセージにカーソルを合わせる
2. 「編集」ボタンをクリック
3. テキストエリアで内容を修正
4. 「保存」ボタンをクリックして変更を確定
5. または「キャンセル」ボタンで編集を破棄

### メッセージの削除

1. 送信済みのメッセージにカーソルを合わせる
2. 「削除」ボタンをクリック
3. 確認ダイアログで「OK」をクリック
4. メッセージが「このメッセージは削除されました」に置き換わる

### 新規メッセージドラフトの保持

1. 新規メッセージを入力中
2. 既存メッセージの「編集」ボタンをクリック
3. 編集作業を完了
4. 新規メッセージ入力フィールドに、元の入力内容が復元される

## 技術的な詳細

### 状態管理

Zustandストアに以下の状態を追加しました：

```typescript
interface AppState {
  // メッセージ編集状態
  editingMessageId: string | null;
  messageDraft: string;
  startEditingMessage: (messageId: string) => void;
  cancelEditingMessage: () => void;
  saveEditedMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
  setMessageDraft: (draft: string) => void;
  
  // AI応答制御
  abortAIResponse: () => void;
  setAbortController: (controller: AbortController | null) => void;
  abortController: AbortController | null;
}
```

### Message型の拡張

```typescript
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isDeleted?: boolean;  // 追加
  editedAt?: Date;      // 追加
}
```

### AI応答のキャンセル

AbortControllerを使用してfetchリクエストを中断します：

```typescript
const abortController = new AbortController();
setAbortController(abortController);

// リクエスト送信
for await (const chunk of sendChatMessageStream(
  message,
  history,
  itinerary,
  model,
  apiKey,
  phase,
  day,
  currency,
  abortController.signal  // AbortSignalを渡す
)) {
  // ...
}

// キャンセル時
abortController.abort();
```

## 制約事項

1. **クライアントサイドのみ**
   - 現在の実装はクライアントサイドのみで動作します
   - ページをリロードすると編集・削除の履歴は失われます
   - 将来的にはサーバーサイドAPIとデータベース統合を検討

2. **AI応答の再生成**
   - メッセージを編集しても、AI応答は自動的に再生成されません
   - ユーザーが新しいメッセージとして再送信する必要があります

3. **編集履歴**
   - 編集履歴は保存されません
   - 最新の編集内容のみが保持されます

## テスト

型チェックが完了し、チャット関連ファイルに型エラーがないことを確認しました。

```bash
npx tsc --noEmit
```

## 関連ファイル

- `components/chat/MessageList.tsx`
- `components/chat/MessageInput.tsx`
- `lib/store/useStore.ts`
- `lib/utils/api-client.ts`
- `types/chat.ts`
