import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

/**
 * NextAuth設定オプション
 * 
 * Phase 2では認証のみを実装し、Phase 9以降でデータベース統合を行う
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],

  // セッション設定
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日間
  },

  // JWT設定
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30日間
  },

  // カスタムページ
  pages: {
    signIn: '/login',
    error: '/login',
  },

  // コールバック関数
  callbacks: {
    /**
     * JWTコールバック
     * トークンにユーザー情報を追加
     */
    async jwt({ token, user, account }) {
      // 初回サインイン時
      if (account && user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image

        // Google IDを保存
        if (account.provider === 'google') {
          token.googleId = account.providerAccountId
        }
      }

      return token
    },

    /**
     * セッションコールバック
     * セッションにユーザー情報を追加
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string | null
        session.user.image = token.picture as string | null
        session.user.googleId = token.googleId as string | undefined
      }

      return session
    },

    /**
     * サインインコールバック
     * サインインを許可するかどうかを決定
     */
    async signIn({ account, profile }) {
      // Googleプロバイダーのみを許可
      if (account?.provider === 'google') {
        // メールアドレスが確認済みかチェック
        const googleProfile = profile as {
          email_verified?: boolean
          email?: string
        }

        if (!googleProfile.email_verified) {
          console.error('Email not verified:', googleProfile.email)
          return false
        }

        return true
      }

      return false
    },

    /**
     * リダイレクトコールバック
     * 認証後のリダイレクト先を制御
     */
    async redirect({ url, baseUrl }) {
      // 相対URLの場合はそのまま使用
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // 同じオリジンの場合は許可
      else if (new URL(url).origin === baseUrl) {
        return url
      }
      // それ以外はホームページにリダイレクト
      return baseUrl
    },
  },

  // イベントハンドラー
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('User signed in:', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
      })
    },
    async signOut({ token }) {
      console.log('User signed out:', { userId: token?.id })
    },
  },

  // デバッグモード（開発環境のみ）
  debug: process.env.NODE_ENV === 'development',
}
