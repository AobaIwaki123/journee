import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Next.js ミドルウェア（認証保護）
 *
 * 特定のパスに対して認証を要求します。
 * 未認証の場合は自動的にログインページにリダイレクトされます。
 * 
 * E2Eテスト時は `x-test-mode` HTTPヘッダーで認証をバイパスできます。
 */
export default withAuth(
  function middleware(req) {
    // E2Eテスト時はx-test-modeヘッダーでバイパス
    const testMode = req.headers.get('x-test-mode');
    if (testMode === 'true') {
      return NextResponse.next();
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      /**
       * 認証が必要かどうかを判定
       * @param token - ユーザーのJWTトークン
       * @param req - リクエストオブジェクト
       * @returns 認証済みの場合はtrue
       */
      authorized: ({ token, req }) => {
        // E2Eテスト時はx-test-modeヘッダーでバイパス
        const testMode = req.headers.get('x-test-mode');
        if (testMode === 'true') {
          return true;
        }
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
 * 認証が必要なパス：
 * - / (ルートパス - しおり作成ページ)
 * - /api/chat, /api/itinerary, /api/generate-pdf, /api/settings
 * - /itineraries, /mypage, /settings
 */
export const config = {
  matcher: [
    "/",
    "/api/chat/:path*",
    "/api/itinerary/:path*",
    "/api/generate-pdf/:path*",
    "/api/settings/:path*",
    "/itineraries/:path*",
    "/mypage/:path*",
    "/settings/:path*",
  ],
};
