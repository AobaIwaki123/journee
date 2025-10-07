# Journee プロジェクト リファクタリングガイドライン

## 📋 目的

このドキュメントは、Journeeプロジェクトのコード品質向上とメンテナンス性改善のためのリファクタリング方針を定義します。

## 🔍 現状分析

### 発見された問題点

#### 1. テストの欠如
- **問題**: テストコードが全く存在しない
- **影響**: リグレッションリスクが高い、リファクタリングが困難
- **優先度**: 🔴 高

#### 2. 大きすぎるファイル
- **問題**: `lib/store/useStore.ts` が537行と肥大化
- **影響**: 可読性低下、責務の分散が不明確
- **優先度**: 🟡 中

#### 3. エラーハンドリングの一貫性
- **問題**: エラー処理が各所で異なる実装
- **影響**: デバッグが困難、ユーザー体験の不統一
- **優先度**: 🟡 中

#### 4. 型安全性の課題
- **問題**: 一部で`any`型の使用、型定義の重複
- **影響**: 型安全性の低下、補完の効きにくさ
- **優先度**: 🟢 低

## 🎯 リファクタリング方針

### フェーズ1: テストインフラの構築

#### 1.1 テストフレームワークの導入
- **採用技術**: Vitest（Next.js 14+との相性が良い）
- **テスティングライブラリ**: @testing-library/react
- **モック**: msw（API mocking）

**理由**:
- Vitestは高速でTypeScriptネイティブサポート
- Next.jsとの統合が容易
- Jestからのマイグレーションパスがシンプル

#### 1.2 テストディレクトリ構造
```
/__tests__/
  /unit/              # 単体テスト
    /lib/
      /ai/
      /store/
      /utils/
    /components/
  /integration/       # 統合テスト
    /api/
  /e2e/              # E2Eテスト（将来的に）
/vitest.config.ts    # Vitest設定
```

### フェーズ2: コードの分割とモジュール化

#### 2.1 Zustandストアの分割

**現状**: `useStore.ts`に全てのステート管理が集約（537行）

**改善案**: 責務ごとにストアを分割

```typescript
lib/store/
  ├── useChatStore.ts        # チャット関連のステート
  ├── useItineraryStore.ts   # しおり関連のステート
  ├── useUIStore.ts          # UI状態（ローディング、エラーなど）
  ├── useSettingsStore.ts    # 設定関連のステート
  ├── useHistoryStore.ts     # Undo/Redo履歴管理
  ├── useToastStore.ts       # トースト通知
  └── index.ts               # 統合エクスポート
```

**利点**:
- 責務が明確化
- ファイルサイズの削減
- テストが容易
- インポートの最適化

#### 2.2 ビジネスロジックの抽出

**現状**: コンポーネント内にビジネスロジックが混在

**改善案**: カスタムフックとユーティリティに分離

```typescript
lib/hooks/
  ├── useChat.ts              # チャット機能のロジック
  ├── useItineraryEditor.ts   # しおり編集のロジック
  └── useStreamingResponse.ts # ストリーミング処理

lib/utils/
  ├── itinerary-helpers.ts    # しおり操作のヘルパー
  ├── validation.ts           # バリデーション関数
  └── formatting.ts           # フォーマット関数
```

### フェーズ3: エラーハンドリングの統一

#### 3.1 エラークラスの定義
```typescript
lib/errors/
  ├── AppError.ts           # 基底エラークラス
  ├── APIError.ts           # API関連エラー
  ├── ValidationError.ts    # バリデーションエラー
  └── index.ts
```

#### 3.2 エラーバウンダリの実装
```typescript
components/errors/
  ├── ErrorBoundary.tsx     # React Error Boundary
  └── APIErrorHandler.tsx   # API エラーハンドラー
```

### フェーズ4: 型安全性の向上

#### 4.1 `any`型の削減
- 明示的な型定義への置き換え
- 型ガード関数の追加
- ジェネリクスの活用

#### 4.2 型定義の整理
```typescript
types/
  ├── common.ts            # 共通型
  ├── domain/              # ドメイン型
  │   ├── chat.ts
  │   ├── itinerary.ts
  │   └── user.ts
  └── api/                 # API型
      ├── requests.ts
      └── responses.ts
```

## 📝 テスト戦略

### テストカバレッジ目標
- **ユーティリティ関数**: 90%以上
- **ビジネスロジック**: 80%以上
- **API Route**: 80%以上
- **コンポーネント**: 60%以上（重要なもの優先）

### 優先度付けテスト対象

#### 🔴 高優先度
1. **AI統合ロジック** (`lib/ai/prompts.ts`)
   - `parseAIResponse`: JSON抽出ロジック
   - `mergeItineraryData`: データマージロジック
   - テストケース: 正常系、異常系、境界値

2. **チャットAPI** (`app/api/chat/route.ts`)
   - ストリーミング/非ストリーミング
   - モデル切り替え（Gemini/Claude）
   - エラーハンドリング

3. **ストア操作** (`lib/store/useStore.ts`)
   - しおり編集（追加、更新、削除）
   - Undo/Redo機能
   - 状態整合性

#### 🟡 中優先度
4. **ユーティリティ関数**
   - `storage.ts`: LocalStorage操作
   - `time-utils.ts`: 時間計算
   - `encryption.ts`: 暗号化

5. **フォーム処理**
   - バリデーション
   - データ変換

#### 🟢 低優先度
6. **UI コンポーネント**
   - 静的コンポーネント
   - プレゼンテーション層

### テストパターン

#### 単体テスト例
```typescript
// __tests__/unit/lib/ai/prompts.test.ts
import { describe, it, expect } from 'vitest';
import { parseAIResponse, mergeItineraryData } from '@/lib/ai/prompts';

describe('parseAIResponse', () => {
  it('should extract JSON from response', () => {
    const response = 'テキスト\n```json\n{"title":"test"}\n```';
    const result = parseAIResponse(response);
    expect(result.itineraryData).toEqual({ title: 'test' });
    expect(result.message).toBe('テキスト');
  });

  it('should handle multiple JSON blocks', () => {
    // テストケース
  });

  it('should handle malformed JSON gracefully', () => {
    // エラーケース
  });
});
```

#### 統合テスト例
```typescript
// __tests__/integration/api/chat.test.ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/chat/route';

describe('POST /api/chat', () => {
  it('should return streaming response', async () => {
    // モックリクエスト
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'test',
        stream: true
      })
    });

    const response = await POST(request as any);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
  });
});
```

## 🚀 CI/CD統合

### GitHub Actions設定
```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## 📊 実装計画

### タイムライン

#### Week 1: 基礎構築
- [ ] Vitestセットアップ
- [ ] テストディレクトリ作成
- [ ] GitHub Actions設定
- [ ] ユーティリティ関数テスト（高優先度）

#### Week 2: コア機能テスト
- [ ] AI統合ロジックテスト
- [ ] チャットAPIテスト
- [ ] ストア分割開始

#### Week 3: リファクタリング
- [ ] Zustandストア完全分割
- [ ] エラーハンドリング統一
- [ ] 型安全性向上

#### Week 4: 仕上げ
- [ ] コンポーネントテスト（重要なもの）
- [ ] カバレッジ確認
- [ ] ドキュメント更新

## 🔧 ツール・スクリプト

### package.json追加スクリプト
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:ci": "vitest run --coverage"
  }
}
```

## 📚 参考リソース

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Zustand Testing](https://docs.pmnd.rs/zustand/guides/testing)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)

## ✅ 成功の指標

- [ ] テストカバレッジ70%以上
- [ ] CI/CDパイプラインが動作
- [ ] `useStore.ts`を5ファイル以下に分割
- [ ] すべての`any`型を削減（必要最小限）
- [ ] エラーハンドリングが統一されている
- [ ] ビルドエラー0、型エラー0
- [ ] ローカルで`npm test`が完全に動作

---

**最終更新**: 2025-10-07
**担当者**: Development Team
**ステータス**: 実装中