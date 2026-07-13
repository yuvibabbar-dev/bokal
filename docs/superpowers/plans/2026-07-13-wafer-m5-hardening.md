# Wafer — Milestone 5: Hardening · E2E harness · CI — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Lock in correctness with integration tests for the risky cross-module paths, a redaction guard that fails CI if a cookie value could be logged, a threat-model doc, a Playwright E2E harness + specs (authored to run in CI / on a real machine), and a GitHub Actions pipeline.

**Environment note (honest scope):** MV3 extension E2E requires Playwright's bundled Chromium (`channel:'chromium'`) and cannot drive Chrome's *native* optional-permission dialog. So the E2E harness ships two spec tiers: (a) a **smoke** tier that runs anywhere (extension loads, SW registers, side panel renders the grant CTA, no console errors); (b) a **granted** tier that runs against an `e2e`-mode build which declares `host_permissions` at install (bypassing the runtime dialog) to exercise CRUD/profiles. The suite + CI are authored here; **actual E2E execution happens in CI or on the developer's machine** (not in this build sandbox). vitest integration tests and the redaction guard DO run here.

**Tech Stack:** + `@playwright/test` (dev). Vitest for integration + redaction.

## Global Constraints
_Inherits all prior constraints._ Additions:
- The redaction guard is authoritative: no `console.*` in shipped source may reference a cookie value / passphrase / plaintext blob.
- The `e2e`-mode build (`host_permissions`) is TEST-ONLY and never the published artifact.

---

## File Structure (added/modified)
```
apps/cookie-manager/
  lib/io/roundtrip.test.ts            # NEW export->import->set round-trip (partitioned + __Host-)
  lib/profiles/roundtrip.test.ts       # NEW encrypt->IDB->decrypt round-trip
  lib/security/redaction.test.ts       # NEW source scan: no value/passphrase logging
  wxt.config.ts                        # MODIFY e2e-mode host_permissions gate
  playwright.config.ts                 # NEW
  e2e/fixtures.ts                      # NEW load extension + get id
  e2e/smoke.spec.ts                    # NEW loads + grant CTA
  e2e/granted.spec.ts                  # NEW CRUD/profiles (e2e build)
  package.json                         # MODIFY add @playwright/test + e2e scripts
docs/threat-model.md                   # NEW
.github/workflows/ci.yml               # NEW
```

---

## Task 1: Integration round-trip tests (vitest)

**Files:** Create `apps/cookie-manager/lib/io/roundtrip.test.ts`, `apps/cookie-manager/lib/profiles/roundtrip.test.ts`

- [ ] **Step 1: Export→import→set round-trip** — `apps/cookie-manager/lib/io/roundtrip.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { toJson } from './export';
import { parseCookiesJson } from './import';
import { toSetDetails } from '../cookies/write';
import type { CookieAttrs } from '../cookie-types';

function base(o: Partial<CookieAttrs> = {}): CookieAttrs {
  return { name: 'sid', value: 'v', domain: 'example.com', path: '/', secure: true, httpOnly: true, sameSite: 'lax', hostOnly: false, ...o };
}

describe('export -> import -> set round-trip', () => {
  it('preserves a partitioned __Host- cookie through the full pipeline', () => {
    const original = base({
      name: '__Host-sid',
      hostOnly: true,
      path: '/',
      partitionKey: { topLevelSite: 'https://top.example', hasCrossSiteAncestor: false },
      expirationDate: 1893456000,
    });
    const parsed = parseCookiesJson(toJson([original]));
    expect(parsed.errors).toEqual([]);
    expect(parsed.cookies[0]).toEqual(original);

    const details = toSetDetails(parsed.cookies[0]!);
    expect(details.url).toBe('https://example.com/');
    expect('domain' in details).toBe(false); // host-only omits domain
    expect(details.secure).toBe(true);
    expect(details.partitionKey).toEqual({ topLevelSite: 'https://top.example', hasCrossSiteAncestor: false });
    expect(details.expirationDate).toBe(1893456000);
  });
});
```
- [ ] **Step 2: Profile encrypt→IDB→decrypt round-trip** — `apps/cookie-manager/lib/profiles/roundtrip.test.ts`
```ts
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { encryptJson, decryptJson } from './crypto';
import { putProfile, getAllProfiles } from './db';
import type { Profile } from './types';
import type { CookieAttrs } from '../cookie-types';

const cookies: CookieAttrs[] = [
  { name: 'sid', value: 'secret-token', domain: 'example.com', path: '/', secure: true, httpOnly: true, sameSite: 'lax', hostOnly: false },
];

describe('encrypted profile round-trip through IndexedDB', () => {
  it('stores ciphertext and recovers the cookies with the passphrase', async () => {
    const blob = await encryptJson(cookies, 'pw123');
    const profile: Profile = { id: 'rt1', name: 'enc', createdAt: 1, encrypted: true, blob };
    await putProfile(profile);

    const stored = (await getAllProfiles()).find((p) => p.id === 'rt1')!;
    expect(stored.cookies).toBeUndefined(); // no plaintext at rest
    expect(stored.blob).toBeDefined();
    // ciphertext must not contain the secret in the clear
    expect(JSON.stringify(stored.blob)).not.toContain('secret-token');

    const recovered = await decryptJson<CookieAttrs[]>(stored.blob!, 'pw123');
    expect(recovered).toEqual(cookies);
  });
});
```
- [ ] **Step 3: Run → PASS** (`pnpm --filter @wafer/cookie-manager test`, now 53). **Step 4: `tsc --noEmit` exit 0**; commit `git add apps/cookie-manager/lib/io/roundtrip.test.ts apps/cookie-manager/lib/profiles/roundtrip.test.ts && git commit -m "test: export/import/set + encrypted-profile IDB round-trip integration tests"`

---

## Task 2: Redaction audit (vitest source scan)

**Files:** Create `apps/cookie-manager/lib/security/redaction.test.ts`

- [ ] **Step 1: Implement the guard** — `apps/cookie-manager/lib/security/redaction.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Recursively collect shipped source files (exclude tests, .output, node_modules, .wxt).
function sources(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.output' || entry === '.wxt' || entry === 'e2e') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sources(full, acc);
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) acc.push(full);
  }
  return acc;
}

// A console.* call is risky if the same statement references a cookie value or a passphrase.
const RISKY = /console\.(log|error|warn|info|debug)\([^)]*\b(value|passphrase|\bpass\b|plaintext|\bblob\b)\b/;

describe('redaction audit', () => {
  it('no shipped source logs a cookie value, passphrase, or plaintext blob', () => {
    const offenders: string[] = [];
    for (const file of sources(join(__dirname, '..', '..'))) {
      const text = readFileSync(file, 'utf8');
      text.split('\n').forEach((line, i) => {
        if (RISKY.test(line)) offenders.push(`${file}:${i + 1}  ${line.trim()}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});
```
- [ ] **Step 2: Run → PASS** (proves the current tree is clean; if it fails, a real logging leak exists — fix the source, not the test). **Step 3: Commit** `git add apps/cookie-manager/lib/security/redaction.test.ts && git commit -m "test: redaction guard — no cookie value/passphrase logging in shipped source"`

---

## Task 3: Playwright E2E harness + specs (authored for CI)

**Files:** Modify `apps/cookie-manager/package.json`, `apps/cookie-manager/wxt.config.ts`; Create `apps/cookie-manager/playwright.config.ts`, `apps/cookie-manager/e2e/fixtures.ts`, `apps/cookie-manager/e2e/smoke.spec.ts`, `apps/cookie-manager/e2e/granted.spec.ts`.

- [ ] **Step 1: deps + scripts** — add to `apps/cookie-manager/package.json` devDependencies `"@playwright/test": "^1.48.0"`; add scripts:
```json
    "build:e2e": "WAFER_E2E=1 wxt build",
    "e2e": "playwright test",
    "e2e:install": "playwright install chromium"
```
Run `pnpm install`.
- [ ] **Step 2: e2e-mode manifest gate** — in `apps/cookie-manager/wxt.config.ts`, add install-time host permission ONLY in E2E mode (so E2E can skip the native dialog). Inside `defineConfig`, compute the manifest with a conditional:
```ts
  manifest: {
    // ...existing fields...
    // TEST-ONLY: in E2E builds, grant host access at install so specs bypass the runtime dialog.
    // Never set for the published build.
    ...(process.env.WAFER_E2E ? { host_permissions: ['<all_urls>'] } : {}),
  },
```
(Add it as the last key inside `manifest`. The published build — no `WAFER_E2E` — is unchanged.)
- [ ] **Step 3: playwright config** — `apps/cookie-manager/playwright.config.ts`
```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
});
```
- [ ] **Step 4: fixtures** — `apps/cookie-manager/e2e/fixtures.ts`
```ts
import { test as base, chromium, type BrowserContext } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', '.output', 'chrome-mv3');

export const test = base.extend<{ context: BrowserContext; extensionId: string }>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: true,
      args: [`--disable-extensions-except=${DIST}`, `--load-extension=${DIST}`],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent('serviceworker');
    const id = sw.url().split('/')[2]!;
    await use(id);
  },
});

export const expect = test.expect;
```
- [ ] **Step 5: smoke spec** — `apps/cookie-manager/e2e/smoke.spec.ts`
```ts
import { test, expect } from './fixtures';

test('side panel loads and shows the grant CTA', async ({ context, extensionId }) => {
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await expect(page.getByRole('button', { name: /grant access/i })).toBeVisible();
  expect(errors).toEqual([]);
});
```
- [ ] **Step 6: granted spec (needs the e2e build)** — `apps/cookie-manager/e2e/granted.spec.ts`
```ts
import { test, expect } from './fixtures';

// Runs against the WAFER_E2E build (host_permissions granted at install), so the grant CTA
// is skipped and cookie APIs work without the native dialog.
test('adds a cookie and shows it in the list', async ({ context, extensionId }) => {
  const site = await context.newPage();
  await site.goto('https://example.com');

  const panel = await context.newPage();
  await panel.goto(`chrome-extension://${extensionId}/sidepanel.html`);

  // If the grant CTA is present, this build wasn't the e2e build — skip.
  if (await panel.getByRole('button', { name: /grant access/i }).isVisible().catch(() => false)) {
    test.skip(true, 'run against build:e2e (host_permissions) to exercise CRUD');
  }

  await panel.getByRole('button', { name: /add cookie/i }).click();
  await panel.getByRole('textbox').first().fill('e2e_test');
  await panel.getByRole('button', { name: /^save$/i }).click();
  await expect(panel.getByText('e2e_test')).toBeVisible();
});
```
- [ ] **Step 7: attempt local run, else document** — Try `pnpm --filter @wafer/cookie-manager build && pnpm --filter @wafer/cookie-manager e2e:install && pnpm --filter @wafer/cookie-manager e2e`. If the environment cannot download/run Chromium (sandbox), that is expected — record it in the report; the specs run in CI. Confirm `tsc`/existing vitest still pass and the config/spec files type-check. **Commit** `git add -A && git commit -m "test: Playwright E2E harness (smoke + granted) + e2e-mode manifest gate"`

---

## Task 4: GitHub Actions CI

**Files:** Create `.github/workflows/ci.yml`

- [ ] **Step 1: workflow** — `.github/workflows/ci.yml`
```yaml
name: CI
on:
  push: { branches: [master] }
  pull_request: {}
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.9.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @wafer/cookie-manager exec tsc --noEmit
      - run: pnpm -r test
      - run: pnpm --filter @wafer/cookie-manager build
      - uses: actions/upload-artifact@v4
        with:
          name: chrome-mv3
          path: apps/cookie-manager/.output/chrome-mv3
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.9.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @wafer/cookie-manager e2e:install
      - run: pnpm --filter @wafer/cookie-manager build:e2e
      - run: xvfb-run -a pnpm --filter @wafer/cookie-manager e2e
```
- [ ] **Step 2: Commit** `git add .github/workflows/ci.yml && git commit -m "ci: GitHub Actions — tsc, vitest, build+artifact, Playwright E2E (xvfb)"`

---

## Task 5: Threat model doc

**Files:** Create `docs/threat-model.md`

- [ ] **Step 1: write it** — `docs/threat-model.md` covering: assets (cookie values = session tokens, profiles = credential material, passphrases); trust boundaries (extension vs page vs storage vs future ExtPay); threats + mitigations (XSS via cookie values → text-node rendering + redaction test; malicious-update exfiltration → minimal manifest, no remote code, public source, CWS review; profile theft at rest → optional AES-GCM encryption; passphrase loss → documented zero-knowledge; supply chain → pinned deps, lockfile, CI); non-goals (not a malware scanner; no cloud sync in MVP); and the residual risks (mock billing unlocks Pro until ExtPay is wired; unencrypted profiles store plaintext at rest by user choice). Reference the redaction test and the minimal-permission manifest as enforced controls.
- [ ] **Step 2: Commit** `git add docs/threat-model.md && git commit -m "docs: threat model"`

---

## Self-Review (spec coverage)
- Integration coverage for the cross-module paths (round-trips) → Task 1. ✅
- Redaction audit (no value/passphrase logging), enforced in CI → Task 2. ✅
- Playwright E2E harness (`channel:'chromium'`, ID from SW, smoke + granted) → Task 3. ✅ (execution in CI)
- CI (tsc + vitest + build + artifact + E2E under xvfb) → Task 4. ✅
- Threat-model doc → Task 5. ✅

**Honest deferrals:** E2E is authored + CI-wired but not executed in this build sandbox (native permission dialog + no Chromium here). The `granted` spec needs the `build:e2e` variant. Interactive confidence comes from CI or a local `pnpm e2e` run.
