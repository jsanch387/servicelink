import { ImageResponse } from 'next/og';
import {
  PAYMENT_LINK_SHARE_DESCRIPTION,
  PAYMENT_LINK_SHARE_TITLE,
} from './constants';

export const PAYMENT_LINK_OG_SIZE = { width: 1200, height: 630 };

export function renderPaymentLinkOpenGraphImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0f0f',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 112,
              height: 112,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 28,
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 64,
                fontWeight: 700,
                color: '#f7f4ee',
                lineHeight: 1,
              }}
            >
              $
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 36,
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: -1.5,
              color: '#f7f4ee',
            }}
          >
            {PAYMENT_LINK_SHARE_TITLE}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 14,
              fontSize: 28,
              fontWeight: 500,
              color: '#a1a1aa',
            }}
          >
            {PAYMENT_LINK_SHARE_DESCRIPTION}
          </div>
        </div>
      </div>
    ),
    {
      ...PAYMENT_LINK_OG_SIZE,
    }
  );
}
