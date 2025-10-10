# LINE Bot化の概要と考慮事項

## 📋 目次

1. [概要](#概要)
2. [Web版とLINE bot版の違い](#web版とline-bot版の違い)
3. [主要な技術的考慮事項](#主要な技術的考慮事項)
4. [アーキテクチャの変更点](#アーキテクチャの変更点)
5. [実装フェーズ](#実装フェーズ)

---

## 概要

Journee Web版は、ブラウザ上でチャット形式でAIと対話しながら旅行のしおりを作成するアプリケーションです。これをLINE botとして実装することで、以下のような利点が得られます：

### LINE bot化の主な利点

| 利点 | 説明 |
|------|------|
| **アクセシビリティ** | ユーザーは専用アプリをダウンロードする必要がなく、LINEから直接利用可能 |
| **モバイル最適化** | スマートフォンでの利用を前提とした設計 |
| **プッシュ通知** | しおり完成、旅行のリマインダーなどを能動的に通知可能 |
| **共有機能** | LINEの友達やグループに簡単にしおりを共有 |
| **音声入力** | LINEの音声入力機能を活用した便利な入力 |

### LINE bot化の制約

| 制約 | 影響 | 対応策 |
|------|------|--------|
| **ストリーミング不可** | リアルタイムでのメッセージ更新ができない | 段階的にメッセージを送信する設計に変更 |
| **メッセージ形式制限** | Flex Messageなど、LINE独自のフォーマットを使用 | リッチなUIをFlex Messageで実現 |
| **応答時間制限** | Webhookは30秒以内に応答が必要 | 非同期処理＋「考え中...」メッセージで対応 |
| **UIの制約** | Web版のような自由なレイアウトは不可 | LINEの制約内で最適なUXを設計 |

---

## Web版とLINE bot版の違い

### 1. インタラクションモデル

#### Web版
```
ユーザー → チャット入力 → WebSocket/SSE → ストリーミング応答 → リアルタイム更新
```

- **特徴**: リアルタイムでAIの思考過程が見える
- **実装**: `/api/chat`エンドポイントでストリーミング応答
- **技術**: Server-Sent Events (SSE)

#### LINE bot版
```
ユーザー → LINEメッセージ → Webhook → バッチ処理 → 段階的送信 → 複数メッセージ
```

- **特徴**: 完成した情報を小出しに送信
- **実装**: `/api/line/webhook`エンドポイントで受信、非同期処理
- **技術**: LINE Messaging API（Reply API / Push API）

### 2. UIレイアウト

#### Web版
- **レイアウト**: リサイズ可能な2カラムレイアウト（チャット＋しおりプレビュー）
- **コンポーネント**: React コンポーネントで自由な配置
- **インタラクション**: クリック、ドラッグ、ホバーなど豊富

#### LINE bot版
- **レイアウト**: 縦スクロールのメッセージリスト
- **コンポーネント**: Flex Messageによるカード型UI
- **インタラクション**: タップ、クイックリプライ、ポストバックアクションに限定

### 3. セッション管理

#### Web版
```typescript
// Zustandグローバルストア + NextAuth セッション
const { currentItinerary, messages } = useStore();
const { data: session } = useSession();
```

- **状態管理**: クライアントサイドZustand + LocalStorage
- **認証**: NextAuth.js (Google OAuth)
- **永続化**: Supabase PostgreSQL

#### LINE bot版
```typescript
// LINE User ID ベースのセッション管理
const userId = event.source.userId;
const session = await getOrCreateUserSession(userId);
```

- **状態管理**: サーバーサイドのみ（データベース）
- **認証**: LINE User IDによる自動認証
- **永続化**: Supabase PostgreSQL（同じスキーマを活用）

---

## 主要な技術的考慮事項

### 1. ストリーミング処理から段階的送信への変更

#### 問題
LINEではメッセージを一つずつ送ることしかできず、既存のストリーミングレスポンスをそのまま使えない。

#### 解決策：段階的送信アーキテクチャ

```typescript
// バックエンドでストリーミング応答をバッファリング
const streamParser = new LINEStreamParser({
  onSpotExtracted: async (spot) => {
    // 観光地が抽出されたら即座にLINEに送信
    await lineClient.pushMessage(userId, createSpotMessage(spot));
  },
  onMealExtracted: async (meal) => {
    // 食事情報が抽出されたら即座にLINEに送信
    await lineClient.pushMessage(userId, createMealMessage(meal));
  },
  onComplete: async (itinerary) => {
    // 完成したしおり全体を送信
    await lineClient.pushMessage(userId, createItinerarySummary(itinerary));
  }
});

// AIストリーミング応答を解析しながら段階的に送信
await processAIStream(userMessage, streamParser);
```

**メリット:**
- ユーザーは待ち時間を感じにくい
- 段階的に情報が届くため、リアルタイム感がある
- バッファリングによりメッセージの品質を保証

### 2. メッセージフォーマットの標準化

#### 問題
観光地、食事、歓楽街など、異なるカテゴリの情報を統一的に扱う必要がある。

#### 解決策：カテゴリ別テンプレート

```typescript
// types/line-message.ts
export interface SpotMessage {
  type: 'tourist_spot' | 'restaurant' | 'entertainment' | 'accommodation';
  name: string;
  description: string;
  time?: string;
  budget?: number;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  imageUrl?: string;
  tags?: string[];
}

// lib/line/message-formatter.ts
export function createSpotFlexMessage(spot: SpotMessage): FlexMessage {
  return {
    type: 'flex',
    altText: `${spot.name} の情報`,
    contents: {
      type: 'bubble',
      hero: spot.imageUrl ? {
        type: 'image',
        url: spot.imageUrl,
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover'
      } : undefined,
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: getCategoryIcon(spot.type) + ' ' + spot.name,
            weight: 'bold',
            size: 'xl'
          },
          {
            type: 'text',
            text: spot.description,
            wrap: true,
            color: '#666666',
            size: 'sm'
          },
          // ... 時間、予算、位置情報など
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '地図で見る',
              uri: `https://maps.google.com/?q=${spot.location.lat},${spot.location.lng}`
            }
          }
        ]
      }
    }
  };
}
```

### 3. Webhook応答時間制限への対応

#### 問題
LINE Webhookは30秒以内に応答する必要があるが、AI処理には時間がかかる。

#### 解決策：非同期処理パターン

```typescript
// app/api/line/webhook/route.ts
export async function POST(req: Request) {
  const signature = req.headers.get('x-line-signature');
  const body = await req.text();
  
  // 署名検証
  if (!validateSignature(body, signature)) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const events = JSON.parse(body).events;
  
  // 即座に200 OKを返す
  res.status(200).json({ success: true });
  
  // バックグラウンドで非同期処理
  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      // 非同期処理（await しない）
      processMessageAsync(event).catch(console.error);
    }
  }
}

async function processMessageAsync(event: WebhookEvent) {
  const userId = event.source.userId;
  const userMessage = event.message.text;
  
  // 「考え中...」メッセージを送信
  await lineClient.pushMessage(userId, {
    type: 'text',
    text: '🤔 旅行プランを考えています...'
  });
  
  // AI処理と段階的送信
  await processItineraryCreation(userId, userMessage);
}
```

### 4. ユーザー識別とセッション管理

#### 問題
Web版ではNextAuth.jsによるGoogle認証を使用しているが、LINE botではLINE User IDを使用する。

#### 解決策：統一ユーザー管理

```typescript
// lib/db/user-repository.ts
export async function getOrCreateLineUser(lineUserId: string, profile: LineProfile) {
  // LINE User IDからユーザーを検索
  let user = await supabase
    .from('users')
    .select('*')
    .eq('line_user_id', lineUserId)
    .single();
  
  if (!user.data) {
    // 新規ユーザー作成
    user = await supabase
      .from('users')
      .insert({
        line_user_id: lineUserId,
        name: profile.displayName,
        image: profile.pictureUrl,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
  }
  
  return user.data;
}

// データベーススキーマ拡張
/*
ALTER TABLE users ADD COLUMN line_user_id TEXT UNIQUE;
CREATE INDEX idx_users_line_user_id ON users(line_user_id);
*/
```

---

## アーキテクチャの変更点

### 既存コンポーネントの再利用

| コンポーネント | Web版 | LINE bot版 | 再利用可能性 |
|--------------|-------|-----------|------------|
| **AIロジック** | `/lib/ai/gemini.ts`, `/lib/ai/claude.ts` | 同じファイルを使用 | ✅ 100% |
| **プロンプト** | `/lib/ai/prompts.ts` | 同じファイルを使用 | ✅ 100% |
| **データベース** | `/lib/db/itinerary-repository.ts` | 同じファイルを使用 | ✅ 95%（一部追加） |
| **型定義** | `/types/itinerary.ts` | 同じファイルを使用 | ✅ 90%（LINE専用型追加） |
| **UIコンポーネント** | `/components/**/*.tsx` | 使用不可 | ❌ 0% |
| **状態管理** | `/lib/store/useStore.ts` | 使用不可 | ❌ 0% |

### 新規追加コンポーネント

```
/app/api/line/
├── webhook/
│   └── route.ts                    # Webhook受信エンドポイント
├── rich-menu/
│   └── route.ts                    # リッチメニュー設定API
└── broadcast/
    └── route.ts                    # 一斉配信API（管理者用）

/lib/line/
├── client.ts                       # LINE Bot SDK クライアント初期化
├── message-formatter.ts            # Flex Message生成
├── stream-parser.ts                # ストリーミング→段階的送信変換
├── session-manager.ts              # ユーザーセッション管理
└── handlers/
    ├── text-message-handler.ts     # テキストメッセージ処理
    ├── postback-handler.ts         # ポストバックアクション処理
    └── follow-handler.ts           # 友だち追加イベント処理

/types/
└── line.ts                         # LINE bot専用型定義
```

---

## 実装フェーズ

### Phase 1: 基本セットアップ（1-2日）

- [ ] LINE Developersアカウント作成
- [ ] Messaging APIチャネル作成
- [ ] 基本的なWebhook応答実装
- [ ] オウム返しbotで動作確認

### Phase 2: メッセージフォーマット設計（2-3日）

- [ ] Flex Messageテンプレート作成
- [ ] カテゴリ別フォーマッタ実装
- [ ] 画像・地図表示対応
- [ ] クイックリプライ設計

### Phase 3: AI統合（3-5日）

- [ ] 既存AIロジックの活用
- [ ] ストリーミング解析パーサー実装
- [ ] 段階的送信ロジック実装
- [ ] エラーハンドリング

### Phase 4: データベース統合（2-3日）

- [ ] ユーザー管理テーブル拡張
- [ ] セッション管理実装
- [ ] しおり保存・読み込み機能
- [ ] 共有機能実装

### Phase 5: リッチ機能（3-5日）

- [ ] リッチメニュー実装
- [ ] プッシュ通知機能
- [ ] 画像アップロード対応
- [ ] 位置情報共有対応

### Phase 6: テストとデプロイ（2-3日）

- [ ] E2Eテスト実装
- [ ] 本番環境へのデプロイ
- [ ] Webhook URL設定
- [ ] モニタリング設定

**合計想定期間**: 13-21日

---

## 次のステップ

この概要を理解したら、次は以下のドキュメントに進んでください：

1. **すぐに始めたい方**: [02_REGISTRATION.md](./02_REGISTRATION.md) - LINE Developers登録
2. **設計を深く理解したい方**: [03_ARCHITECTURE.md](./03_ARCHITECTURE.md) - アーキテクチャ詳細

---

**最終更新**: 2025-10-10  
**関連ドキュメント**: [README.md](./README.md), [03_ARCHITECTURE.md](./03_ARCHITECTURE.md)
