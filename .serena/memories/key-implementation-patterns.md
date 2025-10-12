# 重要な実装パターン

## 1. AIストリーミングレスポンス

### サーバーサイド（APIルート）
```typescript
// app/api/chat/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const result = await model.generateContentStream(prompt);
  
  // ReadableStreamを返す
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        controller.enqueue(new TextEncoder().encode(text));
      }
      controller.close();
    },
  });
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
```

### クライアントサイド
```typescript
// components/chat/ChatBox.tsx
const handleSend = async (content: string) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    appendStreamingMessage(chunk); // Zustandストアで管理
  }
};
```

## 2. Zustand状態管理パターン

### ストア定義（lib/store/useStore.ts）
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  messages: Message[];
  currentItinerary: ItineraryData | null;
  
  addMessage: (message: Message) => void;
  setItinerary: (itinerary: ItineraryData | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      messages: [],
      currentItinerary: null,
      
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      
      setItinerary: (itinerary) => 
        set({ currentItinerary: itinerary }),
    }),
    {
      name: 'journee-storage',
      partialize: (state) => ({
        selectedAI: state.selectedAI,
        soundEnabled: state.soundEnabled,
      }),
    }
  )
);
```

### コンポーネントでの使用
```typescript
// 必要な状態のみ取得
const { messages, addMessage } = useStore();

// 選択的購読（パフォーマンス最適化）
const messageCount = useStore((state) => state.messages.length);
```

## 3. NextAuth認証パターン

### 認証設定（lib/auth/auth-options.ts）
```typescript
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
  },
};
```

### セッション取得
```typescript
// サーバーサイド
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ...
}

// クライアントサイド
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();
```

### ミドルウェア（保護ルート）
```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: ['/mypage/:path*', '/settings/:path*'],
};
```

## 4. Supabaseデータアクセス

### クライアント初期化（lib/db/supabase.ts）
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### リポジトリパターン（lib/db/itinerary-repository.ts）
```typescript
export const itineraryRepository = {
  async create(userId: string, data: ItineraryData) {
    const { data: result, error } = await supabase
      .from('itineraries')
      .insert({
        user_id: userId,
        title: data.title,
        destination: data.destination,
        data: JSON.stringify(data),
      })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },
  
  async findByUserId(userId: string) {
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
};
```

## 5. レスポンシブレイアウト

### デスクトップ・モバイル分岐
```typescript
// components/layout/ResizableLayout.tsx
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };
  
  handleResize();
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

return isMobile ? (
  <MobileLayout />
) : (
  <DesktopLayout />
);
```

### Tailwind CSSブレークポイント
```tsx
<div className="
  flex flex-col        // モバイル: 縦並び
  md:flex-row          // デスクトップ: 横並び
  w-full h-screen
">
  <div className="
    w-full             // モバイル: 全幅
    md:w-1/2           // デスクトップ: 半分
  ">
    {/* チャット */}
  </div>
  <div className="
    w-full md:w-1/2
  ">
    {/* しおり */}
  </div>
</div>
```

## 6. エラーハンドリングパターン

### APIルート
```typescript
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // ビジネスロジック
    
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('[API Error]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

### クライアントサイド
```typescript
const handleAction = async () => {
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const result = await response.json();
    // 成功処理
  } catch (error) {
    console.error('Error:', error);
    setError('エラーが発生しました'); // Zustandストア
    showToast('エラーが発生しました', 'error');
  }
};
```

## 7. 動的インポート（パフォーマンス最適化）

### 重いコンポーネントの遅延ロード
```typescript
import dynamic from 'next/dynamic';

const PDFPreviewModal = dynamic(
  () => import('./PDFPreviewModal'),
  { ssr: false, loading: () => <LoadingSpinner /> }
);
```

## 8. Server Components vs Client Components

### Server Component（デフォルト）
```typescript
// app/page.tsx
import { getServerSession } from 'next-auth/next';

export default async function Page() {
  const session = await getServerSession();
  
  return (
    <div>
      <h1>Welcome, {session?.user?.name}</h1>
    </div>
  );
}
```

### Client Component（インタラクティブUI）
```typescript
// components/chat/ChatBox.tsx
'use client';

import React, { useState } from 'react';

export const ChatBox: React.FC = () => {
  const [message, setMessage] = useState('');
  
  return (
    <input
      value={message}
      onChange={(e) => setMessage(e.target.value)}
    />
  );
};
```

## 9. 型定義の拡張（NextAuth）

### NextAuth型拡張（types/auth.ts）
```typescript
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
```

## 10. 環境変数の使い分け

### サーバーサイドのみ
```typescript
// APIルート内
const apiKey = process.env.GEMINI_API_KEY;
```

### クライアント・サーバー両方
```typescript
// NEXT_PUBLIC_ プレフィックス必須
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
```

### 型安全な環境変数アクセス
```typescript
// lib/utils/env.ts
export const env = {
  geminiApiKey: process.env.GEMINI_API_KEY!,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
} as const;
```

## まとめ

これらのパターンはJourneeプロジェクト全体で一貫して使用されています。
新しい機能を実装する際は、既存のコードからパターンを参考にしてください。
