/**
 * Supabaseクライアント設定（Phase 8）
 *
 * データベース接続とクエリ操作を提供します。
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// 環境変数チェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("[SUPABASE DEBUG] Checking environment variables:");
console.log(
  "[SUPABASE DEBUG] NEXT_PUBLIC_SUPABASE_URL:",
  supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "NOT SET"
);
console.log(
  "[SUPABASE DEBUG] NEXT_PUBLIC_SUPABASE_ANON_KEY:",
  supabaseAnonKey ? "SET" : "NOT SET"
);
console.log(
  "[SUPABASE DEBUG] SUPABASE_SERVICE_ROLE_KEY:",
  supabaseServiceRoleKey ? "SET" : "NOT SET"
);

if (!supabaseUrl || !supabaseAnonKey) {
  const error = new Error(
    "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
  console.error("[SUPABASE DEBUG] Error:", error.message);
  throw error;
}

/**
 * クライアントサイド用Supabaseクライアント
 * - Anon Keyを使用（RLS有効）
 * - ブラウザから直接呼び出し可能
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // NextAuth.jsで管理するためfalse
  },
  db: {
    schema: "public",
  },
});

/**
 * サーバーサイド用Supabaseクライアント（Admin権限）
 * - Service Role Keyを使用（RLS無効）
 * - API Routeからのみ呼び出し
 * - ユーザー認証をバイパスして全データにアクセス可能
 */
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

if (!supabaseAdmin) {
  console.warn(
    "Supabase Service Role Key is not set. Admin operations will not be available."
  );
}

/**
 * Supabase接続テスト
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from("users").select("count").limit(1);
    if (error) {
      console.error("Supabase connection test failed:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase connection test error:", err);
    return false;
  }
}
