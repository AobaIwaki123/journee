import { test, expect } from '@playwright/test';
import type { ItineraryData } from '@/types/itinerary';

test.describe('閲覧ページからのPDF出力機能', () => {
  const mockItinerary: ItineraryData = {
    id: 'test-public-itinerary',
    userId: 'test-user',
    title: '京都3日間の旅',
    destination: '京都',
    startDate: '2025-10-15',
    endDate: '2025-10-17',
    duration: 3,
    schedule: [
      {
        day: 1,
        date: '2025-10-15',
        title: '1日目：嵐山エリア',
        theme: '自然と歴史',
        spots: [
          {
            id: 'spot-1',
            name: '嵐山',
            description: '京都を代表する観光地。竹林の道や渡月橋が有名。',
            category: 'sightseeing',
            scheduledTime: '10:00',
            duration: 120,
            estimatedCost: 0,
            location: {
              lat: 35.0094,
              lng: 135.6689,
              address: '京都府京都市右京区嵐山',
            },
          },
          {
            id: 'spot-2',
            name: '天龍寺',
            description: '世界遺産の禅寺。美しい庭園が見どころ。',
            category: 'sightseeing',
            scheduledTime: '12:30',
            duration: 90,
            estimatedCost: 800,
            location: {
              lat: 35.0156,
              lng: 135.6739,
              address: '京都府京都市右京区嵯峨天龍寺',
            },
          },
        ],
        totalCost: 800,
      },
      {
        day: 2,
        date: '2025-10-16',
        title: '2日目：東山エリア',
        theme: '歴史的建造物',
        spots: [
          {
            id: 'spot-3',
            name: '清水寺',
            description: '京都を代表する寺院。清水の舞台から市街を一望。',
            category: 'sightseeing',
            scheduledTime: '09:00',
            duration: 120,
            estimatedCost: 400,
          },
        ],
        totalCost: 400,
      },
    ],
    summary: '京都の主要観光地を巡る3日間の旅。嵐山、東山、祇園を中心に、歴史と自然を満喫するプランです。',
    totalBudget: 50000,
    status: 'published',
    slug: 'test-kyoto-trip',
    isPublic: true,
    allowPdfDownload: true,
    viewCount: 123,
    createdAt: new Date('2025-10-01T00:00:00Z'),
    updatedAt: new Date('2025-10-05T00:00:00Z'),
    publishedAt: new Date('2025-10-05T00:00:00Z'),
  };

  test.beforeEach(async ({ page }) => {
    // APIレスポンスをモック
    await page.route('**/api/itinerary/public/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockItinerary }),
      });
    });
  });

  test('公開しおりページにPDFボタンが表示される', async ({ page }) => {
    await page.goto('/share/test-kyoto-trip');

    // ページが正しく読み込まれることを確認
    await expect(page.getByText('京都3日間の旅')).toBeVisible({ timeout: 5000 });

    // PDFプレビューボタンが表示されることを確認
    const previewButton = page.getByRole('button', { name: /プレビュー/i });
    await expect(previewButton).toBeVisible();

    // PDFダウンロードボタンが表示されることを確認
    const downloadButton = page.getByRole('button', { name: /PDF/i }).first();
    await expect(downloadButton).toBeVisible();

    console.log('✓ PDF関連ボタンが正しく表示される');
  });

  test('allowPdfDownloadがfalseの場合、PDFボタンが表示されない', async ({ page }) => {
    // allowPdfDownload=falseのモックデータ
    const itineraryWithoutPdf = { ...mockItinerary, allowPdfDownload: false };

    await page.route('**/api/itinerary/public/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: itineraryWithoutPdf }),
      });
    });

    await page.goto('/share/test-kyoto-trip');

    // ページが読み込まれることを確認
    await expect(page.getByText('京都3日間の旅')).toBeVisible({ timeout: 5000 });

    // PDFボタンが表示されないことを確認
    const previewButton = page.getByRole('button', { name: /プレビュー/i });
    const downloadButton = page.getByRole('button', { name: /PDF/i });

    await expect(previewButton).not.toBeVisible();
    await expect(downloadButton).not.toBeVisible();

    console.log('✓ allowPdfDownload=falseの場合、PDFボタンは非表示');
  });

  test('PDFプレビューボタンをクリックするとモーダルが開く', async ({ page }) => {
    await page.goto('/share/test-kyoto-trip');

    // プレビューボタンをクリック
    const previewButton = page.getByRole('button', { name: /プレビュー/i });
    await previewButton.click();

    // モーダルが表示されることを確認
    const modal = page.getByRole('heading', { name: /PDFプレビュー/i });
    await expect(modal).toBeVisible({ timeout: 3000 });

    // モーダル内にしおりタイトルが表示されることを確認
    await expect(page.getByText('京都3日間の旅')).toBeVisible();

    // モーダル内のPDF出力ボタンが表示されることを確認
    const modalExportButton = page.getByRole('button', { name: /PDF出力/i });
    await expect(modalExportButton).toBeVisible();

    // 閉じるボタンをクリックしてモーダルを閉じる
    const closeButton = page.getByRole('button', { name: /閉じる/i });
    await closeButton.click();

    // モーダルが閉じることを確認
    await expect(modal).not.toBeVisible();

    console.log('✓ PDFプレビューモーダルが正しく動作する');
  });

  test('PDFダウンロードボタンをクリックすると生成プロセスが開始される', async ({ page }) => {
    // jsPDFとhtml2canvasをモック（実際のダウンロードを防ぐ）
    await page.addInitScript(() => {
      // @ts-ignore
      window.jsPDF = class {
        constructor() {}
        addImage() {}
        addPage() {}
        save() {
          console.log('Mock PDF save called');
        }
        internal = {
          pageSize: {
            getWidth: () => 210,
            getHeight: () => 297,
          },
        };
      };

      // @ts-ignore
      window.html2canvas = () => Promise.resolve({
        width: 800,
        height: 1200,
        toDataURL: () => 'data:image/jpeg;base64,mockimage',
      });
    });

    await page.goto('/share/test-kyoto-trip');

    // PDFダウンロードボタンをクリック
    const downloadButton = page.getByRole('button', { name: /PDF/i }).first();
    await downloadButton.click();

    // ローディング状態が表示されることを確認
    const loadingIndicator = page.getByRole('button').filter({ hasText: /%/ });
    
    // Note: 実際のPDF生成は非常に速いため、ローディングが一瞬で終わる可能性がある
    // ボタンが無効化されることを確認（代替）
    await expect(downloadButton).toBeDisabled();

    console.log('✓ PDF生成プロセスが開始される');
  });

  test('しおりデータが正しく表示される', async ({ page }) => {
    await page.goto('/share/test-kyoto-trip');

    // タイトルが表示されることを確認
    await expect(page.getByText('京都3日間の旅')).toBeVisible();

    // 行き先が表示されることを確認
    await expect(page.getByText('京都')).toBeVisible();

    // 日程が表示されることを確認
    await expect(page.getByText('1日目：嵐山エリア')).toBeVisible();
    await expect(page.getByText('2日目：東山エリア')).toBeVisible();

    // スポットが表示されることを確認
    await expect(page.getByText('嵐山')).toBeVisible();
    await expect(page.getByText('天龍寺')).toBeVisible();
    await expect(page.getByText('清水寺')).toBeVisible();

    // 閲覧数が表示されることを確認
    await expect(page.getByText(/閲覧数:/)).toBeVisible();

    console.log('✓ しおりデータが正しく表示される');
  });

  test('共有ボタンが正しく動作する', async ({ page }) => {
    await page.goto('/share/test-kyoto-trip');

    // 共有ボタンが表示されることを確認
    const shareButton = page.getByRole('button', { name: /共有/ });
    await expect(shareButton).toBeVisible();

    // URLコピーボタンが表示されることを確認
    const copyButton = page.getByRole('button', { name: /URLコピー/ });
    await expect(copyButton).toBeVisible();

    console.log('✓ 共有ボタンが正しく表示される');
  });

  test('モバイル表示でもPDFボタンが正しく表示される', async ({ page }) => {
    // モバイルビューポートを設定
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/share/test-kyoto-trip');

    // ページが読み込まれることを確認
    await expect(page.getByText('京都3日間の旅')).toBeVisible({ timeout: 5000 });

    // PDFボタンが表示されることを確認（モバイルでは"PDF"テキストは非表示だがアイコンは表示）
    const previewButton = page.getByRole('button', { name: /プレビュー/i });
    const downloadButton = page.getByRole('button', { name: /PDF/i }).first();

    await expect(previewButton).toBeVisible();
    await expect(downloadButton).toBeVisible();

    console.log('✓ モバイル表示でもPDFボタンが正しく表示される');
  });
});
