import { ImageResponse } from 'next/og';

/** Rounded dollar mark for `/p/…` share previews (not the ServiceLink logo). */
export function renderPaymentLinkShareIcon(size: number): ImageResponse {
  const radius = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.52);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#141210',
          borderRadius: radius,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize,
            fontWeight: 700,
            color: '#f7f4ee',
            lineHeight: 1,
          }}
        >
          $
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
