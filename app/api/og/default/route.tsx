/**
 * Phase 10: デフォルトOGP画像生成API
 * 
 * Journeeブランドのデフォルトオープングラフ画像を動的に生成
 * 各ページで個別のOGP画像が設定されていない場合に使用
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

/**
 * デフォルトOGP画像生成エンドポイント
 * GET /api/og/default
 */
export async function GET() {
  try {
    return new ImageResponse(
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
              backgroundImage: 'radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)',
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
              padding: '80px',
              position: 'relative',
            }}
          >
            {/* アイコン */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '40px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '140px',
                height: '140px',
              }}
            >
              <span
                style={{
                  fontSize: '80px',
                }}
              >
                ✈️
              </span>
            </div>

            {/* ブランドロゴ */}
            <h1
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                marginBottom: '24px',
                letterSpacing: '4px',
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              Journee
            </h1>

            {/* サブタイトル */}
            <p
              style={{
                fontSize: '32px',
                color: 'rgba(255, 255, 255, 0.95)',
                textAlign: 'center',
                lineHeight: 1.6,
                fontWeight: '500',
                marginBottom: '16px',
              }}
            >
              AI旅のしおり作成アプリ
            </p>

            {/* キャッチフレーズ */}
            <p
              style={{
                fontSize: '24px',
                color: 'rgba(255, 255, 255, 0.85)',
                textAlign: 'center',
                lineHeight: 1.6,
              }}
            >
              チャット形式で簡単に旅行計画を立てる
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Failed to generate default OG image:', error);
    
    // エラー時はシンプルなフォールバック画像を返す
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#667eea',
          }}
        >
          <span style={{ fontSize: '100px', marginBottom: '20px' }}>✈️</span>
          <span
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: '4px',
            }}
          >
            Journee
          </span>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
