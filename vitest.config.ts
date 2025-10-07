import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '.next/',
        'out/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/',
        '**/mock-data/',
        'scripts/',
        '__tests__/',
        '**/*.test.ts',
        '**/*.test.tsx',
        'lib/ai/__tests__/', // 既存の手動テストファイル
        'lib/store/__tests__/', // 既存の手動テストファイル
      ],
      include: ['lib/**/*.ts', 'components/**/*.tsx', 'app/**/*.tsx'],
      all: true,
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
    include: ['__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
    exclude: [
      'node_modules/',
      '.next/',
      'out/',
      'lib/ai/__tests__/prompts.test.ts', // 既存の手動テスト
      'lib/store/__tests__/phase-transitions.test.ts', // 既存の手動テスト
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});