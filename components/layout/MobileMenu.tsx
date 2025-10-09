'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, BookOpen, Settings, User, LogOut, Plane, MessageSquare } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface MobileMenuProps {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  onFeedbackClick?: () => void;
}

/**
 * モバイル用ハンバーガーメニュー
 * 
 * ナビゲーションリンクとユーザーアクションをコンパクトに表示。
 */
export const MobileMenu: React.FC<MobileMenuProps> = ({
  userName,
  userEmail,
  userImage,
  onFeedbackClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  const handleFeedbackClick = () => {
    setIsOpen(false);
    onFeedbackClick?.();
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
    setIsOpen(false);
  };

  return (
    <>
      {/* ハンバーガーメニューボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* メニューオーバーレイ */}
      {isOpen && (
        <>
          {/* 背景オーバーレイ */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* メニューパネル */}
          <div className="fixed top-0 right-0 bottom-0 w-80 max-w-full bg-white shadow-2xl z-50 md:hidden animate-slideIn">
            <div className="flex flex-col h-full">
              {/* ヘッダー */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-500 rounded-lg p-2">
                    <Plane className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-gray-800">Journee</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="メニューを閉じる"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ユーザー情報 */}
              {userName && (
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    {userImage ? (
                      <img
                        src={userImage}
                        alt={userName}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {userName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {userEmail}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ナビゲーションリンク */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  <button
                    onClick={() => handleNavigation('/')}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Plane className="w-5 h-5" />
                    <span className="text-sm font-medium">ホーム</span>
                  </button>

                  <button
                    onClick={() => handleNavigation('/itineraries')}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="text-sm font-medium">しおり一覧</span>
                  </button>

                  <button
                    onClick={handleFeedbackClick}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-sm font-medium">フィードバック</span>
                  </button>

                  <button
                    onClick={() => handleNavigation('/settings')}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="text-sm font-medium">設定</span>
                  </button>
                </div>
              </nav>

              {/* ログアウトボタン */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">ログアウト</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
