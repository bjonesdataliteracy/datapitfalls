import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// The brand mark: three bars on navy, in the Data Literacy colors.
export default function Icon() {
  const bar = (height: number, background: string) => (
    <div style={{ width: 6, height, background, borderRadius: 1 }} />
  );
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 2,
        paddingBottom: 7,
        background: '#13304d',
        borderRadius: 7,
      }}
    >
      {bar(9, '#1d84b5')}
      {bar(19, '#69dffa')}
      {bar(13, '#eed368')}
    </div>,
    { ...size }
  );
}
