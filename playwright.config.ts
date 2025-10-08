import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  // AIレスポンス待ちを考慮したタイムアウト設定
  timeout: 60000, // 60秒（テスト全体）
  expect: {
    timeout: 10000, // 10秒（アサーション）
  },

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // 開発サーバー設定（既存サーバーを再利用）
  webServer: {
    command: "PLAYWRIGHT_TEST_MODE=true npm run dev",
    url: "http://localhost:3001",
    reuseExistingServer: true, // 既存の開発サーバーを使用
    timeout: 120000,
    env: {
      PLAYWRIGHT_TEST_MODE: "true",
    },
  },
});
