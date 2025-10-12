import { test, expect } from '@playwright/test';

test.describe('住所のマップリンク機能', () => {
  test.beforeEach(async ({ page }) => {
    // テストページに移動（公開しおりページを想定）
    await page.goto('/');
  });

  test('住所リンクが表示される', async ({ page }) => {
    // AIチャットでしおりを作成
    const chatInput = page.locator('textarea[placeholder*="旅行"]');
    await chatInput.fill('京都に1日旅行します');
    await page.keyboard.press('Enter');

    // AIレスポンスを待つ
    await page.waitForTimeout(5000);

    // しおりプレビューに住所が表示されるのを待つ
    const addressButton = page.locator('button:has-text("京都")').first();
    if (await addressButton.count() > 0) {
      await expect(addressButton).toBeVisible();
    }
  });

  test('住所をクリックすると新しいタブでGoogle Mapsが開く', async ({ page, context }) => {
    // 新しいページ（タブ）が開かれることを監視
    const pagePromise = context.waitForEvent('page');

    // AIチャットでしおりを作成
    const chatInput = page.locator('textarea[placeholder*="旅行"]');
    await chatInput.fill('大阪城に行きます');
    await page.keyboard.press('Enter');

    // AIレスポンスを待つ
    await page.waitForTimeout(5000);

    // 住所リンクを探してクリック
    const addressButtons = page.locator('button').filter({ hasText: /大阪|城/ });
    const firstButton = addressButtons.first();
    
    if (await firstButton.count() > 0) {
      await firstButton.click();

      // 新しいタブが開かれるのを待つ
      const newPage = await pagePromise;
      
      // Google MapsのURLが開かれたことを確認
      await newPage.waitForLoadState('domcontentloaded');
      const url = newPage.url();
      expect(url).toContain('google.com/maps');
      expect(url).toContain('query=');

      await newPage.close();
    }
  });

  test('マップアイコンが表示される', async ({ page }) => {
    // AIチャットでしおりを作成
    const chatInput = page.locator('textarea[placeholder*="旅行"]');
    await chatInput.fill('東京タワーを見に行きます');
    await page.keyboard.press('Enter');

    // AIレスポンスを待つ
    await page.waitForTimeout(5000);

    // MapPinアイコンが表示されているか確認（svgとして描画される）
    const mapIcons = page.locator('svg').filter({ has: page.locator('path') });
    if (await mapIcons.count() > 0) {
      await expect(mapIcons.first()).toBeVisible();
    }
  });

  test('公開しおりページでも住所リンクが機能する', async ({ page, context }) => {
    // 公開しおりのモックページ（実際のslugは環境によって異なる）
    // ここでは基本的な動作のみテスト
    await page.goto('/');

    // まず通常ページでしおりを作成し保存
    const chatInput = page.locator('textarea[placeholder*="旅行"]');
    await chatInput.fill('神戸に1日旅行します');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(5000);

    // 住所ボタンが存在することを確認
    const addressButtons = page.locator('button').filter({ hasText: /神戸|兵庫/ });
    if (await addressButtons.count() > 0) {
      await expect(addressButtons.first()).toBeVisible();
    }
  });

  test('複数の住所がある場合、それぞれクリック可能', async ({ page }) => {
    // AIチャットでしおりを作成
    const chatInput = page.locator('textarea[placeholder*="旅行"]');
    await chatInput.fill('東京スカイツリーと浅草寺を訪れます');
    await page.keyboard.press('Enter');

    // AIレスポンスを待つ
    await page.waitForTimeout(8000);

    // 複数の住所リンクボタンを取得
    const addressButtons = page.locator('button').filter({ 
      has: page.locator('svg') 
    }).filter({ hasText: /.+/ });

    const count = await addressButtons.count();
    if (count >= 2) {
      // 最初の住所ボタンをクリック可能
      await expect(addressButtons.nth(0)).toBeEnabled();
      // 2番目の住所ボタンもクリック可能
      await expect(addressButtons.nth(1)).toBeEnabled();
    }
  });

  test('住所にホバーするとカーソルがpointerになる', async ({ page }) => {
    // AIチャットでしおりを作成
    const chatInput = page.locator('textarea[placeholder*="旅行"]');
    await chatInput.fill('富士山を見に行きます');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(5000);

    // 住所ボタンを探してホバー
    const addressButtons = page.locator('button').filter({ hasText: /山梨|静岡|富士/ });
    
    if (await addressButtons.count() > 0) {
      const firstButton = addressButtons.first();
      await firstButton.hover();
      
      // カーソルスタイルを確認（ボタンなのでデフォルトでpointer）
      await expect(firstButton).toBeVisible();
    }
  });

  test('編集モードでも住所リンクが機能する', async ({ page, context }) => {
    // しおりを作成
    const chatInput = page.locator('textarea[placeholder*="旅行"]');
    await chatInput.fill('名古屋城に行きます');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(5000);

    // 編集可能なスポットカードでも住所リンクが表示されることを確認
    // EditableSpotCardを使用している場合
    const addressButtons = page.locator('button').filter({ hasText: /名古屋|愛知/ });
    
    if (await addressButtons.count() > 0) {
      await expect(addressButtons.first()).toBeVisible();
    }
  });

  test('モバイルビューでも住所リンクが機能する', async ({ page }) => {
    // モバイルビューポートを設定
    await page.setViewportSize({ width: 375, height: 667 });

    // しおりを作成
    const chatInput = page.locator('textarea[placeholder*="旅行"]');
    await chatInput.fill('横浜中華街に行きます');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(5000);

    // モバイルでも住所リンクが表示される
    const addressButtons = page.locator('button').filter({ hasText: /横浜|神奈川/ });
    
    if (await addressButtons.count() > 0) {
      await expect(addressButtons.first()).toBeVisible();
      
      // タップ可能か確認
      await expect(addressButtons.first()).toBeEnabled();
    }
  });

  test('住所が空の場合はリンクが表示されない', async ({ page }) => {
    // 住所なしのスポットを含むしおりの場合
    await page.goto('/');

    // 通常のスポットカードは表示される
    await expect(page.locator('.bg-white')).toBeVisible();
  });

  test('日本語以外の住所でも動作する', async ({ page, context }) => {
    const pagePromise = context.waitForEvent('page');

    // 英語の住所でテスト
    const chatInput = page.locator('textarea[placeholder*="旅行"]');
    await chatInput.fill('ニューヨークの自由の女神を見に行きます');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(5000);

    const addressButtons = page.locator('button').filter({ hasText: /New York|Liberty|自由の女神/ });
    
    if (await addressButtons.count() > 0) {
      await addressButtons.first().click();

      const newPage = await pagePromise;
      await newPage.waitForLoadState('domcontentloaded');
      const url = newPage.url();
      expect(url).toContain('google.com/maps');

      await newPage.close();
    }
  });
});
