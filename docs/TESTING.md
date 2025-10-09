# テストガイド

このドキュメントでは、Journeeプロジェクトのテスト戦略と実行方法について説明します。

**最終更新**: 2025-10-09

---

## 📋 目次

- [テスト戦略](#テスト戦略)
- [ユニットテスト](#ユニットテスト)
- [E2Eテスト](#e2eテスト)
- [テストの実行方法](#テストの実行方法)
- [カバレッジ](#カバレッジ)

---

## テスト戦略

### テストピラミッド

```
       /\
      /E2E\          少数（重要なユーザーフロー）
     /______\
    /        \
   /Integration\     中程度（コンポーネント統合）
  /__________  \
 /              \
/  Unit Tests    \   多数（関数、ロジック）
/________________ \
```

### カバレッジ目標

- **ユニットテスト**: 80%以上
- **統合テスト**: 70%以上
- **E2Eテスト**: 主要なユーザーフロー

---

## ユニットテスト

### 技術スタック

- **フレームワーク**: Jest
- **テストユーティリティ**: React Testing Library
- **モック**: jest.mock()

### テスト対象

#### 1. ユーティリティ関数

```typescript
// lib/utils/__tests__/date-utils.test.ts
describe('date-utils', () => {
  it('Date オブジェクトを安全に変換', () => {
    const result = toSafeDate('2024-01-01');
    expect(result).toBeInstanceOf(Date);
  });
});
```

#### 2. リポジトリクラス

```typescript
// lib/db/__tests__/comment-repository.test.ts
describe('CommentRepository', () => {
  it('コメントを作成', async () => {
    const comment = await repository.createComment(request, userId);
    expect(comment.id).toBeDefined();
  });
});
```

#### 3. Reactコンポーネント

```typescript
// components/comments/__tests__/CommentItem.test.tsx
describe('CommentItem', () => {
  it('コメントを表示', () => {
    render(<CommentItem comment={mockComment} />);
    expect(screen.getByText('テストコメント')).toBeInTheDocument();
  });
});
```

### 実行方法

```bash
# すべてのユニットテストを実行
npm run test

# ウォッチモードで実行
npm run test:watch

# カバレッジレポート付きで実行
npm run test:coverage
```

---

## E2Eテスト

### 技術スタック

- **フレームワーク**: Playwright
- **ブラウザ**: Chromium, Firefox, WebKit

### テスト対象

#### コメント機能

```typescript
// e2e/comment-feature.spec.ts
test('匿名でコメントを投稿できる', async ({ page }) => {
  await page.fill('input[placeholder="匿名ユーザー"]', 'テスト');
  await page.fill('textarea', 'テストコメント');
  await page.click('button:has-text("投稿")');
  
  await expect(page.getByText('テストコメント')).toBeVisible();
});
```

### 実行方法

```bash
# E2Eテストを実行
npm run test:e2e

# UIモードで実行（デバッグに便利）
npm run test:e2e:ui

# すべてのテストを実行
npm run test:all
```

---

## テストの実行方法

### 開発時

```bash
# ユニットテストをウォッチモードで実行
npm run test:watch

# ファイルを保存するたびに自動実行される
```

### CI/CD

```bash
# すべてのテストを実行（カバレッジ付き）
npm run test:coverage
npm run test:e2e
```

### デバッグ

#### ユニットテスト

```bash
# 特定のテストファイルのみ実行
npm test -- date-utils.test.ts

# 特定のテストケースのみ実行
npm test -- -t "Date オブジェクトを安全に変換"
```

#### E2Eテスト

```bash
# UIモードでデバッグ
npm run test:e2e:ui

# ヘッドレスモードを無効化
npx playwright test --headed

# 特定のテストのみ実行
npx playwright test comment-feature.spec.ts
```

---

## カバレッジ

### カバレッジレポートの確認

```bash
# カバレッジレポートを生成
npm run test:coverage

# HTMLレポートを開く
open coverage/lcov-report/index.html
```

### カバレッジ目標

| カテゴリ | 目標 |
|---------|------|
| Branches | 70% |
| Functions | 70% |
| Lines | 70% |
| Statements | 70% |

---

## ベストプラクティス

### 1. テストの命名規則

```typescript
// ❌ 悪い例
test('test1', () => { ... });

// ✅ 良い例
test('コメントを作成（認証ユーザー）', () => { ... });
```

### 2. AAA パターン

```typescript
test('コメントを投稿できる', async () => {
  // Arrange（準備）
  const request = { content: 'テスト', ... };
  
  // Act（実行）
  const result = await repository.createComment(request);
  
  // Assert（検証）
  expect(result.content).toBe('テスト');
});
```

### 3. テストの独立性

```typescript
// 各テストは独立して実行できるようにする
beforeEach(() => {
  jest.clearAllMocks();
});
```

---

## トラブルシューティング

### よくある問題

#### 1. `TypeError: date.getTime is not a function`

**解決方法**: `toSafeDate()`ヘルパー関数を使用

```typescript
const safeDate = toSafeDate(date);
if (safeDate) {
  const diff = safeDate.getTime() - now.getTime();
}
```

#### 2. E2Eテストがタイムアウトする

**解決方法**: タイムアウトを延長

```typescript
await expect(page.getByText('コメント')).toBeVisible({ 
  timeout: 10000 // 10秒 
});
```

#### 3. モックが機能しない

**解決方法**: `jest.mock()`はファイルの先頭で呼ぶ

```typescript
// ファイルの先頭
jest.mock('@/lib/utils/date-utils');

// その後にインポート
import { getRelativeTime } from '@/lib/utils/date-utils';
```

---

## 継続的な改善

### 定期的なレビュー

- 週次: カバレッジレポートの確認
- 月次: テスト戦略の見直し
- 四半期: テストピラミッドのバランス調整

### メトリクス

- **カバレッジ**: 70%以上を維持
- **テスト実行時間**: 5分以内（ユニット）
- **E2Eテスト成功率**: 95%以上

---

## 参考リンク

- [Jest公式ドキュメント](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright公式ドキュメント](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**最終更新**: 2025-10-09
