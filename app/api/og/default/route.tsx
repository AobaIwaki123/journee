import { ImageResponse } from 'next/og';
import { DefaultOgpImage } from '@/components/ogp/DefaultOgpImage';

export const runtime = 'edge';

/**
 * デフォルトOGP画像生成API
 *
 * Journeeブランドを表現する美しいデフォルトOGP画像を動的生成します。
 * トップページや、OGP画像が未設定のページで使用されます。
 *
 * サイズ: 1200x630px（OGP標準）
 */
export async function GET() {
  try {
    const response = new ImageResponse(
      (
        <DefaultOgpImage />
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    // キャッシュ設定（7日間 - デフォルト画像は変更頻度が低いため）
    response.headers.set(
      'Cache-Control',
      'public, max-age=604800, s-maxage=604800, stale-while-revalidate=2592000'
    );

    return response;
  } catch (error) {
    console.error('[OGP Default Image] Error generating default OG image:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    // フォールバック: シンプルなエラー画像
    const errorResponse = new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#667eea',
            color: 'white',
            fontSize: '48px',
            fontWeight: 'bold',
          }}
        >
          Journee
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    // エラー時も短時間キャッシュ
    errorResponse.headers.set(
      'Cache-Control',
      'public, max-age=3600, s-maxage=3600'
    );

    return errorResponse;
  }
}
