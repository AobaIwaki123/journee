import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/**
 * GET /api/user/me
 *
 * 現在ログインしているユーザーの情報を取得するAPI
 *
 * @returns ユーザー情報またはエラーレスポンス
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/user/me')
 * if (response.ok) {
 *   const user = await response.json()
 * }
 * ```
 */
export async function GET() {
  try {
    // 現在のユーザーを取得
    const user = await getCurrentUser();

    // 未認証の場合
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "ログインが必要です" },
        { status: 401 }
      );
    }

    // ユーザー情報を返す
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      googleId: user.googleId,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "ユーザー情報の取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
