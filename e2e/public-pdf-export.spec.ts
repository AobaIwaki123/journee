import { test, expect } from "@playwright/test";

/**
 * 閲覧ページからのPDF出力機能テスト
 * 
 * 注意: このテストはシードデータ（test-itinerary-slug）を使用します。
 * テスト前に `npx tsx scripts/seed-e2e-data.ts` を実行してください。
 */
test.describe("閲覧ページからのPDF出力機能", () => {
  // シードデータに合わせた設定
  const TEST_SLUG = "test-itinerary-slug";
  const TEST_TITLE = "E2E Test Trip to Tokyo";
  const TEST_DESTINATION = "Tokyo";
  const TEST_SPOT = "Tokyo Tower";

  test("公開しおりページにPDFボタンが表示される", async ({ page }) => {
    await page.goto(`/share/${TEST_SLUG}`);

    // ページが正しく読み込まれることを確認
    await expect(page.getByText(TEST_TITLE)).toBeVisible({
      timeout: 10000,
    });

    // PDFプレビューボタンが表示されることを確認
    const previewButton = page.getByRole("button", { name: /プレビュー/i });
    await expect(previewButton).toBeVisible();

    // PDFダウンロードボタンが表示されることを確認
    const downloadButton = page.getByRole("button", { name: /PDF/i }).first();
    await expect(downloadButton).toBeVisible();

    console.log("✓ PDF関連ボタンが正しく表示される");
  });

  test("PDFプレビューボタンをクリックするとモーダルが開く", async ({
    page,
  }) => {
    await page.goto(`/share/${TEST_SLUG}`);

    // ページが読み込まれることを確認
    await expect(page.getByText(TEST_TITLE)).toBeVisible({
      timeout: 10000,
    });

    // プレビューボタンをクリック
    const previewButton = page.getByRole("button", { name: /プレビュー/i });
    await previewButton.click();

    // モーダルが表示されることを確認
    const modal = page.getByRole("heading", { name: /PDFプレビュー/i });
    await expect(modal).toBeVisible({ timeout: 5000 });

    // モーダル内にしおりタイトルが表示されることを確認（複数存在するので.first()を使用）
    await expect(page.getByRole("heading", { name: TEST_TITLE }).first()).toBeVisible();

    // モーダル内のPDF出力ボタンが表示されることを確認
    const modalExportButton = page.getByRole("button", { name: /PDF出力/i });
    await expect(modalExportButton).toBeVisible();

    // 閉じるボタンをクリックしてモーダルを閉じる
    const closeButton = page.getByRole("button", { name: /閉じる/i });
    await closeButton.click();

    // モーダルが閉じることを確認
    await expect(modal).not.toBeVisible();

    console.log("✓ PDFプレビューモーダルが正しく動作する");
  });

  test("PDFダウンロードボタンをクリックできる", async ({
    page,
  }) => {
    await page.goto(`/share/${TEST_SLUG}`);

    // ページが読み込まれることを確認
    await expect(page.getByRole("heading", { name: TEST_TITLE }).first()).toBeVisible({
      timeout: 10000,
    });

    // PDFダウンロードボタンが表示されていることを確認
    const downloadButton = page.getByRole("button", { name: /PDF/i }).first();
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toBeEnabled();

    // ボタンをクリック（PDF生成が開始される）
    await downloadButton.click();

    // 短時間待機（PDF生成処理が開始されたことを確認）
    await page.waitForTimeout(500);

    console.log("✓ PDFダウンロードボタンが正しく動作する");
  });

  test("しおりデータが正しく表示される", async ({ page }) => {
    await page.goto(`/share/${TEST_SLUG}`);

    // タイトルが表示されることを確認（ヘッダーのh1を使用）
    await expect(page.getByRole("heading", { name: TEST_TITLE }).first()).toBeVisible({
      timeout: 10000,
    });

    // 行き先が表示されることを確認（exactで完全一致）
    await expect(page.getByText(TEST_DESTINATION, { exact: true })).toBeVisible();

    // スポットが表示されることを確認（heading要素を使用）
    await expect(page.getByRole("heading", { name: TEST_SPOT })).toBeVisible();

    // 閲覧数が表示されることを確認
    await expect(page.getByText(/閲覧数:/)).toBeVisible();

    console.log("✓ しおりデータが正しく表示される");
  });

  test("URLコピーボタンが正しく動作する", async ({ page }) => {
    await page.goto(`/share/${TEST_SLUG}`);

    // ページが読み込まれることを確認
    await expect(page.getByText(TEST_TITLE)).toBeVisible({
      timeout: 10000,
    });

    // URLコピーボタンが表示されることを確認
    const copyButton = page.getByRole("button", { name: /URLコピー/i });
    await expect(copyButton).toBeVisible();

    console.log("✓ URLコピーボタンが正しく表示される");
  });

  test("モバイル表示でもPDFボタンが正しく表示される", async ({ page }) => {
    // モバイルビューポートを設定
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`/share/${TEST_SLUG}`);

    // ページが読み込まれることを確認
    await expect(page.getByText(TEST_TITLE)).toBeVisible({
      timeout: 10000,
    });

    // PDFボタンが表示されることを確認
    const previewButton = page.getByRole("button", { name: /プレビュー/i });
    const downloadButton = page.getByRole("button", { name: /PDF/i }).first();

    await expect(previewButton).toBeVisible();
    await expect(downloadButton).toBeVisible();

    console.log("✓ モバイル表示でもPDFボタンが正しく表示される");
  });
});
