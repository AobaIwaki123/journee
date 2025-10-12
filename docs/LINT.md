# npm build 事前チェックリスト

このドキュメントは、`npm build` が失敗するのを防ぐための事前チェックリストです。コードを変更した後、必ずこれらの項目を確認してください。

## 🚀 クイックチェック

コミット前に必ず実行してください：

```bash
# 型チェック
npm run type-check

# Lintチェック
npm run lint

# ビルド確認
npm run build
```

## 📋 詳細チェックリスト

### 1. TypeScript型エラー

#### ✅ チェック項目
- [ ] すべての変数に適切な型が付いているか
- [ ] `any` 型を使用していないか（やむを得ない場合は `// @ts-ignore` でコメント付き）
- [ ] インポートパスが正しいか
- [ ] 型定義ファイル（`types/*.ts`）が最新か
- [ ] Null/undefined チェックが適切に行われているか

#### ❌ よくあるエラー

**エラー例1: 型の不一致**
```typescript
// ❌ NG
const message: Message = {
  role: "user",
  content: "hello"
  // timestamp が欠落
};

// ✅ OK
const message: Message = {
  role: "user",
  content: "hello",
  timestamp: Date.now()
};
```

**エラー例2: 暗黙的な any**
```typescript
// ❌ NG
function processData(data) {
  return data.map(item => item.value);
}

// ✅ OK
function processData(data: Array<{ value: string }>) {
  return data.map(item => item.value);
}
```

**エラー例3: Null/undefined チェック漏れ**
```typescript
// ❌ NG
const userName = user.name.toUpperCase();

// ✅ OK
const userName = user?.name?.toUpperCase() ?? "Unknown";
```

### 2. ESLint エラー

#### ✅ チェック項目
- [ ] 未使用の変数・インポートがないか
- [ ] `console.log` などのデバッグコードが残っていないか（`console.error` は OK）
- [ ] React Hooks のルール（依存配列など）が守られているか
- [ ] `useEffect` のクリーンアップ関数が適切か

#### ❌ よくあるエラー

**エラー例1: 未使用のインポート**
```typescript
// ❌ NG
import { useState, useEffect, useMemo } from 'react'; // useMemo が未使用

// ✅ OK
import { useState, useEffect } from 'react';
```

**エラー例2: 依存配列の問題**
```typescript
// ❌ NG
useEffect(() => {
  fetchData(userId);
}, []); // userId が依存配列に含まれていない

// ✅ OK
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

**エラー例3: console.log の残留**
```typescript
// ❌ NG
console.log('Debug:', data);

// ✅ OK（開発時のみ必要な場合）
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', data);
}

// ✅ OK（エラーログ）
console.error('Error:', error);
```

### 3. Next.js 固有のエラー

#### ✅ チェック項目
- [ ] `'use client'` ディレクティブが必要な箇所で使われているか
- [ ] Server Component と Client Component の使い分けが適切か
- [ ] 動的ルートのパラメータが正しいか
- [ ] API Route のエクスポートが正しいか（GET, POST など）
- [ ] Metadata が正しく定義されているか

#### ❌ よくあるエラー

**エラー例1: Client Component での useState 使用**
```typescript
// ❌ NG（'use client' がない）
import { useState } from 'react';

export default function MyComponent() {
  const [count, setCount] = useState(0);
  // ...
}

// ✅ OK
'use client';
import { useState } from 'react';

export default function MyComponent() {
  const [count, setCount] = useState(0);
  // ...
}
```

**エラー例2: API Route のエクスポート**
```typescript
// ❌ NG
export default function handler(req, res) {
  // ...
}

// ✅ OK
export async function GET(request: Request) {
  // ...
}

export async function POST(request: Request) {
  // ...
}
```

### 4. インポート・パスエラー

#### ✅ チェック項目
- [ ] 相対パス・絶対パスが正しいか
- [ ] `@/` エイリアスが正しく使われているか
- [ ] 存在しないファイルをインポートしていないか
- [ ] 循環参照が発生していないか

#### ❌ よくあるエラー

**エラー例1: パスの間違い**
```typescript
// ❌ NG
import { useStore } from '../lib/store/useStore'; // パスが間違っている

// ✅ OK
import { useStore } from '@/lib/store/useStore';
```

**エラー例2: 拡張子の問題**
```typescript
// ❌ NG
import MyComponent from './MyComponent.tsx'; // 拡張子は不要

// ✅ OK
import MyComponent from './MyComponent';
```

### 5. 環境変数エラー

#### ✅ チェック項目
- [ ] 必要な環境変数がすべて定義されているか
- [ ] クライアント側で使用する変数は `NEXT_PUBLIC_` プレフィックスがあるか
- [ ] `.env.example` が最新か

#### ❌ よくあるエラー

**エラー例1: プレフィックス漏れ**
```typescript
// ❌ NG（クライアントコンポーネントで使用）
const apiUrl = process.env.API_URL;

// ✅ OK
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

### 6. Zustand ストアエラー

#### ✅ チェック項目
- [ ] ストアの型定義が正しいか
- [ ] ストアの更新が不変（immutable）に行われているか
- [ ] セレクタ関数が適切に使われているか

#### ❌ よくあるエラー

**エラー例1: ミューテーション**
```typescript
// ❌ NG
set((state) => {
  state.messages.push(newMessage); // 直接変更
  return state;
});

// ✅ OK
set((state) => ({
  messages: [...state.messages, newMessage]
}));
```

## 🛠️ 自動化ツール

### VSCode 設定

`.vscode/settings.json` に以下を追加することで、保存時に自動チェックが可能です：

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### Git Pre-commit Hook

Husky を使用して、コミット前に自動チェックを行うことができます：

```bash
# インストール
npm install --save-dev husky

# セットアップ
npx husky install

# Pre-commit フックを追加
npx husky add .husky/pre-commit "npm run type-check && npm run lint"
```

### CI/CD チェック

GitHub Actions で自動チェックを行う場合：

```yaml
# .github/workflows/build-check.yml
name: Build Check
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run build
```

## 📝 チェックリスト使用ガイド

### コミット前

1. **必須チェック**
   ```bash
   npm run type-check && npm run lint
   ```

2. **推奨チェック**
   ```bash
   npm run build
   ```

3. **完全チェック**
   ```bash
   npm run test && npm run type-check && npm run lint && npm run build
   ```

### プルリクエスト前

- [ ] すべてのチェックが通る
- [ ] 新規ファイルが適切に型定義されている
- [ ] 変更したコンポーネントが正しく動作する
- [ ] 関連するテストを更新/追加している

## 🔧 トラブルシューティング

### ビルドが遅い場合

```bash
# キャッシュをクリア
rm -rf .next
npm run build
```

### 型エラーが解決しない場合

```bash
# TypeScript サーバーを再起動（VSCode）
# Cmd+Shift+P → "TypeScript: Restart TS Server"

# または node_modules を再インストール
rm -rf node_modules package-lock.json
npm install
```

### ESLint エラーが大量に出る場合

```bash
# 自動修正可能なエラーを修正
npm run lint -- --fix
```

## 📚 参考リンク

- [Next.js ドキュメント](https://nextjs.org/docs)
- [TypeScript ドキュメント](https://www.typescriptlang.org/docs/)
- [ESLint ルール](https://eslint.org/docs/rules/)
- [React Hooks ルール](https://react.dev/reference/rules/rules-of-hooks)

## 🎯 まとめ

**ビルド失敗を防ぐための3つの習慣**

1. 💾 **保存時に確認**: VSCode の自動チェック機能を有効化
2. 🔍 **コミット前に確認**: `npm run type-check && npm run lint` を実行
3. 🚀 **プッシュ前に確認**: `npm run build` を実行

これらの習慣を身につけることで、ビルドエラーを未然に防ぎ、開発効率を大幅に向上させることができます。
