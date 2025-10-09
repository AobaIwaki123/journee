'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

/**
 * 認証プロバイダーコンポーネント
 * 
 * アプリケーション全体に認証機能を提供します。
 * next-auth/reactのSessionProviderをラップして使用。
 * 
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider
      // ウィンドウフォーカス時の自動セッション更新を無効化
      // ログアウト直後のリダイレクトループを防ぐ
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  )
}
