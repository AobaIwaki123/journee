import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/db/supabase";
import type { UserMeResponse } from "@/types/auth";

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
    const sessionUser = await getCurrentUser();

    // 未認証の場合
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Unauthorized", message: "ログインが必要です" },
        { status: 401 }
      );
    }

    // データベースから完全なユーザー情報を取得
    const client = supabaseAdmin;
    if (!client) {
      // フォールバック: Supabase Adminが利用できない場合はセッション情報のみ
      const response: UserMeResponse = {
        id: sessionUser.id,
        email: sessionUser.email || "",
        name: sessionUser.name || null,
        image: sessionUser.image || null,
        googleId: sessionUser.googleId || null,
        createdAt: new Date().toISOString(), // フォールバック
      };
      return NextResponse.json(response);
    }

    const { data: dbUser, error } = await client
      .from("users")
      .select("id, email, name, image, google_id, created_at")
      .eq("id", sessionUser.id)
      .single<{
        id: string;
        email: string;
        name: string | null;
        image: string | null;
        google_id: string;
        created_at: string;
      }>();

    if (error || !dbUser) {
      console.error("Failed to fetch user from database:", error);
      // フォールバック: セッション情報を返す
      const response: UserMeResponse = {
        id: sessionUser.id,
        email: sessionUser.email || "",
        name: sessionUser.name || null,
        image: sessionUser.image || null,
        googleId: sessionUser.googleId || null,
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json(response);
    }

    // ユーザー情報を返す（createdAtを含む）
    const response: UserMeResponse = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      image: dbUser.image,
      googleId: dbUser.google_id,
      createdAt: dbUser.created_at,
    };

    return NextResponse.json(response);
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
