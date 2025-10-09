import { ImageResponse } from 'next/og';

// Image metadata
export const alt = 'Journee - AI旅のしおり作成アプリ';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Image generation
export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ marginRight: 30 }}
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              fill="white"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div
            style={{
              fontSize: 100,
              fontWeight: 'bold',
              letterSpacing: -2,
            }}
          >
            Journee
          </div>
        </div>
        <div
          style={{
            fontSize: 40,
            opacity: 0.9,
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          AIとともに旅のしおりを作成
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
