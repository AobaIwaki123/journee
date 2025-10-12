import type { Metadata } from "next";
import { LoginButton } from "@/components/auth/LoginButton";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

// ログインページは常に動的にレンダリングして、認証状態のキャッシュによる
// 不正なリダイレクト（例: ログアウト直後にホームへ戻される）を防ぐ
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ログイン | Journee",
  description: "Journeeにログインして、AIとともに旅のしおりを作成しましょう。",
  openGraph: {
    title: "ログイン | Journee",
    description: "AIとともに旅のしおりを作成",
    type: "website",
    images: ["/api/og/default"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ログイン | Journee",
    description: "AIとともに旅のしおりを作成",
    images: ["/api/og/default"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

interface LoginPageProps {
  searchParams: { callbackUrl?: string };
}

/**
 * ログインページ
 *
 * Googleアカウントでのログインを提供します。
 * 既にログイン済みの場合はホームページにリダイレクトします。
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  // 既にログイン済みの場合はリダイレクト
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  const callbackUrl = searchParams.callbackUrl || "/";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md w-full mx-4">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Journee
          </h1>
          <p className="text-gray-600 text-lg">AIとともに旅のしおりを作成</p>
        </div>

        {/* ログインカード */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ログイン</h2>
            <p className="text-gray-600 text-sm">
              Googleアカウントでログインして、旅のしおり作成を始めましょう
            </p>
          </div>

          {/* ログインボタン */}
          <div className="flex justify-center">
            <LoginButton callbackUrl={callbackUrl} />
          </div>

          {/* 利用規約・プライバシーポリシー */}
          <p className="text-xs text-gray-500 text-center mt-6">
            ログインすることで、
            <a
              href="/terms"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              利用規約
            </a>
            および
            <a
              href="/privacy"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              プライバシーポリシー
            </a>
            に同意したものとみなされます。
          </p>
        </div>

        {/* 機能紹介 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl mb-2">🤖</div>
            <p className="text-sm font-medium text-gray-700">AI対話</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm font-medium text-gray-700">しおり作成</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl mb-2">📄</div>
            <p className="text-sm font-medium text-gray-700">PDF出力</p>
          </div>
        </div>
      </div>
    </div>
  );
}
