import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/db/supabase";
import type { Database } from "@/types/database";

/**
 * GET /api/user/me
 *
 * 現在ログインしているユーザーの情報を取得するAPI
 * データベースからユーザー情報と登録日を取得して返します。
 *
 * @returns ユーザー情報（created_at含む）またはエラーレスポンス
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/user/me')
 * if (response.ok) {
 *   const user = await response.json()
 *   console.log(user.createdAt) // 登録日
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

    // データベースから完全なユーザー情報を取得（created_at含む）
    if (!supabaseAdmin) {
      console.error("Supabase admin client is not available");
      return NextResponse.json(
        {
          error: "Service Unavailable",
          message: "データベース接続が利用できません",
        },
        { status: 503 }
      );
    }

    const { data: userProfile, error: dbError } = await supabaseAdmin
      .from("users")
      .select("id, email, name, image, google_id, created_at")
      .eq("id", user.id)
      .single() as {
        data: Pick<Database['public']['Tables']['users']['Row'], 'id' | 'email' | 'name' | 'image' | 'google_id' | 'created_at'> | null;
        error: any;
      };

    if (dbError || !userProfile) {
      console.error("Error fetching user from database:", dbError);
      // データベースエラーの場合でもセッション情報は返す
      return NextResponse.json({
        id: user.id,
        email: user.email || "",
        name: user.name || null,
        image: user.image || null,
        googleId: user.googleId || null,
        createdAt: null,
      });
    }

    // ユーザー情報を返す（created_at含む）
    return NextResponse.json({
      id: userProfile.id,
      email: userProfile.email || "",
      name: userProfile.name || null,
      image: userProfile.image || null,
      googleId: userProfile.google_id || null,
      createdAt: userProfile.created_at || null,
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
