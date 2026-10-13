import { ImageResponse } from 'next/og';

export const alt =
  'Data Pitfalls: the mistakes that mislead in data work, from the book by Ben Jones';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '90px',
        background: '#13304d',
        color: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', fontSize: 28, letterSpacing: '0.2em', color: '#69dffa' }}>
        FROM THE BOOK BY BEN JONES
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 24,
          fontSize: 120,
          fontWeight: 800,
          letterSpacing: '0.02em',
          color: '#eed368',
        }}
      >
        DATA PITFALLS
      </div>
      <div style={{ display: 'flex', marginTop: 28, fontSize: 40, lineHeight: 1.3, maxWidth: 960 }}>
        The mistakes that mislead in charts, dashboards, SQL and reports.
      </div>
      <div style={{ display: 'flex', marginTop: 56, fontSize: 28, color: '#69dffa' }}>
        avoidingdatapitfalls.com
      </div>
    </div>,
    { ...size }
  );
}
