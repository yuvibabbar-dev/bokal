import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icon');
mkdirSync(outDir, { recursive: true });

// A "wafer": a rounded square with a subtle grid (silicon-wafer + cookie motif) on the brand accent.
const svg = (s) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="#2563eb"/>
  <g fill="#ffffff">
    <circle cx="64" cy="64" r="40" fill="#ffffff" opacity="0.12"/>
    <circle cx="46" cy="50" r="6"/><circle cx="80" cy="44" r="5"/><circle cx="86" cy="76" r="6"/>
    <circle cx="52" cy="82" r="5"/><circle cx="66" cy="64" r="4"/>
  </g>
  <path d="M64 20 a44 44 0 1 0 44 44 a20 20 0 0 1 -22 -22 a20 20 0 0 1 -22 -22 z" fill="#ffffff" opacity="0.9"/>
</svg>`;

const sizes = [16, 32, 48, 128];
const browser = await chromium.launch({ channel: 'chromium', headless: true });
for (const s of sizes) {
  const page = await browser.newPage({ viewport: { width: s, height: s }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0">${svg(s).replace('width="'+s+'" height="'+s+'"', 'width="'+s+'" height="'+s+'"')}</body>`);
  await page.locator('svg').screenshot({ path: join(outDir, `${s}.png`), omitBackground: true });
  await page.close();
}
await browser.close();
console.log('icons written to', outDir);
