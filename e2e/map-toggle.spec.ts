import { test, expect } from '@playwright/test';

test.describe('地図切り替えボタンのデバッグ', () => {
  test.beforeEach(async ({ page }) => {
    // ログインページに移動（認証が必要な場合）
    await page.goto('/');
    
    // ログイン処理が必要な場合はここに追加
    // 現在は認証をスキップするため、直接メインページをロード
  });

  test('しおりが存在しない場合、地図切り替えボタンは表示されない', async ({ page }) => {
    await page.goto('/');
    
    // 切り替えボタンが存在しないことを確認
    const scheduleButton = page.getByText('スケジュール');
    const mapButton = page.getByText('地図');
    
    await expect(scheduleButton).not.toBeVisible();
    await expect(mapButton).not.toBeVisible();
    
    console.log('✓ しおりなし状態: 切り替えボタンは非表示');
  });

  test('位置情報なしのしおりの場合、地図切り替えボタンは表示されない', async ({ page }) => {
    await page.goto('/');
    
    // LocalStorageに位置情報なしのしおりデータを設定
    await page.evaluate(() => {
      const mockItinerary = {
        id: 'test-itinerary-1',
        title: '東京旅行（位置情報なし）',
        destination: '東京',
        startDate: '2025-10-15',
        endDate: '2025-10-17',
        duration: 3,
        schedule: [
          {
            day: 1,
            date: '2025-10-15',
            title: '1日目',
            spots: [
              {
                id: 'spot-1',
                name: '浅草寺',
                description: '東京の観光名所',
                scheduledTime: '10:00',
                category: 'sightseeing' as const,
                // location は設定しない（位置情報なし）
              },
            ],
          },
        ],
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      localStorage.setItem('journee-storage', JSON.stringify({
        state: {
          currentItinerary: mockItinerary,
        },
        version: 0,
      }));
    });
    
    // ページをリロードしてLocalStorageのデータを反映
    await page.reload();
    
    // しおりが表示されることを確認
    await expect(page.getByText('東京旅行（位置情報なし）')).toBeVisible();
    
    // 切り替えボタンが存在しないことを確認
    const scheduleButton = page.getByRole('button', { name: 'スケジュール' });
    const mapButton = page.getByRole('button', { name: '地図' });
    
    await expect(scheduleButton).not.toBeVisible();
    await expect(mapButton).not.toBeVisible();
    
    console.log('✓ 位置情報なし: 切り替えボタンは非表示');
  });

  test('位置情報ありのしおりの場合、地図切り替えボタンが表示される', async ({ page }) => {
    await page.goto('/');
    
    // LocalStorageに位置情報ありのしおりデータを設定
    await page.evaluate(() => {
      const mockItinerary = {
        id: 'test-itinerary-2',
        title: '京都旅行（位置情報あり）',
        destination: '京都',
        startDate: '2025-10-20',
        endDate: '2025-10-22',
        duration: 3,
        schedule: [
          {
            day: 1,
            date: '2025-10-20',
            title: '1日目：嵐山エリア',
            spots: [
              {
                id: 'spot-1',
                name: '嵐山',
                description: '京都の観光名所',
                scheduledTime: '10:00',
                category: 'sightseeing' as const,
                location: {
                  lat: 35.0094,
                  lng: 135.6689,
                  address: '京都府京都市右京区嵐山',
                },
              },
              {
                id: 'spot-2',
                name: '渡月橋',
                description: '嵐山のシンボル',
                scheduledTime: '11:30',
                category: 'sightseeing' as const,
                location: {
                  lat: 35.0147,
                  lng: 135.6778,
                  address: '京都府京都市右京区嵯峨天龍寺',
                },
              },
            ],
          },
        ],
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      localStorage.setItem('journee-storage', JSON.stringify({
        state: {
          currentItinerary: mockItinerary,
        },
        version: 0,
      }));
    });
    
    // ページをリロードしてLocalStorageのデータを反映
    await page.reload();
    
    // しおりが表示されることを確認
    await expect(page.getByText('京都旅行（位置情報あり）')).toBeVisible();
    
    // デバッグ情報を取得
    const debugInfo = await page.evaluate(() => {
      const storage = localStorage.getItem('journee-storage');
      const parsed = storage ? JSON.parse(storage) : null;
      const itinerary = parsed?.state?.currentItinerary;
      
      const hasSchedule = itinerary?.schedule && itinerary.schedule.length > 0;
      const spots = itinerary?.schedule?.flatMap((day: any) => day.spots || []) || [];
      const spotsWithLocation = spots.filter((spot: any) => spot.location?.lat && spot.location?.lng);
      
      return {
        hasItinerary: !!itinerary,
        hasSchedule,
        totalSpots: spots.length,
        spotsWithLocation: spotsWithLocation.length,
        scheduleLength: itinerary?.schedule?.length || 0,
      };
    });
    
    console.log('デバッグ情報:', debugInfo);
    
    // 切り替えボタンが表示されることを確認
    const scheduleButton = page.getByRole('button', { name: 'スケジュール' });
    const mapButton = page.getByRole('button', { name: '地図' });
    
    // デバッグ: ボタンの存在確認
    const scheduleButtonExists = await scheduleButton.count();
    const mapButtonExists = await mapButton.count();
    
    console.log('スケジュールボタン数:', scheduleButtonExists);
    console.log('地図ボタン数:', mapButtonExists);
    
    // ボタンが表示されることを確認
    await expect(scheduleButton).toBeVisible({ timeout: 5000 });
    await expect(mapButton).toBeVisible({ timeout: 5000 });
    
    console.log('✓ 位置情報あり: 切り替えボタンが表示される');
  });

  test('地図切り替えボタンのクリック動作', async ({ page }) => {
    await page.goto('/');
    
    // 位置情報ありのしおりデータを設定
    await page.evaluate(() => {
      const mockItinerary = {
        id: 'test-itinerary-3',
        title: '大阪旅行',
        destination: '大阪',
        startDate: '2025-11-01',
        endDate: '2025-11-03',
        duration: 3,
        schedule: [
          {
            day: 1,
            date: '2025-11-01',
            title: '1日目',
            spots: [
              {
                id: 'spot-1',
                name: '大阪城',
                description: '大阪のシンボル',
                scheduledTime: '10:00',
                category: 'sightseeing' as const,
                location: {
                  lat: 34.6873,
                  lng: 135.5262,
                },
              },
            ],
          },
        ],
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      localStorage.setItem('journee-storage', JSON.stringify({
        state: {
          currentItinerary: mockItinerary,
        },
        version: 0,
      }));
    });
    
    await page.reload();
    
    // 切り替えボタンが表示されるまで待機
    const scheduleButton = page.getByRole('button', { name: 'スケジュール' });
    const mapButton = page.getByRole('button', { name: '地図' });
    
    await scheduleButton.waitFor({ state: 'visible', timeout: 5000 });
    
    // 初期状態はスケジュールビュー（スケジュールボタンがアクティブ）
    await expect(scheduleButton).toHaveClass(/bg-blue-500/);
    
    // 地図ボタンをクリック
    await mapButton.click();
    
    // 地図ボタンがアクティブになることを確認
    await expect(mapButton).toHaveClass(/bg-blue-500/);
    await expect(scheduleButton).not.toHaveClass(/bg-blue-500/);
    
    // スケジュールボタンをクリック
    await scheduleButton.click();
    
    // スケジュールボタンがアクティブに戻ることを確認
    await expect(scheduleButton).toHaveClass(/bg-blue-500/);
    await expect(mapButton).not.toHaveClass(/bg-blue-500/);
    
    console.log('✓ 切り替えボタンのクリック動作が正常');
  });

  test('hasLocations関数のデバッグ', async ({ page }) => {
    await page.goto('/');
    
    // テストデータを設定
    await page.evaluate(() => {
      const mockItinerary = {
        id: 'test-itinerary-debug',
        title: 'デバッグ用旅行',
        destination: 'テスト',
        schedule: [
          {
            day: 1,
            spots: [
              {
                id: 'spot-1',
                name: 'スポット1',
                location: {
                  lat: 35.6812,
                  lng: 139.7671,
                },
              },
            ],
          },
        ],
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      localStorage.setItem('journee-storage', JSON.stringify({
        state: {
          currentItinerary: mockItinerary,
        },
        version: 0,
      }));
    });
    
    await page.reload();
    
    // hasLocationsの計算結果を取得
    const hasLocationsResult = await page.evaluate(() => {
      const storage = localStorage.getItem('journee-storage');
      const parsed = storage ? JSON.parse(storage) : null;
      const itinerary = parsed?.state?.currentItinerary;
      
      if (!itinerary?.schedule) return { hasLocations: false, reason: 'no schedule' };
      
      const hasLocations = itinerary.schedule.some((day: any) =>
        day.spots?.some((spot: any) => spot.location?.lat && spot.location?.lng)
      );
      
      return {
        hasLocations,
        scheduleLength: itinerary.schedule.length,
        spots: itinerary.schedule.map((day: any) => ({
          day: day.day,
          spotCount: day.spots?.length || 0,
          spotsWithLocation: day.spots?.filter((s: any) => s.location?.lat && s.location?.lng).length || 0,
        })),
      };
    });
    
    console.log('hasLocations計算結果:', JSON.stringify(hasLocationsResult, null, 2));
    
    // 結果をアサート
    expect(hasLocationsResult.hasLocations).toBe(true);
  });
});
