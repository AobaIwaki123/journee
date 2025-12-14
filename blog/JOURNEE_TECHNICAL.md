---
title: "Next.js App RouterでストリーミングAIチャットを実装する - Gemini API × Zustand × Supabase"
emoji: "⚡"
type: "tech"
topics: ["Next.js", "AI", "Supabase", "TypeScript", "ストリーミング"]
published: false
---

## はじめに

旅のしおり作成アプリ「Journee」の開発を通じて、**Next.js App Router でストリーミング対応の AI チャットアプリ**を実装しました。

本記事では、以下の実装パターンを詳しく解説します：

- **ストリーミングレスポンス**の実装（ReadableStream）
- **段階的なフロー制御**によるAI対話の構造化
- **Zustand**での複雑な状態管理
- **Supabase**でのデータ永続化とセキュリティ

## 技術スタック

```
- Next.js 14 (App Router)
- TypeScript
- Zustand (状態管理)
- Supabase (PostgreSQL + Auth)
- Google Gemini API
- Tailwind CSS
```

GitHub: https://github.com/AobaIwaki123/journee

## 1. ストリーミングレスポンスの実装

### なぜストリーミングが必要か

AIの応答を待つ間、ユーザーは何も見えないと不安になります。ストリーミングレスポンスにより、**生成されたテキストをリアルタイムに表示**できます。

### サーバーサイド実装

```typescript:app/api/chat/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  const { message, history, itinerary } = await req.json();
  
  // APIキーはサーバーサイドで管理
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  // プロンプト構築（現在のフェーズとしおりの状態を含む）
  const prompt = buildPrompt(message, history, itinerary);
  
  // ストリーミング開始
  const result = await model.generateContentStream(prompt);
  
  // ReadableStreamでクライアントに送信
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          controller.enqueue(encoder.encode(text));
        }
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
```

**ポイント：**
- `generateContentStream()` でストリーミング取得
- `ReadableStream` でクライアントに送信
- エラーハンドリングを忘れずに

### クライアントサイド実装

```typescript:components/chat/ChatBox.tsx
const handleSendMessage = async (message: string) => {
  setStreaming(true);
  
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: messages,
        itinerary: currentItinerary,
      }),
    });
    
    if (!response.ok) throw new Error('API Error');
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    let accumulatedText = '';
    
    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      accumulatedText += chunk;
      
      // リアルタイムでUIを更新
      appendStreamingMessage(chunk);
    }
    
    // 完了したらメッセージを確定
    finalizeMessage(accumulatedText);
  } catch (error) {
    handleError(error);
  } finally {
    setStreaming(false);
  }
};
```

**ポイント：**
- `TextDecoder` でバイトストリームをデコード
- `{ stream: true }` オプションで部分デコード
- UI更新は Zustand のアクションで管理

## 2. 段階的フロー制御

### 課題：AIの応答を構造化データに変換

AIは自然言語で返答しますが、しおりは構造化されたデータが必要です。

### 解決策：フェーズベースの対話設計

```typescript:types/itinerary.ts
export type ItineraryPhase = 
  | 'initial'           // 初期状態
  | 'gathering_info'    // 情報収集フェーズ
  | 'creating_skeleton' // 骨組み作成フェーズ
  | 'detailing'         // 詳細化フェーズ
  | 'completed';        // 完成

export interface RequirementChecklist {
  destination: boolean;      // 行き先
  duration: boolean;         // 滞在日数
  startDate: boolean;        // 出発日
  budget: boolean;           // 予算
  interests: boolean;        // 興味・好み
  transportation: boolean;   // 交通手段
}
```

### プロンプト設計

```typescript:lib/ai/prompts.ts
export function buildPrompt(
  message: string,
  history: Message[],
  itinerary: ItineraryData
): string {
  const phase = itinerary.planningPhase;
  const checklist = itinerary.requirementChecklist;
  
  // フェーズごとに異なるプロンプトを構築
  switch (phase) {
    case 'gathering_info':
      return `
あなたは旅行計画のアシスタントです。
ユーザーから以下の情報を収集してください：

チェックリスト：
${formatChecklist(checklist)}

未収集の項目について、1つずつ自然な質問をしてください。
すべて収集できたら、「情報が揃いました」と伝えてください。

ユーザーメッセージ: ${message}
`;

    case 'creating_skeleton':
      return `
収集した情報をもとに、旅程の骨組みを作成してください。

必須項目：
- 各日の大まかなテーマ
- 訪問予定のエリア
- 移動手段

JSON形式で返してください：
{
  "days": [
    { "day": 1, "theme": "...", "area": "...", "spots": [] }
  ]
}
`;

    case 'detailing':
      return `
Day ${itinerary.currentDetailingDay} の詳細を追加してください。

各スポットに以下を含めてください：
- 名前
- 説明（50文字程度）
- 滞在時間
- 予算
- 座標（緯度・経度）

JSON形式で返してください。
`;
      
    default:
      return buildGeneralPrompt(message, history);
  }
}
```

**ポイント：**
- フェーズごとにプロンプトを切り替え
- チェックリストで進捗を管理
- JSON形式での返答を強制

## 3. Zustand での状態管理

### なぜZustand？

- **シンプルなAPI**：Redux より学習コストが低い
- **TypeScript 完全対応**
- **ミドルウェア充実**：永続化、DevTools 連携
- **再レンダリング最適化**：必要な状態のみを購読

### ストア設計

```typescript:lib/store/useStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  streamingMessage: string;
}

interface ItineraryState {
  currentItinerary: ItineraryData;
  planningPhase: ItineraryPhase;
  currentDetailingDay: number | null;
}

interface Actions {
  // メッセージ管理
  addMessage: (message: Message) => void;
  appendStreamingMessage: (chunk: string) => void;
  finalizeStreamingMessage: () => void;
  
  // しおり管理
  updateItinerary: (update: Partial<ItineraryData>) => void;
  setPlanningPhase: (phase: ItineraryPhase) => void;
  proceedToNextStep: () => void;
}

type StoreState = ChatState & ItineraryState & Actions;

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // 初期状態
      messages: [],
      isStreaming: false,
      streamingMessage: '',
      currentItinerary: createEmptyItinerary(),
      planningPhase: 'initial',
      currentDetailingDay: null,
      
      // メッセージ管理
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
      })),
      
      appendStreamingMessage: (chunk) => set((state) => ({
        streamingMessage: state.streamingMessage + chunk
      })),
      
      finalizeStreamingMessage: () => set((state) => {
        const newMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: state.streamingMessage,
          timestamp: Date.now(),
        };
        return {
          messages: [...state.messages, newMessage],
          streamingMessage: '',
          isStreaming: false,
        };
      }),
      
      // しおり管理
      updateItinerary: (update) => set((state) => ({
        currentItinerary: { ...state.currentItinerary, ...update }
      })),
      
      setPlanningPhase: (phase) => set({ planningPhase: phase }),
      
      proceedToNextStep: () => {
        const { planningPhase, currentDetailingDay, currentItinerary } = get();
        
        switch (planningPhase) {
          case 'gathering_info':
            if (isChecklistComplete(currentItinerary.requirementChecklist)) {
              set({ planningPhase: 'creating_skeleton' });
            }
            break;
            
          case 'creating_skeleton':
            set({ 
              planningPhase: 'detailing',
              currentDetailingDay: 1
            });
            break;
            
          case 'detailing':
            const nextDay = (currentDetailingDay || 0) + 1;
            if (nextDay <= currentItinerary.days.length) {
              set({ currentDetailingDay: nextDay });
            } else {
              set({ 
                planningPhase: 'completed',
                currentDetailingDay: null
              });
            }
            break;
        }
      },
    }),
    {
      name: 'journee-storage',
      partialize: (state) => ({
        // 永続化する状態を選択
        messages: state.messages,
        currentItinerary: state.currentItinerary,
        planningPhase: state.planningPhase,
      }),
    }
  )
);
```

**ポイント：**
- `persist` ミドルウェアで LocalStorage に保存
- `partialize` で永続化する状態を選択
- 複雑なロジックは Zustand のアクション内に集約

### コンポーネントでの使用

```typescript:components/chat/ChatBox.tsx
export function ChatBox() {
  // 必要な状態のみを購読（再レンダリング最適化）
  const messages = useStore((state) => state.messages);
  const isStreaming = useStore((state) => state.isStreaming);
  const addMessage = useStore((state) => state.addMessage);
  const appendStreamingMessage = useStore((state) => state.appendStreamingMessage);
  
  // ...
}
```

## 4. Supabase でのデータ永続化

### スキーマ設計

```sql:lib/db/schema.sql
-- ユーザーテーブル（NextAuth.jsと連携）
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- しおりテーブル
CREATE TABLE itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  data JSONB NOT NULL,  -- 柔軟な構造を許容
  is_published BOOLEAN DEFAULT FALSE,
  slug TEXT UNIQUE,     -- 公開URL用
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security（RLS）設定
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のしおりのみアクセス可能
CREATE POLICY "Users can view their own itineraries"
  ON itineraries FOR SELECT
  USING (auth.uid() = user_id OR is_published = TRUE);

CREATE POLICY "Users can insert their own itineraries"
  ON itineraries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries"
  ON itineraries FOR UPDATE
  USING (auth.uid() = user_id);

-- インデックス
CREATE INDEX idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX idx_itineraries_slug ON itineraries(slug);
CREATE INDEX idx_itineraries_published ON itineraries(is_published);
```

### リポジトリパターンでの実装

```typescript:lib/db/itinerary-repository.ts
import { createClient } from '@/lib/db/supabase';

export class ItineraryRepository {
  private supabase = createClient();
  
  async save(itinerary: ItineraryData, userId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('itineraries')
      .upsert({
        user_id: userId,
        title: itinerary.title,
        destination: itinerary.destination,
        start_date: itinerary.startDate,
        end_date: itinerary.endDate,
        data: itinerary,  // JSONB形式で保存
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();
      
    if (error) throw error;
    return data.id;
  }
  
  async load(id: string, userId: string): Promise<ItineraryData | null> {
    const { data, error } = await this.supabase
      .from('itineraries')
      .select('data')
      .eq('id', id)
      .eq('user_id', userId)  // RLSで自動チェックされるが明示的に
      .single();
      
    if (error) return null;
    return data.data as ItineraryData;
  }
  
  async publish(id: string, userId: string): Promise<string> {
    const slug = generateSlug();
    
    const { error } = await this.supabase
      .from('itineraries')
      .update({ 
        is_published: true, 
        slug: slug 
      })
      .eq('id', id)
      .eq('user_id', userId);
      
    if (error) throw error;
    return slug;
  }
}
```

**ポイント：**
- **RLS**でセキュリティを確保
- **JSONB**で柔軟なスキーマ
- リポジトリパターンでビジネスロジックを分離

## 5. パフォーマンス最適化

### React.memo による再レンダリング防止

```typescript:components/itinerary/DaySchedule.tsx
export const DaySchedule = React.memo(({ day, spots }: Props) => {
  // spots が変更されない限り再レンダリングされない
  return (
    <div>
      {spots.map(spot => <SpotCard key={spot.id} spot={spot} />)}
    </div>
  );
}, (prevProps, nextProps) => {
  // カスタム比較関数
  return prevProps.day === nextProps.day && 
         deepEqual(prevProps.spots, nextProps.spots);
});
```

### useMemo/useCallback の活用

```typescript
const sortedMessages = useMemo(() => {
  return messages.sort((a, b) => a.timestamp - b.timestamp);
}, [messages]);

const handleSendMessage = useCallback(async (message: string) => {
  // 処理
}, [addMessage, currentItinerary]);
```

## まとめ

本記事では、Next.js App Router でストリーミング AI チャットを実装する方法を解説しました。

**重要なポイント：**
- ストリーミングレスポンスで UX 向上
- フェーズベースの対話設計で構造化データを取得
- Zustand でシンプルかつ強力な状態管理
- Supabase + RLS で安全なデータ永続化

**参考リンク：**
- [Journee リポジトリ](https://github.com/AobaIwaki123/journee)
- [Next.js Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [Zustand](https://github.com/pmndrs/zustand)
- [Supabase](https://supabase.com/docs)

質問があれば、コメントや GitHub の Issue でお気軽にどうぞ！

