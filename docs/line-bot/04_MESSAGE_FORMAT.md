# メッセージフォーマット設計

## 📋 目次

1. [概要](#概要)
2. [メッセージタイプの定義](#メッセージタイプの定義)
3. [カテゴリ別フォーマット](#カテゴリ別フォーマット)
4. [Flex Message 設計](#flex-message-設計)
5. [クイックリプライ](#クイックリプライ)
6. [アクションボタン](#アクションボタン)
7. [実装例](#実装例)

---

## 概要

LINE botでは、テキストメッセージだけでなく、Flex Messageを使ってリッチな表現が可能です。Journee botでは、観光地、食事、歓楽街などのカテゴリ別に最適化されたメッセージフォーマットを設計します。

### 設計原則

1. **視認性**: 一目で情報が分かるデザイン
2. **アクション性**: タップで地図表示、詳細確認など
3. **一貫性**: カテゴリ間で統一されたデザイン言語
4. **モバイル最適化**: スマートフォンでの閲覧に最適化

---

## メッセージタイプの定義

### 1. スポット情報メッセージ

観光地、レストラン、歓楽街などの個別スポット情報

### 2. サマリーメッセージ

しおり全体の概要（日程、予算、概要）

### 3. 日程詳細メッセージ

1日ごとの詳細スケジュール

### 4. 確認メッセージ

ユーザーに選択を求めるメッセージ（クイックリプライ付き）

### 5. システムメッセージ

エラー、進捗状況などのシステム通知

---

## カテゴリ別フォーマット

### 観光地（Tourist Spot）

```typescript
export interface TouristSpotMessage {
  type: 'tourist_spot';
  name: string;              // 「清水寺」
  description: string;       // 「京都を代表する歴史的な寺院...」
  time?: string;             // 「10:00 - 12:00」
  duration?: number;         // 120（分）
  budget?: {
    amount: number;          // 400
    currency: string;        // 'JPY'
  };
  location?: {
    lat: number;
    lng: number;
    address: string;         // 「京都府京都市東山区清水1-294」
  };
  imageUrl?: string;         // スポット画像URL
  tags?: string[];           // ['寺院', '世界遺産', '観光名所']
  rating?: number;           // 4.5
}
```

**視覚的イメージ**:
```
┌────────────────────────────┐
│  [スポット画像]              │
├────────────────────────────┤
│ 🏛️ 清水寺                   │
│                            │
│ 京都を代表する歴史的な寺院。│
│ 清水の舞台からの景色は絶景。│
│                            │
│ ⏰ 10:00 - 12:00 (2時間)   │
│ 💰 ¥400                    │
│ 📍 東山区清水1-294          │
│                            │
│ #寺院 #世界遺産 #観光名所   │
├────────────────────────────┤
│ [地図で見る] [詳細を見る]   │
└────────────────────────────┘
```

### レストラン・食事（Restaurant / Meal）

```typescript
export interface RestaurantMessage {
  type: 'restaurant';
  name: string;              // 「京都祇園 萬八」
  description: string;       // 「京懐石の老舗...」
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'cafe';
  time?: string;             // 「12:00 - 13:30」
  budget?: {
    amount: number;          // 5000
    currency: string;        // 'JPY'
  };
  cuisine?: string;          // '京懐石'
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  imageUrl?: string;
  rating?: number;           // 4.8
  mustTryDishes?: string[];  // ['湯豆腐', '懐石コース']
}
```

**視覚的イメージ**:
```
┌────────────────────────────┐
│  [料理画像]                 │
├────────────────────────────┤
│ 🍱 京都祇園 萬八             │
│                            │
│ 京懐石の老舗。季節の食材を  │
│ 使った美しい懐石料理が楽しめる。│
│                            │
│ 🍴 昼食 (ランチ)            │
│ ⏰ 12:00 - 13:30           │
│ 💰 ¥5,000/人              │
│ 📍 祇園町南側570-235       │
│                            │
│ おすすめ: 湯豆腐、懐石コース │
│ ⭐ 4.8                     │
├────────────────────────────┤
│ [地図で見る] [予約する]     │
└────────────────────────────┘
```

### 歓楽街・ナイトスポット（Entertainment）

```typescript
export interface EntertainmentMessage {
  type: 'entertainment';
  name: string;              // 「祇園白川夜桜ライトアップ」
  description: string;       // 「夜桜が美しいエリア...」
  category: 'nightlife' | 'shopping' | 'event' | 'nature';
  time?: string;             // 「18:00 - 21:00」
  budget?: {
    amount: number;
    currency: string;
  };
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  imageUrl?: string;
  ageRestriction?: number;   // 20（20歳以上）
  tips?: string;             // '混雑するため早めの訪問がおすすめ'
}
```

**視覚的イメージ**:
```
┌────────────────────────────┐
│  [ナイトスポット画像]        │
├────────────────────────────┤
│ 🌃 祇園白川夜桜ライトアップ  │
│                            │
│ 夜桜が美しいエリア。白川沿い │
│ の桜が幻想的にライトアップ。 │
│                            │
│ 🎭 イベント                 │
│ ⏰ 18:00 - 21:00           │
│ 💰 無料                    │
│ 📍 祇園白川エリア           │
│                            │
│ 💡 ヒント: 混雑するため早めの│
│    訪問がおすすめ            │
├────────────────────────────┤
│ [地図で見る] [詳細を見る]   │
└────────────────────────────┘
```

### 宿泊施設（Accommodation）

```typescript
export interface AccommodationMessage {
  type: 'accommodation';
  name: string;              // 「京都ホテルオークラ」
  description: string;       // 「京都駅近くの高級ホテル...」
  checkIn?: string;          // 「15:00」
  checkOut?: string;         // 「11:00」
  budget?: {
    amount: number;          // 15000（1泊あたり）
    currency: string;
  };
  roomType?: string;         // 'ダブルルーム'
  amenities?: string[];      // ['WiFi', '朝食付き', '温泉']
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  imageUrl?: string;
  rating?: number;
}
```

---

## Flex Message 設計

### 基本構造

```json
{
  "type": "flex",
  "altText": "スポット情報",
  "contents": {
    "type": "bubble",
    "hero": { /* 画像 */ },
    "body": { /* メインコンテンツ */ },
    "footer": { /* アクションボタン */ }
  }
}
```

### 観光地 Flex Message 実装

```typescript
// lib/line/message-formatters/tourist-spot-formatter.ts
import { FlexMessage } from '@line/bot-sdk';
import { TouristSpotMessage } from '@/types/line-message';

export function createTouristSpotFlexMessage(
  spot: TouristSpotMessage
): FlexMessage {
  return {
    type: 'flex',
    altText: `${spot.name} の情報`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      hero: spot.imageUrl
        ? {
            type: 'image',
            url: spot.imageUrl,
            size: 'full',
            aspectRatio: '20:13',
            aspectMode: 'cover',
            action: {
              type: 'uri',
              uri: spot.imageUrl,
            },
          }
        : undefined,
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          // タイトル
          {
            type: 'text',
            text: `🏛️ ${spot.name}`,
            weight: 'bold',
            size: 'xl',
            color: '#1DB446',
          },
          // 説明
          {
            type: 'text',
            text: spot.description,
            wrap: true,
            color: '#666666',
            size: 'sm',
            margin: 'md',
          },
          // セパレータ
          {
            type: 'separator',
            margin: 'lg',
          },
          // 詳細情報ボックス
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              // 時間
              spot.time
                ? {
                    type: 'box',
                    layout: 'baseline',
                    spacing: 'sm',
                    contents: [
                      {
                        type: 'text',
                        text: '⏰',
                        size: 'sm',
                        flex: 0,
                      },
                      {
                        type: 'text',
                        text: spot.time,
                        wrap: true,
                        color: '#666666',
                        size: 'sm',
                        flex: 5,
                      },
                    ],
                  }
                : undefined,
              // 予算
              spot.budget
                ? {
                    type: 'box',
                    layout: 'baseline',
                    spacing: 'sm',
                    contents: [
                      {
                        type: 'text',
                        text: '💰',
                        size: 'sm',
                        flex: 0,
                      },
                      {
                        type: 'text',
                        text: `¥${spot.budget.amount.toLocaleString()}`,
                        wrap: true,
                        color: '#666666',
                        size: 'sm',
                        flex: 5,
                      },
                    ],
                  }
                : undefined,
              // 場所
              spot.location
                ? {
                    type: 'box',
                    layout: 'baseline',
                    spacing: 'sm',
                    contents: [
                      {
                        type: 'text',
                        text: '📍',
                        size: 'sm',
                        flex: 0,
                      },
                      {
                        type: 'text',
                        text: spot.location.address,
                        wrap: true,
                        color: '#666666',
                        size: 'sm',
                        flex: 5,
                      },
                    ],
                  }
                : undefined,
            ].filter(Boolean),
          },
          // タグ
          spot.tags && spot.tags.length > 0
            ? {
                type: 'box',
                layout: 'horizontal',
                margin: 'md',
                contents: spot.tags.slice(0, 3).map((tag) => ({
                  type: 'text',
                  text: `#${tag}`,
                  size: 'xs',
                  color: '#1DB446',
                  flex: 0,
                  margin: 'xs',
                })),
              }
            : undefined,
        ].filter(Boolean),
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          // 地図で見るボタン
          spot.location
            ? {
                type: 'button',
                style: 'primary',
                color: '#1DB446',
                action: {
                  type: 'uri',
                  label: '地図で見る',
                  uri: `https://www.google.com/maps/search/?api=1&query=${spot.location.lat},${spot.location.lng}`,
                },
              }
            : undefined,
          // 詳細を見るボタン
          {
            type: 'button',
            style: 'link',
            action: {
              type: 'postback',
              label: '詳細を見る',
              data: `action=view_detail&spot_id=${spot.name}`,
              displayText: `${spot.name}の詳細を見る`,
            },
          },
        ].filter(Boolean),
      },
    },
  };
}
```

### レストラン Flex Message 実装

```typescript
// lib/line/message-formatters/restaurant-formatter.ts
export function createRestaurantFlexMessage(
  restaurant: RestaurantMessage
): FlexMessage {
  const mealTypeEmoji = {
    breakfast: '🍳',
    lunch: '🍱',
    dinner: '🍽️',
    cafe: '☕',
  };

  return {
    type: 'flex',
    altText: `${restaurant.name} の情報`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      hero: restaurant.imageUrl
        ? {
            type: 'image',
            url: restaurant.imageUrl,
            size: 'full',
            aspectRatio: '20:13',
            aspectMode: 'cover',
          }
        : undefined,
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          // タイトル
          {
            type: 'text',
            text: `${mealTypeEmoji[restaurant.mealType]} ${restaurant.name}`,
            weight: 'bold',
            size: 'xl',
            color: '#FF6B35',
          },
          // 説明
          {
            type: 'text',
            text: restaurant.description,
            wrap: true,
            color: '#666666',
            size: 'sm',
            margin: 'md',
          },
          // セパレータ
          {
            type: 'separator',
            margin: 'lg',
          },
          // 詳細情報
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              // 料理ジャンル
              restaurant.cuisine
                ? {
                    type: 'box',
                    layout: 'baseline',
                    spacing: 'sm',
                    contents: [
                      {
                        type: 'text',
                        text: '🍴',
                        size: 'sm',
                        flex: 0,
                      },
                      {
                        type: 'text',
                        text: restaurant.cuisine,
                        wrap: true,
                        color: '#666666',
                        size: 'sm',
                        flex: 5,
                      },
                    ],
                  }
                : undefined,
              // 時間
              restaurant.time
                ? {
                    type: 'box',
                    layout: 'baseline',
                    spacing: 'sm',
                    contents: [
                      {
                        type: 'text',
                        text: '⏰',
                        size: 'sm',
                        flex: 0,
                      },
                      {
                        type: 'text',
                        text: restaurant.time,
                        wrap: true,
                        color: '#666666',
                        size: 'sm',
                        flex: 5,
                      },
                    ],
                  }
                : undefined,
              // 予算
              restaurant.budget
                ? {
                    type: 'box',
                    layout: 'baseline',
                    spacing: 'sm',
                    contents: [
                      {
                        type: 'text',
                        text: '💰',
                        size: 'sm',
                        flex: 0,
                      },
                      {
                        type: 'text',
                        text: `¥${restaurant.budget.amount.toLocaleString()}/人`,
                        wrap: true,
                        color: '#666666',
                        size: 'sm',
                        flex: 5,
                      },
                    ],
                  }
                : undefined,
              // 場所
              restaurant.location
                ? {
                    type: 'box',
                    layout: 'baseline',
                    spacing: 'sm',
                    contents: [
                      {
                        type: 'text',
                        text: '📍',
                        size: 'sm',
                        flex: 0,
                      },
                      {
                        type: 'text',
                        text: restaurant.location.address,
                        wrap: true,
                        color: '#666666',
                        size: 'sm',
                        flex: 5,
                      },
                    ],
                  }
                : undefined,
              // おすすめ料理
              restaurant.mustTryDishes && restaurant.mustTryDishes.length > 0
                ? {
                    type: 'box',
                    layout: 'baseline',
                    spacing: 'sm',
                    contents: [
                      {
                        type: 'text',
                        text: '✨',
                        size: 'sm',
                        flex: 0,
                      },
                      {
                        type: 'text',
                        text: `おすすめ: ${restaurant.mustTryDishes.join(', ')}`,
                        wrap: true,
                        color: '#666666',
                        size: 'sm',
                        flex: 5,
                      },
                    ],
                  }
                : undefined,
              // 評価
              restaurant.rating
                ? {
                    type: 'box',
                    layout: 'baseline',
                    spacing: 'sm',
                    contents: [
                      {
                        type: 'text',
                        text: '⭐',
                        size: 'sm',
                        flex: 0,
                      },
                      {
                        type: 'text',
                        text: restaurant.rating.toString(),
                        wrap: true,
                        color: '#666666',
                        size: 'sm',
                        flex: 5,
                      },
                    ],
                  }
                : undefined,
            ].filter(Boolean),
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          // 地図で見るボタン
          restaurant.location
            ? {
                type: 'button',
                style: 'primary',
                color: '#FF6B35',
                action: {
                  type: 'uri',
                  label: '地図で見る',
                  uri: `https://www.google.com/maps/search/?api=1&query=${restaurant.location.lat},${restaurant.location.lng}`,
                },
              }
            : undefined,
          // 予約するボタン
          {
            type: 'button',
            style: 'link',
            action: {
              type: 'postback',
              label: '予約する',
              data: `action=reserve&restaurant_name=${restaurant.name}`,
              displayText: `${restaurant.name}を予約したい`,
            },
          },
        ].filter(Boolean),
      },
    },
  };
}
```

---

## クイックリプライ

ユーザーに選択肢を提示する場合に使用します。

### 使用例: 食事の時間帯選択

```typescript
// lib/line/quick-replies.ts
import { QuickReply, QuickReplyItem } from '@line/bot-sdk';

export function createMealTimeQuickReply(): QuickReply {
  return {
    items: [
      {
        type: 'action',
        action: {
          type: 'message',
          label: '🍳 朝食',
          text: '朝食のおすすめを教えて',
        },
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '🍱 昼食',
          text: '昼食のおすすめを教えて',
        },
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '🍽️ 夕食',
          text: '夕食のおすすめを教えて',
        },
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '☕ カフェ',
          text: 'カフェのおすすめを教えて',
        },
      },
    ],
  };
}

// 使用方法
await lineClient.pushMessage(userId, {
  type: 'text',
  text: 'どの食事をお探しですか？',
  quickReply: createMealTimeQuickReply(),
});
```

### 使用例: 旅行日数選択

```typescript
export function createTripDurationQuickReply(): QuickReply {
  return {
    items: [
      {
        type: 'action',
        action: {
          type: 'message',
          label: '日帰り',
          text: '日帰り旅行',
        },
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '1泊2日',
          text: '1泊2日の旅行',
        },
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '2泊3日',
          text: '2泊3日の旅行',
        },
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '3泊4日以上',
          text: '3泊4日以上の旅行',
        },
      },
    ],
  };
}
```

---

## アクションボタン

### ポストバックアクション

ユーザーのアクションを受け取り、サーバー側で処理します。

```typescript
// Flex Message内のボタン
{
  type: 'button',
  action: {
    type: 'postback',
    label: 'この場所を追加',
    data: JSON.stringify({
      action: 'add_spot',
      spotId: spot.id,
      spotName: spot.name,
    }),
    displayText: `${spot.name}を追加しました`,
  },
}

// サーバー側の処理
// lib/line/handlers/postback-handler.ts
export async function handlePostback(event: PostbackEvent) {
  const userId = event.source.userId!;
  const data = JSON.parse(event.postback.data);
  
  switch (data.action) {
    case 'add_spot':
      await addSpotToItinerary(userId, data.spotId);
      await lineClient.pushMessage(userId, {
        type: 'text',
        text: `${data.spotName}をしおりに追加しました！`,
      });
      break;
    
    case 'reserve':
      // 予約処理
      break;
    
    default:
      console.log('Unknown postback action:', data.action);
  }
}
```

---

## 実装例

### 段階的メッセージ送信の完全な流れ

```typescript
// lib/line/itinerary-processor.ts
export async function processItineraryCreation(
  userId: string,
  userMessage: string,
  session: UserSession
) {
  // 1. 「考え中...」メッセージ
  await lineClient.pushMessage(userId, {
    type: 'text',
    text: '🤔 旅行プランを考えています...',
  });
  
  let spotCount = 0;
  let mealCount = 0;
  
  // 2. ストリームパーサー初期化
  const parser = new LINEStreamParser({
    onSpotExtracted: async (spot) => {
      spotCount++;
      // 観光地情報を即座に送信
      const flexMessage = createTouristSpotFlexMessage(spot);
      await lineClient.pushMessage(userId, flexMessage);
      
      // 進捗メッセージ
      if (spotCount % 3 === 0) {
        await lineClient.pushMessage(userId, {
          type: 'text',
          text: `📍 ${spotCount}箇所の観光地を見つけました！`,
        });
      }
    },
    
    onMealExtracted: async (meal) => {
      mealCount++;
      // 食事情報を即座に送信
      const flexMessage = createRestaurantFlexMessage(meal);
      await lineClient.pushMessage(userId, flexMessage);
    },
    
    onComplete: async (itinerary) => {
      // しおり完成メッセージ
      await lineClient.pushMessage(userId, {
        type: 'text',
        text: `✅ しおりが完成しました！\n観光地: ${spotCount}箇所\n食事: ${mealCount}軒`,
      });
      
      // サマリーを送信
      const summaryMessage = createItinerarySummary(itinerary);
      await lineClient.pushMessage(userId, summaryMessage);
      
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
    },
  });
  
  // 3. AI応答をストリーミング取得
  await streamGeminiResponse({
    messages: [...session.messages, { role: 'user', content: userMessage }],
    onChunk: (chunk) => parser.addChunk(chunk),
    onComplete: () => parser.finalize(),
  });
}
```

---

## Flex Message Simulator でテスト

実装したFlex Messageは、LINE公式の[Flex Message Simulator](https://developers.line.biz/flex-simulator/)でプレビューできます。

### テスト手順

1. Simulatorにアクセス
2. JSON形式のFlex Messageをペースト
3. プレビューで確認
4. 調整してコードに反映

---

## 次のステップ

メッセージフォーマットを理解したら、次のドキュメントに進んでください：

- **バックエンドAPIを実装する**: [05_BACKEND_API.md](./05_BACKEND_API.md)
- **ストリーミング解析を実装する**: [06_STREAMING_PARSER.md](./06_STREAMING_PARSER.md)

---

**最終更新**: 2025-10-10  
**関連ドキュメント**: [03_ARCHITECTURE.md](./03_ARCHITECTURE.md), [05_BACKEND_API.md](./05_BACKEND_API.md)
