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
8. [コミット規約](#コミット規約)

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
Deploy:    Google Cloud Run, Kubernetes
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
│   ├── api/                 # APIルート
│   ├── (pages)/             # ページコンポーネント
│   └── layout.tsx           # ルートレイアウト
├── components/              # Reactコンポーネント
│   ├── auth/                # 認証UI
│   ├── chat/                # チャット機能
│   ├── itinerary/           # しおり機能
│   ├── layout/              # レイアウト
│   └── ui/                  # 共通UI
├── lib/                     # ユーティリティ・ロジック
│   ├── ai/                  # AI統合
│   ├── auth/                # 認証ロジック
│   ├── db/                  # データベース
│   ├── store/               # Zustand状態管理
│   └── utils/               # ヘルパー関数
├── types/                   # TypeScript型定義
└── docs/                    # ドキュメント
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
```

### 型の厳格性

```typescript
// ✅ Good - 厳格な型定義
const [itinerary, setItinerary] = useState<Itinerary | null>(null);
const [error, setError] = useState<string | null>(null);

// ❌ Bad - any, 暗黙的型
const [itinerary, setItinerary] = useState(null);
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
}

export interface DetailedItinerary extends Itinerary {
  daySchedules: DaySchedule[];
}

// ⚠️ type - Union型・ユーティリティ型のみ
export type ItineraryPhase = 'initial' | 'collecting' | 'skeleton' | 'detailing' | 'completed';
```

### 命名規則

- **型・インターフェース**: PascalCase（`Message`, `Itinerary`, `AppState`）
- **変数・関数**: camelCase（`currentItinerary`, `handleSubmit`）
- **定数**: UPPER_SNAKE_CASE（`API_BASE_URL`, `MAX_MESSAGE_LENGTH`）

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

```typescript
// ✅ Good - Global state (Zustand)
const { messages, addMessage, isStreaming } = useStore();

// ✅ Good - Local state
const [isOpen, setIsOpen] = useState<boolean>(false);
```

### イベントハンドラ

```typescript
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ...
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};
```

### Hooks順序

```typescript
export const MyComponent: React.FC = () => {
  // 1. Zustand
  const { messages, addMessage } = useStore();
  
  // 2. useState
  const [isOpen, setIsOpen] = useState(false);
  
  // 3. useEffect
  useEffect(() => {
    // ...
  }, []);
  
  // 4. useCallback / useMemo
  const handleClick = useCallback(() => {
    // ...
  }, [dep]);
  
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

**クラス命名順序**:

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
<button className="flex items-center gap-2 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 transition-all">
  <Send size={16} />
  送信
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

<Send size={16} />  // ボタン内
<User size={20} />  // 標準
<MapPin size={24} /> // ヘッダー
```

---

## 状態管理（Zustand）

### ストア構造

`lib/store/useStore.ts`:

```typescript
import { create } from 'zustand';

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
export interface ChatSlice {
  messages: Message[];
  isStreaming: boolean;
  
  addMessage: (message: Message) => void;
  setStreaming: (streaming: boolean) => void;
}

export const createChatSlice: StateCreator<ChatSlice> = (set) => ({
  messages: [],
  isStreaming: false,
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  
  setStreaming: (streaming) => set({ isStreaming: streaming }),
});
```

### コンポーネントでの使用

```typescript
// 複数の状態を購読
const { messages, addMessage, isStreaming } = useStore();

// 選択的購読（パフォーマンス最適化）
const messages = useStore((state) => state.messages);
```

---

## API・認証

### APIルート（Next.js App Router）

```typescript
// app/api/itinerary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // ビジネスロジック...
    
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('[API Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

### NextAuth認証

```typescript
// lib/auth/session.ts
import { getServerSession } from 'next-auth/next';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}
```

詳細は[lib/auth/README.md](../lib/auth/README.md)を参照。

---

## コミット規約

### Conventional Commits

```
type(scope): subject

body (optional)
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

Closes #42
```

---

## 参考資料

### 公式ドキュメント
- [Next.js App Router](https://nextjs.org/docs/app)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)

### プロジェクト内ドキュメント
- [実装計画](./PLAN.md)
- [API仕様](./API.md)
- [データベーススキーマ](./SCHEMA.md)
- [クイックスタート](./QUICK_START.md)

---

**作成日**: 2025-10-09  
**バージョン**: 1.0
