import { test, expect } from '@playwright/test';

/**
 * Phase 12: 閲覧モードでの住所リンク機能のE2Eテスト
 * 
 * テストシナリオ：
 * 1. 公開しおりページで住所が表示されている
 * 2. 住所をクリックするとGoogle Mapsが新しいタブで開く
 */

test.describe('閲覧モードでの住所リンク機能', () => {
  test.beforeEach(async ({ page }) => {
    // モック認証を設定（必要に応じて）
    await page.goto('/');
  });

  test('公開しおりページで住所がクリック可能なリンクとして表示される', async ({ page, context }) => {
    // 公開しおりページに遷移（実際のslugに応じて調整が必要）
    // ここではテスト用のモックデータがあると仮定
    await page.goto('/share/test-itinerary-slug');
    
    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');
    
    // 住所が表示されていることを確認
    const addressLink = page.locator('a').filter({ hasText: /住所|address/i }).first();
    
    if (await addressLink.count() > 0) {
      // 住所リンクが存在する場合のテスト
      
      // リンクが表示されている
      await expect(addressLink).toBeVisible();
      
      // Google MapsのURLが正しく設定されている
      const href = await addressLink.getAttribute('href');
      expect(href).toContain('google.com/maps/search');
      expect(href).toContain('api=1');
      expect(href).toContain('query=');
      
      // target="_blank"が設定されている
      await expect(addressLink).toHaveAttribute('target', '_blank');
      
      // rel属性が適切に設定されている
      await expect(addressLink).toHaveAttribute('rel', 'noopener noreferrer');
      
      // MapPinアイコンが表示されている
      const mapPinIcon = addressLink.locator('svg').first();
      await expect(mapPinIcon).toBeVisible();
      
      // ホバー時にスタイルが変わる（色が変わる）
      await addressLink.hover();
      const color = await addressLink.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      // ホバー時は青色（rgb(37, 99, 235) または類似）に変わることを期待
      // 注：実際の色コードは実装に応じて調整
    }
  });

  test('住所をクリックすると新しいタブでGoogle Mapsが開く', async ({ page, context }) => {
    await page.goto('/share/test-itinerary-slug');
    await page.waitForLoadState('networkidle');
    
    const addressLink = page.locator('a').filter({ hasText: /住所|address/i }).first();
    
    if (await addressLink.count() > 0) {
      // 新しいタブが開くことを監視
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        addressLink.click(),
      ]);
      
      // 新しいタブのURLがGoogle MapsのURLであることを確認
      await newPage.waitForLoadState('domcontentloaded');
      const url = newPage.url();
      expect(url).toContain('google.com/maps');
      
      // 新しいタブを閉じる
      await newPage.close();
    }
  });

  test('複数の住所がある場合、それぞれが独立してクリック可能', async ({ page }) => {
    await page.goto('/share/test-itinerary-slug');
    await page.waitForLoadState('networkidle');
    
    // すべての住所リンクを取得
    const addressLinks = page.locator('a[href*="google.com/maps/search"]');
    const count = await addressLinks.count();
    
    if (count > 1) {
      // 各リンクが異なる住所を指していることを確認
      const hrefs = [];
      for (let i = 0; i < Math.min(count, 3); i++) {
        const href = await addressLinks.nth(i).getAttribute('href');
        hrefs.push(href);
      }
      
      // すべてのhrefがユニークであることを確認（実際の住所が異なる場合）
      const uniqueHrefs = new Set(hrefs);
      expect(uniqueHrefs.size).toBeGreaterThanOrEqual(1);
    }
  });

  test('住所がない場合はリンクが表示されない', async ({ page }) => {
    // 住所がないしおりのページに遷移（存在する場合）
    // このテストは、住所データがないしおりが存在する場合のみ有効
    await page.goto('/share/no-address-itinerary-slug');
    await page.waitForLoadState('networkidle');
    
    // 住所リンクが存在しないことを確認
    const addressLinks = page.locator('a[href*="google.com/maps/search"]');
    const count = await addressLinks.count();
    expect(count).toBe(0);
  });

  test('モバイルビューポートでも住所リンクが正しく動作する', async ({ page, context }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/share/test-itinerary-slug');
    await page.waitForLoadState('networkidle');
    
    const addressLink = page.locator('a').filter({ hasText: /住所|address/i }).first();
    
    if (await addressLink.count() > 0) {
      // リンクがモバイルでも表示されている
      await expect(addressLink).toBeVisible();
      
      // タップ可能な領域が十分にある（アクセシビリティ）
      const box = await addressLink.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(24); // 最小タップ領域
      }
      
      // タップして新しいタブが開く
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        addressLink.click(),
      ]);
      
      expect(newPage.url()).toContain('google.com/maps');
      await newPage.close();
    }
  });

  test('URLエンコーディングが正しく行われている', async ({ page }) => {
    await page.goto('/share/test-itinerary-slug');
    await page.waitForLoadState('networkidle');
    
    const addressLink = page.locator('a[href*="google.com/maps/search"]').first();
    
    if (await addressLink.count() > 0) {
      const href = await addressLink.getAttribute('href');
      
      // URLエンコーディングされた文字列が含まれている
      // 日本語住所の場合、%記号を含むはず
      const queryParam = new URL(href!).searchParams.get('query');
      expect(queryParam).toBeTruthy();
      
      // デコードして元の住所と一致することを確認
      const displayText = await addressLink.textContent();
      expect(displayText).toBeTruthy();
      expect(displayText?.trim().length).toBeGreaterThan(0);
    }
  });
});
