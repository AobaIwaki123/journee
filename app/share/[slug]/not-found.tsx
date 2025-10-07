import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

/**
 * Phase 5.5: 公開しおりが見つからない場合の404ページ
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <FileQuestion className="w-24 h-24 text-gray-300 mx-auto mb-6" />
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          しおりが見つかりません
        </h1>
        
        <p className="text-gray-600 mb-8">
          指定されたしおりは存在しないか、非公開に設定されています。
        </p>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            トップページへ戻る
          </Link>
          
          <p className="text-sm text-gray-500 mt-4">
            自分の旅のしおりを作成したい場合は、<br />
            トップページから新規作成できます。
          </p>
        </div>
      </div>
    </div>
  );
}
