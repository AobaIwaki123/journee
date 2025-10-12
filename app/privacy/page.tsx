import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | Journee',
  description: 'Journeeのプライバシーポリシー。個人情報の取り扱いについて説明します。',
  openGraph: {
    title: 'プライバシーポリシー | Journee',
    description: 'Journeeのプライバシーポリシー',
    type: 'website',
    images: ['/api/og/default'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'プライバシーポリシー | Journee',
    description: 'Journeeのプライバシーポリシー',
    images: ['/api/og/default'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * プライバシーポリシーページ
 */
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">プライバシーポリシー</h1>
        
        <div className="text-sm text-gray-600 mb-8">
          最終更新日: 2025年10月7日
        </div>

        <div className="space-y-6 text-gray-700">
          <section>
            <p className="mb-4">
              Journee（以下「本サービス」といいます）は、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. 収集する情報</h2>
            <p className="mb-2">本サービスでは、以下の情報を収集します。</p>
            
            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">1.1 Googleアカウント情報</h3>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>メールアドレス</li>
              <li>氏名</li>
              <li>プロフィール画像</li>
              <li>Google ID</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">1.2 利用情報</h3>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>作成した旅行計画・しおりの内容</li>
              <li>AIとのチャット履歴</li>
              <li>サービスの利用履歴</li>
              <li>アクセス日時・IPアドレス</li>
              <li>ブラウザ情報・デバイス情報</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">1.3 Cookie情報</h3>
            <p className="ml-4">
              本サービスは、ユーザー体験の向上のため、Cookieを使用します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. 情報の利用目的</h2>
            <p className="mb-2">収集した情報は、以下の目的で利用します。</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>本サービスの提供・運営のため</li>
              <li>ユーザー認証・本人確認のため</li>
              <li>旅行計画・しおりの作成・保存のため</li>
              <li>AIによるパーソナライズされた提案のため</li>
              <li>サービスの改善・新機能開発のため</li>
              <li>利用状況の分析・統計データの作成のため</li>
              <li>お問い合わせへの対応のため</li>
              <li>利用規約違反の対応のため</li>
              <li>重要なお知らせの通知のため</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. 情報の第三者提供</h2>
            <p className="mb-2">
              本サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>ユーザーの同意がある場合</li>
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合</li>
              <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
              <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. 外部サービスの利用</h2>
            <p className="mb-2">本サービスは、以下の外部サービスを利用しています。</p>
            
            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">4.1 Google OAuth</h3>
            <p className="ml-4 mb-4">
              認証にGoogle OAuthを使用しています。詳細は
              <a 
                href="https://policies.google.com/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Googleプライバシーポリシー
              </a>
              をご確認ください。
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">4.2 AI API</h3>
            <p className="ml-4 mb-4">
              旅行計画の作成にGoogle Gemini APIを使用しています。送信された情報は、AI応答生成の目的でのみ使用されます。
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">4.3 ホスティングサービス</h3>
            <p className="ml-4">
              本サービスはVercelでホスティングされています。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. データの保存期間</h2>
            <p className="mb-2">
              収集した情報は、利用目的を達成するために必要な期間、または法令で定められた期間保存します。
            </p>
            <p>
              アカウント削除後は、法令で保存が義務付けられている情報を除き、速やかに削除します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. セキュリティ</h2>
            <p className="mb-2">
              本サービスは、個人情報の漏洩、滅失または毀損を防止するため、以下のセキュリティ対策を実施しています。
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>SSL/TLS暗号化通信の使用</li>
              <li>HTTPOnly Cookie によるセキュアなセッション管理</li>
              <li>CSRF（クロスサイトリクエストフォージェリ）対策</li>
              <li>定期的なセキュリティアップデート</li>
              <li>アクセス制御の実施</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. ユーザーの権利</h2>
            <p className="mb-2">ユーザーは、以下の権利を有します。</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>自己の個人情報の開示を請求する権利</li>
              <li>個人情報の訂正・追加・削除を請求する権利</li>
              <li>個人情報の利用停止を請求する権利</li>
              <li>アカウントの削除を請求する権利</li>
            </ul>
            <p className="mt-2">
              これらの権利を行使される場合は、本サービス内のお問い合わせフォームからご連絡ください。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Cookie（クッキー）について</h2>
            <p className="mb-2">
              本サービスは、ユーザー体験の向上、セッション管理、アクセス解析のためにCookieを使用します。
            </p>
            <p className="mb-2">
              Cookieの使用を希望されない場合は、ブラウザの設定で無効化できますが、一部機能が正常に動作しない場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. 子どもの個人情報</h2>
            <p>
              本サービスは、13歳未満の子どもから意図的に個人情報を収集しません。
              13歳未満の方は、保護者の同意のもとでのみ本サービスをご利用ください。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. プライバシーポリシーの変更</h2>
            <p className="mb-2">
              本ポリシーの内容は、法令の変更や本サービスの機能追加等に応じて変更されることがあります。
            </p>
            <p>
              重要な変更がある場合は、本サービス上で通知します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. お問い合わせ</h2>
            <p className="mb-2">
              本ポリシーに関するお問い合わせ、個人情報の開示・訂正・削除等のご請求は、本サービス内のお問い合わせフォームからご連絡ください。
            </p>
            <p className="text-sm text-gray-600 mt-4">
              対応時間：平日 10:00-18:00（土日祝日を除く）
            </p>
          </section>

          <section className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">制定日・改定日</h2>
            <p className="text-sm">制定日: 2025年10月7日</p>
            <p className="text-sm">最終改定日: 2025年10月7日</p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <Link
            href="/login"
            className="inline-block text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← ログインページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
