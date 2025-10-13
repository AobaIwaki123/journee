import React from 'react';

export const DefaultOgpImage: React.FC<{}> = () => {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        fontFamily: '"Inter", sans-serif',
      }}
    >
      {/* Abstract background shapes */}
      <div
        style={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          filter: 'blur(50px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -150,
          right: -150,
          width: 400,
          height: 400,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          filter: 'blur(60px)',
        }}
      />

      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        {/* Modern SVG Icon */}
        <svg
          width="100"
          height="100"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginBottom: '30px', filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.2))' }}
        >
          <path d="M2 21l21-9L2 3v7l9 2-9 2z" />
        </svg>

        <span
          style={{
            fontSize: '96px',
            fontWeight: 700,
            color: 'white',
            letterSpacing: '2px',
            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            fontFamily: '"Inter Bold", sans-serif',
          }}
        >
          Journee
        </span>
        <p
          style={{
            fontSize: '36px',
            color: 'rgba(255, 255, 255, 0.9)',
            marginTop: '24px',
            fontWeight: 400,
            fontFamily: '"Inter Regular", sans-serif',
          }}
        >
          AI旅のしおり作成アプリ
        </p>
      </div>
    </div>
  );
};
