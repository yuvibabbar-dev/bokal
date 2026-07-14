import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Chrome Web Store promo tiles. CWS requires JPEG or 24-bit PNG with NO alpha channel, so every
// tile is rendered over an opaque background and screenshotted WITHOUT omitBackground (which is what
// would introduce an alpha channel and get the asset rejected).
//
//   Small promo tile  440x280  — shown alongside the listing
//   Marquee promo tile 1400x560 — required to be eligible for Web Store featuring
//
//   pnpm --filter @bokal/cookie-manager exec node scripts/gen-promo.mjs

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', 'store', 'promo');
mkdirSync(outDir, { recursive: true });

const GRAPHITE = '#1E2226';
const TILE = '#24282C';
const AMBER = '#E9A83E';
const CHIP = '#B67A22';
const FG = '#EDECE8';
const MUTED = '#A9AFB5';

const mark = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="${TILE}"/>
  <circle cx="64" cy="64" r="45" fill="${AMBER}"/>
  <rect x="18" y="99" width="92" height="16" fill="${TILE}"/>
  <g fill="${CHIP}">
    <rect x="40" y="40" width="9" height="9" rx="2"/><rect x="70" y="40" width="9" height="9" rx="2"/>
    <rect x="55" y="58" width="9" height="9" rx="2"/><rect x="80" y="62" width="9" height="9" rx="2"/>
    <rect x="46" y="74" width="9" height="9" rx="2"/><rect x="68" y="80" width="9" height="9" rx="2"/>
  </g>
</svg>`;

// NO quoted font names: these strings are interpolated into a style="..." ATTRIBUTE, and a double
// quote inside it terminates the attribute early — silently dropping every declaration that follows
// (which previously killed the padding and fell back to a serif face).
const FONT = `system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif`;

// 440x280 — compact: mark, wordmark, one line of value.
const small = `
<div style="width:440px;height:280px;background:${GRAPHITE};display:flex;flex-direction:column;
            align-items:center;justify-content:center;gap:14px;font-family:${FONT};box-sizing:border-box;padding:24px;">
  ${mark(64)}
  <div style="font-size:30px;font-weight:600;color:${FG};letter-spacing:-0.02em;">Bokal</div>
  <div style="font-size:14px;color:${MUTED};text-align:center;line-height:1.5;">
    Every cookie, under your control.<br>Nothing leaves your device.
  </div>
  <div style="font-size:11px;color:${AMBER};letter-spacing:0.06em;text-transform:uppercase;">
    Open source · No tracking
  </div>
</div>`;

// 1400x560 — banner: mark left, message right, trust row beneath.
const marquee = `
<div style="width:1400px;height:560px;background:${GRAPHITE};display:flex;align-items:center;
            gap:64px;font-family:${FONT};box-sizing:border-box;padding:0 96px;">
  ${mark(200)}
  <div style="display:flex;flex-direction:column;gap:18px;">
    <div style="font-size:72px;font-weight:600;color:${FG};letter-spacing:-0.03em;line-height:1;">Bokal</div>
    <div style="font-size:30px;color:${FG};line-height:1.35;">
      Every cookie, under your control.
    </div>
    <div style="font-size:22px;color:${MUTED};line-height:1.5;max-width:820px;">
      An open-source cookie editor for developers and QA — view, edit, import and export
      cookies, including HttpOnly. Nothing leaves your device.
    </div>
    <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;">
      ${['No tracking', 'No tabs permission', 'Local-first', 'Open source']
        .map(
          (t) =>
            `<span style="font-size:16px;color:${FG};background:${TILE};border:1px solid #33383D;
             border-radius:999px;padding:7px 16px;">${t}</span>`,
        )
        .join('')}
    </div>
  </div>
</div>`;

const browser = await chromium.launch({ channel: 'chromium', headless: true });

for (const [name, html, w, h] of [
  ['small-promo-440x280', small, 440, 280],
  ['marquee-promo-1400x560', marquee, 1400, 560],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(`<body style="margin:0;background:${GRAPHITE}">${html}</body>`);
  await page.waitForTimeout(300);
  // No omitBackground -> opaque -> no alpha channel -> CWS-compliant.
  await page.screenshot({ path: join(outDir, `${name}.png`) });
  await page.close();
  console.log('  ✓', name);
}

await browser.close();
console.log('promo tiles written to', outDir);
