/**
 * Supabaseクライアント設定（Phase 8）
 *
 * データベース接続とクエリ操作を提供します。
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// 環境変数チェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasClientConfig = Boolean(supabaseUrl && supabaseAnonKey);

const createMissingConfigProxy = <T extends object>(resourceName: string) =>
  new Proxy({} as T, {
    get() {
      throw new Error(
        `${resourceName} is unavailable because Supabase environment variables are not configured. ` +
          "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    },
  });

if (!hasClientConfig) {
  console.warn(
    "[SUPABASE] Environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. " +
      "Database features will be disabled until they are configured."
  );
}

/**
 * クライアントサイド用Supabaseクライアント
 * - Anon Keyを使用（RLS有効）
 * - ブラウザから直接呼び出し可能
 */
const createSupabaseClient = () =>
  createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: false, // NextAuth.jsで管理するためfalse
    },
    db: {
      schema: "public",
    },
  });

export const supabase: SupabaseClient<Database> = hasClientConfig
  ? createSupabaseClient()
  : (createMissingConfigProxy<SupabaseClient<Database>>("Supabase client") as SupabaseClient<Database>);

/**
 * サーバーサイド用Supabaseクライアント（Admin権限）
 * - Service Role Keyを使用（RLS無効）
 * - API Routeからのみ呼び出し
 * - ユーザー認証をバイパスして全データにアクセス可能
 */
export const supabaseAdmin =
  hasClientConfig && supabaseServiceRoleKey
    ? createClient<Database>(supabaseUrl!, supabaseServiceRoleKey, {
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
  if (!hasClientConfig) {
    console.warn(
      "Supabase connection test skipped because environment variables are not configured."
    );
    return false;
  }

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
