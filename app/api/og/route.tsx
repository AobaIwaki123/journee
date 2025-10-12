/**
 * Phase 10.2: OGP画像生成API
 * 
 * Next.js ImageResponseを使用して、しおりのOGP画像を動的生成
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { itineraryRepository } from '@/lib/db/itinerary-repository';

export const runtime = 'edge';

/**
 * OGP画像生成エンドポイント
 * GET /api/og?slug=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    if (!slug) {
      return new Response('Missing slug parameter', { status: 400 });
    }

    // データベースから公開しおりを取得
    const itinerary = await itineraryRepository.getPublicItinerary(slug);

    if (!itinerary) {
      return new Response('Itinerary not found', { status: 404 });
    }

    // しおり情報の整形
    const title = itinerary.title || '旅のしおり';
    const destination = itinerary.destination || '未定';
    const duration = itinerary.schedule?.length || 0;
    const durationText = duration > 0 ? `${duration}日間` : '';
    const summary = itinerary.summary || '';

    // OGP画像を生成（1200x630px）
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
                width: '120px',
                height: '120px',
              }}
            >
              <span
                style={{
                  fontSize: '64px',
                }}
              >
                ✈️
              </span>
            </div>

            {/* タイトル */}
            <h1
              style={{
                fontSize: '60px',
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                marginBottom: '24px',
                lineHeight: 1.2,
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                maxWidth: '900px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {title}
            </h1>

            {/* 目的地と日数 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  padding: '16px 32px',
                  borderRadius: '50px',
                }}
              >
                <span
                  style={{
                    fontSize: '32px',
                    fontWeight: '600',
                    color: 'white',
                    marginRight: '12px',
                  }}
                >
                  📍
                </span>
                <span
                  style={{
                    fontSize: '36px',
                    fontWeight: '600',
                    color: 'white',
                  }}
                >
                  {destination}
                </span>
              </div>

              {durationText && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    padding: '16px 32px',
                    borderRadius: '50px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '32px',
                      fontWeight: '600',
                      color: 'white',
                      marginRight: '12px',
                    }}
                  >
                    📅
                  </span>
                  <span
                    style={{
                      fontSize: '36px',
                      fontWeight: '600',
                      color: 'white',
                    }}
                  >
                    {durationText}
                  </span>
                </div>
              )}
            </div>

            {/* 概要（あれば） */}
            {summary && (
              <p
                style={{
                  fontSize: '24px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  textAlign: 'center',
                  maxWidth: '800px',
                  lineHeight: 1.6,
                  marginBottom: '32px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {summary}
              </p>
            )}

            {/* ブランドロゴ */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '40px',
              }}
            >
              <span
                style={{
                  fontSize: '40px',
                  fontWeight: 'bold',
                  color: 'white',
                  letterSpacing: '2px',
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                }}
              >
                Journee
              </span>
            </div>
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
    console.error('Failed to generate OG image:', error);
    
    // エラー時はデフォルトのOGP画像を返す
    const fallbackResponse = new ImageResponse(
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
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '80px', marginBottom: '20px' }}>✈️</span>
            <span
              style={{
                fontSize: '60px',
                fontWeight: 'bold',
                color: 'white',
                letterSpacing: '2px',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              }}
            >
              Journee
            </span>
            <p
              style={{
                fontSize: '28px',
                color: 'rgba(255, 255, 255, 0.9)',
                marginTop: '20px',
              }}
            >
              AI旅のしおり作成アプリ
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    // エラー時もキャッシュを設定（短時間）
    fallbackResponse.headers.set(
      'Cache-Control',
      'public, max-age=300, s-maxage=300'
    );

    return fallbackResponse;
  }
}