'use client';

import React from 'react';
import { User as UserIcon, Mail, Calendar } from 'lucide-react';
import type { Session } from 'next-auth';

interface UserProfileProps {
  session: Session;
  createdAt?: string; // ISO 8601形式の登録日
}

/**
 * ユーザープロフィールコンポーネント
 * プロフィール画像、ユーザー名、メールアドレス、登録日を表示
 * Phase 10.4: 実際のcreatedAtをpropsから受け取る
 */
export const UserProfile: React.FC<UserProfileProps> = ({ session, createdAt }) => {
  const { user } = session;
  
  // 登録日のフォーマット
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '登録日不明';

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* プロフィール画像 */}
        <div className="flex-shrink-0">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || 'User'}
              className="w-24 h-24 rounded-full border-4 border-blue-100 object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-blue-100 bg-blue-50 flex items-center justify-center">
              <UserIcon className="w-12 h-12 text-blue-400" />
            </div>
          )}
        </div>

        {/* ユーザー情報 */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {user.name || 'ゲストユーザー'}
          </h2>
          
          <div className="space-y-2">
            {/* メールアドレス */}
            <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{user.email}</span>
            </div>

            {/* 登録日 */}
            <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{formattedDate} 登録</span>
            </div>
          </div>

          {/* ステータスバッジ */}
          <div className="mt-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              アクティブ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};