# Phase 3: AI API 実装ドキュメント

このドキュメントは、Phase 3で実装されたAI機能APIの使用方法を説明します。

## 📁 実装ファイル

### 型定義
- `types/chat.ts` - チャット関連の型定義
- `types/itinerary.ts` - 旅のしおり関連の型定義
- `types/api.ts` - API関連の型定義

### AIライブラリ
- `lib/ai/prompts.ts` - プロンプトテンプレートとパース処理
- `lib/ai/gemini.ts` - Google Gemini API統合

### APIルート
- `app/api/chat/route.ts` - チャットAPIエンドポイント

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、Gemini APIキーを設定：

```bash
cp .env.example .env.local
```

`.env.local`を編集：

```
GEMINI_API_KEY=your_actual_gemini_api_key
```

### 3. Gemini APIキーの取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey)にアクセス
2. Googleアカウントでログイン
3. "Get API Key"をクリック
4. 生成されたAPIキーをコピーして`.env.local`に設定

## 📡 API エンドポイント

### POST /api/chat

チャットメッセージを送信してAIの応答を取得します。

#### リクエスト

```typescript
{
  "message": "東京で3日間の旅行計画を立てたいです",
  "chatHistory": [
    {
      "id": "msg-1",
      "role": "user",
      "content": "こんにちは",
      "timestamp": "2025-10-07T10:00:00.000Z"
    },
    {
      "id": "msg-2",
      "role": "assistant",
      "content": "こんにちは！旅行計画のお手伝いをします。",
      "timestamp": "2025-10-07T10:00:01.000Z"
    }
  ],
  "currentItinerary": {
    // 既存のしおりデータ（オプション）
  },
  "model": "gemini",
  "stream": false
}
```

#### レスポンス（非ストリーミング）

```typescript
{
  "message": "東京での3日間の旅行、素敵ですね！...",
  "itinerary": {
    "id": "itinerary-1234567890",
    "title": "東京3日間の旅",
    "destination": "東京",
    "startDate": "2025-11-01",
    "endDate": "2025-11-03",
    "duration": 3,
    "schedule": [
      {
        "day": 1,
        "date": "2025-11-01",
        "title": "1日目: 浅草・スカイツリー観光",
        "spots": [
          {
            "id": "spot-1",
            "name": "浅草寺",
            "description": "東京最古の寺院",
            "scheduledTime": "10:00",
            "duration": 90,
            "category": "sightseeing",
            "estimatedCost": 0
          }
        ]
      }
    ],
    "status": "draft",
    "createdAt": "2025-10-07T10:00:00.000Z",
    "updatedAt": "2025-10-07T10:00:00.000Z"
  },
  "model": "gemini"
}
```

#### レスポンス（ストリーミング）

`stream: true`を指定すると、Server-Sent Events (SSE)形式でストリーミングレスポンスを返します。

```
data: {"type":"message","content":"東京での"}
data: {"type":"message","content":"3日間の旅"}
data: {"type":"itinerary","itinerary":{...}}
data: {"type":"done"}
```

## 💻 使用例

### 1. 非ストリーミングリクエスト

```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: '京都で2日間の旅行計画を立てたいです',
    model: 'gemini',
    stream: false,
  }),
});

const data = await response.json();
console.log(data.message); // AIの応答
console.log(data.itinerary); // 生成されたしおりデータ
```

### 2. ストリーミングリクエスト

```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: '大阪で3日間の旅行計画を立てたいです',
    model: 'gemini',
    stream: true,
  }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      
      if (data.type === 'message') {
        console.log('Chunk:', data.content);
      } else if (data.type === 'itinerary') {
        console.log('Itinerary:', data.itinerary);
      } else if (data.type === 'done') {
        console.log('Done!');
      }
    }
  }
}
```

### 3. チャット履歴を含むリクエスト

```typescript
const chatHistory = [
  {
    id: 'msg-1',
    role: 'user',
    content: '北海道に行きたいです',
    timestamp: new Date('2025-10-07T10:00:00'),
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: '北海道、良いですね！何日間の旅行を予定されていますか？',
    timestamp: new Date('2025-10-07T10:00:01'),
  },
];

const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: '3日間で札幌と小樽を回りたいです',
    chatHistory,
    model: 'gemini',
  }),
});
```

### 4. 既存のしおりを更新

```typescript
const currentItinerary = {
  id: 'itinerary-123',
  title: '北海道3日間の旅',
  destination: '北海道',
  schedule: [
    // 既存のスケジュール
  ],
  status: 'draft',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: '2日目に旭山動物園を追加してください',
    currentItinerary,
    model: 'gemini',
  }),
});
```

## 🔧 ライブラリ直接使用

APIルートを経由せず、サーバーサイドで直接Geminiクライアントを使用することも可能です。

```typescript
import { sendGeminiMessage, streamGeminiMessage } from '@/lib/ai/gemini';

// 非ストリーミング
const result = await sendGeminiMessage(
  '福岡で2日間の旅行計画を立てたいです',
  [],
  undefined
);

// ストリーミング
for await (const chunk of streamGeminiMessage(
  '沖縄で5日間の旅行計画を立てたいです',
  [],
  undefined
)) {
  console.log('Chunk:', chunk);
}
```

## 📝 プロンプトのカスタマイズ

`lib/ai/prompts.ts`でプロンプトテンプレートをカスタマイズできます。

```typescript
import { SYSTEM_PROMPT, createUpdatePrompt } from '@/lib/ai/prompts';

// システムプロンプトを確認
console.log(SYSTEM_PROMPT);

// しおり更新用のプロンプトを生成
const prompt = createUpdatePrompt(currentItinerary);
```

## 🔍 レスポンスのパース

AIの応答からメッセージとしおりデータを抽出：

```typescript
import { parseAIResponse, mergeItineraryData } from '@/lib/ai/prompts';

const aiResponse = `素敵な旅行計画ですね！

\`\`\`json
{
  "title": "東京3日間の旅",
  "destination": "東京",
  ...
}
\`\`\`
`;

const { message, itineraryData } = parseAIResponse(aiResponse);
console.log(message); // "素敵な旅行計画ですね！"
console.log(itineraryData); // しおりデータのオブジェクト

// しおりデータをマージ
const updatedItinerary = mergeItineraryData(currentItinerary, itineraryData);
```

## ⚠️ エラーハンドリング

```typescript
try {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'こんにちは' }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error.message);
    // エラー処理
  }

  const data = await response.json();
  // 成功時の処理
} catch (error) {
  console.error('Network Error:', error);
  // ネットワークエラー処理
}
```

## 🧪 テスト

APIをテストするためのサンプルcurlコマンド：

```bash
# 非ストリーミング
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "東京で3日間の旅行計画を立てたいです",
    "model": "gemini",
    "stream": false
  }'

# ストリーミング
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "京都で2日間の旅行計画を立てたいです",
    "model": "gemini",
    "stream": true
  }'
```

## 📊 型定義の構造

### ChatMessage
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  itineraryData?: Partial<ItineraryData>;
}
```

### ItineraryData
```typescript
interface ItineraryData {
  id: string;
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  summary?: string;
  schedule: DaySchedule[];
  totalBudget?: number;
  status: 'draft' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}
```

### DaySchedule
```typescript
interface DaySchedule {
  day: number;
  date?: string;
  title?: string;
  spots: TouristSpot[];
  totalDistance?: number;
  totalCost?: number;
}
```

### TouristSpot
```typescript
interface TouristSpot {
  id: string;
  name: string;
  description: string;
  location?: Location;
  scheduledTime?: string;
  duration?: number;
  category?: 'sightseeing' | 'dining' | 'transportation' | 'accommodation' | 'other';
  estimatedCost?: number;
  notes?: string;
  imageUrl?: string;
}
```

## 🔜 次のステップ

- Phase 4: 一時保存機能の実装（LocalStorage + Context）
- Phase 5: しおりコンポーネントの詳細実装
- Phase 6: PDF出力機能
- Phase 7: Claude API統合

## 📚 参考リンク

- [Google AI Studio](https://makersuite.google.com/app/apikey)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
