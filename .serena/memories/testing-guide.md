# テスト実行ガイド

## テスト戦略

Journeeプロジェクトでは、2種類のテストを実施:

1. **ユニットテスト（Jest）**: ビジネスロジック、ユーティリティ関数
2. **E2Eテスト（Playwright）**: ユーザーフロー全体

## ユニットテスト（Jest）

### 実行コマンド

```bash
npm test                 # テスト実行
npm run test:watch       # Watchモード（開発時）
npm run test:coverage    # カバレッジ付き
```

### テストファイル配置

- `__tests__` ディレクトリ内
- または同階層に `*.test.ts` / `*.test.tsx`

例:
```
lib/
├── utils/
│   ├── api-client.ts
│   └── __tests__/
│       └── api-client.test.ts
```

### テスト対象

- `lib/utils/` 配下のユーティリティ関数
- `lib/store/` 配下の状態管理ロジック
- `lib/ai/` 配下のAI統合ロジック（モック使用）
- `lib/db/` 配下のデータベースロジック（モック使用）

### ユニットテスト例

```typescript
// lib/utils/__tests__/api-client.test.ts
import { apiClient } from '../api-client';

describe('apiClient', () => {
  it('should fetch data successfully', async () => {
    const result = await apiClient('/api/test');
    expect(result).toBeDefined();
  });
});
```

## E2Eテスト（Playwright）

### 実行コマンド

```bash
npm run test:e2e         # ヘッドレスモードで実行
npm run test:e2e:ui      # UIモードで実行（デバッグ向き）
npm run test:e2e:debug   # デバッグモード
```

### テストファイル配置

- `/e2e` ディレクトリ内
- ファイル名: `*.spec.ts`

### 主要E2Eテスト

#### 1. チャット機能
- メッセージ送信
- AIストリーミングレスポンス
- しおりのリアルタイム更新

#### 2. しおり機能
- しおり作成フロー
- 編集機能（タイトル、スポット追加・削除）
- PDF出力
- 地図表示トグル

#### 3. 認証機能
- ログイン/ログアウト
- 保護ページへのアクセス制御

#### 4. データベース統合
- しおり保存・読み込み
- しおり一覧表示
- しおり削除

#### 5. 共有機能
- しおり公開
- 公開リンクからのアクセス
- コメント投稿

### E2Eテスト例

```typescript
// e2e/itinerary-db-integration.spec.ts
import { test, expect } from '@playwright/test';

test('should save itinerary to database', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // ログイン
  await page.click('button:has-text("ログイン")');
  
  // チャットでしおり作成
  await page.fill('textarea', '東京3日間');
  await page.click('button:has-text("送信")');
  
  // 保存
  await page.click('button:has-text("保存")');
  
  // 保存成功を確認
  await expect(page.locator('text=保存しました')).toBeVisible();
});
```

### テスト環境

- **開発サーバー**: `http://localhost:3000`
- **モック認証**: `NEXT_PUBLIC_ENABLE_MOCK_AUTH=true` でモック認証有効化
- **テストDB**: Supabaseのテスト用プロジェクト（推奨）

## テスト実行のベストプラクティス

### 1. ユニットテスト
- 関数・ロジックを小さく分割してテスト可能に
- モックを使用して外部依存を排除
- テストケースは「正常系」「異常系」「境界値」を網羅

### 2. E2Eテスト
- ユーザーの主要フローをテスト
- テストデータはテスト内で作成・削除
- テスト間の依存を排除（各テストが独立して実行可能）

### 3. CI/CD統合
- Pull Request時に自動実行
- すべてのテストがパスするまでマージしない

## トラブルシューティング

### Jest: TypeError: Cannot read property 'xxx' of undefined
→ モックが正しく設定されているか確認

### Playwright: Timeout
→ 開発サーバーが起動しているか確認
→ セレクタが正しいか確認

### E2E: Database connection error
→ 環境変数（Supabase）が設定されているか確認

## カバレッジ目標

- **ユニットテスト**: 80%以上（ユーティリティ・ロジック）
- **E2Eテスト**: 主要ユーザーフロー100%カバー

## 継続的テスト

開発時は以下を実行:
```bash
# ユニットテストをwatchモードで
npm run test:watch

# 変更後にE2Eテスト
npm run test:e2e
```

Pull Request前:
```bash
npm run test:all
```

すべてパスすることを確認してからマージ。
