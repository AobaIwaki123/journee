/**
 * コメント機能のE2Eテスト
 */

import { test, expect } from '@playwright/test';

test.describe('コメント機能', () => {
  // テスト用の公開しおりURL
  const SHARED_ITINERARY_URL = '/share/test-itinerary-slug'; // 実際のURLに置き換える

  test.beforeEach(async ({ page }) => {
    // 公開しおりページに移動
    await page.goto(SHARED_ITINERARY_URL);
  });

  test('未認証ユーザーはコメントを閲覧できるが投稿はできない', async ({ page }) => {
    // コメントセクションヘッダー（コメント数込み）を確認
    // seedで2件追加しているので "コメント (2件)" となっているはず
    // 正規表現で柔軟にチェック
    await expect(page.getByRole('heading', { name: /コメント \(\d+件\)/ })).toBeVisible();

    // コメントアイテムの数を確認
    const commentItems = page.locator('[data-testid="comment-item"]');
    await expect(commentItems).toHaveCount(2);

    // 既存のコメントが表示されていることを確認
    await expect(page.getByText('楽しみですね！')).toBeVisible();
    await expect(page.getByText('参考にします！')).toBeVisible();

    // 投稿フォームが表示されていないことを確認
    await expect(page.locator('textarea[placeholder="コメントを入力..."]')).not.toBeVisible();

    // ログインを促すメッセージが表示されていることを確認
    await expect(page.getByText('コメントを投稿するにはログインが必要です')).toBeVisible();

    // ログインボタンが表示されていることを確認
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });
});
