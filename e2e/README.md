# E2Eテスト

## 概要

このディレクトリには、Playwrightを使用したEnd-to-Endテストが含まれています。

## テストファイル

- `flow-improvement.spec.ts` - フロー改善機能の統合テスト
  - シナリオ1: 基本情報収集フロー（collecting_basic）
  - シナリオ2: 詳細情報収集フロー（collecting_detailed）
  - シナリオ3: 骨組み作成フロー（skeleton）
  - エッジケース1: 情報が不足したまま進む
  - エッジケース3: LocalStorageの永続化
  - パフォーマンステスト

## 前提条件

1. **開発サーバーが起動していること**
   ```bash
   npm run dev
   ```
   サーバーは `http://localhost:3001` または `http://localhost:3000` で起動している必要があります。

2. **Playwrightのインストール**
   ```bash
   npm install
   npx playwright install
   ```

## テスト実行方法

### 1. 基本的な実行（ヘッドレスモード）

```bash
npm run test:flow
```

または

```bash
./scripts/run-flow-tests.sh
```

### 2. ブラウザを表示して実行

```bash
npm run test:flow:headed
```

または

```bash
./scripts/run-flow-tests.sh --headed
```

### 3. UIモードで実行（推奨：開発時）

```bash
npm run test:flow:ui
```

または

```bash
./scripts/run-flow-tests.sh --ui
```

UIモードでは：
- テストをインタラクティブに実行できます
- 各ステップをステップバイステップで確認できます
- タイムラインビューで詳細を確認できます

### 4. デバッグモードで実行

```bash
npm run test:flow:debug
```

または

```bash
./scripts/run-flow-tests.sh --debug
```

### 5. レポート付きで実行

```bash
./scripts/run-flow-tests.sh --headed --report
```

テスト終了後、自動的にHTMLレポートが開きます。

### 6. 特定のテストのみ実行

```bash
npx playwright test e2e/flow-improvement.spec.ts --grep "基本情報収集"
```

## テスト結果の確認

### HTMLレポート

テスト実行後、HTMLレポートが自動生成されます：

```bash
npx playwright show-report
```

### ログファイル

テスト結果は以下のファイルに記録されます：

```
test-results/flow-improvement-results.log
```

## トラブルシューティング

### 1. 開発サーバーが起動していない

```
✗ 開発サーバーが起動していません
  別のターミナルで 'npm run dev' を実行してください
```

**解決方法:**
```bash
# 別のターミナルで
npm run dev
```

### 2. Playwrightブラウザがインストールされていない

```
⚠ Playwrightブラウザがインストールされていない可能性があります
```

**解決方法:**
```bash
npx playwright install
```

### 3. ログインページにリダイレクトされる

現在、テストは認証が必要なページでスキップされます。
モック認証を実装する場合は、テストファイルを更新してください。

### 4. テストがタイムアウトする

AIの応答に時間がかかる場合、タイムアウトが発生することがあります。

**解決方法:**
- `playwright.config.ts` でタイムアウト時間を延長
- テストファイル内の `waitForTimeout` を調整

## テストの追加

新しいテストを追加する場合：

1. `flow-improvement.spec.ts` に新しい `test.describe` ブロックを追加
2. テストケースを記述
3. 期待値を設定

例：

```typescript
test.describe('新しいシナリオ', () => {
  test('テスト内容の説明', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // テストロジック
    const element = page.locator('text=要素名');
    await expect(element).toBeVisible();
  });
});
```

## CI/CD統合

GitHub ActionsなどのCI/CDパイプラインに統合する場合：

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:flow

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## ベストプラクティス

1. **テストの独立性**: 各テストは独立して実行できるようにする
2. **クリーンアップ**: `beforeEach` でLocalStorageをクリア
3. **待機**: 適切な待機時間を設定（AIレスポンス考慮）
4. **セレクタ**: 安定したセレクタを使用（text, role, testid）
5. **スクリーンショット**: 失敗時のデバッグ用に自動保存される

## 関連ドキュメント

- [FLOW_IMPROVEMENT_TEST_GUIDE.md](../docs/FLOW_IMPROVEMENT_TEST_GUIDE.md) - 手動テストガイド
- [Playwright Documentation](https://playwright.dev/)

