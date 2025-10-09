import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabase, supabaseAdmin } from "@/lib/db/supabase";
import type { Database } from "@/types/database";

/**
 * NextAuth設定オプション
 *
 * Phase 8: Supabaseデータベースと統合
 * Multi-Branch: 認証プロキシパターン対応
 */
export const authOptions: NextAuthOptions = {
  // プロキシ・トンネル環境での動作を許可
  trustHost: true,

  providers: [
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

  // Cookie設定（ドメイン共有対応）
  cookies: {
    sessionToken: {
      name: `${
        process.env.NODE_ENV === "production" ? "__Secure-" : ""
      }next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true, // HTTPSでは常にsecure
        // ブランチ環境間でセッション共有
        domain: process.env.COOKIE_DOMAIN || undefined,
      },
    },
    callbackUrl: {
      name: `${
        process.env.NODE_ENV === "production" ? "__Secure-" : ""
      }next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        domain: process.env.COOKIE_DOMAIN || undefined,
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
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
     */
    async jwt({ token, user, account }) {
      // 初回サインイン時
      if (account && user) {
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
     */
    async signIn({ account, profile, user }) {
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
     * Multi-Branch: 認証プロキシからの戻り先を処理
     */
    async redirect({ url, baseUrl }) {
      // 認証プロキシモードの場合
      const authProxyMode = process.env.AUTH_PROXY_MODE === "true";
      const cookieDomain = process.env.COOKIE_DOMAIN;

      // NEXTAUTH_URLを明示的に使用（baseUrlが内部ホストの場合に対処）
      const trustedBaseUrl = process.env.NEXTAUTH_URL || baseUrl;

      console.log("[Auth Redirect]", {
        url,
        baseUrl,
        trustedBaseUrl,
        authProxyMode,
      });

      // 相対URLの場合はそのまま使用
      if (url.startsWith("/")) {
        return `${trustedBaseUrl}${url}`;
      }

      // 同じオリジンの場合は許可
      try {
        const urlOrigin = new URL(url).origin;
        const trustedOrigin = new URL(trustedBaseUrl).origin;

        if (urlOrigin === trustedOrigin) {
          return url;
        }
      } catch (error) {
        console.error("Invalid URL in redirect:", error);
      }

      // 認証プロキシモード：同じドメイン配下なら許可
      if (authProxyMode && cookieDomain) {
        try {
          const urlHost = new URL(url).hostname;
          // .aooba.net ドメイン配下の場合は許可
          if (urlHost.endsWith(cookieDomain.replace(/^\./, ""))) {
            console.log("[Auth Redirect] Allowing cross-domain redirect:", url);
            return url;
          }
        } catch (error) {
          console.error("Invalid URL in redirect:", error);
        }
      }

      // それ以外はホームページにリダイレクト
      console.log("[Auth Redirect] Fallback to base URL:", trustedBaseUrl);
      return trustedBaseUrl;
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
