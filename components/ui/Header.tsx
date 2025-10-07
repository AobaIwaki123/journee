'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { UserMenu } from '@/components/auth/UserMenu'
import { LoginButton } from '@/components/auth/LoginButton'

/**
 * ヘッダーコンポーネント
 * 
 * アプリケーション全体の上部ナビゲーションバー。
 * ロゴ、ナビゲーションリンク、ユーザーメニューを表示します。
 */
export function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* ロゴ */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl">✈️</div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Journee
              </span>
            </Link>

            {/* ナビゲーション（ログイン時のみ表示） */}
            {session && (
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  新規作成
                </Link>
                <Link
                  href="#"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    // TODO: Phase 4で実装予定
                    console.log('しおり一覧へ移動')
                  }}
                >
                  しおり一覧
                </Link>
              </nav>
            )}
          </div>

          {/* 右側メニュー */}
          <div className="flex items-center gap-4">
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
  )
}
