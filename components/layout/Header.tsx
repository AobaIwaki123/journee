'use client';

import React from 'react';
import { Plane } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { UserMenu } from '@/components/auth/UserMenu';
import { LoginButton } from '@/components/auth/LoginButton';

export const Header: React.FC = () => {
  const { data: session, status } = useSession();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500 rounded-lg p-2">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Journee</h1>
            <p className="text-xs text-gray-500">AI旅のしおり作成</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {status === 'loading' ? (
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
          ) : session ? (
            <UserMenu />
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </header>
  );
};
