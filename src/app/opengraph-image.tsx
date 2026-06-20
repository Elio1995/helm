import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Helm — a specialty bookshop';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Static OG image. Edge runtime so the image can be regenerated cheaply if
// the design ever changes. No external fonts — keeps cold-start tiny.
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #18181b 100%)',
        color: '#fafafa',
        fontFamily: 'sans-serif',
      }}
    >
      <p
        style={{
          fontSize: 20,
          letterSpacing: 6,
          textTransform: 'uppercase',
          color: '#a1a1aa',
          margin: 0,
        }}
      >
        Helm
      </p>
      <h1
        style={{
          fontSize: 96,
          lineHeight: 1.05,
          margin: '32px 0 0',
          fontWeight: 600,
          maxWidth: 1000,
        }}
      >
        A small shelf, chosen with care.
      </h1>
      <p style={{ fontSize: 28, color: '#a1a1aa', marginTop: 32 }}>
        Independent. Curated. Shipped.
      </p>
    </div>,
    size,
  );
}
