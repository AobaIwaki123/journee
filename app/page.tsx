import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { Header } from '@/components/layout/Header';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { ResizableLayout } from '@/components/layout/ResizableLayout';
import { ErrorNotification } from '@/components/ui/ErrorNotification';
import { StorageInitializer } from '@/components/layout/StorageInitializer';
import { AutoSave } from '@/components/layout/AutoSave';

/**
 * メインページ（ホーム）
 * 
 * 認証済みユーザー向けのメインアプリケーション画面。
 * 
 * **デスクトップ (≥768px)**:
 * - 左側にチャットボックス（40%）、右側に旅のしおりプレビュー（60%）
 * 
 * **モバイル (<768px)**:
 * - タブ切り替えで「しおり」または「チャット」を表示
 * - しおりタブがデフォルト
 */
export default async function Home() {
  // 認証チェック（E2Eテスト時はスキップ）
  const isE2ETest = process.env.PLAYWRIGHT_TEST_MODE === 'true';
  if (!isE2ETest) {
    const session = await getSession();
    if (!session) {
      redirect('/login');
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* LocalStorageからデータ復元 */}
      <StorageInitializer />
      
      {/* しおりの自動保存 */}
      <AutoSave />

      {/* Header */}
      <Header />

      {/* Desktop Layout - Resizable Layout (≥768px) */}
      <div className="hidden md:block flex-1 overflow-hidden">
        <ResizableLayout />
      </div>

      {/* Mobile Layout - タブ切り替え (<768px) */}
      <div className="md:hidden flex-1 overflow-hidden">
        <MobileLayout />
      </div>

      {/* Error Notification */}
      <ErrorNotification />
    </div>
  );
}
