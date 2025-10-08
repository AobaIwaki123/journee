import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { Header } from '@/components/layout/Header';
import { ChatBox } from '@/components/chat/ChatBox';
import { ItineraryPreview } from '@/components/itinerary/ItineraryPreview';
import { ErrorNotification } from '@/components/ui/ErrorNotification';
import { StorageInitializer } from '@/components/layout/StorageInitializer';
import { AutoSave } from '@/components/layout/AutoSave';
import { ResizableLayout } from '@/components/layout/ResizableLayout';

/**
 * メインページ（ホーム）
 * 
 * 認証済みユーザー向けのメインアプリケーション画面。
 * 左側にチャットボックス、右側に旅のしおりプレビューを表示します。
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

      {/* Main Content - Resizable Layout */}
      <ResizableLayout />

      {/* Error Notification */}
      <ErrorNotification />
    </div>
  );
}
