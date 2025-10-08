import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Next.js ミドルウェア（認証保護）
 *
 * 特定のパスに対して認証を要求します。
 * 未認証の場合は自動的にログインページにリダイレクトされます。
 */
export default withAuth(
  function middleware(req) {
    // 認証済みユーザーのみアクセス可能
    // 追加のロジックが必要な場合はここに記述
    return NextResponse.next();
  },
  {
    callbacks: {
      /**
       * 認証が必要かどうかを判定
       * @param token - ユーザーのJWTトークン
       * @returns 認証済みの場合はtrue
       */
      authorized: ({ token }) => {
        // E2Eテストモード時は認証をバイパス
        if (process.env.PLAYWRIGHT_TEST_MODE === "true") {
          return true;
        }

        // トークンが存在する場合は認証済みとみなす
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

/**
 * ミドルウェアを適用するパスの設定
 *
 * Phase 2では基本的な認証保護のみを実装
 * 以下のパスは認証が必要：
 * - /api/* (公開APIとNextAuth APIを除く)
 * - /itineraries (しおり一覧ページ)
 * - /mypage (マイページ)
 * - /settings (設定ページ)
 *
 * 以下のパスは認証不要：
 * - /login
 * - /api/auth/*
 * - /privacy
 * - /terms
 * - 静的ファイル
 */
export const config = {
  matcher: [
    /*
     * マッチするパス:
     * - /api/以下のすべて (ただし /api/auth/* と /api/health は除く)
     * - /itineraries (しおり一覧ページ)
     * - /mypage (マイページ)
     * - /settings (設定ページ)
     *
     * マッチしないパス:
     * - /api/auth/* (NextAuth.js)
     * - /api/health (ヘルスチェック)
     * - /_next/* (Next.jsの内部ファイル)
     * - /favicon.ico, /robots.txt などの静的ファイル
     */
    "/api/chat/:path*",
    "/api/itinerary/:path*",
    "/api/generate-pdf/:path*",
    "/api/settings/:path*",
    "/itineraries/:path*",
    "/mypage/:path*",
    "/settings/:path*",
  ],
};
