# Journee プロジェクト ベストプラクティスガイド

このドキュメントは、Journeeプロジェクトで使用している技術スタックに基づいた、コーディングのベストプラクティスと実装方針をまとめたものです。

## 目次
1. [Next.js 14 App Router パターン](#nextjs-14-app-router-パターン)
2. [TypeScript 型安全性](#typescript-型安全性)
3. [React コンポーネント設計](#react-コンポーネント設計)
4. [Zustand 状態管理](#zustand-状態管理)
5. [Tailwind CSS スタイリング](#tailwind-css-スタイリング)
6. [API Route Handlers](#api-route-handlers)
7. [エラーハンドリング](#エラーハンドリング)
8. [パフォーマンス最適化](#パフォーマンス最適化)
9. [セキュリティ](#セキュリティ)
10. [コードの品質と保守性](#コードの品質と保守性)

---

## Next.js 14 App Router パターン

### Server Components vs Client Components

#### Server Components（デフォルト）
```typescript
// app/dashboard/page.tsx
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  
  return <div>Dashboard</div>;
}
```

**使用場面:**
- データフェッチング（DB、API）
- 認証チェック
- サーバーサイドロジック
- 環境変数への直接アクセス

#### Client Components（'use client'）
```typescript
// components/chat/MessageInput.tsx
'use client';

import React, { useState } from 'react';

export const MessageInput: React.FC = () => {
  const [input, setInput] = useState('');
  
  return <input value={input} onChange={(e) => setInput(e.target.value)} />;
};
```

**使用場面:**
- useState, useEffect などのフック使用
- イベントハンドラ（onClick, onChange）
- ブラウザAPI使用（localStorage, window）
- Zustand などのクライアント状態管理

### ファイル構造のベストプラクティス

```
app/
├── page.tsx              # ルートページ（認証チェック）
├── layout.tsx            # ルートレイアウト（プロバイダー設定）
├── globals.css           # グローバルスタイル
├── login/
│   └── page.tsx          # 公開ページ
└── api/
    ├── auth/             # 認証API（NextAuth.js）
    ├── chat/             # チャットAPI
    │   └── route.ts      # POST /api/chat
    └── health/
        └── route.ts      # GET /api/health

components/
├── auth/                 # 認証コンポーネント
├── chat/                 # チャット機能
├── itinerary/            # しおり機能
├── layout/               # レイアウト
└── ui/                   # 共通UI

lib/
├── ai/                   # AI統合ロジック
├── auth/                 # 認証ロジック
├── store/                # Zustand ストア
└── utils/                # ユーティリティ

types/
├── chat.ts               # チャット型定義
├── itinerary.ts          # しおり型定義
├── auth.ts               # 認証型定義
└── api.ts                # API型定義
```

---

## TypeScript 型安全性

### 厳格な型定義

#### ✅ Good: 具体的な型定義
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const message: Message = {
  id: 'msg-1',
  role: 'user',
  content: 'Hello',
  timestamp: new Date(),
};
```

#### ❌ Bad: any型の使用
```typescript
const message: any = {
  id: 'msg-1',
  content: 'Hello',
};
```

### null/undefined の明示的な処理

#### ✅ Good: Optional chaining & Nullish coalescing
```typescript
interface User {
  name: string;
  email?: string;
}

const user: User | null = getCurrentUser();
const email = user?.email ?? 'unknown@example.com';
```

#### ❌ Bad: 暗黙的なnull許容
```typescript
const user = getCurrentUser(); // 型が不明確
const email = user.email; // エラーの可能性
```

### 型推論の活用

#### ✅ Good: 型推論を活用しつつ、必要な場所で明示
```typescript
// 型推論で十分
const [count, setCount] = useState(0);

// 複雑な型は明示
const [user, setUser] = useState<User | null>(null);
```

### Generics の活用

```typescript
// 汎用的なAPIレスポンス型
interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// 使用例
const response: ApiResponse<User> = await fetchUser();
const itineraries: ApiResponse<Itinerary[]> = await fetchItineraries();
```

---

## React コンポーネント設計

### コンポーネント定義パターン

#### ✅ Good: Named export + React.FC + Props interface
```typescript
'use client';

import React from 'react';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onMessageClick?: (id: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  onMessageClick,
}) => {
  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id} onClick={() => onMessageClick?.(msg.id)}>
          {msg.content}
        </div>
      ))}
    </div>
  );
};
```

### 単一責任の原則（SRP）

#### ✅ Good: 小さく、焦点を絞ったコンポーネント
```typescript
// MessageList.tsx - メッセージ一覧の表示のみ
export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div>
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
    </div>
  );
};

// MessageItem.tsx - 個別メッセージの表示
export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  return <div>{message.content}</div>;
};

// MessageInput.tsx - メッセージ入力のみ
export const MessageInput: React.FC = () => {
  // 入力処理
};
```

### DRY原則（Don't Repeat Yourself）

#### ✅ Good: 共通ロジックを抽出
```typescript
// components/ui/MarkdownRenderer.tsx
export const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={MARKDOWN_COMPONENTS}
    >
      {content}
    </ReactMarkdown>
  );
};

// lib/constants/markdown-components.ts
export const MARKDOWN_COMPONENTS = {
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" 
       className="text-blue-600 hover:text-blue-800 underline" />
  ),
  // ... 他のコンポーネント
};
```

#### ❌ Bad: 同じコードの重複
```typescript
// MessageList.tsx で2箇所に同じReactMarkdown設定
<ReactMarkdown components={{ a: ..., h1: ..., h2: ... }}>
  {message.content}
</ReactMarkdown>

// 同じファイルの別の場所でまた同じ設定
<ReactMarkdown components={{ a: ..., h1: ..., h2: ... }}>
  {streamingMessage}
</ReactMarkdown>
```

### Hooks の使用順序

```typescript
export const ChatBox: React.FC = () => {
  // 1. Zustand ストア
  const { messages, addMessage } = useStore();
  
  // 2. useState
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  // 3. useRef
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 4. useEffect
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // 5. カスタムフック
  const { isOnline } = useNetworkStatus();
  
  // 6. useCallback / useMemo
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    addMessage({ content: input });
  }, [input, addMessage]);
  
  // ...
};
```

---

## Zustand 状態管理

### ストア設計パターン

#### ✅ Good: 単一ストア、明確な責務
```typescript
// lib/store/useStore.ts
interface AppState {
  // Chat state
  messages: Message[];
  isLoading: boolean;
  addMessage: (message: Message) => void;
  
  // Itinerary state
  currentItinerary: ItineraryData | null;
  setItinerary: (itinerary: ItineraryData | null) => void;
  
  // UI state
  selectedAI: AIModelId;
  setSelectedAI: (ai: AIModelId) => void;
  
  // Error state
  error: string | null;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  // 初期値
  messages: [],
  isLoading: false,
  currentItinerary: null,
  selectedAI: 'gemini',
  error: null,
  
  // アクション
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setItinerary: (itinerary) => set({ currentItinerary: itinerary }),
  setSelectedAI: (ai) => set({ selectedAI: ai }),
  setError: (error) => set({ error }),
}));
```

### コンポーネントでの使用パターン

#### ✅ Good: 必要な部分のみ取得（パフォーマンス最適化）
```typescript
// 方法1: 分割代入
const { messages, addMessage } = useStore();

// 方法2: セレクタ（再レンダリング最小化）
const messageCount = useStore((state) => state.messages.length);
const addMessage = useStore((state) => state.addMessage);
```

#### ❌ Bad: ストア全体を取得
```typescript
const store = useStore(); // 全体が変更されるたびに再レンダリング
```

### イミュータブルな更新

#### ✅ Good: スプレッド構文でイミュータブル更新
```typescript
addMessage: (message) =>
  set((state) => ({
    messages: [...state.messages, message],
  })),

updateItinerary: (updates) =>
  set((state) => ({
    currentItinerary: state.currentItinerary
      ? { ...state.currentItinerary, ...updates }
      : null,
  })),
```

#### ❌ Bad: 直接変更（ミューテーション）
```typescript
addMessage: (message) =>
  set((state) => {
    state.messages.push(message); // ❌ 直接変更
    return { messages: state.messages };
  }),
```

---

## Tailwind CSS スタイリング

### クラス順序の一貫性

```typescript
// レイアウト → サイズ → スペーシング → タイポグラフィ → カラー → ボーダー → エフェクト
<div className="flex items-center justify-between w-full h-12 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
  コンテンツ
</div>
```

### カラーパレットの統一

```typescript
// グレー系（UI全般）
const COLORS = {
  background: {
    light: 'bg-gray-50',
    main: 'bg-white',
    hover: 'bg-gray-100',
  },
  text: {
    primary: 'text-gray-800',
    secondary: 'text-gray-700',
    muted: 'text-gray-500',
  },
  border: 'border-gray-200',
  
  // アクセント（プライマリアクション）
  primary: {
    main: 'bg-blue-500',
    hover: 'hover:bg-blue-600',
    text: 'text-white',
  },
};
```

### コンポーネントスタイルの一貫性

```typescript
// 共通パターンを定数化
const BUTTON_STYLES = {
  base: 'px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors',
  primary: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300',
  disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
};

// 使用例
<button className={`${BUTTON_STYLES.base} ${BUTTON_STYLES.primary} ${BUTTON_STYLES.disabled}`}>
  送信
</button>
```

### レスポンシブデザイン

```typescript
// モバイルファースト
<div className="
  flex flex-col space-y-4           /* モバイル */
  md:flex-row md:space-y-0 md:space-x-4  /* タブレット */
  lg:w-4/5                           /* デスクトップ */
">
  コンテンツ
</div>
```

---

## API Route Handlers

### 基本パターン

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    // 1. 認証チェック（必要な場合）
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'ログインが必要です' },
        { status: 401 }
      );
    }

    // 2. リクエストボディのパース
    const body = await req.json();

    // 3. バリデーション
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'ValidationError', message: 'メッセージは必須です' },
        { status: 400 }
      );
    }

    // 4. ビジネスロジック
    const result = await processMessage(body.message);

    // 5. 成功レスポンス
    return NextResponse.json(result);

  } catch (error) {
    // 6. エラーハンドリング
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: 'InternalServerError',
        message: 'サーバーエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
```

### ストリーミングレスポンス（SSE）

```typescript
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamData()) {
          const data = `data: ${JSON.stringify(chunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        controller.close();
      } catch (error) {
        const errorData = `data: ${JSON.stringify({ type: 'error', error: 'エラーメッセージ' })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## エラーハンドリング

### フロントエンドのエラーハンドリング

```typescript
// ✅ Good: 型安全で適切なエラーハンドリング
try {
  const result = await apiCall();
  setData(result);
  setError(null);
} catch (err) {
  const errorMessage = err instanceof Error 
    ? err.message 
    : '不明なエラーが発生しました';
  
  setError(errorMessage);
  console.error('API Error:', err);
}
```

### カスタムエラークラス

```typescript
// lib/errors/api-errors.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(400, 'ValidationError', message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'ログインが必要です') {
    super(401, 'Unauthorized', message);
    this.name = 'UnauthorizedError';
  }
}
```

### エラーバウンダリ（React）

```typescript
// components/ui/ErrorBoundary.tsx
'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-800 font-semibold">エラーが発生しました</h2>
          <p className="text-red-600 mt-2">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## パフォーマンス最適化

### React.memo による再レンダリング最適化

```typescript
// ✅ Good: props が変わらない限り再レンダリングしない
export const MessageItem = React.memo<MessageItemProps>(({ message }) => {
  return (
    <div className="p-3 bg-gray-100 rounded-lg">
      <p>{message.content}</p>
      <span className="text-xs text-gray-500">
        {new Date(message.timestamp).toLocaleTimeString()}
      </span>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';
```

### useCallback / useMemo の適切な使用

```typescript
export const MessageInput: React.FC = () => {
  const addMessage = useStore((state) => state.addMessage);
  const [input, setInput] = useState('');

  // ✅ Good: 依存配列が変わらない限り関数を再生成しない
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    addMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    });
    setInput('');
  }, [input, addMessage]);

  // ✅ Good: 重い計算結果をキャッシュ
  const wordCount = useMemo(() => {
    return input.trim().split(/\s+/).length;
  }, [input]);

  return (
    <form onSubmit={handleSubmit}>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <span>単語数: {wordCount}</span>
    </form>
  );
};
```

### 仮想スクロール（大量データ）

```typescript
// 将来的に大量のメッセージを扱う場合
import { FixedSizeList } from 'react-window';

export const VirtualMessageList: React.FC<{ messages: Message[] }> = ({ messages }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <MessageItem message={messages[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={messages.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

### 画像の最適化

```typescript
// Next.js Image コンポーネントの使用
import Image from 'next/image';

<Image
  src="/images/spot.jpg"
  alt="観光スポット"
  width={400}
  height={300}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/..."
/>
```

---

## セキュリティ

### XSS対策

```typescript
// ✅ Good: サニタイゼーション
import DOMPurify from 'isomorphic-dompurify';

const sanitizedHtml = DOMPurify.sanitize(userInput);

// react-markdown は安全（デフォルトでエスケープ）
<ReactMarkdown>{userContent}</ReactMarkdown>
```

### CSRF対策

```typescript
// NextAuth.js が自動的にCSRFトークンを管理
// middleware.ts でルート保護
export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/api/:path*', '/((?!login|privacy|terms).*)'],
};
```

### 環境変数の安全な管理

```typescript
// ✅ Good: サーバーサイドのみで使用
// app/api/chat/route.ts
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ❌ Bad: クライアントに公開
// NEXT_PUBLIC_ プレフィックスは公開されるため、秘密情報に使用しない
const API_KEY = process.env.NEXT_PUBLIC_API_KEY; // ❌
```

### 入力バリデーション

```typescript
// Zod を使用した型安全なバリデーション
import { z } from 'zod';

const MessageSchema = z.object({
  content: z.string().min(1).max(1000),
  userId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // バリデーション
  const result = MessageSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'ValidationError', details: result.error.issues },
      { status: 400 }
    );
  }
  
  // 安全なデータを使用
  const { content, userId } = result.data;
}
```

---

## コードの品質と保守性

### コメントとドキュメント

```typescript
/**
 * チャットメッセージを送信してAIの応答を取得
 * 
 * @param message - ユーザーのメッセージ
 * @param chatHistory - 過去のチャット履歴（最大10件）
 * @param currentItinerary - 現在作成中のしおり
 * @returns AI応答としおりデータ
 * 
 * @example
 * ```typescript
 * const result = await sendChatMessage(
 *   '東京で3日間の旅行を計画したい',
 *   [],
 *   null
 * );
 * ```
 */
export async function sendChatMessage(
  message: string,
  chatHistory?: ChatMessage[],
  currentItinerary?: ItineraryData
): Promise<ChatAPIResponse> {
  // 実装
}
```

### 定数の管理

```typescript
// lib/constants/app-config.ts
export const APP_CONFIG = {
  chat: {
    maxHistoryLength: 10,
    maxMessageLength: 1000,
  },
  itinerary: {
    maxDays: 30,
    maxSpotsPerDay: 10,
  },
  ui: {
    toastDuration: 3000,
    animationDuration: 300,
  },
} as const;

// 使用例
const history = messages.slice(-APP_CONFIG.chat.maxHistoryLength);
```

### テストの記述（将来的に）

```typescript
// __tests__/lib/ai/prompts.test.ts
import { parseAIResponse, mergeItineraryData } from '@/lib/ai/prompts';

describe('parseAIResponse', () => {
  it('should extract itinerary data from JSON block', () => {
    const response = `
      素敵な旅行計画ですね！
      
      \`\`\`json
      {
        "title": "東京3日間の旅",
        "destination": "東京"
      }
      \`\`\`
    `;
    
    const { message, itineraryData } = parseAIResponse(response);
    
    expect(message).toBe('素敵な旅行計画ですね！');
    expect(itineraryData).toEqual({
      title: '東京3日間の旅',
      destination: '東京',
    });
  });
});
```

---

## まとめ

### 重要な原則

1. **型安全性**: TypeScriptの厳格な型チェックを活用
2. **DRY原則**: コードの重複を避ける
3. **単一責任**: 1つのコンポーネント/関数は1つの責務
4. **イミュータビリティ**: 状態を直接変更しない
5. **エラーハンドリング**: 適切なエラー処理と型安全性
6. **パフォーマンス**: 必要な場所で最適化
7. **セキュリティ**: XSS、CSRF対策を徹底
8. **保守性**: 読みやすく、拡張しやすいコード

### コードレビューチェックリスト

- [ ] 型定義は適切か（any型を使用していないか）
- [ ] コンポーネントは単一責任を守っているか
- [ ] DRY原則に従っているか（重複コードはないか）
- [ ] エラーハンドリングは適切か
- [ ] パフォーマンス最適化は必要か（React.memo, useCallback）
- [ ] セキュリティリスクはないか
- [ ] Tailwindクラスの順序は一貫しているか
- [ ] コメントやドキュメントは十分か
- [ ] テストは記述されているか（将来的に）

---

## 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Best Practices](https://react.dev/learn)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [プロジェクトREADME](../README.md)
- [API仕様書](./API.md)