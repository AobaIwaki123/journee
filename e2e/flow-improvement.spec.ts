import { test, expect, Page } from "@playwright/test";

/**
 * フロー改善 E2Eテスト
 * テストガイド（FLOW_IMPROVEMENT_TEST_GUIDE.md）に基づく自動テスト
 */

// テスト前のセットアップ
test.beforeEach(async ({ page }) => {
  // ローカルストレージをクリア
  await page.goto("http://localhost:3001");
  await page.evaluate(() => {
    localStorage.clear();
  });
});

test.describe("フロー改善 統合テスト", () => {
  test.describe("シナリオ1: 基本情報収集フロー（collecting_basic）", () => {
    test("行き先と日数の収集を確認", async ({ page }) => {
      await page.goto("http://localhost:3001");

      // ログインが必要な場合はスキップ（モック認証を使用する場合は実装）
      // 今はログインページにリダイレクトされる可能性があるので確認
      const isLoginPage = await page
        .locator("text=ログイン")
        .isVisible()
        .catch(() => false);

      if (isLoginPage) {
        test.skip();
        return;
      }

      // チャット入力欄を探す
      const input = page.locator('textarea, input[type="text"]').first();
      await input.waitFor({ state: "visible", timeout: 10000 });

      // メッセージを入力
      await input.fill("京都に3日間行きたいです");

      // 送信ボタンをクリック
      const sendButton = page
        .locator('button[type="submit"], button:has-text("送信")')
        .first();
      await sendButton.click();

      // AIの応答を待つ
      await page.waitForTimeout(3000);

      // チェックリストが表示されることを確認
      const checklist = page.locator("text=情報収集の進捗");
      await expect(checklist).toBeVisible({ timeout: 10000 });

      // 行き先が抽出されていることを確認
      const destination = page.locator("text=行き先");
      await expect(destination).toBeVisible();

      // 日程が抽出されていることを確認
      const duration = page.locator("text=日程");
      await expect(duration).toBeVisible();

      // プログレスバーが表示されていることを確認
      const progressBar = page.locator('[class*="bg-blue-500"]');
      await expect(progressBar.first()).toBeVisible();

      // 「詳細情報を収集」ボタンが表示されることを確認
      const detailButton = page.locator('button:has-text("詳細情報を収集")');
      await expect(detailButton).toBeVisible();
    });
  });

  test.describe("シナリオ2: 詳細情報収集フロー（collecting_detailed）", () => {
    test("LLM主導の対話的情報収集を確認", async ({ page }) => {
      await page.goto("http://localhost:3001");

      const isLoginPage = await page
        .locator("text=ログイン")
        .isVisible()
        .catch(() => false);
      if (isLoginPage) {
        test.skip();
        return;
      }

      // 基本情報を入力
      const input = page.locator('textarea, input[type="text"]').first();
      await input.waitFor({ state: "visible", timeout: 10000 });
      await input.fill("京都に3日間行きたいです");

      const sendButton = page
        .locator('button[type="submit"], button:has-text("送信")')
        .first();
      await sendButton.click();
      await page.waitForTimeout(3000);

      // 「詳細情報を収集」ボタンをクリック
      const detailButton = page.locator('button:has-text("詳細情報を収集")');
      await detailButton.click();
      await page.waitForTimeout(2000);

      // ヘルプテキストが変更されることを確認
      const helpText = page.locator(
        "text=AIに興味、予算、同行者などを伝えてください"
      );
      await expect(helpText).toBeVisible({ timeout: 5000 });

      // 同行者情報を入力
      await input.fill("彼女と二人で行きます");
      await sendButton.click();
      await page.waitForTimeout(3000);

      // チェックリストが更新されることを確認（同行者）
      const travelers = page
        .locator("text=人数")
        .or(page.locator("text=同行者"));
      await expect(travelers.first()).toBeVisible({ timeout: 5000 });

      // 興味を入力
      await input.fill("寺社巡りとグルメを楽しみたいです");
      await sendButton.click();
      await page.waitForTimeout(3000);

      // チェックリストが更新されることを確認（興味）
      const interests = page
        .locator("text=興味")
        .or(page.locator("text=テーマ"));
      await expect(interests.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("シナリオ3: 骨組み作成フロー（skeleton）", () => {
    test("収集した情報を基に骨組みが作成されることを確認", async ({ page }) => {
      await page.goto("http://localhost:3001");

      const isLoginPage = await page
        .locator("text=ログイン")
        .isVisible()
        .catch(() => false);
      if (isLoginPage) {
        test.skip();
        return;
      }

      // 基本情報を入力
      const input = page.locator('textarea, input[type="text"]').first();
      await input.waitFor({ state: "visible", timeout: 10000 });
      await input.fill("京都に3日間行きたいです");

      const sendButton = page
        .locator('button[type="submit"], button:has-text("送信")')
        .first();
      await sendButton.click();
      await page.waitForTimeout(3000);

      // 詳細情報収集フェーズへ
      const detailButton = page.locator('button:has-text("詳細情報を収集")');
      await detailButton.click();
      await page.waitForTimeout(2000);

      // 同行者情報を入力
      await input.fill("彼女と二人で行きます");
      await sendButton.click();
      await page.waitForTimeout(3000);

      // 興味を入力
      await input.fill("寺社巡りとグルメを楽しみたいです");
      await sendButton.click();
      await page.waitForTimeout(3000);

      // 「骨組みを作成」ボタンをクリック
      const skeletonButton = page.locator('button:has-text("骨組みを作成")');
      await skeletonButton.click();
      await page.waitForTimeout(5000);

      // しおりプレビューに各日のテーマが表示されることを確認
      const day1 = page.locator("text=1日目");
      await expect(day1).toBeVisible({ timeout: 10000 });

      // テーマが表示されていることを確認
      const theme = page
        .locator('[class*="theme"]')
        .or(page.locator("text=テーマ"));
      await expect(theme.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("エッジケース1: 情報が不足したまま進む", () => {
    test("必須情報の不足が検出される", async ({ page }) => {
      await page.goto("http://localhost:3001");

      const isLoginPage = await page
        .locator("text=ログイン")
        .isVisible()
        .catch(() => false);
      if (isLoginPage) {
        test.skip();
        return;
      }

      // 不完全な情報を入力（行き先のみ）
      const input = page.locator('textarea, input[type="text"]').first();
      await input.waitFor({ state: "visible", timeout: 10000 });
      await input.fill("東京");

      const sendButton = page
        .locator('button[type="submit"], button:has-text("送信")')
        .first();
      await sendButton.click();
      await page.waitForTimeout(3000);

      // 「詳細情報を収集」ボタンをクリック
      const detailButton = page.locator('button:has-text("詳細情報を収集")');

      // ボタンが表示されているか確認
      const isVisible = await detailButton.isVisible().catch(() => false);

      if (isVisible) {
        await detailButton.click();
        await page.waitForTimeout(1000);

        // 警告ダイアログまたは不足情報の表示を確認
        const warning = page
          .locator("text=情報が不足")
          .or(page.locator("text=必須情報"))
          .or(page.locator('[class*="orange"]'));

        // 警告が表示されるか、またはボタンが無効化されているはず
        const warningVisible = await warning
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        expect(warningVisible).toBeTruthy();
      }
    });
  });

  test.describe("エッジケース3: LocalStorageの永続化", () => {
    test("フェーズと情報が保持される", async ({ page }) => {
      await page.goto("http://localhost:3001");

      const isLoginPage = await page
        .locator("text=ログイン")
        .isVisible()
        .catch(() => false);
      if (isLoginPage) {
        test.skip();
        return;
      }

      // 基本情報を入力
      const input = page.locator('textarea, input[type="text"]').first();
      await input.waitFor({ state: "visible", timeout: 10000 });
      await input.fill("京都に3日間行きたいです");

      const sendButton = page
        .locator('button[type="submit"], button:has-text("送信")')
        .first();
      await sendButton.click();
      await page.waitForTimeout(3000);

      // 詳細情報収集フェーズへ
      const detailButton = page.locator('button:has-text("詳細情報を収集")');
      await detailButton.click();
      await page.waitForTimeout(2000);

      // ページをリロード
      await page.reload();
      await page.waitForTimeout(2000);

      // フェーズが保持されていることを確認
      const helpText = page.locator(
        "text=AIに興味、予算、同行者などを伝えてください"
      );
      await expect(helpText).toBeVisible({ timeout: 5000 });

      // チェックリストの情報が復元されていることを確認
      const checklist = page.locator("text=情報収集の進捗");
      await expect(checklist).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe("パフォーマンステスト", () => {
  test("チェックリスト更新のパフォーマンス", async ({ page }) => {
    await page.goto("http://localhost:3001");

    const isLoginPage = await page
      .locator("text=ログイン")
      .isVisible()
      .catch(() => false);
    if (isLoginPage) {
      test.skip();
      return;
    }

    const input = page.locator('textarea, input[type="text"]').first();
    await input.waitFor({ state: "visible", timeout: 10000 });

    // メッセージ入力開始時刻
    const startTime = Date.now();

    await input.fill("京都に3日間行きたいです");

    const sendButton = page
      .locator('button[type="submit"], button:has-text("送信")')
      .first();
    await sendButton.click();

    // チェックリストが表示されるまでの時間を測定
    await page.locator("text=情報収集の進捗").waitFor({
      state: "visible",
      timeout: 10000,
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // レスポンスタイムが妥当な範囲内であることを確認（10秒以内）
    expect(responseTime).toBeLessThan(10000);
  });
});
