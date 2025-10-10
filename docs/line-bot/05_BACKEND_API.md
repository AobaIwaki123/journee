# バックエンドAPI実装ガイド

## 📋 目次

1. [概要](#概要)
2. [必要なパッケージ](#必要なパッケージ)
3. [環境変数設定](#環境変数設定)
4. [LINEクライアント初期化](#lineクライアント初期化)
5. [Webhookエンドポイント実装](#webhookエンドポイント実装)
6. [イベントハンドラ実装](#イベントハンドラ実装)
7. [メッセージ送信実装](#メッセージ送信実装)
8. [エラーハンドリング](#エラーハンドリング)

---

## 概要

LINE bot用のバックエンドAPIを実装します。既存のAIロジックを最大限再利用しつつ、LINEプラットフォームに最適化した処理を追加します。

---

## 必要なパッケージ

### パッケージインストール

```bash
npm install @line/bot-sdk
```

### `package.json` への追加

```json
{
  "dependencies": {
    "@line/bot-sdk": "^8.0.0"
  }
}
```

---

## 環境変数設定

### `.env.local`

```bash
# LINE Bot設定
LINE_CHANNEL_SECRET=your_channel_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here

# 既存の環境変数
GEMINI_API_KEY=your_gemini_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### `next.config.js` への追加

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
    LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  },
  // ... 既存の設定
};

module.exports = nextConfig;
```

---

## LINEクライアント初期化

### `/lib/line/client.ts`

```typescript
// lib/line/client.ts
import { Client } from '@line/bot-sdk';

if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
  throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not defined');
}

if (!process.env.LINE_CHANNEL_SECRET) {
  throw new Error('LINE_CHANNEL_SECRET is not defined');
}

export const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

export const lineClient = new Client(lineConfig);
```

### 署名検証ユーティリティ

```typescript
// lib/line/signature-validator.ts
import crypto from 'crypto';

export function validateSignature(
  body: string,
  signature: string | null,
  channelSecret: string
): boolean {
  if (!signature) {
    return false;
  }

  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');

  return hash === signature;
}
```

---

## Webhookエンドポイント実装

### `/app/api/line/webhook/route.ts`

```typescript
// app/api/line/webhook/route.ts
import { WebhookEvent } from '@line/bot-sdk';
import { validateSignature } from '@/lib/line/signature-validator';
import { processEventAsync } from '@/lib/line/event-processor';

export async function POST(req: Request) {
  try {
    // リクエストボディを取得
    const body = await req.text();
    const signature = req.headers.get('x-line-signature');

    // 署名検証
    if (!validateSignature(body, signature, process.env.LINE_CHANNEL_SECRET!)) {
      console.error('Invalid signature');
      return new Response('Unauthorized', { status: 401 });
    }

    // Webhookボディをパース
    const webhookBody = JSON.parse(body);
    const events: WebhookEvent[] = webhookBody.events;

    // 各イベントを非同期で処理
    // 注: Next.jsではバックグラウンド処理に制限があるため、
    // 本番環境ではキューシステム（BullMQ等）の使用を検討
    events.forEach((event) => {
      processEventAsync(event).catch((error) => {
        console.error('Error processing event:', error);
      });
    });

    // 即座に200 OKを返す（LINEの要件）
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// GETリクエスト（ヘルスチェック用）
export async function GET() {
  return new Response('LINE Webhook is running', { status: 200 });
}
```

---

## イベントハンドラ実装

### イベントプロセッサ

```typescript
// lib/line/event-processor.ts
import { WebhookEvent } from '@line/bot-sdk';
import { handleTextMessage } from './handlers/text-message-handler';
import { handlePostback } from './handlers/postback-handler';
import { handleFollow } from './handlers/follow-handler';
import { handleUnfollow } from './handlers/unfollow-handler';
import { handleLocation } from './handlers/location-handler';

export async function processEventAsync(event: WebhookEvent) {
  try {
    console.log('Processing event:', event.type);

    switch (event.type) {
      case 'message':
        if (event.message.type === 'text') {
          await handleTextMessage(event);
        } else if (event.message.type === 'location') {
          await handleLocation(event);
        } else {
          console.log('Unsupported message type:', event.message.type);
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
    console.error('Error in processEventAsync:', error);
    
    // エラーメッセージをユーザーに送信
    if ('source' in event && event.source.userId) {
      await sendErrorMessage(event.source.userId);
    }
  }
}

async function sendErrorMessage(userId: string) {
  const { lineClient } = await import('./client');
  
  await lineClient.pushMessage(userId, {
    type: 'text',
    text: '申し訳ございません。エラーが発生しました。\nもう一度お試しください。',
  });
}
```

### テキストメッセージハンドラ

```typescript
// lib/line/handlers/text-message-handler.ts
import { MessageEvent } from '@line/bot-sdk';
import { lineClient } from '../client';
import { getOrCreateSession, updateSession } from '../session-manager';
import { processItineraryCreation } from '../itinerary-processor';

export async function handleTextMessage(event: MessageEvent) {
  if (event.message.type !== 'text') {
    return;
  }

  const userId = event.source.userId!;
  const userMessage = event.message.text;

  console.log(`Received message from ${userId}: ${userMessage}`);

  // セッション取得または作成
  const session = await getOrCreateSession(userId);

  // コマンド処理
  if (userMessage.startsWith('/')) {
    await handleCommand(userId, userMessage, session);
    return;
  }

  // メッセージ履歴に追加
  session.messages.push({
    id: event.message.id,
    role: 'user',
    content: userMessage,
    timestamp: new Date(event.timestamp),
  });

  await updateSession(userId, { messages: session.messages });

  // 「考え中...」メッセージを送信
  await lineClient.pushMessage(userId, {
    type: 'text',
    text: '🤔 旅行プランを考えています...',
  });

  // AI処理と段階的送信
  await processItineraryCreation(userId, userMessage, session);
}

async function handleCommand(
  userId: string,
  command: string,
  session: UserSession
) {
  switch (command.toLowerCase()) {
    case '/help':
      await lineClient.pushMessage(userId, {
        type: 'text',
        text: `📚 ヘルプ\n\n` +
          `【使い方】\n` +
          `「京都に2泊3日で旅行したい」などと送信してください。\n\n` +
          `【コマンド】\n` +
          `/help - ヘルプを表示\n` +
          `/reset - 会話をリセット\n` +
          `/list - 保存したしおりを表示`,
      });
      break;

    case '/reset':
      // セッションをリセット
      await updateSession(userId, {
        messages: [],
        state: 'idle',
        currentItineraryId: undefined,
      });
      await lineClient.pushMessage(userId, {
        type: 'text',
        text: '🔄 会話をリセットしました。\n新しい旅行プランを教えてください！',
      });
      break;

    case '/list':
      // 保存したしおり一覧を表示
      await showSavedItineraries(userId);
      break;

    default:
      await lineClient.pushMessage(userId, {
        type: 'text',
        text: `❓ 不明なコマンドです: ${command}\n/help でヘルプを表示できます。`,
      });
  }
}
```

### ポストバックハンドラ

```typescript
// lib/line/handlers/postback-handler.ts
import { PostbackEvent } from '@line/bot-sdk';
import { lineClient } from '../client';
import { addSpotToItinerary, removeSpotFromItinerary } from '../itinerary-manager';

export async function handlePostback(event: PostbackEvent) {
  const userId = event.source.userId!;
  const postbackData = event.postback.data;

  console.log(`Received postback from ${userId}: ${postbackData}`);

  // データをパース
  const data = parsePostbackData(postbackData);

  switch (data.action) {
    case 'add_spot':
      await handleAddSpot(userId, data);
      break;

    case 'remove_spot':
      await handleRemoveSpot(userId, data);
      break;

    case 'view_detail':
      await handleViewDetail(userId, data);
      break;

    case 'reserve':
      await handleReserve(userId, data);
      break;

    case 'share':
      await handleShare(userId, data);
      break;

    default:
      console.log('Unknown postback action:', data.action);
  }
}

function parsePostbackData(data: string): any {
  try {
    // JSON形式
    return JSON.parse(data);
  } catch {
    // クエリパラメータ形式 (action=add_spot&spot_id=123)
    const params = new URLSearchParams(data);
    const result: any = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}

async function handleAddSpot(userId: string, data: any) {
  try {
    await addSpotToItinerary(userId, data.spotId);
    
    await lineClient.pushMessage(userId, {
      type: 'text',
      text: `✅ ${data.spotName || 'スポット'}をしおりに追加しました！`,
    });
  } catch (error) {
    console.error('Error adding spot:', error);
    
    await lineClient.pushMessage(userId, {
      type: 'text',
      text: '❌ スポットの追加に失敗しました。',
    });
  }
}

async function handleRemoveSpot(userId: string, data: any) {
  // 同様の実装
}

async function handleViewDetail(userId: string, data: any) {
  // 詳細表示の実装
}

async function handleReserve(userId: string, data: any) {
  // 予約処理の実装（外部サービス連携）
}

async function handleShare(userId: string, data: any) {
  // しおり共有の実装
}
```

### フォロー/アンフォローハンドラ

```typescript
// lib/line/handlers/follow-handler.ts
import { FollowEvent } from '@line/bot-sdk';
import { lineClient } from '../client';
import { getOrCreateLineUser } from '@/lib/db/user-repository';

export async function handleFollow(event: FollowEvent) {
  const userId = event.source.userId!;

  console.log(`New follower: ${userId}`);

  // ユーザープロフィールを取得
  try {
    const profile = await lineClient.getProfile(userId);
    
    // データベースにユーザーを登録
    await getOrCreateLineUser(userId, profile);

    // ウェルカムメッセージを送信
    await lineClient.pushMessage(userId, [
      {
        type: 'text',
        text: `こんにちは、${profile.displayName}さん！👋\n\n` +
          `Journee botへようこそ🗺️\n\n` +
          `私はAIとともに旅のしおりを作成するbotです。\n` +
          `行きたい場所や日程を教えていただければ、\n` +
          `最適な旅行プランをご提案します！`,
      },
      {
        type: 'text',
        text: `【使い方】\n\n` +
          `例: 「京都に2泊3日で旅行したい」\n` +
          `例: 「大阪でグルメを楽しみたい」\n` +
          `例: 「沖縄に家族で行きたい」\n\n` +
          `どこへ行きたいですか？`,
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'message',
                label: '🗾 国内旅行',
                text: '国内旅行のプランを作りたい',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '✈️ 海外旅行',
                text: '海外旅行のプランを作りたい',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '📚 ヘルプ',
                text: '/help',
              },
            },
          ],
        },
      },
    ]);
  } catch (error) {
    console.error('Error in handleFollow:', error);
  }
}
```

```typescript
// lib/line/handlers/unfollow-handler.ts
import { UnfollowEvent } from '@line/bot-sdk';
import { supabase } from '@/lib/db/supabase';

export async function handleUnfollow(event: UnfollowEvent) {
  const userId = event.source.userId!;

  console.log(`User unfollowed: ${userId}`);

  // セッションをクリーンアップ（オプション）
  try {
    await supabase
      .from('line_sessions')
      .delete()
      .eq('line_user_id', userId);
  } catch (error) {
    console.error('Error cleaning up session:', error);
  }
}
```

### 位置情報ハンドラ

```typescript
// lib/line/handlers/location-handler.ts
import { MessageEvent } from '@line/bot-sdk';
import { lineClient } from '../client';

export async function handleLocation(event: MessageEvent) {
  if (event.message.type !== 'location') {
    return;
  }

  const userId = event.source.userId!;
  const location = event.message;

  console.log(`Received location from ${userId}:`, location);

  // 位置情報を使って近くのスポットを提案
  await lineClient.pushMessage(userId, {
    type: 'text',
    text: `📍 位置情報を受け取りました！\n\n` +
      `住所: ${location.address}\n` +
      `緯度: ${location.latitude}\n` +
      `経度: ${location.longitude}\n\n` +
      `この近くのおすすめスポットを探します...`,
  });

  // TODO: 近くのスポットを検索して提案
}
```

---

## メッセージ送信実装

### しおり処理プロセッサ

```typescript
// lib/line/itinerary-processor.ts
import { streamGeminiResponse } from '@/lib/ai/gemini';
import { getItineraryPrompt } from '@/lib/ai/prompts';
import { LINEStreamParser } from './stream-parser';
import { lineClient } from './client';
import { UserSession } from './session-manager';
import {
  createTouristSpotFlexMessage,
  createRestaurantFlexMessage,
  createEntertainmentFlexMessage,
  createItinerarySummary,
} from './message-formatters';

export async function processItineraryCreation(
  userId: string,
  userMessage: string,
  session: UserSession
) {
  let spotCount = 0;
  let mealCount = 0;
  let entertainmentCount = 0;

  // ストリームパーサーの初期化
  const parser = new LINEStreamParser({
    onSpotExtracted: async (spot) => {
      spotCount++;
      console.log(`Extracted spot: ${spot.name}`);

      // 観光地情報を即座に送信
      const flexMessage = createTouristSpotFlexMessage(spot);
      await lineClient.pushMessage(userId, flexMessage);

      // 進捗メッセージ（3箇所ごと）
      if (spotCount % 3 === 0) {
        await lineClient.pushMessage(userId, {
          type: 'text',
          text: `📍 ${spotCount}箇所の観光地を見つけました！`,
        });
      }
    },

    onMealExtracted: async (meal) => {
      mealCount++;
      console.log(`Extracted meal: ${meal.name}`);

      // 食事情報を即座に送信
      const flexMessage = createRestaurantFlexMessage(meal);
      await lineClient.pushMessage(userId, flexMessage);
    },

    onEntertainmentExtracted: async (entertainment) => {
      entertainmentCount++;
      console.log(`Extracted entertainment: ${entertainment.name}`);

      // 歓楽街情報を即座に送信
      const flexMessage = createEntertainmentFlexMessage(entertainment);
      await lineClient.pushMessage(userId, flexMessage);
    },

    onComplete: async (itinerary) => {
      console.log('Itinerary creation completed');

      // しおり完成メッセージ
      await lineClient.pushMessage(userId, {
        type: 'text',
        text: `✅ しおりが完成しました！\n\n` +
          `📍 観光地: ${spotCount}箇所\n` +
          `🍱 食事: ${mealCount}軒\n` +
          `🌃 歓楽街: ${entertainmentCount}箇所`,
      });

      // サマリーメッセージを送信
      const summaryMessage = createItinerarySummary(itinerary);
      await lineClient.pushMessage(userId, summaryMessage);

      // データベースに保存
      try {
        const savedItinerary = await saveItinerary(userId, itinerary);
        
        // アクションを促すクイックリプライ
        await lineClient.pushMessage(userId, {
          type: 'text',
          text: '次に何をしますか？',
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: '📥 しおりを保存',
                  text: 'しおりを保存',
                },
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: '📤 友達に共有',
                  text: 'しおりを共有',
                },
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: '✏️ 編集する',
                  text: 'しおりを編集',
                },
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: '🔄 もう一度作成',
                  text: '新しいしおりを作成',
                },
              },
            ],
          },
        });

        // セッションを更新
        await updateSession(userId, {
          currentItineraryId: savedItinerary.id,
          state: 'completed',
        });
      } catch (error) {
        console.error('Error saving itinerary:', error);
        
        await lineClient.pushMessage(userId, {
          type: 'text',
          text: '⚠️ しおりの保存に失敗しました。',
        });
      }
    },
  });

  try {
    // AI応答をストリーミング取得
    const messages = [
      ...session.messages,
      { role: 'user' as const, content: userMessage },
    ];

    const prompt = getItineraryPrompt(messages);

    await streamGeminiResponse({
      prompt,
      onChunk: (chunk) => {
        parser.addChunk(chunk);
      },
      onComplete: () => {
        parser.finalize();
      },
      onError: async (error) => {
        console.error('Streaming error:', error);
        
        await lineClient.pushMessage(userId, {
          type: 'text',
          text: '❌ AI処理中にエラーが発生しました。\nもう一度お試しください。',
        });
      },
    });
  } catch (error) {
    console.error('Error in processItineraryCreation:', error);
    
    await lineClient.pushMessage(userId, {
      type: 'text',
      text: '❌ エラーが発生しました。\nもう一度お試しください。',
    });
  }
}

async function saveItinerary(userId: string, itinerary: ItineraryData) {
  const { saveItinerary } = await import('@/lib/db/itinerary-repository');
  
  // LINE User IDからユーザー情報を取得
  const { supabase } = await import('@/lib/db/supabase');
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('line_user_id', userId)
    .single();

  if (!user) {
    throw new Error('User not found');
  }

  return await saveItinerary(user.id, itinerary);
}
```

---

## エラーハンドリング

### グローバルエラーハンドラ

```typescript
// lib/line/error-handler.ts
import { lineClient } from './client';

export class LINEBotError extends Error {
  constructor(
    message: string,
    public userId?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'LINEBotError';
  }
}

export async function handleError(error: Error, userId?: string) {
  console.error('LINEBotError:', error);

  // ユーザーにエラーメッセージを送信
  if (userId) {
    try {
      await lineClient.pushMessage(userId, {
        type: 'text',
        text: '申し訳ございません。エラーが発生しました。\n' +
          'しばらくしてからもう一度お試しください。\n\n' +
          'エラーが続く場合は /help でヘルプをご覧ください。',
      });
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }

  // エラーログをデータベースに保存（オプション）
  // await logError(error, userId);
}

// レート制限エラー処理
export async function handleRateLimitError(userId: string) {
  await lineClient.pushMessage(userId, {
    type: 'text',
    text: '⚠️ リクエストが多すぎます。\n' +
      'しばらく待ってからもう一度お試しください。',
  });
}

// タイムアウトエラー処理
export async function handleTimeoutError(userId: string) {
  await lineClient.pushMessage(userId, {
    type: 'text',
    text: '⏱️ 処理に時間がかかりすぎています。\n' +
      'もう一度お試しください。',
  });
}
```

---

## 次のステップ

バックエンドAPIの実装方法を理解したら、次のドキュメントに進んでください：

- **ストリーミング解析を実装する**: [06_STREAMING_PARSER.md](./06_STREAMING_PARSER.md)
- **デプロイする**: [07_DEPLOYMENT.md](./07_DEPLOYMENT.md)

---

**最終更新**: 2025-10-10  
**関連ドキュメント**: [04_MESSAGE_FORMAT.md](./04_MESSAGE_FORMAT.md), [06_STREAMING_PARSER.md](./06_STREAMING_PARSER.md)
