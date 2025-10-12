'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Clock, ChevronUp, X, ListTodo } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';

export const MobilePlannerControls: React.FC = () => {
  const {
    isAutoProgressing,
    autoProgressState,
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);

  const progress = useMemo(() => {
    return autoProgressState?.progress || 0;
  }, [autoProgressState]);

  const phaseLabel = '進捗';

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  // モーダル表示時はスクロールを固定
  useEffect(() => {
    if (!isOpen) return;

    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  // 初期フェーズでも操作ボタンを表示するため常に描画
  return (
    <>
      {/* トリガーボタン */}
      <button
        type="button"
        onClick={handleOpen}
        className="md:hidden fixed bottom-5 right-4 z-30 flex items-center gap-3 rounded-full bg-blue-600 px-4 py-3 text-white shadow-lg shadow-blue-500/40"
        aria-label="プランニングの進捗と操作を開く"
      >
        <Clock className="h-5 w-5" />
        <div className="text-left">
          <p className="text-[11px] uppercase tracking-widest text-white/80">
            プラン進捗
          </p>
          <p className="text-sm font-semibold leading-tight">
            {isAutoProgressing && autoProgressState
              ? autoProgressState.currentStep || '自動進行中'
              : '進捗'}
          </p>
        </div>
        <div className="ml-2 flex items-center gap-1 text-sm font-semibold">
          <span>{Math.round(progress)}%</span>
          <ChevronUp className="h-4 w-4" />
        </div>
      </button>

      {/* 下部シート */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={handleClose}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 flex justify-center">
            <div className="w-full max-w-md rounded-t-3xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">プランニングの状況</p>
                  <p className="text-xs text-gray-500">進捗の確認と次のアクションを選べます</p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                  aria-label="閉じる"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto px-5 pb-6 pt-4">
                {isAutoProgressing && autoProgressState ? (
                  <div className="mt-5 flex items-center gap-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    <ListTodo className="h-5 w-5 flex-shrink-0" />
                    <span>自動進行中です。完了までお待ちください。</span>
                  </div>
                ) : (
                  <div className="mt-5 flex items-center gap-3 rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-700">
                    <ListTodo className="h-5 w-5 flex-shrink-0" />
                    <span>現在、手動での操作はありません。</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
