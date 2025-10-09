import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabase, supabaseAdmin } from "@/lib/db/supabase";
import type { Database } from "@/types/database";
import {
  isMockAuthEnabled,
  DEFAULT_MOCK_USER,
} from "@/lib/mock-data/mock-users";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * NextAuth設定オプション
 *
 * Phase 8: Supabaseデータベースと統合
 * ブランチモード: モック認証サポート（ENABLE_MOCK_AUTH=true）
 */
export const authOptions: NextAuthOptions = {
  providers: [
    // モック認証が有効な場合は、Credentialsプロバイダーを使用
    ...(isMockAuthEnabled()
      ? [
          CredentialsProvider({
            id: "mock",
            name: "Mock Authentication",
            credentials: {
              mockUser: { label: "Mock User", type: "text" },
            },
            async authorize(credentials) {
              // モック認証では常にデフォルトユーザーを返す
              const mockUserKey = credentials?.mockUser || "default";

              // モックユーザーデータを動的にインポート
              const { getMockUser } = await import(
                "@/lib/mock-data/mock-users"
              );
              const mockUser = getMockUser(mockUserKey);

              console.log("🧪 Mock authentication:", mockUser.email);

              return {
                id: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
                image: mockUser.image,
                googleId: mockUser.googleId,
              };
            },
          }),
        ]
      : [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]),
  ],

  // セッション設定
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日間
  },

  // JWT設定
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30日間
  },

  // カスタムページ
  pages: {
    signIn: "/login",
    error: "/login",
  },

  // コールバック関数
  callbacks: {
    /**
     * JWTコールバック
     * トークンにユーザー情報を追加
     * Phase 8: SupabaseのUUIDをトークンに保存
     * ブランチモード: モック認証のサポート
     */
    async jwt({ token, user, account }) {
      // 初回サインイン時
      if (account && user) {
        // モック認証の場合
        if (account.provider === "mock") {
          token.id = user.id;
          token.googleId = (user as any).googleId || "mock-google-id";
          token.email = user.email;
          token.name = user.name;
          token.picture = user.image;
          console.log("🧪 Mock JWT token created:", token.email);
          return token;
        }

        // Google IDを保存
        if (account.provider === "google") {
          token.googleId = account.providerAccountId;

          // SupabaseからユーザーのUUIDを取得（Admin権限で）
          try {
            if (!supabaseAdmin) {
              console.error("Supabase Admin client is not configured");
              token.id = user.id; // フォールバック
              return token;
            }

            type UserRow = Database["public"]["Tables"]["users"]["Row"];
            const { data: supabaseUser, error: fetchError } =
              await supabaseAdmin!
                .from("users")
                .select("*")
                .eq("google_id", account.providerAccountId)
                .single();

            if (fetchError && fetchError.code !== "PGRST116") {
              // PGRST116 = "Row not found" (許容されるエラー)
              console.error("Error fetching Supabase user ID:", fetchError);
              token.id = user.id; // フォールバック
            } else if (supabaseUser) {
              token.id = (supabaseUser as UserRow).id; // SupabaseのUUID
            } else {
              console.error(
                "Supabase user not found for googleId:",
                account.providerAccountId
              );
              token.id = user.id; // フォールバック
            }
          } catch (error) {
            console.error("Error fetching Supabase user ID:", error);
            token.id = user.id; // フォールバック
          }
        } else {
          token.id = user.id;
        }

        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      return token;
    },

    /**
     * セッションコールバック
     * セッションにユーザー情報を追加
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string | null;
        session.user.image = token.picture as string | null;
        session.user.googleId = token.googleId as string | undefined;
      }

      return session;
    },

    /**
     * サインインコールバック
     * サインインを許可するかどうかを決定
     * Phase 8: Supabaseにユーザーを作成/取得
     * ブランチモード: モック認証を許可
     */
    async signIn({ account, profile, user }) {
      // モック認証の場合は常に許可
      if (account?.provider === "mock") {
        console.log("🧪 Mock authentication allowed:", user.email);
        return true;
      }

      // Googleプロバイダーのみを許可
      if (account?.provider === "google") {
        // メールアドレスが確認済みかチェック
        const googleProfile = profile as {
          email_verified?: boolean;
          email?: string;
          name?: string;
          picture?: string;
        };

        if (!googleProfile.email_verified) {
          console.error("Email not verified:", googleProfile.email);
          return false;
        }

        try {
          // Supabaseでユーザーを取得または作成
          const googleId = account.providerAccountId;
          const email = googleProfile.email || user.email;

          if (!email || !googleId) {
            console.error("Missing email or googleId");
            return false;
          }

          // Service Role Keyが必要
          if (!supabaseAdmin) {
            console.error("Supabase Admin client is not configured");
            return false;
          }

          // google_idでユーザーを検索
          type UserRow = Database["public"]["Tables"]["users"]["Row"];
          type UserInsert = Database["public"]["Tables"]["users"]["Insert"];

          const { data: existingUser, error: fetchError } = await supabaseAdmin!
            .from("users")
            .select("*")
            .eq("google_id", googleId)
            .single();

          if (fetchError && fetchError.code !== "PGRST116") {
            // PGRST116 = "Row not found" (許容されるエラー)
            console.error("Error fetching user:", fetchError);
            return false;
          }

          if (!existingUser) {
            // ユーザーが存在しない場合は新規作成（Admin権限で）
            const { data: newUser, error: insertError } = await supabaseAdmin!
              .from("users")
              .insert({
                email,
                name: googleProfile.name || user.name || null,
                image: googleProfile.picture || user.image || null,
                google_id: googleId,
              } as any)
              .select()
              .single();

            if (insertError) {
              console.error("Error creating user:", insertError);
              return false;
            }

            console.log(
              "New user created in Supabase:",
              (newUser as UserRow).id
            );
          } else {
            console.log(
              "Existing user found in Supabase:",
              (existingUser as UserRow).id
            );
          }

          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }

      return false;
    },

    /**
     * リダイレクトコールバック
     * 認証後のリダイレクト先を制御
     */
    async redirect({ url, baseUrl }) {
      // 相対URLの場合はそのまま使用
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // 同じオリジンの場合は許可
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // それ以外はホームページにリダイレクト
      return baseUrl;
    },
  },

  // イベントハンドラー
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("User signed in:", {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
      });
    },
    async signOut({ token }) {
      console.log("User signed out:", { userId: token?.id });
    },
  },

  // デバッグモード（開発環境のみ）
  debug: process.env.NODE_ENV === "development",
};
