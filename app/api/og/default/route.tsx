/**
 * Phase 10.1: デフォルトOGP画像生成API
 * 
 * Journeeブランドを表現するデフォルトOGP画像を動的生成
 * トップページや各静的ページで使用
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

/**
 * デフォルトOGP画像生成エンドポイント
 * GET /api/og/default
 */
export async function GET() {
  try {
    // デフォルトOGP画像を生成（1200x630px）
    const response = new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            position: 'relative',
          }}
        >
          {/* 装飾的な背景パターン */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage:
                'radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)',
              backgroundSize: '100px 100px',
            }}
          />

          {/* メインコンテンツ */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* アイコン */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '50px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '160px',
                height: '160px',
              }}
            >
              <span
                style={{
                  fontSize: '100px',
                }}
              >
                ✈️
              </span>
            </div>

            {/* ロゴ */}
            <h1
              style={{
                fontSize: '90px',
                fontWeight: 'bold',
                color: 'white',
                letterSpacing: '6px',
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                marginBottom: '40px',
              }}
            >
              Journee
            </h1>

            {/* キャッチコピー */}
            <p
              style={{
                fontSize: '40px',
                color: 'rgba(255, 255, 255, 0.95)',
                fontWeight: '500',
                textAlign: 'center',
              }}
            >
              AI旅のしおり作成アプリ
            </p>

            {/* サブテキスト */}
            <p
              style={{
                fontSize: '28px',
                color: 'rgba(255, 255, 255, 0.85)',
                marginTop: '20px',
                textAlign: 'center',
              }}
            >
              チャット形式で簡単に旅行計画
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    // キャッシュ設定（1日間、stale-while-revalidateで7日間）
    response.headers.set(
      'Cache-Control',
      'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
    );

    return response;
  } catch (error) {
    console.error('Failed to generate default OG image:', error);

    // エラー時のシンプルなフォールバック
    return new Response('Failed to generate image', { status: 500 });
  }
}
