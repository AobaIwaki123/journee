/**
 * OGP実装チェックスクリプト
 * 
 * 実装されたOGP機能をチェックします。
 * 
 * 使用方法:
 *   npx tsx scripts/check-ogp-implementation.ts
 */

import fs from 'fs';
import path from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, successMsg: string, failMsg: string, isWarning = false) {
  if (condition) {
    results.push({ name, status: 'pass', message: successMsg });
  } else {
    results.push({ name, status: isWarning ? 'warn' : 'fail', message: failMsg });
  }
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function fileContains(filePath: string, searchString: string): boolean {
  if (!fileExists(filePath)) return false;
  const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
  return content.includes(searchString);
}

console.log('🔍 OGP実装チェック');
console.log('='.repeat(50));
console.log('');

// Phase 1: デフォルトOGP画像API
console.log('📦 Phase 1: デフォルトOGP画像API');
console.log('-'.repeat(50));

check(
  'デフォルトOGP画像APIファイル',
  fileExists('app/api/og/default/route.tsx'),
  '✅ app/api/og/default/route.tsx が存在します',
  '❌ app/api/og/default/route.tsx が見つかりません'
);

check(
  'ImageResponse使用',
  fileContains('app/api/og/default/route.tsx', 'ImageResponse'),
  '✅ ImageResponseを使用しています',
  '❌ ImageResponseが使用されていません'
);

check(
  'Edge Runtime設定',
  fileContains('app/api/og/default/route.tsx', "runtime = 'edge'"),
  '✅ Edge Runtimeが設定されています',
  '⚠️  Edge Runtimeが設定されていません',
  true
);

check(
  'キャッシュ設定',
  fileContains('app/api/og/default/route.tsx', 'Cache-Control'),
  '✅ Cache-Controlヘッダーが設定されています',
  '⚠️  Cache-Controlヘッダーが設定されていません',
  true
);

check(
  'ルートレイアウトのOGP画像パス',
  fileContains('app/layout.tsx', '/api/og/default'),
  '✅ app/layout.tsx がデフォルトOGP画像APIを参照しています',
  '❌ app/layout.tsx のOGP画像パスが更新されていません'
);

console.log('');

// Phase 2: 各ページのメタデータ
console.log('📄 Phase 2: 各ページのメタデータ設定');
console.log('-'.repeat(50));

check(
  'マイページのメタデータ',
  fileContains('app/mypage/page.tsx', 'generateMetadata'),
  '✅ マイページにgenerateMetadata関数があります',
  '❌ マイページにメタデータ設定がありません'
);

check(
  'しおり一覧ページ',
  fileContains('app/itineraries/page.tsx', 'metadata'),
  '✅ しおり一覧ページにメタデータがあります',
  '❌ しおり一覧ページにメタデータ設定がありません'
);

check(
  'しおり一覧クライアントコンポーネント',
  fileExists('components/itinerary/ItineraryListClient.tsx'),
  '✅ ItineraryListClient.tsx が作成されています',
  '❌ ItineraryListClient.tsx が見つかりません'
);

check(
  'プライバシーポリシーのメタデータ',
  fileContains('app/privacy/page.tsx', 'metadata'),
  '✅ プライバシーポリシーにメタデータがあります',
  '❌ プライバシーポリシーにメタデータ設定がありません'
);

check(
  '利用規約のメタデータ',
  fileContains('app/terms/page.tsx', 'metadata'),
  '✅ 利用規約にメタデータがあります',
  '❌ 利用規約にメタデータ設定がありません'
);

check(
  'ログインページのメタデータ',
  fileContains('app/login/page.tsx', 'metadata'),
  '✅ ログインページにメタデータがあります',
  '❌ ログインページにメタデータ設定がありません'
);

check(
  '設定ページのメタデータ',
  fileExists('app/settings/layout.tsx') && fileContains('app/settings/layout.tsx', 'metadata'),
  '✅ 設定ページにメタデータがあります',
  '⚠️  設定ページにメタデータ設定がありません',
  true
);

console.log('');

// Phase 3: キャッシュ戦略
console.log('⚡ Phase 3: キャッシュ戦略');
console.log('-'.repeat(50));

check(
  'しおりOGP画像のキャッシュ',
  fileContains('app/api/og/route.tsx', 'Cache-Control'),
  '✅ しおりOGP画像にCache-Controlが設定されています',
  '❌ しおりOGP画像にCache-Control設定がありません'
);

check(
  'デフォルトOGP画像のキャッシュ',
  fileContains('app/api/og/default/route.tsx', 'Cache-Control'),
  '✅ デフォルトOGP画像にCache-Controlが設定されています',
  '❌ デフォルトOGP画像にCache-Control設定がありません'
);

console.log('');

// Phase 4: エラーハンドリング
console.log('🛡️  Phase 4: エラーハンドリング');
console.log('-'.repeat(50));

check(
  'しおりOGP画像のエラーログ',
  fileContains('app/api/og/route.tsx', 'console.error'),
  '✅ エラーログが実装されています',
  '⚠️  エラーログが実装されていません',
  true
);

check(
  'デフォルトOGP画像のエラーハンドリング',
  fileContains('app/api/og/default/route.tsx', 'catch'),
  '✅ エラーハンドリングが実装されています',
  '❌ エラーハンドリングが実装されていません'
);

console.log('');

// 結果サマリー
console.log('📊 チェック結果サマリー');
console.log('='.repeat(50));

const passed = results.filter(r => r.status === 'pass').length;
const failed = results.filter(r => r.status === 'fail').length;
const warned = results.filter(r => r.status === 'warn').length;
const total = results.length;

results.forEach(result => {
  const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
  console.log(`${icon} ${result.name}`);
  console.log(`   ${result.message}`);
});

console.log('');
console.log(`合計: ${total} 項目`);
console.log(`✅ 成功: ${passed}`);
if (warned > 0) console.log(`⚠️  警告: ${warned}`);
if (failed > 0) console.log(`❌ 失敗: ${failed}`);

console.log('');

if (failed === 0) {
  console.log('🎉 すべての必須チェックに合格しました！');
  console.log('');
  console.log('📋 次のステップ:');
  console.log('   1. 開発サーバーを起動: npm run dev');
  console.log('   2. OGPテストスクリプトを実行: bash scripts/test-ogp.sh');
  console.log('   3. ブラウザで確認: http://localhost:3000/api/og/default');
  console.log('   4. OGP検証ツールでテスト:');
  console.log('      → https://developers.facebook.com/tools/debug/');
  console.log('      → https://cards-dev.twitter.com/validator');
} else {
  console.log('⚠️  いくつかのチェックが失敗しました。上記の結果を確認してください。');
  process.exit(1);
}
