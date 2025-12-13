import { defineConfig, devices } from '@playwright/test';

// パッケージマネージャーに応じたコマンドを決定
const getDevCommand = () => {
  const packageManager = process.env.PACKAGE_MANAGER || 'npm';
  const baseCommand = 'PLAYWRIGHT_TEST_MODE=true';
  
  switch (packageManager) {
    case 'bun':
      return `${baseCommand} bun run dev`;
    case 'pnpm':
      return `${baseCommand} pnpm run dev`;
    case 'npm':
    default:
      return `${baseCommand} npm run dev`;
  }
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],  // HTMLレポート生成
    ['github'],                    // GitHub Actions用の注釈
    ['list'],                      // コンソール出力
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: getDevCommand(),
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      PLAYWRIGHT_TEST_MODE: 'true',
    },
  },
});