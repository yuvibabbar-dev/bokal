import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Guards the public claim (README, store copy): the Pro UI is code-split into its own lazy chunk,
// so a free user never fetches or executes Pro logic. Without this, the split is only true by
// accident — one stray static import of ProfilesPanel would silently bundle the encryption +
// IndexedDB code into the always-loaded panel bundle and make the claim a lie.
//
// Run AFTER a build. Wired into CI right after the build step.

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', '.output', 'chrome-mv3');
const chunksDir = join(outDir, 'chunks');

// Markers chosen to survive minification: a string literal handed to crypto.subtle, a Web Crypto
// method name, and a global. All three belong to the Pro profiles code (encryption + IndexedDB) and
// to nothing in the free path. NOTE: lib/pay (the entitlement gate) legitimately lives in the main
// bundle — it must, to decide whether to load Pro — so it is deliberately NOT a marker.
const PRO_MARKERS = ['PBKDF2', 'deriveKey', 'indexedDB'];

function fail(msg) {
  console.error(`✗ bundle-split guard FAILED\n  ${msg}`);
  process.exit(1);
}

if (!existsSync(chunksDir)) {
  fail(`no build output at ${chunksDir}\n  Run: pnpm --filter @wafer/cookie-manager build`);
}

const files = readdirSync(chunksDir);
const appChunk = files.find((f) => /^App-.*\.js$/.test(f));
const proChunk = files.find((f) => /^ProfilesPanel-.*\.js$/.test(f));

if (!appChunk) fail('could not find the main App-*.js chunk in the build output.');
if (!proChunk) {
  fail(
    'ProfilesPanel is NOT emitted as a separate chunk — the Pro UI has been bundled into the main app.\n' +
      '  Keep it behind the dynamic import() in entrypoints/sidepanel/App.tsx.',
  );
}

// Sanity-check the markers themselves, so this guard can never pass vacuously if the Pro code moves.
const proSrc = readFileSync(join(chunksDir, proChunk), 'utf8');
const presentInPro = PRO_MARKERS.filter((m) => proSrc.includes(m));
if (presentInPro.length === 0) {
  fail(
    `the Pro chunk (${proChunk}) contains none of the markers [${PRO_MARKERS.join(', ')}].\n` +
      '  The markers are stale, so this guard would pass without checking anything. Update PRO_MARKERS.',
  );
}

const appSrc = readFileSync(join(chunksDir, appChunk), 'utf8');
const leaked = PRO_MARKERS.filter((m) => appSrc.includes(m));
if (leaked.length > 0) {
  fail(
    `the main bundle (${appChunk}) contains Pro-only code: [${leaked.join(', ')}].\n` +
      '  A free user must never load or execute Pro logic. Remove the static import of ProfilesPanel\n' +
      '  (or of lib/profiles) from the always-loaded path and keep it behind dynamic import().',
  );
}

console.log(
  `✓ bundle-split guard passed — Pro code is isolated in ${proChunk} ` +
    `(markers: ${presentInPro.join(', ')}); main bundle ${appChunk} is clean.`,
);
