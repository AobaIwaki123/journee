<<<<<<< HEAD
'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { ChatBox } from '@/components/chat/ChatBox';
import { ItineraryPreview } from '@/components/itinerary/ItineraryPreview';

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
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
    </div>
  );
=======
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { Header } from '@/components/ui/Header'

/**
 * メインページ（ホーム）
 * 
 * 認証済みユーザー向けのメインアプリケーション画面。
 * 左側にチャットボックス、右側に旅のしおりプレビューを表示します。
 */
export default async function Home() {
  // 認証チェック
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto p-4">
        {/* デスクトップ版: 左右分割レイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-5rem)]">
          {/* 左側: チャットボックス (40%) */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <span>🤖</span>
                AIチャット
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                旅行の希望を教えてください
              </p>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {/* TODO: Phase 3で実装予定 - MessageList コンポーネント */}
              <div className="text-center text-gray-500 mt-20">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-lg font-medium mb-2">チャット機能</p>
                <p className="text-sm">Phase 3で実装予定</p>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4">
              {/* TODO: Phase 3で実装予定 - MessageInput コンポーネント */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="メッセージを入力..."
                  disabled
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  disabled
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  送信
                </button>
              </div>
            </div>
          </div>

          {/* 右側: 旅のしおりプレビュー (60%) */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <span>📋</span>
                旅のしおり
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                リアルタイムプレビュー
              </p>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {/* TODO: Phase 5で実装予定 - ItineraryPreview コンポーネント */}
              <div className="text-center text-gray-500 mt-20">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-lg font-medium mb-2">しおりプレビュー</p>
                <p className="text-sm mb-4">Phase 5で実装予定</p>
                <p className="text-xs text-gray-400">
                  AIとのチャットで旅程を作成すると、ここにしおりが表示されます
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <span className="font-medium">保存状態:</span>
                <span className="ml-2 text-gray-500">未保存</span>
              </div>
              <button
                disabled
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF出力
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
>>>>>>> 3cabe7b (feat: Implement authentication and basic layout)
}
