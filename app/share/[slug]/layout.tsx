import { ReactNode } from 'react';
import type { Viewport } from 'next';

/**
 * Phase 10.2: 共有ページ専用レイアウト
 * 公開しおりの閲覧に最適化されたレイアウト
 */

// 共有ページ用のViewport設定
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // ズーム可能にして閲覧性を向上
  themeColor: '#667eea',
};

export default function ShareLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
