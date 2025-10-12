import { DefaultSession } from 'next-auth'

/**
 * NextAuth用の拡張型定義
 */
declare module 'next-auth' {
  /**
   * セッションインターフェースの拡張
   */
  interface Session {
    user: {
      id: string
      googleId?: string
    } & DefaultSession['user']
  }

  /**
   * ユーザーインターフェースの拡張
   */
  interface User {
    id: string
    googleId?: string
    email: string
    name?: string | null
    image?: string | null
  }
}

declare module 'next-auth/jwt' {
  /**
   * JWTトークンインターフェースの拡張
   */
  interface JWT {
    id: string
    googleId?: string
  }
}

/**
 * 認証状態
 */
export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading'

/**
 * 認証エラー型
 */
export interface AuthError {
  error: string
  message: string
}

/**
 * ユーザープロフィール型
 */
export interface UserProfile {
  id: string
  email: string
  name: string | null
  image: string | null
  googleId: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * /api/user/me レスポンス型
 */
export interface UserMeResponse {
  id: string
  email: string
  name: string | null
  image: string | null
  googleId: string | null
  createdAt: string // ISO 8601形式
}

/**
 * /api/user/stats レスポンス型
 */
export interface UserStatsResponse {
  totalItineraries: number
  totalCountries: number
  totalDays: number
  monthlyStats: MonthlyStats[]
  countryDistribution: CountryDistribution[]
}

export interface MonthlyStats {
  month: string  // YYYY-MM形式
  count: number  // しおり作成数
}

export interface CountryDistribution {
  country: string
  count: number
  percent: number // 割合（0.0 - 1.0）
}
