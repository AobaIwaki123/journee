/**
 * Phase 10.2.1: デフォルトOGP画像生成API
 *
 * Journeeブランドを表現するデフォルトOGP画像を動的生成
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";

/**
 * デフォルトOGP画像生成エンドポイント
 * GET /api/og/default
 */
export async function GET() {
  try {
    const response = new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fff",
            backgroundImage:
              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            position: "relative",
          }}
        >
          {/* 装飾的な背景パターン */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage:
                "radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)",
              backgroundSize: "100px 100px",
            }}
          />

          {/* メインコンテンツ */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* アイコン */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "40px",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: "50%",
                width: "140px",
                height: "140px",
              }}
            >
              <span
                style={{
                  fontSize: "80px",
                }}
              >
                ✈️
              </span>
            </div>

            {/* ブランドロゴ */}
            <span
              style={{
                fontSize: "100px",
                fontWeight: "bold",
                color: "white",
                letterSpacing: "4px",
                textShadow: "0 4px 20px rgba(0,0,0,0.3)",
                marginBottom: "30px",
              }}
            >
              Journee
            </span>

            {/* キャッチコピー */}
            <p
              style={{
                fontSize: "40px",
                color: "rgba(255, 255, 255, 0.95)",
                fontWeight: "500",
                textAlign: "center",
                maxWidth: "800px",
                lineHeight: 1.4,
              }}
            >
              AI旅のしおり作成アプリ
            </p>

            {/* サブテキスト */}
            <p
              style={{
                fontSize: "28px",
                color: "rgba(255, 255, 255, 0.85)",
                marginTop: "20px",
                textAlign: "center",
              }}
            >
              AIとともに、旅の計画を楽しく
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    // キャッシュ設定（7日間 - デフォルト画像は変更頻度が低い）
    response.headers.set(
      "Cache-Control",
      "public, max-age=604800, s-maxage=604800, immutable"
    );

    return response;
  } catch (error) {
    console.error("[Default OGP Image Generation Error]", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // エラー時でもシンプルな画像を返す
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#667eea",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "80px", marginBottom: "20px" }}>✈️</span>
            <span
              style={{
                fontSize: "60px",
                fontWeight: "bold",
                color: "white",
              }}
            >
              Journee
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
