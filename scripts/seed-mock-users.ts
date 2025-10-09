/**
 * モックユーザーをSupabaseに一括登録するスクリプト
 *
 * 使用方法：
 * npx ts-node scripts/seed-mock-users.ts
 */

import { createClient } from "@supabase/supabase-js";
import { MOCK_USERS } from "../lib/mock-data/mock-users";
import type { Database } from "../types/database";

// 環境変数の確認
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ Error: Missing required environment variables");
  console.error("Please set:");
  console.error("  - NEXT_PUBLIC_SUPABASE_URL");
  console.error("  - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Supabase Admin クライアント作成
const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedMockUsers() {
  console.log("🌱 Seeding mock users to Supabase...\n");

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const [key, mockUser] of Object.entries(MOCK_USERS)) {
    console.log(`Processing: ${mockUser.name} (${mockUser.email})`);

    try {
      // 既存ユーザーの確認
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("google_id", mockUser.googleId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error(`  ❌ Error fetching user:`, fetchError.message);
        errorCount++;
        continue;
      }

      if (existingUser) {
        console.log(`  ⏭️  Already exists (ID: ${existingUser.id})`);
        skipCount++;
        continue;
      }

      // ユーザーの作成
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          email: mockUser.email,
          name: mockUser.name,
          image: mockUser.image,
          google_id: mockUser.googleId,
        })
        .select()
        .single();

      if (insertError) {
        console.error(`  ❌ Error creating user:`, insertError.message);
        errorCount++;
        continue;
      }

      console.log(`  ✅ Created (ID: ${newUser.id})`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Unexpected error:`, error);
      errorCount++;
    }

    console.log("");
  }

  // サマリー
  console.log("─".repeat(50));
  console.log("📊 Summary:");
  console.log(`  ✅ Created: ${successCount}`);
  console.log(`  ⏭️  Skipped: ${skipCount}`);
  console.log(`  ❌ Errors:  ${errorCount}`);
  console.log(`  📝 Total:   ${Object.keys(MOCK_USERS).length}`);
  console.log("─".repeat(50));

  if (errorCount > 0) {
    process.exit(1);
  }
}

// 実行
seedMockUsers()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
