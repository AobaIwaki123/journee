'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plane, Settings, BookOpen } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserMenu } from '@/components/auth/UserMenu';
import { LoginButton } from '@/components/auth/LoginButton';

export const Header: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-3">
            <div className="bg-blue-500 rounded-lg p-2">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Journee</h1>
              <p className="text-xs text-gray-500">AI旅のしおり作成</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {/* しおり一覧ボタン */}
          {session && (
            <Link
              href="/itineraries"
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="しおり一覧"
            >
              <BookOpen className="w-5 h-5" />
              <span className="hidden sm:inline">しおり一覧</span>
            </Link>
          )}

          {/* 設定ボタン */}
          {session && (
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="設定ページ"
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">設定</span>
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
        </div>
      </div>
    </header>
  );
};
