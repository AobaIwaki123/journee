# LINE Bot アーキテクチャ設計

## 📋 目次

1. [概要](#概要)
2. [全体アーキテクチャ](#全体アーキテクチャ)
3. [コンポーネント構成](#コンポーネント構成)
4. [データフロー](#データフロー)
5. [セッション管理](#セッション管理)
6. [データベース設計](#データベース設計)
7. [既存コードの再利用戦略](#既存コードの再利用戦略)
8. [スケーラビリティ](#スケーラビリティ)

---

## 概要

Journee LINE botは、既存のWeb版の機能を最大限再利用しつつ、LINEプラットフォームの特性に最適化されたアーキテクチャを採用します。

### 設計の基本方針

1. **既存ロジックの再利用**: AIロジック、プロンプト、データベースリポジトリを100%再利用
2. **非同期処理**: Webhook応答時間制限（30秒）に対応した非同期アーキテクチャ
3. **段階的送信**: ストリーミング応答を解析し、小出しにメッセージを送信
4. **ステートレス**: サーバーはステートレスに保ち、状態はすべてデータベースで管理

---

## 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────┐
│                          LINE Platform                              │
│  ┌──────────────┐                              ┌─────────────────┐  │
│  │ LINE Client  │ ◄──── Push Message ────────► │ Messaging API   │  │
│  │ (User's App) │                              │                 │  │
│  └──────────────┘                              └─────────────────┘  │
│         │                                              ▲            │
│         │ User Message                                 │            │
│         ▼                                              │            │
│  ┌─────────────────────────────────────────────────────┘            │
│  │                     Webhook                                      │
└──┼──────────────────────────────────────────────────────────────────┘
   │ POST /api/line/webhook
   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Journee Backend (Next.js)                      │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    API Routes Layer                           │ │
│  │                                                               │ │
│  │  /api/line/webhook ──┐                                       │ │
│  │                       │                                       │ │
│  │                       ├─► Signature Verification             │ │
│  │                       │                                       │ │
│  │                       ├─► Event Router                        │ │
│  │                       │    ├─ Text Message Handler           │ │
│  │                       │    ├─ Postback Handler               │ │
│  │                       │    ├─ Follow/Unfollow Handler        │ │
│  │                       │    └─ Location Handler               │ │
│  │                       │                                       │ │
│  │                       └─► Async Message Processor             │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│                              ▼                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                  Business Logic Layer                         │ │
│  │                                                               │ │
│  │  ┌────────────────────────┐  ┌────────────────────────────┐  │ │
│  │  │   AI Integration       │  │  Message Processing        │  │ │
│  │  │                        │  │                            │  │ │
│  │  │  - Gemini Client       │  │  - Stream Parser           │  │ │
│  │  │  - Claude Client       │  │  - Message Formatter       │  │ │
│  │  │  - Prompt Manager      │  │  - Flex Message Builder    │  │ │
│  │  │  (Reuse from Web ver.) │  │                            │  │ │
│  │  └────────────────────────┘  └────────────────────────────┘  │ │
│  │                                                               │ │
│  │  ┌────────────────────────┐  ┌────────────────────────────┐  │ │
│  │  │   Session Manager      │  │  Itinerary Builder         │  │ │
│  │  │                        │  │                            │  │ │
│  │  │  - User Context        │  │  - Planning Logic          │  │ │
│  │  │  - Conversation State  │  │  - Spot Extraction         │  │ │
│  │  │  - Cache Management    │  │  (Reuse from Web ver.)     │  │ │
│  │  └────────────────────────┘  └────────────────────────────┘  │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│                              ▼                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                   Data Access Layer                           │ │
│  │                                                               │ │
│  │  - User Repository                                            │ │
│  │  - Itinerary Repository (Reuse from Web ver.)                 │ │
│  │  - Session Repository                                         │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              │                                     │
└──────────────────────────────┼─────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Supabase (PostgreSQL)                          │
│                                                                     │
│  - users (extended with line_user_id)                               │
│  - itineraries                                                      │
│  - line_sessions (new table)                                        │
│  - line_messages (new table for logging)                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## コンポーネント構成

### 1. API Routes Layer

#### `/app/api/line/webhook/route.ts`

**責務**: LINEからのWebhookリクエストを受信し、即座に200 OKを返す

```typescript
// app/api/line/webhook/route.ts
import { validateSignature } from '@/lib/line/signature-validator';
import { processEventAsync } from '@/lib/line/event-processor';

export async function POST(req: Request) {
  const signature = req.headers.get('x-line-signature');
  const body = await req.text();
  
  // 署名検証（同期処理）
  if (!validateSignature(body, signature, process.env.LINE_CHANNEL_SECRET!)) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const webhookBody = JSON.parse(body);
  
  // 即座に200 OKを返す
  const response = new Response('OK', { status: 200 });
  
  // バックグラウンドで非同期処理
  // 注: Next.jsのEdge Runtimeでは制限があるため、実装に注意
  webhookBody.events.forEach((event: any) => {
    processEventAsync(event).catch(console.error);
  });
  
  return response;
}
```

**ポイント**:
- 署名検証は必須（セキュリティ）
- 30秒以内に応答するため、即座に200 OKを返す
- イベント処理は非同期で実行

#### `/app/api/line/message/route.ts`（管理者用）

**責務**: 管理者がユーザーにメッセージを送信するAPI

```typescript
// app/api/line/message/route.ts
export async function POST(req: Request) {
  // 管理者認証チェック
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user)) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // メッセージ送信ロジック
  // ...
}
```

### 2. Business Logic Layer

#### `/lib/line/event-processor.ts`

**責務**: イベントタイプに応じて適切なハンドラにルーティング

```typescript
// lib/line/event-processor.ts
import { WebhookEvent } from '@line/bot-sdk';
import { handleTextMessage } from './handlers/text-message-handler';
import { handlePostback } from './handlers/postback-handler';
import { handleFollow } from './handlers/follow-handler';

export async function processEventAsync(event: WebhookEvent) {
  try {
    switch (event.type) {
      case 'message':
        if (event.message.type === 'text') {
          await handleTextMessage(event);
        } else if (event.message.type === 'location') {
          await handleLocation(event);
        }
        break;
      
      case 'postback':
        await handlePostback(event);
        break;
      
      case 'follow':
        await handleFollow(event);
        break;
      
      case 'unfollow':
        await handleUnfollow(event);
        break;
      
      default:
        console.log('Unsupported event type:', event.type);
    }
  } catch (error) {
    console.error('Error processing event:', error);
    // エラー通知をユーザーに送信
    await sendErrorMessage(event.source.userId);
  }
}
```

#### `/lib/line/handlers/text-message-handler.ts`

**責務**: テキストメッセージを受信し、AI処理を実行

```typescript
// lib/line/handlers/text-message-handler.ts
import { MessageEvent } from '@line/bot-sdk';
import { lineClient } from '../client';
import { getOrCreateSession } from '../session-manager';
import { processItineraryCreation } from '../itinerary-processor';

export async function handleTextMessage(event: MessageEvent) {
  const userId = event.source.userId!;
  const userMessage = event.message.type === 'text' ? event.message.text : '';
  
  // セッション取得
  const session = await getOrCreateSession(userId);
  
  // 「考え中...」メッセージを送信
  await lineClient.pushMessage(userId, {
    type: 'text',
    text: '🤔 旅行プランを考えています...',
  });
  
  // AI処理と段階的送信
  await processItineraryCreation(userId, userMessage, session);
}
```

#### `/lib/line/itinerary-processor.ts`

**責務**: AIを使ってしおりを作成し、段階的に送信

```typescript
// lib/line/itinerary-processor.ts
import { streamGeminiResponse } from '@/lib/ai/gemini';
import { LINEStreamParser } from './stream-parser';
import { lineClient } from './client';

export async function processItineraryCreation(
  userId: string,
  userMessage: string,
  session: UserSession
) {
  // ストリームパーサーの初期化
  const parser = new LINEStreamParser({
    onSpotExtracted: async (spot) => {
      // 観光地が抽出されたら即座に送信
      const flexMessage = createSpotFlexMessage(spot);
      await lineClient.pushMessage(userId, flexMessage);
    },
    onMealExtracted: async (meal) => {
      // 食事情報が抽出されたら即座に送信
      const flexMessage = createMealFlexMessage(meal);
      await lineClient.pushMessage(userId, flexMessage);
    },
    onComplete: async (itinerary) => {
      // 完成したしおり全体を保存・送信
      await saveItinerary(userId, itinerary);
      const summaryMessage = createItinerarySummary(itinerary);
      await lineClient.pushMessage(userId, summaryMessage);
    },
  });
  
  // AI応答をストリーミング取得し、パース
  await streamGeminiResponse({
    messages: [...session.messages, { role: 'user', content: userMessage }],
    onChunk: (chunk) => parser.addChunk(chunk),
    onComplete: () => parser.finalize(),
  });
}
```

#### `/lib/line/stream-parser.ts`

**責務**: ストリーミング応答を解析し、カテゴリ別にメッセージを抽出

```typescript
// lib/line/stream-parser.ts
export class LINEStreamParser {
  private buffer: string = '';
  private callbacks: {
    onSpotExtracted?: (spot: SpotMessage) => Promise<void>;
    onMealExtracted?: (meal: SpotMessage) => Promise<void>;
    onComplete?: (itinerary: ItineraryData) => Promise<void>;
  };
  
  constructor(callbacks: typeof this.callbacks) {
    this.callbacks = callbacks;
  }
  
  addChunk(chunk: string) {
    this.buffer += chunk;
    
    // パターンマッチングで観光地を抽出
    const spotPattern = /【観光地】\s*(.+?)\n説明：(.+?)(?:\n|$)/g;
    let match;
    
    while ((match = spotPattern.exec(this.buffer)) !== null) {
      const spot: SpotMessage = {
        type: 'tourist_spot',
        name: match[1].trim(),
        description: match[2].trim(),
      };
      
      this.callbacks.onSpotExtracted?.(spot);
    }
    
    // 同様に食事、歓楽街なども抽出
    // ...
  }
  
  finalize() {
    // 最終的なしおりデータを構築
    const itinerary = this.buildItinerary();
    this.callbacks.onComplete?.(itinerary);
  }
  
  private buildItinerary(): ItineraryData {
    // バッファ全体から完全なしおりを構築
    // ...
  }
}
```

### 3. Data Access Layer

#### `/lib/line/session-manager.ts`

**責務**: ユーザーセッションの管理（会話履歴、状態）

```typescript
// lib/line/session-manager.ts
import { supabase } from '@/lib/db/supabase';

export interface UserSession {
  userId: string;
  lineUserId: string;
  messages: Message[];
  currentItineraryId?: string;
  state: 'idle' | 'planning' | 'detailing';
  createdAt: Date;
  updatedAt: Date;
}

export async function getOrCreateSession(lineUserId: string): Promise<UserSession> {
  // データベースからセッションを取得
  const { data: session } = await supabase
    .from('line_sessions')
    .select('*')
    .eq('line_user_id', lineUserId)
    .single();
  
  if (session) {
    return session;
  }
  
  // 新規セッション作成
  const { data: newSession } = await supabase
    .from('line_sessions')
    .insert({
      line_user_id: lineUserId,
      messages: [],
      state: 'idle',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  return newSession;
}

export async function updateSession(userId: string, updates: Partial<UserSession>) {
  await supabase
    .from('line_sessions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('line_user_id', userId);
}
```

---

## データフロー

### ユーザーメッセージ送信からしおり完成までの流れ

```
1. ユーザーがLINEでメッセージ送信
   「京都に2泊3日で旅行したい」
   
   ↓

2. LINE Platformがwebhookを呼び出し
   POST /api/line/webhook
   
   ↓

3. Signature検証 → 200 OK即座に返す
   
   ↓

4. 非同期でイベント処理開始
   processEventAsync(event)
   
   ↓

5. テキストメッセージハンドラが実行
   handleTextMessage(event)
   
   ├─► セッション取得/作成
   │   getOrCreateSession(userId)
   │
   ├─► 「考え中...」メッセージ送信
   │   lineClient.pushMessage()
   │
   └─► AI処理開始
       processItineraryCreation()
       
       ↓

6. AI応答をストリーミング取得
   streamGeminiResponse()
   
   ├─► チャンクごとにパーサーに渡す
   │   parser.addChunk(chunk)
   │
   └─► パーサーがパターンマッチング
       
       ├─► 観光地を検出
       │   → createSpotFlexMessage()
       │   → lineClient.pushMessage()  ← ユーザーに即座に送信
       │
       ├─► 食事情報を検出
       │   → createMealFlexMessage()
       │   → lineClient.pushMessage()  ← ユーザーに即座に送信
       │
       └─► 歓楽街を検出
           → createEntertainmentFlexMessage()
           → lineClient.pushMessage()  ← ユーザーに即座に送信
   
   ↓

7. AI応答完了
   parser.finalize()
   
   ├─► 完全なしおりデータを構築
   │   buildItinerary()
   │
   ├─► データベースに保存
   │   saveItinerary()
   │
   └─► サマリーメッセージ送信
       createItinerarySummary()
       lineClient.pushMessage()  ← ユーザーに送信
   
   ↓

8. セッション更新
   updateSession()
   
   ↓

9. 完了
```

---

## セッション管理

### セッションの種類

| セッション種類 | 保存場所 | 有効期限 | 用途 |
|-------------|---------|---------|------|
| **会話セッション** | PostgreSQL | 24時間 | メッセージ履歴、状態管理 |
| **ユーザー情報** | PostgreSQL | 永続 | ユーザープロフィール、設定 |
| **一時キャッシュ** | Redis（オプション） | 1時間 | AI応答の一時保存 |

### セッション状態遷移

```
idle（アイドル）
  ↓ ユーザーがメッセージ送信
planning（計画中）
  ↓ 基本情報収集完了
detailing（詳細化中）
  ↓ しおり完成
completed（完了）
  ↓ 24時間後
idle（リセット）
```

---

## データベース設計

### 新規テーブル

#### `line_sessions` テーブル

```sql
CREATE TABLE line_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_user_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]'::jsonb,
  state TEXT DEFAULT 'idle',
  current_itinerary_id UUID REFERENCES itineraries(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_line_sessions_line_user_id ON line_sessions(line_user_id);
CREATE INDEX idx_line_sessions_user_id ON line_sessions(user_id);
```

#### `line_messages` テーブル（ログ用）

```sql
CREATE TABLE line_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_user_id TEXT NOT NULL,
  direction TEXT NOT NULL, -- 'incoming' or 'outgoing'
  message_type TEXT NOT NULL, -- 'text', 'flex', etc.
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_line_messages_line_user_id ON line_messages(line_user_id);
CREATE INDEX idx_line_messages_created_at ON line_messages(created_at);
```

### 既存テーブルの拡張

#### `users` テーブル

```sql
ALTER TABLE users ADD COLUMN line_user_id TEXT UNIQUE;
CREATE INDEX idx_users_line_user_id ON users(line_user_id);
```

---

## 既存コードの再利用戦略

### 再利用可能なコンポーネント

| コンポーネント | ファイル | 再利用率 |
|-------------|---------|---------|
| **AIクライアント** | `/lib/ai/gemini.ts`, `/lib/ai/claude.ts` | 100% |
| **プロンプト** | `/lib/ai/prompts.ts` | 100% |
| **しおりリポジトリ** | `/lib/db/itinerary-repository.ts` | 95% |
| **型定義** | `/types/itinerary.ts` | 90% |
| **ユーティリティ** | `/lib/utils/*.ts` | 80% |

### 再利用の例

```typescript
// Web版とLINE bot版で同じAIロジックを使用
import { streamGeminiResponse } from '@/lib/ai/gemini';
import { getItineraryPrompt } from '@/lib/ai/prompts';

// Web版: SSEでストリーミング応答
export async function POST(req: Request) {
  const stream = await streamGeminiResponse({ ... });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
}

// LINE bot版: 段階的メッセージ送信
export async function processItineraryCreation(...) {
  await streamGeminiResponse({
    onChunk: (chunk) => parser.addChunk(chunk),
  });
}
```

---

## スケーラビリティ

### 負荷対策

| 対策 | 実装 | 効果 |
|------|------|------|
| **水平スケーリング** | Kubernetes ReplicaSet | 同時接続数に応じてPod自動スケール |
| **非同期処理** | バックグラウンドジョブ | Webhook応答時間を最小化 |
| **キャッシュ** | Redis（オプション） | DB負荷軽減 |
| **レート制限** | API Gateway | 過負荷防止 |

### 想定負荷

- **ユーザー数**: 〜10,000人
- **同時接続**: 〜100人
- **メッセージ/秒**: 〜10 msg/s
- **AI処理時間**: 5-10秒/リクエスト

---

## 次のステップ

アーキテクチャを理解したら、次のドキュメントに進んでください：

- **メッセージフォーマットを設計する**: [04_MESSAGE_FORMAT.md](./04_MESSAGE_FORMAT.md)
- **実装を始める**: [05_BACKEND_API.md](./05_BACKEND_API.md)

---

**最終更新**: 2025-10-10  
**関連ドキュメント**: [01_OVERVIEW.md](./01_OVERVIEW.md), [04_MESSAGE_FORMAT.md](./04_MESSAGE_FORMAT.md)
