import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/db/supabase";

/**
 * GET /api/user/me
 *
 * 現在ログインしているユーザーの情報を取得するAPI
 * Phase 10.4: created_at フィールドを追加
 *
 * @returns ユーザー情報またはエラーレスポンス
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/user/me')
 * if (response.ok) {
 *   const user = await response.json()
 *   console.log(user.createdAt) // ISO 8601形式
 * }
 * ```
 */
export async function GET() {
  try {
    // 現在のユーザーを取得（セッションから）
    const user = await getCurrentUser();

    // 未認証の場合
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "ログインが必要です" },
        { status: 401 }
      );
    }

    // データベースからユーザーの詳細情報を取得
    const supabase = createClient();
    const { data: userData, error } = await supabase
      .from('users')
      .select('created_at')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error("Error fetching user data from database:", error);
      // エラーでもセッション情報は返す（created_atは現在時刻をフォールバック）
      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        googleId: user.googleId,
        createdAt: new Date().toISOString(),
      });
    }

    // ユーザー情報を返す
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      googleId: user.googleId,
      createdAt: userData?.created_at || new Date().toISOString(),
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
