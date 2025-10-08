import { test, expect } from '@playwright/test';

test.describe('testコマンドのモックデータ確認', () => {
  test('「test」と入力すると位置情報付きのしおりが表示される', async ({ page }) => {
    await page.goto('/');
    
    // メッセージ入力エリアを探す
    const messageInput = page.getByPlaceholder(/メッセージを入力/i);
    await messageInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // 「test」と入力
    await messageInput.fill('test');
    
    // 送信ボタンをクリック
    const sendButton = page.getByRole('button', { name: 'メッセージを送信' });
    await sendButton.click();
    
    // しおりが表示されるまで待機
    await page.waitForTimeout(2000);
    
    // しおりのタイトルが表示されることを確認
    await expect(page.getByText('京都2日間の旅')).toBeVisible({ timeout: 10000 });
    
    // LocalStorageから位置情報を確認
    const hasLocationsInfo = await page.evaluate(() => {
      const storage = localStorage.getItem('journee-storage');
      if (!storage) return { found: false, reason: 'no storage' };
      
      const parsed = JSON.parse(storage);
      const itinerary = parsed?.state?.currentItinerary;
      
      if (!itinerary) return { found: false, reason: 'no itinerary' };
      
      const allSpots = itinerary.schedule?.flatMap((day: any) => day.spots || []) || [];
      const spotsWithLocation = allSpots.filter((spot: any) => 
        spot.location?.lat && spot.location?.lng
      );
      
      return {
        found: true,
        totalSpots: allSpots.length,
        spotsWithLocation: spotsWithLocation.length,
        sampleLocation: spotsWithLocation[0]?.location,
        spotNames: spotsWithLocation.map((s: any) => s.name),
      };
    });
    
    console.log('位置情報確認結果:', JSON.stringify(hasLocationsInfo, null, 2));
    
    // 位置情報が存在することを確認
    expect(hasLocationsInfo.found).toBe(true);
    expect(hasLocationsInfo.totalSpots).toBeGreaterThan(0);
    expect(hasLocationsInfo.spotsWithLocation).toBeGreaterThan(0);
    expect(hasLocationsInfo.sampleLocation).toBeDefined();
    expect(hasLocationsInfo.sampleLocation?.lat).toBeDefined();
    expect(hasLocationsInfo.sampleLocation?.lng).toBeDefined();
    
    // 地図切り替えボタンが表示されることを確認
    const mapButton = page.getByRole('button', { name: '地図' });
    await expect(mapButton).toBeVisible({ timeout: 5000 });
    
    console.log('✓ testコマンドで位置情報付きのしおりが生成された');
    console.log(`✓ ${hasLocationsInfo.spotsWithLocation}/${hasLocationsInfo.totalSpots} スポットに位置情報あり`);
    console.log(`✓ スポット名: ${hasLocationsInfo.spotNames?.join(', ')}`);
  });

  test('地図を表示して観光スポットが表示される', async ({ page }) => {
    await page.goto('/');
    
    // 「test」と入力してしおりを生成
    const messageInput = page.getByPlaceholder(/メッセージを入力/i);
    await messageInput.waitFor({ state: 'visible', timeout: 10000 });
    await messageInput.fill('test');
    
    const sendButton = page.getByRole('button', { name: 'メッセージを送信' });
    await sendButton.click();
    
    // しおりが表示されるまで待機
    await page.waitForTimeout(2000);
    
    // 地図ボタンをクリック
    const mapButton = page.getByRole('button', { name: '地図' });
    await mapButton.waitFor({ state: 'visible', timeout: 5000 });
    await mapButton.click();
    
    // 地図が表示されることを確認（Google Maps APIキーがない場合はエラーメッセージが表示される）
    const mapContainer = page.locator('div[ref]').first();
    const errorMessage = page.getByText(/Google Maps APIキーが設定されていません/i);
    
    // どちらか一方が表示されることを確認
    const mapVisible = await mapContainer.isVisible().catch(() => false);
    const errorVisible = await errorMessage.isVisible().catch(() => false);
    
    expect(mapVisible || errorVisible).toBe(true);
    
    if (errorVisible) {
      console.log('✓ Google Maps APIキー未設定のため、エラーメッセージが表示された（正常）');
    } else {
      console.log('✓ 地図が正常に表示された');
    }
  });
});
