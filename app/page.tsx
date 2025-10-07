import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { Header } from '@/components/layout/Header';
import { ChatBox } from '@/components/chat/ChatBox';
import { ItineraryPreview } from '@/components/itinerary/ItineraryPreview';
import { ErrorNotification } from '@/components/ui/ErrorNotification';
import { StorageInitializer } from '@/components/layout/StorageInitializer';

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

      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Box - Left Side (40%) */}
        <div className="w-2/5 border-r border-gray-200">
          <ChatBox />
        </div>

        {/* Itinerary Preview - Right Side (60%) */}
        <div className="w-3/5">
          <ItineraryPreview />
        </div>
      </div>

      {/* Error Notification */}
      <ErrorNotification />
    </div>
  );
}
