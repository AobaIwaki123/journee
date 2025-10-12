import Link from 'next/link';
import { Metadata } from 'next';

/**
 * Phase 10.1: 利用規約ページOGPメタデータ
 */
export const metadata: Metadata = {
  title: '利用規約 | Journee',
  description: 'Journeeの利用規約。サービスの利用条件について説明します。',
  openGraph: {
    title: '利用規約 | Journee',
    description: 'Journeeの利用規約',
    type: 'website',
    images: ['/api/og/default'],
  },
  twitter: {
    card: 'summary_large_image',
    title: '利用規約 | Journee',
    description: 'Journeeの利用規約',
    images: ['/api/og/default'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * 利用規約ページ
 */
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">利用規約</h1>
        
        <div className="text-sm text-gray-600 mb-8">
          最終更新日: 2025年10月7日
        </div>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第1条（適用）</h2>
            <p className="mb-2">
              本利用規約（以下「本規約」といいます）は、Journee（以下「本サービス」といいます）の利用条件を定めるものです。
            </p>
            <p>
              ユーザーの皆様（以下「ユーザー」といいます）には、本規約に従って本サービスをご利用いただきます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第2条（サービス内容）</h2>
            <p className="mb-2">
              本サービスは、AI技術を活用した旅行計画作成支援サービスです。
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>AIとの対話による旅行計画の作成</li>
              <li>旅のしおりの自動生成</li>
              <li>作成したしおりのPDF出力</li>
              <li>旅行計画の保存・管理</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第3条（アカウント登録）</h2>
            <p className="mb-2">
              本サービスの利用には、Googleアカウントによる認証が必要です。
            </p>
            <p className="mb-2">
              ユーザーは、登録情報が正確かつ最新であることを保証するものとします。
            </p>
            <p>
              登録情報の管理責任はユーザーにあり、第三者による不正利用について当サービスは責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第4条（禁止事項）</h2>
            <p className="mb-2">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>本サービスのサーバーやネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>本サービスの運営を妨害するおそれのある行為</li>
              <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
              <li>不正アクセスをし、またはこれを試みる行為</li>
              <li>他のユーザーに成りすます行為</li>
              <li>本サービスが意図しない方法で自動化ツール等を用いてアクセスする行為</li>
              <li>その他、当サービスが不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第5条（コンテンツの権利）</h2>
            <p className="mb-2">
              ユーザーが本サービスで作成した旅行計画やしおり等のコンテンツの著作権は、ユーザーに帰属します。
            </p>
            <p>
              ただし、当サービスは、サービスの改善・向上のため、ユーザーが作成したコンテンツを匿名化した上で分析・利用できるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第6条（AIによる生成コンテンツ）</h2>
            <p className="mb-2">
              本サービスが提供するAIによる旅行計画は、参考情報として提供されるものです。
            </p>
            <p className="mb-2">
              当サービスは、AIが生成した情報の正確性、完全性、有用性について保証しません。
            </p>
            <p>
              実際の旅行計画の実施にあたっては、ユーザー自身で情報の確認を行ってください。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第7条（免責事項）</h2>
            <p className="mb-2">
              当サービスは、本サービスに関して、以下の事項について一切の責任を負いません。
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>本サービスの内容の正確性、完全性、有用性</li>
              <li>本サービスの利用によって生じたいかなる損害</li>
              <li>本サービスの中断、停止、終了、利用不能または変更</li>
              <li>本サービスを通じて入手した情報の利用による損害</li>
              <li>第三者による不正アクセスまたはデータの改ざん・破壊</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第8条（サービスの変更・終了）</h2>
            <p className="mb-2">
              当サービスは、ユーザーへの事前通知なく、本サービスの内容を変更し、または提供を終了することができます。
            </p>
            <p>
              これによってユーザーに生じた損害について、当サービスは一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第9条（利用規約の変更）</h2>
            <p className="mb-2">
              当サービスは、必要と判断した場合には、ユーザーに通知することなく本規約を変更できるものとします。
            </p>
            <p>
              変更後の利用規約は、本サービス上に表示した時点より効力を生じるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第10条（個人情報の取扱い）</h2>
            <p>
              本サービスにおける個人情報の取扱いについては、別途定める
              <Link href="/privacy" className="text-blue-600 hover:underline">プライバシーポリシー</Link>
              に従うものとします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第11条（準拠法・管轄裁判所）</h2>
            <p className="mb-2">
              本規約の解釈にあたっては、日本法を準拠法とします。
            </p>
            <p>
              本サービスに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第12条（お問い合わせ）</h2>
            <p>
              本規約に関するお問い合わせは、本サービス内のお問い合わせフォームからご連絡ください。
            </p>
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
