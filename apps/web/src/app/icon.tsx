import { ImageResponse } from 'next/og';

import { BRAND_COLORS } from '@community-marketplace/config';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/** Dynamic favicon — beacon mark on teal rounded square (matches icon-app.svg). */
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
          background: BRAND_COLORS.primary,
          borderRadius: 7,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 512 512" fill="none">
          <circle cx="256" cy="272" r="34" fill={BRAND_COLORS.white} />
          <path
            d="M 208.5 238.7 A 58 58 0 0 1 303.5 238.7"
            stroke={BRAND_COLORS.white}
            strokeWidth="26"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 173.8 218.6 A 98 98 0 0 1 338.2 218.6"
            stroke={BRAND_COLORS.white}
            strokeWidth="26"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 137.7 200.9 A 138 138 0 0 1 374.3 200.9"
            stroke={BRAND_COLORS.white}
            strokeWidth="26"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M198 368 L256 328 L314 368 L314 398 L198 398 Z"
            fill={BRAND_COLORS.white}
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
