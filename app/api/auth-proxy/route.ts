import { NextRequest, NextResponse } from "next/server";

/**
 * 認証プロキシエンドポイント
 * 
 * ブランチ環境から認証サービスへのリダイレクトを処理します。
 * 認証後に元の環境に戻るため、returnUrlを保存します。
 * 
 * 使用例：
 * - ブランチ環境: https://feature-xyz.preview.aooba.net
 * - このエンドポイント: /api/auth-proxy?action=signin
 * - 認証サービス: https://auth.preview.aooba.net
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action") || "signin";
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  
  const authProxyMode = process.env.AUTH_PROXY_MODE === "true";
  const authServiceUrl = process.env.AUTH_SERVICE_URL || process.env.NEXTAUTH_URL;
  
  // 認証プロキシモードでない場合は、通常のNextAuth認証にリダイレクト
  if (!authProxyMode) {
    const nextAuthUrl = `/api/auth/${action}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    return NextResponse.redirect(new URL(nextAuthUrl, request.url));
  }
  
  // 現在のオリジン（ブランチ環境のURL）を取得
  const currentOrigin = request.nextUrl.origin;
  
  // 元の環境に戻るためのURLを構築
  const returnUrl = `${currentOrigin}${callbackUrl}`;
  
  // 認証サービスへのリダイレクトURL
  const authUrl = new URL(`/api/auth/${action}`, authServiceUrl);
  authUrl.searchParams.set("callbackUrl", returnUrl);
  
  console.log("[Auth Proxy] Redirecting to auth service:", {
    from: currentOrigin,
    to: authUrl.toString(),
    returnUrl,
  });
  
  return NextResponse.redirect(authUrl);
}

/**
 * POSTリクエスト対応（サインアウト用）
 */
export async function POST(request: NextRequest) {
  const authProxyMode = process.env.AUTH_PROXY_MODE === "true";
  const authServiceUrl = process.env.AUTH_SERVICE_URL || process.env.NEXTAUTH_URL;
  
  // 認証プロキシモードでない場合は、通常のNextAuth認証にリダイレクト
  if (!authProxyMode) {
    return NextResponse.redirect(new URL("/api/auth/signout", request.url));
  }
  
  // 認証サービスのサインアウトエンドポイントにリダイレクト
  const authUrl = new URL("/api/auth/signout", authServiceUrl);
  
  console.log("[Auth Proxy] Redirecting to auth service signout:", authUrl.toString());
  
  return NextResponse.redirect(authUrl);
}

