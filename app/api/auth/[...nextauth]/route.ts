import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'

/**
 * NextAuth.js APIルートハンドラー
 * 
 * 以下のエンドポイントが自動的に生成されます：
 * - GET  /api/auth/signin          サインインページ
 * - POST /api/auth/signin/:provider プロバイダーでサインイン
 * - GET  /api/auth/signout         サインアウトページ
 * - POST /api/auth/signout         サインアウト実行
 * - GET  /api/auth/callback/:provider OAuth コールバック
 * - GET  /api/auth/session         セッション情報取得
 * - GET  /api/auth/csrf            CSRF トークン取得
 * - GET  /api/auth/providers       プロバイダー一覧取得
 */
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
