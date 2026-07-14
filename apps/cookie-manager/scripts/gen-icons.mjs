import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icon');
mkdirSync(outDir, { recursive: true });

// Bokal brand mark (see docs/superpowers/specs/2026-07-13-bokal-brand-design.md): an amber cookie
// disc on graphite with one flat edge and chip squares. The flat edge is what keeps the icon from
// collapsing into a generic amber blob at 16px — a plain circle has no silhouette.
// Fixed colors — a logo does NOT invert for dark mode.
const GRAPHITE = '#24282C';
const AMBER = '#E9A83E';
const CHIP = '#B67A22';
const svg = (s) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="${GRAPHITE}"/>
  <circle cx="64" cy="64" r="45" fill="${AMBER}"/>
  <rect x="18" y="99" width="92" height="16" fill="${GRAPHITE}"/>
  <g fill="${CHIP}">
    <rect x="40" y="40" width="9" height="9" rx="2"/><rect x="70" y="40" width="9" height="9" rx="2"/>
    <rect x="55" y="58" width="9" height="9" rx="2"/><rect x="80" y="62" width="9" height="9" rx="2"/>
    <rect x="46" y="74" width="9" height="9" rx="2"/><rect x="68" y="80" width="9" height="9" rx="2"/>
  </g>
</svg>`;

const sizes = [16, 32, 48, 128];
const browser = await chromium.launch({ channel: 'chromium', headless: true });
for (const s of sizes) {
  const page = await browser.newPage({ viewport: { width: s, height: s }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0">${svg(s)}</body>`);
  await page.locator('svg').screenshot({ path: join(outDir, `${s}.png`), omitBackground: true });
  await page.close();
}
await browser.close();
console.log('icons written to', outDir);
