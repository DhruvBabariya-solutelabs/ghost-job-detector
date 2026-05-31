/**
 * Brand lockup — violet line-art ghost glyph + wordmark. The glyph uses the
 * constant brand violet (never recolours to the verdict).
 */

import { BRAND_VIOLET } from './verdict';

export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M4 13a8 8 0 0 1 16 0v7l-2.7-1.9L14.6 20 12 18 9.4 20l-2.7-1.9L4 20z"
        stroke={BRAND_VIOLET}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <path
        d="M4 13a8 8 0 0 1 16 0v7l-2.7-1.9L14.6 20 12 18 9.4 20l-2.7-1.9L4 20z"
        fill={BRAND_VIOLET}
        opacity={0.12}
      />
      <circle cx="9.3" cy="12.3" r="1.4" fill={BRAND_VIOLET} />
      <circle cx="14.7" cy="12.3" r="1.4" fill={BRAND_VIOLET} />
    </svg>
  );
}

export function Brand({ size = 22 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <BrandMark size={size} />
      <span
        style={{
          fontSize: 'var(--t-base)',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: 'var(--ink)',
        }}
      >
        Ghost Job Detector
      </span>
    </span>
  );
}
