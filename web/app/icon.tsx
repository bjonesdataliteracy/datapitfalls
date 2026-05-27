import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#5b8cff',
          color: '#0b0d12',
          fontSize: 24,
          fontWeight: 700,
          borderRadius: 7,
        }}
      >
        !
      </div>
    ),
    { ...size }
  );
}
