'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

/**
 * ログインリダイレクトコンポーネント
 * 
 * ログイン済みユーザーをホームページにリダイレクトします。
 * クライアントサイドで動作するため、ログアウト直後のリダイレクトループを回避できます。
 */
export function LoginRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // ログアウトから来た場合はリダイレクトしない
    const fromLogout = searchParams.get('from') === 'logout'
    
    if (status === 'authenticated' && !fromLogout) {
      // セッションがある場合はホームにリダイレクト
      router.replace('/')
    }
  }, [session, status, router, searchParams])

  return null
}
