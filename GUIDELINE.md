# Journee プロジェクト リファクタリングガイドライン

## 📋 目的

このドキュメントは、Journeeプロジェクトのコード品質向上とメンテナンス性改善のためのリファクタリング方針を定義します。

## 🔍 現状分析

### 発見された問題点

#### 1. テストの不足
- **問題**: 既存のテストファイルは手動テスト用（実行不可）
- **影響**: リグレッションリスクが高い、リファクタリングが困難
- **優先度**: 🔴 高

#### 2. 大きすぎるファイル
- **問題**: `lib/store/useStore.ts` が766行と肥大化
- **影響**: 可読性低下、責務の分散が不明確
- **優先度**: 🟡 中
- **ステータス**: ✅ **解決済み**（6スライスに分割完了）

#### 3. エラーハンドリングの一貫性
- **問題**: エラー処理が各所で異なる実装
- **影響**: デバッグが困難、ユーザー体験の不統一
- **優先度**: 🟡 中
- **ステータス**: ❌ **未解決**

#### 4. 型安全性の課題
- **問題**: 一部で`any`型の使用、型定義の重複
- **影響**: 型安全性の低下、補完の効きにくさ
- **優先度**: 🟢 低
- **ステータス**: 🔄 **一部改善**

## 🎯 リファクタリング方針

### Phase 1: テストインフラの構築 ✅ 完了

#### 1.1 テストフレームワークの導入 ✅
- **採用技術**: Vitest（Next.js 14+との相性が良い）
- **テスティングライブラリ**: @testing-library/react
- **モック**: msw（API mocking）

**理由**:
- Vitestは高速でTypeScriptネイティブサポート
- Next.jsとの統合が容易
- Jestからのマイグレーションパスがシンプル

#### 1.2 テストディレクトリ構造 ✅
```
__tests__/
  unit/              # 単体テスト ✅ 実装済み
    lib/
      ai/
        prompts.test.ts (19テスト)
      utils/
        time-utils.test.ts (20テスト)
        encryption.test.ts (18テスト)
        storage.test.ts (19テスト)
    components/      # ❌ 未実装
  integration/       # 統合テスト ❌ 未実装
    api/
  e2e/              # E2Eテスト ❌ 未実装
vitest.config.ts    # ✅ 実装済み
```

### Phase 2: コードの分割とモジュール化

#### 2.1 Zustandストアの分割 ✅ 完了

**現状**: `useStore.ts`に全てのステート管理が集約（766行）

**改善結果**: 責務ごとにストアを分割 ✅

```typescript
lib/store/
  ├── useStore.ts (25行) - 統合 ✅
  ├── slices/
  │   ├── chatSlice.ts (45行) ✅
  │   ├── uiSlice.ts (85行) ✅
  │   ├── toastSlice.ts (36行) ✅
  │   ├── settingsSlice.ts (132行) ✅
  │   ├── historySlice.ts (101行) ✅
  │   └── itinerarySlice.ts (335行) ✅
  └── README.md ✅
```

**達成した利点**:
- ✅ 責務が明確化
- ✅ ファイルサイズの削減（平均122行/ファイル）
- ✅ テストが容易
- ✅ インポートの最適化

#### 2.2 ビジネスロジックの抽出 ❌ 未実施

**現状**: コンポーネント内にビジネスロジックが混在

**改善案**: カスタムフックとユーティリティに分離

```typescript
lib/hooks/           # ❌ 未作成
  ├── useChat.ts              # チャット機能のロジック
  ├── useItineraryEditor.ts   # しおり編集のロジック
  └── useStreamingResponse.ts # ストリーミング処理

lib/utils/           # 一部実装済み
  ├── itinerary-helpers.ts    # ❌ 未作成
  ├── validation.ts           # ❌ 未作成
  └── formatting.ts           # ❌ 未作成
```

### Phase 3: エラーハンドリングの統一 ❌ 未実施

#### 3.1 エラークラスの定義 ❌
```typescript
lib/errors/          # ❌ 未作成
  ├── AppError.ts           # 基底エラークラス
  ├── APIError.ts           # API関連エラー
  ├── ValidationError.ts    # バリデーションエラー
  └── index.ts
```

#### 3.2 エラーバウンダリの実装 ❌
```typescript
components/errors/   # ❌ 未作成
  ├── ErrorBoundary.tsx     # React Error Boundary
  └── APIErrorHandler.tsx   # API エラーハンドラー
```

### Phase 4: 型安全性の向上 🔄 一部実施

#### 4.1 `any`型の削減 🔄
- ✅ lib/store/ - 型安全性向上
- ❌ components/ - 残存する`any`型あり
- ❌ app/api/ - 一部で`any`使用

#### 4.2 型定義の整理 ❌
```typescript
types/               # 既存あり、整理は未実施
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
- **ユーティリティ関数**: ✅ 90%以上達成
- **ビジネスロジック**: ❌ 未実施
- **API Route**: ❌ 未実施
- **コンポーネント**: ❌ 未実施

### 優先度付けテスト対象

#### 🔴 高優先度

1. **AI統合ロジック** (`lib/ai/prompts.ts`) ✅ 完了
   - ✅ `parseAIResponse`: JSON抽出ロジック (19テスト)
   - ✅ `mergeItineraryData`: データマージロジック
   - ✅ テストケース: 正常系、異常系、境界値

2. **チャットAPI** (`app/api/chat/route.ts`) ❌ 未実施
   - ❌ ストリーミング/非ストリーミング
   - ❌ モデル切り替え（Gemini/Claude）
   - ❌ エラーハンドリング

3. **ストア操作** (`lib/store/useStore.ts`) 🔄 スライス化完了、テスト未実施
   - ✅ スライス化完了
   - ❌ 各スライスの単体テスト未実施

#### 🟡 中優先度

4. **ユーティリティ関数** ✅ 完了
   - ✅ `storage.ts`: LocalStorage操作 (19テスト)
   - ✅ `time-utils.ts`: 時間計算 (20テスト)
   - ✅ `encryption.ts`: 暗号化 (18テスト)

5. **フォーム処理** ❌ 未実施
   - ❌ バリデーション
   - ❌ データ変換

#### 🟢 低優先度

6. **UI コンポーネント** ❌ 未実施
   - ❌ 静的コンポーネント
   - ❌ プレゼンテーション層

### テストパターン

#### 単体テスト例 ✅ 実装済み
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
});
```

#### 統合テスト例 ❌ 未実装
```typescript
// __tests__/integration/api/chat.test.ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/chat/route';

describe('POST /api/chat', () => {
  it('should return streaming response', async () => {
    // 未実装
  });
});
```

## 🚀 CI/CD統合

### GitHub Actions設定 ✅ 完了
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
      - run: npm ci
      - run: npm run test:ci
```

## 📊 実装計画と進捗状況

### ✅ Phase 1: 完了済み（2025-10-07）

#### 基礎構築
- [x] Vitestセットアップ
- [x] テストディレクトリ作成
- [x] GitHub Actions設定
- [x] ユーティリティ関数テスト（高優先度）

#### コア機能テスト
- [x] AI統合ロジックテスト（lib/ai/prompts.ts）
- [x] ストア分割完了（6スライス）
- [x] ユーティリティ関数テスト完全実装
  - [x] time-utils.ts (20テスト)
  - [x] encryption.ts (18テスト)
  - [x] storage.ts (19テスト)

#### リファクタリング
- [x] Zustandストア完全分割
  - [x] chatSlice.ts
  - [x] uiSlice.ts
  - [x] toastSlice.ts
  - [x] settingsSlice.ts
  - [x] historySlice.ts
  - [x] itinerarySlice.ts

### 🔄 Phase 2: 未完了（優先度順）

#### 🔴 高優先度
- [ ] **APIルートのテスト**
  - [ ] `/api/chat` (POST) - ストリーミング/非ストリーミング
  - [ ] `/api/health` (GET)
  - [ ] `/api/user/me` (GET)
  - [ ] エラーケースのテスト

#### 🟡 中優先度
- [ ] **コンポーネントテスト**
  - [ ] MessageInput.tsx - チャット入力
  - [ ] MessageList.tsx - メッセージ表示
  - [ ] ItineraryPreview.tsx - しおりプレビュー
  - [ ] ErrorNotification.tsx - エラー通知

- [ ] **エラーハンドリング統一**
  - [ ] エラークラスの定義
  - [ ] エラーバウンダリの実装
  - [ ] 統一されたエラー表示

#### 🟢 低優先度
- [ ] **型安全性向上**
  - [ ] 残存する`any`型の削減
  - [ ] 型ガード関数の追加
  - [ ] ジェネリクスの活用

- [ ] **E2Eテスト**
  - [ ] ログインフロー
  - [ ] しおり作成フロー
  - [ ] エラーリカバリー

## 🔧 ツール・スクリプト

### package.json追加スクリプト ✅
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:ci": "vitest run --coverage --reporter=verbose"
  }
}
```

## 📚 参考リソース

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Zustand Testing](https://docs.pmnd.rs/zustand/guides/testing)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)

## ✅ 成功の指標

### Phase 1 達成済み ✅
- [x] **テストインフラ構築** - Vitest + GitHub Actions
- [x] **76個のユニットテスト** - 100%合格
- [x] **Zustandストア分割** - 6スライスに分割完了
- [x] **CI/CDパイプライン動作** - GitHub Actions稼働中
- [x] **ローカルテスト動作** - `npm test` 完全動作

### Phase 2 目標（未達成）
- [ ] **APIルートテスト** - 統合テスト実装
- [ ] **コンポーネントテスト** - 主要コンポーネント
- [ ] **テストカバレッジ70%以上** - 現在: lib/のみ90%+
- [ ] **エラーハンドリング統一** - エラークラス実装
- [ ] **すべての`any`型削減** - QuickActions.tsxなど残存
- [ ] **型エラー0** - 現在: 3件のエラー（既存コード由来）

## 📈 現在の進捗

| カテゴリ | 完了率 | 詳細 |
|---------|-------|------|
| テストインフラ | 100% | ✅ 完了 |
| lib/テスト | 100% | ✅ 76テスト合格 |
| lib/リファクタリング | 100% | ✅ ストア分割完了 |
| app/api/テスト | 0% | ❌ 未着手 |
| components/テスト | 0% | ❌ 未着手 |
| エラーハンドリング | 0% | ❌ 未着手 |
| **総合進捗** | **約40%** | Phase 1完了 |

## 🎯 次のステップ（推奨優先度順）

### 1. 🔴 最優先: APIルートのテスト
- `app/api/chat/route.ts` の統合テスト
- `app/api/health/route.ts` の単体テスト
- `app/api/user/me/route.ts` の認証テスト

### 2. 🟡 高優先: 主要コンポーネントのテスト
- `MessageInput.tsx` - ユーザー入力の中核
- `MessageList.tsx` - メッセージ表示
- `ItineraryPreview.tsx` - しおり表示

### 3. 🟡 中優先: エラーハンドリング統一
- エラークラスの定義
- ErrorBoundaryの実装
- 統一されたエラー表示UI

### 4. 🟢 低優先: 残りの改善
- 型安全性の完全な向上
- E2Eテストの追加
- パフォーマンス最適化

---

**最終更新**: 2025-10-07 16:30  
**担当者**: Development Team  
**ステータス**: Phase 1完了 / Phase 2未着手  
**次のアクション**: APIルートテスト実装を推奨