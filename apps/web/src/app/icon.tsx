import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 7,
        background: '#2563eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 18,
          height: 22,
          background: 'white',
          borderRadius: '9px 9px 3px 3px',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-start',
          paddingTop: 8,
          paddingLeft: 2,
          paddingRight: 2,
        }}
      >
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#2563eb' }} />
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#2563eb' }} />
      </div>
    </div>,
    { ...size },
  );
}
