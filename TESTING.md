# テストガイド

## テスト概要

Journeeプロジェクトには、以下のテストが含まれています：

1. **E2Eテスト（Playwright）** - ブラウザでの実際の動作をテスト
2. **型チェック（TypeScript）** - 型安全性の確認
3. **リンター（ESLint）** - コード品質のチェック

## クイックスタート

### 1. フロー改善テストの実行

```bash
# 開発サーバーを起動（別ターミナル）
npm run dev

# テストを実行
npm run test:flow
```

### 2. ブラウザを表示してテスト

```bash
npm run test:flow:headed
```

### 3. UIモードでテスト（推奨）

```bash
npm run test:flow:ui
```

## 利用可能なテストコマンド

### E2Eテスト

| コマンド | 説明 |
|---------|------|
| `npm run test:flow` | フロー改善テスト（ヘッドレス） |
| `npm run test:flow:headed` | ブラウザを表示してテスト |
| `npm run test:flow:ui` | UIモードでインタラクティブにテスト |
| `npm run test:flow:debug` | デバッグモードでテスト |
| `npm run test:e2e` | 全E2Eテストを実行 |
| `npm run test:e2e:ui` | 全E2EテストをUIモードで実行 |

### 型チェック・リンター

| コマンド | 説明 |
|---------|------|
| `npm run type-check` | TypeScript型チェック |
| `npm run lint` | ESLintチェック |

## テストの詳細

### フロー改善テスト

**対象**: Phase 4.8のフロー改善機能

**テストシナリオ**:
- ✅ シナリオ1: 基本情報収集フロー（collecting_basic）
- ✅ シナリオ2: 詳細情報収集フロー（collecting_detailed）
- ✅ シナリオ3: 骨組み作成フロー（skeleton）
- ✅ エッジケース1: 情報が不足したまま進む
- ✅ エッジケース3: LocalStorageの永続化
- ✅ パフォーマンステスト

**テストファイル**: `e2e/flow-improvement.spec.ts`

**詳細**: [e2e/README.md](./e2e/README.md)

## テスト実行の前提条件

1. **Node.js**: v18以上
2. **開発サーバー**: テスト実行前に起動しておく
   ```bash
   npm run dev
   ```
3. **Playwrightブラウザ**: 初回のみインストール
   ```bash
   npx playwright install
   ```

## テスト結果の確認

### 1. コンソール出力

テスト実行時、リアルタイムで結果が表示されます：

```
✓ 開発サーバーが起動しています (http://localhost:3001)
✓ 依存関係OK
✓ ブラウザOK

🧪 ヘッドレスモードでテスト実行...

Running 6 tests using 1 worker
  ✓ シナリオ1: 基本情報収集フロー（collecting_basic）
  ✓ シナリオ2: 詳細情報収集フロー（collecting_detailed）
  ...

  6 passed (45s)

🎉 全てのテストが成功しました！
```

### 2. HTMLレポート

詳細なHTMLレポートが自動生成されます：

```bash
npx playwright show-report
```

レポートには以下が含まれます：
- テスト実行時間
- スクリーンショット（失敗時）
- トレースログ
- ネットワークリクエスト

### 3. ログファイル

テスト結果は以下に記録されます：

```
test-results/flow-improvement-results.log
```

## トラブルシューティング

### Q: テストが「開発サーバーが起動していません」で失敗する

**A:** 別のターミナルで開発サーバーを起動してください：

```bash
npm run dev
```

### Q: テストが「ログインページ」でスキップされる

**A:** 現在、認証が必要なページではテストがスキップされます。
開発時は認証をバイパスするか、モック認証を実装してください。

### Q: AIレスポンスでタイムアウトする

**A:** `playwright.config.ts` でタイムアウトを延長してください：

```typescript
export default defineConfig({
  timeout: 60000, // 60秒
  expect: {
    timeout: 10000, // 10秒
  },
});
```

### Q: 「Playwrightブラウザがインストールされていない」と表示される

**A:** Playwrightブラウザをインストールしてください：

```bash
npx playwright install
```

## CI/CD統合

### GitHub Actions

`.github/workflows/test.yml` に以下を追加：

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      
      - name: Build application
        run: npm run build
      
      - name: Start server
        run: npm start &
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      
      - name: Wait for server
        run: npx wait-on http://localhost:3000
      
      - name: Run E2E tests
        run: npm run test:flow
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## テストの追加

新しいテストを追加する手順：

1. **テストファイルを作成**
   ```bash
   touch e2e/new-feature.spec.ts
   ```

2. **テストを記述**
   ```typescript
   import { test, expect } from '@playwright/test';
   
   test.describe('新機能', () => {
     test('動作確認', async ({ page }) => {
       await page.goto('http://localhost:3001');
       // テストロジック
     });
   });
   ```

3. **テストを実行**
   ```bash
   npx playwright test e2e/new-feature.spec.ts
   ```

## ベストプラクティス

1. **独立性**: 各テストは独立して実行できるようにする
2. **クリーンアップ**: テスト前にLocalStorageなどをクリア
3. **明確なアサーション**: 期待値を明確に記述
4. **安定したセレクタ**: data-testidやrole属性を使用
5. **適切な待機**: AIレスポンスには十分な待機時間を設定

## 関連ドキュメント

- [フロー改善テストガイド](./docs/FLOW_IMPROVEMENT_TEST_GUIDE.md)
- [E2Eテスト README](./e2e/README.md)
- [Playwright公式ドキュメント](https://playwright.dev/)

