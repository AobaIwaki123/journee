# Journee コーディングガイドライン

Journeeプロジェクトの統一的なコーディング規約・ベストプラクティス集

**最終更新**: 2025-10-09  
**対象**: Next.js 14, TypeScript, React, Tailwind CSS

---

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [ディレクトリ構造](#ディレクトリ構造)
3. [TypeScript規約](#typescript規約)
4. [React規約](#react規約)
5. [スタイリング規約](#スタイリング規約)
6. [状態管理（Zustand）](#状態管理zustand)
7. [API・認証](#api認証)
8. [AI統合](#ai統合)
9. [テスト](#テスト)
10. [コミット規約](#コミット規約)

---

## プロジェクト概要

### 技術スタック

```
Frontend:  Next.js 14 (App Router), TypeScript, React 18
Styling:   Tailwind CSS
State:     Zustand
Auth:      NextAuth.js (Google OAuth)
Database:  Supabase (PostgreSQL)
AI:        Google Gemini API, Anthropic Claude API
Icons:     lucide-react
Deploy:    Vercel, Google Cloud Run
```

### 開発原則

1. **型安全性第一**: TypeScript strictモード、any禁止
2. **シンプル・明瞭**: 複雑な抽象化を避ける
3. **パフォーマンス**: メモ化、遅延ロード、最適化
4. **アクセシビリティ**: セマンティックHTML、ARIA属性
5. **セキュリティ**: RLS、APIキー暗号化、入力検証

---

## ディレクトリ構造

```
journee/
├── app/                     # Next.js App Router
│   ├── api/                 # APIルート（サーバーサイド）
│   │   ├── auth/            # NextAuth認証
│   │   ├── chat/            # AIチャット
│   │   ├── itinerary/       # しおりCRUD
│   │   └── user/            # ユーザー情報
│   ├── login/               # ログインページ
│   ├── mypage/              # マイページ
│   ├── settings/            # 設定ページ
│   ├── share/[slug]/        # 公開しおり閲覧
│   ├── layout.tsx           # ルートレイアウト
│   ├── page.tsx             # トップページ（認証必須）
│   └── globals.css          # グローバルスタイル
│
├── components/              # Reactコンポーネント
│   ├── auth/                # 認証UI
│   │   ├── AuthProvider.tsx
│   │   ├── LoginButton.tsx
│   │   └── UserMenu.tsx
│   ├── chat/                # チャット機能
│   │   ├── ChatBox.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   └── AISelector.tsx
│   ├── itinerary/           # しおり機能
│   │   ├── ItineraryPreview.tsx
│   │   ├── DaySchedule.tsx
│   │   ├── SpotCard.tsx
│   │   └── ...
│   ├── layout/              # レイアウト
│   │   ├── Header.tsx
│   │   ├── ResizableLayout.tsx
│   │   └── AutoSave.tsx
│   ├── settings/            # 設定UI
│   └── ui/                  # 共通UI
│       ├── LoadingSpinner.tsx
│       ├── ErrorNotification.tsx
│       └── Toast.tsx
│
├── lib/                     # ユーティリティ・ロジック
│   ├── ai/                  # AI統合
│   │   ├── gemini.ts        # Google Gemini API
│   │   ├── claude.ts        # Anthropic Claude API
│   │   └── prompts.ts       # プロンプト管理
│   ├── auth/                # 認証ロジック
│   │   ├── auth-options.ts  # NextAuth設定
│   │   └── session.ts       # セッション管理
│   ├── db/                  # データベース
│   │   ├── supabase.ts      # Supabaseクライアント
│   │   ├── itinerary-repository.ts
│   │   ├── migration.ts     # LocalStorage→DB
│   │   └── schema.sql       # SQLスキーマ
│   ├── store/               # Zustand状態管理
│   │   ├── useStore.ts      # メインストア
│   │   ├── chatSlice.ts
│   │   ├── itinerarySlice.ts
│   │   └── settingsSlice.ts
│   └── utils/               # ヘルパー関数
│       ├── api-client.ts
│       ├── date-utils.ts
│       └── storage.ts
│
├── types/                   # TypeScript型定義
│   ├── chat.ts              # チャット型
│   ├── itinerary.ts         # しおり型
│   ├── auth.ts              # 認証型
│   ├── database.ts          # Supabase型
│   └── api.ts               # API共通型
│
├── docs/                    # ドキュメント
├── public/                  # 静的ファイル
├── middleware.ts            # 認証ミドルウェア
└── [設定ファイル]
```

### ファイル命名規則

- **コンポーネント**: PascalCase（例: `ChatBox.tsx`, `ItineraryPreview.tsx`）
- **ユーティリティ**: kebab-case（例: `api-client.ts`, `date-utils.ts`）
- **型定義**: kebab-case（例: `itinerary.ts`, `auth.ts`）
- **ページ**: Next.js規約（`page.tsx`, `layout.tsx`, `route.ts`）

---

## TypeScript規約

### 型定義の場所

**`/types` ディレクトリ**に集約:

```typescript
// types/chat.ts
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  streamingMessage: string;
}
```

### 型の厳格性

```typescript
// ✅ Good - 厳格な型定義
const [itinerary, setItinerary] = useState<Itinerary | null>(null);
const [error, setError] = useState<string | null>(null);
const [count, setCount] = useState<number>(0);

// ❌ Bad - any, 暗黙的型
const [itinerary, setItinerary] = useState(null);
const [error, setError] = useState();
let data: any = fetchData();
```

### interface vs type

**interface優先**（拡張性のため）:

```typescript
// ✅ Good - interface（拡張可能）
export interface Itinerary {
  id: string;
  title: string;
  destination: string;
  duration: number;
}

export interface DetailedItinerary extends Itinerary {
  daySchedules: DaySchedule[];
  chatHistory: Message[];
}

// ⚠️ type - Union型・ユーティリティ型のみ
export type ItineraryPhase = 'initial' | 'collecting' | 'skeleton' | 'detailing' | 'completed';
export type PartialItinerary = Partial<Itinerary>;
```

### 命名規則

- **型・インターフェース**: PascalCase（`Message`, `Itinerary`, `AppState`）
- **変数・関数**: camelCase（`currentItinerary`, `handleSubmit`）
- **定数**: UPPER_SNAKE_CASE（`API_BASE_URL`, `MAX_MESSAGE_LENGTH`）

```typescript
// ✅ Good
export interface Message { }
const handleSubmit = () => { };
const MAX_RETRIES = 3;

// ❌ Bad
export interface message { }
const HandleSubmit = () => { };
const maxRetries = 3;
```

### Import/Export

**Named export優先** (default exportは避ける):

```typescript
// ✅ Good - Named export
export const ChatBox: React.FC = () => { };
export interface ChatBoxProps { }

// ❌ Bad - Default export
export default function ChatBox() { }
```

### Import順序

```typescript
'use client'; // Next.js指定子（最上部）

// 1. React
import React, { useState, useEffect } from 'react';

// 2. Next.js
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 3. 外部ライブラリ
import { Send, User } from 'lucide-react';

// 4. エイリアスimport (@/)
import { useStore } from '@/lib/store/useStore';
import { Message } from '@/types/chat';

// 5. 相対パス
import { formatDate } from './utils';
```

---

## React規約

### コンポーネント定義

```typescript
// ✅ Good - アロー関数 + React.FC + 'use client'
'use client';

import React from 'react';

export const ChatBox: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* コンテンツ */}
    </div>
  );
};
```

### Props定義

```typescript
// ✅ Good - コンポーネント名 + Props
interface MessageListProps {
  messages: Message[];
  isLoading?: boolean; // オプショナル
  onMessageClick: (id: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isLoading = false, // デフォルト値
  onMessageClick 
}) => {
  // ...
};
```

### State管理

**グローバル状態はZustand、ローカル状態はuseState**:

```typescript
// ✅ Good - Global state (Zustand)
const { messages, addMessage, isStreaming } = useStore();

// ✅ Good - Local state
const [isOpen, setIsOpen] = useState<boolean>(false);
const [inputValue, setInputValue] = useState<string>('');
```

### イベントハンドラ

```typescript
// ✅ Good - handleXxx命名 + 型定義
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ...
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.stopPropagation();
  // ...
};
```

### Hooks順序

```typescript
export const MyComponent: React.FC = () => {
  // 1. Zustand
  const { messages, addMessage } = useStore();
  
  // 2. useState
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);
  
  // 3. useEffect
  useEffect(() => {
    // ...
  }, []);
  
  // 4. Custom Hooks
  const { data } = useCustomHook();
  
  // 5. useCallback / useMemo
  const handleClick = useCallback(() => {
    // ...
  }, [dep]);
  
  const expensiveValue = useMemo(() => {
    return computeExpensiveValue(count);
  }, [count]);
  
  return <div>...</div>;
};
```

### パフォーマンス最適化

```typescript
// メモ化（頻繁に再レンダリングされるコンポーネント）
export const SpotCard = React.memo<SpotCardProps>(({ spot }) => {
  // ...
});

// useCallback（子コンポーネントに渡す関数）
const handleDelete = useCallback((id: string) => {
  deleteSpot(id);
}, []);

// useMemo（重い計算）
const sortedSpots = useMemo(() => {
  return spots.sort((a, b) => a.order_index - b.order_index);
}, [spots]);
```

---

## スタイリング規約

### Tailwind CSS基本ルール

**クラス命名順序** (可読性のため):

```tsx
<div className="
  flex items-center justify-between    // Layout
  w-full h-12                          // Size
  px-4 py-2 gap-2                      // Spacing
  text-sm font-medium                  // Typography
  text-gray-700 bg-white               // Color
  border border-gray-200 rounded-lg   // Border
  shadow-sm hover:bg-gray-50          // Effects
  transition-colors                    // Animation
">
  コンテンツ
</div>
```

### カラーパレット

```tsx
// プライマリカラー（グレー）
text-gray-900  // ヘッダー・強調
text-gray-700  // メインテキスト
text-gray-500  // 補助テキスト
bg-gray-50     // 背景（薄い）
bg-white       // カード背景
border-gray-200 // ボーダー

// アクセントカラー（青）
bg-blue-500    // メインボタン
bg-blue-600    // ボタンホバー
text-blue-600  // リンク

// しおりヘッダーグラデーション
bg-gradient-to-r from-blue-500 to-purple-600
```

### コンポーネントスタイルパターン

**カード**:
```tsx
<div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
  {/* コンテンツ */}
</div>
```

**プライマリボタン**:
```tsx
<button className="flex items-center gap-2 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
  <Send size={16} />
  送信
</button>
```

**セカンダリボタン**:
```tsx
<button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
  キャンセル
</button>
```

**入力フォーム**:
```tsx
<input
  type="text"
  className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
  placeholder="メッセージを入力..."
/>
```

### アイコン（lucide-react）

```tsx
import { Send, User, Bot, MapPin } from 'lucide-react';

// サイズ
<Send size={16} />  // ボタン内
<User size={20} />  // 標準
<MapPin size={24} /> // ヘッダー

// カラー
<Bot size={20} className="text-blue-500" />
<User size={20} className="text-gray-500" />
```

### 禁止事項

```tsx
// ❌ Bad - インラインstyle
<div style={{ color: 'red', fontSize: '14px' }}>

// ❌ Bad - カスタムCSSファイル
import './MyComponent.css';

// ❌ Bad - !important
<div className="!text-red-500">

// ✅ Good - Tailwindクラスのみ
<div className="text-red-500 text-sm">
```

---

## 状態管理（Zustand）

### ストア構造

**`lib/store/useStore.ts`** にグローバルストアを統合:

```typescript
import { create } from 'zustand';
import { createChatSlice, ChatSlice } from './chatSlice';
import { createItinerarySlice, ItinerarySlice } from './itinerarySlice';
import { createSettingsSlice, SettingsSlice } from './settingsSlice';

type StoreState = ChatSlice & ItinerarySlice & SettingsSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createChatSlice(...a),
  ...createItinerarySlice(...a),
  ...createSettingsSlice(...a),
}));
```

### Slice定義例

```typescript
// lib/store/chatSlice.ts
import { StateCreator } from 'zustand';
import { Message } from '@/types/chat';

export interface ChatSlice {
  messages: Message[];
  isStreaming: boolean;
  streamingMessage: string;
  
  addMessage: (message: Message) => void;
  appendStreamingMessage: (chunk: string) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
}

export const createChatSlice: StateCreator<ChatSlice> = (set) => ({
  messages: [],
  isStreaming: false,
  streamingMessage: '',
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  
  appendStreamingMessage: (chunk) => set((state) => ({
    streamingMessage: state.streamingMessage + chunk,
  })),
  
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  
  clearMessages: () => set({ messages: [], streamingMessage: '' }),
});
```

### コンポーネントでの使用

```typescript
// 複数の状態を購読
const { messages, addMessage, isStreaming } = useStore();

// 選択的購読（パフォーマンス最適化）
const messages = useStore((state) => state.messages);
const addMessage = useStore((state) => state.addMessage);

// 複数の状態をまとめて購読
const { messages, isStreaming, streamingMessage } = useStore((state) => ({
  messages: state.messages,
  isStreaming: state.isStreaming,
  streamingMessage: state.streamingMessage,
}));
```

### LocalStorage永続化

```typescript
import { persist } from 'zustand/middleware';

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createChatSlice(...a),
      ...createItinerarySlice(...a),
      ...createSettingsSlice(...a),
    }),
    {
      name: 'journee-storage',
      partialize: (state) => ({
        // 永続化する状態のみ指定
        currentItinerary: state.currentItinerary,
        settings: state.settings,
      }),
    }
  )
);
```

---

## API・認証

### APIルート（Next.js App Router）

```typescript
// app/api/itinerary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { ItineraryRepository } from '@/lib/db/itinerary-repository';

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // ビジネスロジック
    const repository = new ItineraryRepository();
    const itineraries = await repository.getItinerariesByUser(user.id);
    
    return NextResponse.json({ data: itineraries }, { status: 200 });
  } catch (error) {
    console.error('[API Error]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

### クライアントサイドAPI呼び出し

```typescript
// lib/utils/api-client.ts
export async function fetchItineraries(): Promise<Itinerary[]> {
  const res = await fetch('/api/itinerary', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }
  
  const { data } = await res.json();
  return data;
}
```

### NextAuth認証

```typescript
// lib/auth/session.ts
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth-options';

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}
```

**使用例**:
```typescript
// Server Component
import { getCurrentUser } from '@/lib/auth/session';

export default async function MyPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  return <div>Welcome, {user.name}</div>;
}
```

---

## AI統合

### Gemini API（ストリーミング）

```typescript
// lib/ai/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function* streamGeminiResponse(
  prompt: string,
  conversationHistory: Message[]
): AsyncGenerator<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  const chat = model.startChat({
    history: conversationHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    })),
  });
  
  const result = await chat.sendMessageStream(prompt);
  
  for await (const chunk of result.stream) {
    const text = chunk.text();
    yield text;
  }
}
```

### プロンプト管理

```typescript
// lib/ai/prompts.ts
export const SYSTEM_PROMPTS = {
  collecting: `あなたは旅行プランナーです。ユーザーから行き先・日数・予算・興味を聞き出してください。`,
  skeleton: `収集した情報を基に、各日のテーマを含む骨組みを作成してください。JSON形式で出力。`,
  detailing: (day: number, theme: string) =>
    `${day}日目（テーマ: ${theme}）の詳細なスポットを提案してください。`,
};

export function parseItineraryJSON(response: string): Itinerary {
  const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
  if (!jsonMatch) throw new Error('JSON not found');
  
  return JSON.parse(jsonMatch[1]);
}
```

---

## テスト

### Playwright E2Eテスト

```typescript
// e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat flow', () => {
  test('should send message and receive AI response', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // ログイン（事前にテストユーザー作成）
    await page.click('text=ログイン');
    // ... Google OAuth モック
    
    // メッセージ送信
    await page.fill('textarea[placeholder*="メッセージ"]', '京都に3日間行きたい');
    await page.click('button[aria-label="送信"]');
    
    // AI応答を待つ
    await expect(page.locator('text=京都')).toBeVisible({ timeout: 10000 });
    
    // しおりプレビュー確認
    await expect(page.locator('text=旅のしおり')).toBeVisible();
  });
});
```

### 実行

```bash
npm run test:e2e          # 全テスト
npm run test:e2e:ui       # UIモード
npm run test:e2e:debug    # デバッグモード
```

---

## コミット規約

### Conventional Commits

```
type(scope): subject

body (optional)

footer (optional)
```

**type**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: コードフォーマット
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド・設定変更

**例**:
```
feat(chat): add streaming response support

- Implement Gemini streaming API
- Add streaming indicator in MessageList
- Update ChatBox to handle real-time chunks

Closes #42
```

---

## 参考資料

### 公式ドキュメント
- [Next.js App Router](https://nextjs.org/docs/app)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [NextAuth.js](https://next-auth.js.org/)
- [Supabase](https://supabase.com/docs)

### プロジェクト内ドキュメント
- [実装計画](./PLAN.md)
- [API仕様](./API.md)
- [データベーススキーマ](./SCHEMA.md)
- [クイックスタート](./QUICK_START.md)

---

**作成日**: 2025-10-09  
**バージョン**: 1.0  
**メンテナンス**: プロジェクト進行に応じて随時更新

