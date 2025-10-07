'use client';

import React from 'react';
import { User, Mail, Calendar, LogOut, Trash2, AlertCircle } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { clearAllAppData } from '@/lib/utils/storage';

/**
 * アカウント設定コンポーネント
 * ユーザー情報の表示とアカウント管理
 */
export const AccountSettings: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      await signOut({ callbackUrl: '/login' });
    }
  };

  const handleClearData = () => {
    if (confirm('すべてのアプリケーションデータを削除しますか？\n\n削除されるデータ:\n- AIモデル設定\n- Claude APIキー\n- アプリケーション設定\n\nこの操作は取り消せません。')) {
      const success = clearAllAppData();
      if (success) {
        alert('すべてのデータを削除しました。ページをリロードします。');
        window.location.reload();
      } else {
        alert('データの削除に失敗しました。');
      }
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '不明';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800">アカウント設定</h2>
        <p className="text-sm text-gray-600 mt-1">
          アカウント情報の確認とアカウント管理
        </p>
      </div>

      {/* ユーザー情報 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-medium text-gray-800 mb-4">ユーザー情報</h3>
        
        {session?.user ? (
          <div className="space-y-4">
            {/* プロフィール画像と名前 */}
            <div className="flex items-center space-x-4">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-16 h-16 rounded-full border-2 border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-500" />
                </div>
              )}
              <div>
                <p className="text-lg font-medium text-gray-800">
                  {session.user.name || '名前未設定'}
                </p>
                <p className="text-sm text-gray-600">
                  {session.user.email}
                </p>
              </div>
            </div>

            {/* 詳細情報 */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">メールアドレス</p>
                  <p className="text-sm font-medium text-gray-800">
                    {session.user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">ユーザーID</p>
                  <p className="text-sm font-medium text-gray-800 font-mono">
                    {session.user.id}
                  </p>
                </div>
              </div>

              {session.user.googleId && (
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Google ID</p>
                    <p className="text-sm font-medium text-gray-800">
                      連携済み
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            ユーザー情報を読み込めませんでした
          </div>
        )}
      </div>

      {/* アカウント操作 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-medium text-gray-800 mb-4">アカウント操作</h3>
        <div className="space-y-3">
          {/* ログアウト */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <LogOut className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">ログアウト</p>
                <p className="text-xs text-gray-600">
                  現在のセッションを終了します
                </p>
              </div>
            </div>
          </button>

          {/* データ削除 */}
          <button
            onClick={handleClearData}
            className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <Trash2 className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">すべてのデータを削除</p>
                <p className="text-xs text-red-600">
                  LocalStorageに保存されたすべてのアプリケーションデータを削除します
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 警告メッセージ */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-yellow-800">データ管理について</h4>
            <p className="text-sm text-yellow-700 mt-1">
              現在、データはブラウザのLocalStorageに保存されています。
              ブラウザのキャッシュをクリアすると、保存されたデータが失われる可能性があります。
              Phase 8以降でデータベース統合を予定しています。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};