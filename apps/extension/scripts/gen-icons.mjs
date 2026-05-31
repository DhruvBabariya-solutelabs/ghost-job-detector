/**
 * Generates the Chrome extension icon set from a single master SVG.
 *
 * The mark is the side-panel/popup ghost (BrandMark) on a brand-violet gradient
 * rounded square, with the eyes knocked out in the deep violet so it reads as a
 * cut-out — crisp from 128px down to the 16px toolbar size.
 *
 * Output: public/icon.svg (master) + public/icon/{16,32,48,128}.png.
 * WXT auto-discovers public/icon/{size}.png and wires them into the manifest's
 * `icons` + `action.default_icon`.
 *
 * Run: node scripts/gen-icons.mjs   (re-run if the logo changes)
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

const VIOLET_LIGHT = '#8b6cff';
const VIOLET_DEEP = '#6a3ff5';

// 128 viewBox. Ghost = BrandMark path (24-box) scaled ×4 and centred.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${VIOLET_LIGHT}"/>
      <stop offset="1" stop-color="${VIOLET_DEEP}"/>
    </linearGradient>
    <radialGradient id="hl" cx="0.5" cy="0.2" r="0.85">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="sh" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#3a1f9e" flood-opacity="0.45"/>
    </filter>
  </defs>

  <rect width="128" height="128" rx="29" fill="url(#bg)"/>
  <rect width="128" height="128" rx="29" fill="url(#hl)"/>

  <g transform="translate(16,17) scale(4)" filter="url(#sh)">
    <path d="M4 13a8 8 0 0 1 16 0v7l-2.7-1.9L14.6 20 12 18 9.4 20l-2.7-1.9L4 20z" fill="#ffffff"/>
    <circle cx="9.3" cy="12.3" r="1.5" fill="${VIOLET_DEEP}"/>
    <circle cx="14.7" cy="12.3" r="1.5" fill="${VIOLET_DEEP}"/>
  </g>
</svg>`;

mkdirSync('public/icon', { recursive: true });
writeFileSync('public/icon.svg', svg);

const SIZES = [16, 32, 48, 128];
for (const size of SIZES) {
  await sharp(Buffer.from(svg), { density: 512 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(`public/icon/${size}.png`);
}
console.log(`Wrote public/icon.svg + ${SIZES.map((s) => `${s}.png`).join(', ')}`);
