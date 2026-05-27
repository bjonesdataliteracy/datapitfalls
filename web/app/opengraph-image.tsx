import { ImageResponse } from 'next/og';

export const alt = 'datapitfalls — detect the data pitfalls in your work';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '90px',
          background: '#0f1115',
          color: '#e7e9ee',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 92, fontWeight: 700, letterSpacing: '-0.03em' }}>
          datapitfalls
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: 40,
            lineHeight: 1.3,
            color: '#9aa3b2',
            maxWidth: 960,
          }}
        >
          Detect the common pitfalls in your data work — charts, code, prose, documents.
        </div>
        <div style={{ display: 'flex', marginTop: 56, fontSize: 28, color: '#5b8cff' }}>
          avoidingdatapitfalls.com
        </div>
      </div>
    ),
    { ...size }
  );
}
