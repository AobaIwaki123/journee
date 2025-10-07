import { getServerSession } from 'next-auth'
import { authOptions } from './auth-options'

/**
 * サーバーサイドでセッションを取得するヘルパー関数
 * 
 * App RouterのServer Componentやroute.tsで使用できます。
 * 
 * @returns 現在のセッション情報（未認証の場合はnull）
 * 
 * @example
 * ```typescript
 * import { getSession } from '@/lib/auth/session'
 * 
 * export async function GET() {
 *   const session = await getSession()
 *   
 *   if (!session) {
 *     return new Response('Unauthorized', { status: 401 })
 *   }
 *   
 *   // セッション情報を使用
 *   const userId = session.user.id
 *   // ...
 * }
 * ```
 */
export async function getSession() {
  return await getServerSession(authOptions)
}

/**
 * 現在のユーザー情報を取得するヘルパー関数
 * 
 * @returns 現在のユーザー情報（未認証の場合はnull）
 * 
 * @example
 * ```typescript
 * import { getCurrentUser } from '@/lib/auth/session'
 * 
 * export async function GET() {
 *   const user = await getCurrentUser()
 *   
 *   if (!user) {
 *     return new Response('Unauthorized', { status: 401 })
 *   }
 *   
 *   console.log('User ID:', user.id)
 *   console.log('Email:', user.email)
 *   // ...
 * }
 * ```
 */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}

/**
 * ユーザーが認証済みかどうかをチェックするヘルパー関数
 * 
 * @returns 認証済みの場合はtrue
 * 
 * @example
 * ```typescript
 * import { isAuthenticated } from '@/lib/auth/session'
 * 
 * export async function GET() {
 *   if (!(await isAuthenticated())) {
 *     return new Response('Unauthorized', { status: 401 })
 *   }
 *   
 *   // 認証済みの処理
 *   // ...
 * }
 * ```
 */
export async function isAuthenticated() {
  const session = await getSession()
  return !!session
}
