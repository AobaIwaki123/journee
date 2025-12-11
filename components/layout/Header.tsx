
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plane, Settings, BookOpen, MessageSquare, Bell } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserMenu } from '@/components/auth/UserMenu';
import { LoginButton } from '@/components/auth/LoginButton';
import { SaveStatus } from '@/components/ui/SaveStatus';
import { MobileMenu } from './MobileMenu';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';
import { BranchModeIndicator } from '@/components/ui/BranchModeIndicator';

export const Header: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  return (
    <>
      <BranchModeIndicator />
      <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
        {/* ロゴ */}
        <div className="flex items-center space-x-2 md:space-x-3">
          <Link href="/" className="flex items-center space-x-2 md:space-x-3">
            <div className="bg-blue-500 rounded-lg p-1.5 md:p-2">
              <Plane className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-bold text-gray-800">Journee</h1>
              <p className="text-xs text-gray-500">AI旅のしおり作成</p>
            </div>
            {/* モバイルでは簡略版 */}
            <span className="sm:hidden text-lg font-bold text-gray-800">Journee</span>
          </Link>
        </div>

        {/* デスクトップメニュー (≥768px) */}
        <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
          {/* 保存状態表示 */}
          {session && <SaveStatus />}

          {/* しおり一覧ボタン */}
          {session && (
            <Link
              href="/itineraries"
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="しおり一覧"
            >
              <BookOpen className="w-5 h-5" />
              <span>しおり一覧</span>
            </Link>
          )}

          {/* フィードバックボタン */}
          <button
            onClick={() => setIsFeedbackModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="フィードバック"
          >
            <MessageSquare className="w-5 h-5" />
            <span>フィードバック</span>
          </button>

          {/* プッシュ通知デモ */}
          <Link
            href="/notification-demo"
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="プッシュ通知デモ"
          >
            <Bell className="w-5 h-5" />
            <span>通知デモ</span>
          </Link>

          {/* 設定ボタン */}
          {session && (
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="設定ページ"
            >
              <Settings className="w-5 h-5" />
              <span>設定</span>
            </button>
          )}

          {/* 認証ボタン */}
          {status === 'loading' ? (
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
          ) : session ? (
            <UserMenu />
          ) : (
            <LoginButton />
          )}
        </div>

        {/* モバイルメニュー (<768px) */}
        <div className="flex items-center space-x-2 md:hidden">
          {/* 保存状態表示（モバイル用コンパクト版） */}
          {session && (
            <div className="mr-1">
              <SaveStatus />
            </div>
          )}

          {/* ハンバーガーメニュー */}
          {status === 'loading' ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          ) : session ? (
            <MobileMenu
              userName={session.user?.name}
              userEmail={session.user?.email}
              userImage={session.user?.image}
              onFeedbackClick={() => setIsFeedbackModalOpen(true)}
            />
          ) : (
            <LoginButton />
          )}
        </div>
      </div>

      {/* フィードバックモーダル */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
      </header>
    </>
  );
};
