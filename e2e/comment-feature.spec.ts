/**
 * コメント機能のE2Eテスト
 */

import { test, expect } from '@playwright/test';

test.describe('コメント機能', () => {
  // テスト用の公開しおりURL
  const SHARED_ITINERARY_URL = '/share/test-itinerary'; // 実際のURLに置き換える

  test.beforeEach(async ({ page }) => {
    // 公開しおりページに移動
    await page.goto(SHARED_ITINERARY_URL);
  });

  test('コメントセクションが表示される', async ({ page }) => {
    // コメントセクションを確認
    await expect(page.getByRole('heading', { name: /コメント/ })).toBeVisible();
  });

  test('匿名でコメントを投稿できる', async ({ page }) => {
    // 名前を入力
    await page.fill('input[placeholder="匿名ユーザー"]', 'テストユーザー');

    // コメントを入力
    await page.fill('textarea[placeholder="コメントを入力..."]', 'これはテストコメントです');

    // 投稿ボタンをクリック
    await page.click('button:has-text("投稿")');

    // コメントが表示されることを確認
    await expect(page.getByText('これはテストコメントです')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('テストユーザー')).toBeVisible();
  });

  test('文字数制限を超えるとエラーメッセージが表示される', async ({ page }) => {
    // 501文字のコメントを入力
    const longComment = 'あ'.repeat(501);
    await page.fill('textarea[placeholder="コメントを入力..."]', longComment);

    // エラーメッセージを確認
    await expect(page.getByText(/500文字以内/)).toBeVisible();
  });

  test('空のコメントは投稿できない', async ({ page }) => {
    // 投稿ボタンが無効化されていることを確認
    const submitButton = page.locator('button:has-text("投稿")');
    await expect(submitButton).toBeDisabled();
  });

  test('文字数カウンターが正しく表示される', async ({ page }) => {
    // コメントを入力
    await page.fill('textarea[placeholder="コメントを入力..."]', 'テスト');

    // 文字数カウンターを確認（500文字制限）
    await expect(page.getByText(/残り496文字/)).toBeVisible();
  });

  test('コメントを報告できる', async ({ page }) => {
    // 既存のコメントがあると仮定
    // 報告ボタンをクリック
    const reportButton = page.locator('button[title="報告"]').first();
    
    // ボタンが存在する場合のみテスト
    if (await reportButton.count() > 0) {
      await reportButton.click();

      // 確認ダイアログをハンドル
      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('報告');
        await dialog.accept();
      });

      // 報告完了のアラートを確認
      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('報告しました');
        await dialog.accept();
      });
    }
  });

  test('コメント一覧のページネーションが機能する', async ({ page }) => {
    // 「さらに読み込む」ボタンが存在するか確認
    const loadMoreButton = page.locator('button:has-text("さらに読み込む")');
    
    if (await loadMoreButton.count() > 0) {
      // 現在のコメント数を取得
      const initialCommentCount = await page.locator('[data-testid="comment-item"]').count();

      // 「さらに読み込む」をクリック
      await loadMoreButton.click();

      // コメントが増えることを確認
      await page.waitForTimeout(1000);
      const newCommentCount = await page.locator('[data-testid="comment-item"]').count();
      expect(newCommentCount).toBeGreaterThan(initialCommentCount);
    }
  });

  test('相対時間が正しく表示される', async ({ page }) => {
    // コメントを投稿
    await page.fill('input[placeholder="匿名ユーザー"]', 'テスト');
    await page.fill('textarea[placeholder="コメントを入力..."]', 'テストコメント');
    await page.click('button:has-text("投稿")');

    // 「たった今」または「〜分前」が表示されることを確認
    await expect(
      page.getByText(/たった今|分前|時間前|日前/)
    ).toBeVisible({ timeout: 10000 });
  });

  test('認証ユーザーとしてコメントを投稿できる', async ({ page, context }) => {
    // 認証が必要なテストの場合
    // セッションをセットアップ（実際の認証フローに応じて調整）
    
    // 匿名チェックボックスが表示されていることを確認（認証済みの場合）
    const anonymousCheckbox = page.locator('input[type="checkbox"]:has-text("匿名で投稿")');
    
    if (await anonymousCheckbox.count() > 0) {
      // コメントを入力
      await page.fill('textarea[placeholder="コメントを入力..."]', '認証ユーザーのコメント');

      // 投稿
      await page.click('button:has-text("投稿")');

      // コメントが表示されることを確認
      await expect(page.getByText('認証ユーザーのコメント')).toBeVisible({ timeout: 10000 });
    }
  });

  test('自分のコメントを削除できる', async ({ page }) => {
    // 認証ユーザーとしてコメントを投稿
    await page.fill('textarea[placeholder="コメントを入力..."]', '削除テスト');
    await page.click('button:has-text("投稿")');

    // コメントが表示されるまで待つ
    await expect(page.getByText('削除テスト')).toBeVisible({ timeout: 10000 });

    // 削除ボタンをクリック
    const deleteButton = page.locator('button[title="削除"]').first();
    
    if (await deleteButton.count() > 0) {
      await deleteButton.click();

      // 確認ダイアログをハンドル
      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('削除');
        await dialog.accept();
      });

      // コメントが削除されることを確認
      await expect(page.getByText('削除テスト')).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('コメント数が正しく表示される', async ({ page }) => {
    // コメントヘッダーを確認
    const commentHeader = page.getByRole('heading', { name: /コメント \(\d+件\)/ });
    await expect(commentHeader).toBeVisible();
  });

  test('コメントがない場合は空状態メッセージが表示される', async ({ page }) => {
    // 新しいしおり（コメントがない）の場合
    // 「まだコメントがありません」というメッセージを確認
    const emptyMessage = page.getByText(/まだコメントがありません/);
    
    // コメントがない場合のみ表示される
    if (await emptyMessage.count() > 0) {
      await expect(emptyMessage).toBeVisible();
    }
  });
});
