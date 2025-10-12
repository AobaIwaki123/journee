'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, X, LogIn } from 'lucide-react';

/**
 * ログインプロンプトバナーコンポーネント
 * 
 * 未ログインユーザーに対して、データの永続保存のためにログインを促すバナーを表示します。
 * - ブラウザストレージの一時性を説明
 * - データ損失のリスクを警告
 * - ログインボタンを提供
 */
export const LoginPromptBanner: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  // ログイン済み、または閉じられた場合は表示しない
  if (session?.user || dismissed) {
    return null;
  }

  const handleLogin = () => {
    router.push('/login');
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-1">
            ログインして旅のしおりを安全に保存
          </h3>
          <p className="text-sm text-amber-800 mb-3">
            現在、しおりはブラウザに一時保存されています。
            ブラウザのデータを削除したり、別の端末でアクセスすると、
            作成したしおりが失われる可能性があります。
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
            >
              <LogIn size={16} />
              ログインしてクラウドに保存
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-amber-700 hover:text-amber-900 transition-colors text-sm"
            >
              後で
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-amber-600 hover:text-amber-800 transition-colors"
          aria-label="閉じる"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};
