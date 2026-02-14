import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ライセンス | Journee',
  description: 'Journeeのライセンス情報。CC BY-SA 4.0ライセンスの概要と詳細。',
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * ライセンスページ
 * 
 * アプリケーションのライセンス情報（CC BY-SA 4.0）を表示します。
 */
export default function LicensePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">ライセンス (License)</h1>
            <Link 
              href="/"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              ホームに戻る
            </Link>
          </div>

          <div className="prose prose-blue max-w-none text-gray-700 space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center gap-2">
                Creative Commons Attribution-ShareAlike 4.0 International
              </h2>
              <p className="text-sm text-blue-800 mb-4">
                当サイトのコンテンツおよびソースコードは、特に記載がない限り、クリエイティブ・コモンズ 表示 - 継承 4.0 国際 ライセンスの下に提供されています。
              </p>
              <div className="flex gap-4 mt-4">
                <a 
                  href="https://creativecommons.org/licenses/by-sa/4.0/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  View License Deed
                </a>
                <a 
                  href="https://creativecommons.org/licenses/by-sa/4.0/legalcode" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-white text-blue-600 border border-blue-200 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  View Legal Code
                </a>
              </div>
            </div>

            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Summary</h3>
              <p className="leading-relaxed">
                Creative Commons Attribution-ShareAlike license in International version 4, that allows to do what they want with your work as long as they share the work under the same licence.
              </p>
            </section>

            <section className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Attribution</h4>
                <p className="text-sm">
                  You must give credit to the original author of the work, including a URI or hyperlink to the work, this Public license and a copyright notice.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Attribution information revoke</h4>
                <p className="text-sm">
                  Author can request to remove any attribution given information.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Tivoization</h4>
                <p className="text-sm">
                  You may not apply legal terms or technological measures that legally restrict others from doing anything the license permits.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Revoke</h4>
                <p className="text-sm">
                  The licensor cannot revoke these freedoms as long as you follow the license terms.
                </p>
              </div>
            </section>

            <section className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Disclaimer & Liability</h4>
              <p className="text-sm mb-2">
                <strong>Disclaimer of warranties:</strong> Disclaimer of warranties is optional. If separately undertaken, shared material must retain a notice to Disclaimer of warranties. Otherwise, Disclaimer of warranties, is taken by default, providing the work as-is and as-available.
              </p>
              <p className="text-sm">
                <strong>Liable:</strong> Liable follows the same rules as Disclaimer of warranties, providing, by default, protection from defamation for the creator.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
