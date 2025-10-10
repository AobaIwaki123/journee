'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AlertCircle, X, LogIn } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';

/**
 * Phase 11: ログインプロンプトバナー
 * 
 * 未ログインユーザーにログインを促すバナーコンポーネント
 * - しおりが存在する場合のみ表示
 * - 閉じるボタンで非表示可能（セッション中は再表示しない）
 */
export const LoginPromptBanner: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const currentItinerary = useStore((state) => state.currentItinerary);
  const [isDismissed, setIsDismissed] = useState(false);

  // ログイン済み、読み込み中、しおりがない、または閉じられた場合は表示しない
  if (status === 'loading' || session?.user || !currentItinerary || isDismissed) {
    return null;
  }

  const handleLogin = () => {
    router.push('/login');
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 rounded-r-lg shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 mb-1">
              ログインしてしおりを永続的に保存しましょう
            </h3>
            <p className="text-sm text-amber-800 mb-3">
              現在、しおりはブラウザにのみ保存されています。ブラウザのデータを削除すると失われる可能性があります。
              <br />
              ログインすると、データベースに安全に保存され、別のデバイスからもアクセスできるようになります。
            </p>
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
            >
              <LogIn size={16} />
              ログインして保存
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-amber-600 hover:text-amber-800 transition-colors flex-shrink-0"
          aria-label="閉じる"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};
