# コーディング規約とスタイル

## TypeScript規約

### 型安全性
- **strictモード有効**: tsconfig.jsonで `strict: true`
- **any型の使用禁止**: 必ず明示的な型定義
- **interface優先**: 拡張性のためinterfaceを使用（Union型はtype）
- **型定義の場所**: `/types` ディレクトリに集約

### 命名規則
- **型・インターフェース**: PascalCase (`Message`, `Itinerary`)
- **変数・関数**: camelCase (`currentItinerary`, `handleSubmit`)
- **定数**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **ファイル名**:
  - コンポーネント: PascalCase (`ChatBox.tsx`)
  - ユーティリティ: kebab-case (`api-client.ts`)

### Import順序
```typescript
'use client'; // Next.js指定子（最上部）

// 1. React
import React, { useState } from 'react';

// 2. Next.js
import Link from 'next/link';

// 3. 外部ライブラリ
import { Send } from 'lucide-react';

// 4. エイリアスimport (@/)
import { useStore } from '@/lib/store/useStore';

// 5. 相対パス
import { formatDate } from './utils';
```

## React規約

### コンポーネント定義
```typescript
'use client'; // クライアントコンポーネントの場合

import React from 'react';

export const ComponentName: React.FC = () => {
  return <div>...</div>;
};
```

### Props定義
```typescript
interface ComponentNameProps {
  required: string;
  optional?: boolean;
  onAction: (id: string) => void;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  required,
  optional = false, // デフォルト値
  onAction
}) => {
  // ...
};
```

### Hooks順序
```typescript
export const MyComponent: React.FC = () => {
  // 1. Zustand
  const { messages } = useStore();
  
  // 2. useState
  const [isOpen, setIsOpen] = useState(false);
  
  // 3. useEffect
  useEffect(() => {}, []);
  
  // 4. useCallback / useMemo
  const handleClick = useCallback(() => {}, []);
  
  return <div>...</div>;
};
```

## Tailwind CSS規約

### クラス順序
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
```

### カラーパレット
- プライマリ: グレー系 (`gray-900`, `gray-700`, `gray-500`)
- アクセント: ブルー系 (`blue-500`, `blue-600`)
- しおりヘッダー: グラデーション (`bg-gradient-to-r from-blue-500 to-purple-600`)

## Zustand状態管理

### ストア定義
- **場所**: `lib/store/useStore.ts`
- **スライス分割**: Chat, Itinerary, Settings
- **命名**: 状態はそのまま、アクションは動詞で始める (`addMessage`, `setLoading`)

### 使用パターン
```typescript
// 複数購読
const { messages, addMessage } = useStore();

// 選択的購読（パフォーマンス最適化）
const messages = useStore((state) => state.messages);
```

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
- `test`: テスト
- `chore`: ビルド・設定

**例**:
```
feat(chat): add streaming response support

- Implement Gemini streaming API
- Add streaming indicator

Closes #42
```
