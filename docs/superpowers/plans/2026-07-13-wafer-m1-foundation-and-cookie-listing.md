# Wafer — Milestone 1: Foundation & Cookie Listing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Wafer monorepo + WXT extension and ship a read-only, XSS-safe, searchable cookie viewer for the active tab's domain, gated behind a runtime `<all_urls>` permission grant.

**Architecture:** pnpm monorepo; a WXT (Vite) React+TS extension whose **side panel** is the primary UI and calls `chrome.cookies.*` directly. Pure logic (validation, cookie keys/URL construction, event debouncing) lives in framework-free `lib/` modules unit-tested with Vitest. `chrome.storage` is the source of truth; a Zustand vanilla store rehydrates from it. The background service worker only relays `cookies.onChanged` (debounced for the remove-then-write double-fire) and sets side-panel open-on-action behavior.

**Tech Stack:** WXT `0.20.27` (pinned), React 19, TypeScript (strict), Zustand 5, `@tanstack/react-virtual` 3, Vitest, pnpm 9.9 / Node 24.

## Global Constraints

_Every task's requirements implicitly include this section. Values are verbatim from the spec._

- **Runtime:** Node ≥ 24, pnpm 9.9. WXT pinned to `0.20.27` (pre-1.0; do not use `^`).
- **Product name:** `Wafer`. Manifest `version` `1.0.0`, `minimum_chrome_version` `"114"`.
- **Install permissions:** `["cookies","storage","sidePanel","unlimitedStorage"]`. **No `tabs`.**
- **Optional host permission:** `optional_host_permissions: ["<all_urls>"]`, requested at runtime via `chrome.permissions.request()` **synchronously inside a user gesture** (no `await` before the call).
- **CSP (extension_pages):** `script-src 'self'; object-src 'self'`. **No remote code**, no CDNs, no `eval`. Bundle everything.
- **Security:** cookie values render as **text nodes only** — never `dangerouslySetInnerHTML`, never inject a value into HTML/attributes. Never log cookie values to console in production.
- **State:** `chrome.storage` is the single source of truth; in-memory store is ephemeral (panel remounts, SW idle-suspends ~30s). Rehydrate on load; sync via `chrome.storage.onChanged`.
- **Repo root:** `chrome_extensions/wafer/` (git already initialized; the design spec is committed under `docs/`).
- **TypeScript:** `strict: true`. No `any` in committed code.

**Definition of Done (Milestone 1):** With `pnpm dev` and the unpacked extension loaded, opening the side panel on a live site shows a Grant-access empty state; after granting, the current domain's cookies list (virtualized), are searchable, and a cookie whose value is `<img src=x onerror="alert(1)">` renders as literal text with no script execution. `pnpm test` is green.

---

## File Structure

```
wafer/
  package.json                                 # workspace root: scripts + devDeps
  pnpm-workspace.yaml
  .gitignore
  .nvmrc
  packages/
    tsconfig/
      package.json                             # @wafer/tsconfig
      base.json                                # shared strict tsconfig
  apps/
    cookie-manager/
      package.json                             # @wafer/cookie-manager
      tsconfig.json
      wxt.config.ts                            # manifest + react module
      vitest.config.ts
      entrypoints/
        background.ts                          # SW: setPanelBehavior + onChanged relay
        sidepanel/
          index.html
          main.tsx                             # React mount
          App.tsx                              # panel shell + routing between states
      lib/
        cookie-types.ts                        # CookieAttrs, SameSite, PartitionKey
        cookies/
          validation.ts                        # pure: prefix/size/samesite rules
          validation.test.ts
          keys.ts                              # pure: cookieId, cookieUrl
          keys.test.ts
          read.ts                              # chrome.cookies read wrapper
        debounce.ts                            # pure: createDebouncer
        debounce.test.ts
        permissions.ts                         # request/check <all_urls>
      stores/
        cookies-store.ts                       # zustand + storage rehydrate
      components/
        GrantAccess.tsx                        # first-run permission empty state
        CookieList.tsx                         # virtualized list
        CookieRow.tsx                          # single row (XSS-safe)
        SearchBar.tsx
```

---

## Task 1: Monorepo scaffold

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.nvmrc`
- Create: `packages/tsconfig/package.json`, `packages/tsconfig/base.json`

**Interfaces:**
- Produces: workspace package `@wafer/tsconfig` exporting `base.json`; root scripts `build`, `test`, `dev`.

- [ ] **Step 1: Create workspace manifest files**

`pnpm-workspace.yaml`:
```yaml
packages:
  - packages/*
  - apps/*
```

`.nvmrc`:
```
24
```

`.gitignore`:
```
node_modules/
.output/
.wxt/
dist/
*.log
.DS_Store
coverage/
```

`package.json` (root):
```json
{
  "name": "wafer-monorepo",
  "private": true,
  "packageManager": "pnpm@9.9.0",
  "engines": { "node": ">=24" },
  "scripts": {
    "dev": "pnpm --filter @wafer/cookie-manager dev",
    "build": "pnpm --filter @wafer/cookie-manager build",
    "test": "pnpm -r test"
  }
}
```

- [ ] **Step 2: Create the shared tsconfig package**

`packages/tsconfig/package.json`:
```json
{
  "name": "@wafer/tsconfig",
  "version": "0.0.0",
  "private": true,
  "files": ["base.json"]
}
```

`packages/tsconfig/base.json`:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

- [ ] **Step 3: Verify workspace resolves**

Run: `pnpm install`
Expected: completes without error; `pnpm-workspace.yaml` picks up `packages/tsconfig` (a warning about no app yet is fine).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-workspace.yaml .gitignore .nvmrc packages/tsconfig
git commit -m "chore: scaffold pnpm monorepo + shared tsconfig"
```

---

## Task 2: WXT extension scaffold + manifest

**Files:**
- Create: `apps/cookie-manager/package.json`, `tsconfig.json`, `wxt.config.ts`
- Create: `apps/cookie-manager/entrypoints/background.ts`
- Create: `apps/cookie-manager/entrypoints/sidepanel/index.html`, `main.tsx`, `App.tsx`

**Interfaces:**
- Produces: a loadable MV3 extension named Wafer with a side panel entrypoint (`sidepanel.html`) and a module background SW.

- [ ] **Step 1: Create the app package.json (pinned WXT + React 19)**

`apps/cookie-manager/package.json`:
```json
{
  "name": "@wafer/cookie-manager",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wxt",
    "build": "wxt build",
    "zip": "wxt zip",
    "postinstall": "wxt prepare",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "5.0.14",
    "@tanstack/react-virtual": "3.14.6"
  },
  "devDependencies": {
    "@wafer/tsconfig": "workspace:*",
    "@wxt-dev/module-react": "1.1.3",
    "wxt": "0.20.27",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0",
    "@types/chrome": "^0.0.287"
  }
}
```

> Note: version floors marked `^` for React/TS/vitest/types are fine; WXT and the two runtime libs are pinned per spec. If a pinned patch is unavailable at install time, pick the nearest published patch and record it in the commit message.

- [ ] **Step 2: Create tsconfig + WXT config**

`apps/cookie-manager/tsconfig.json`:
```json
{
  "extends": "@wafer/tsconfig/base.json",
  "compilerOptions": {
    "types": ["chrome"]
  },
  "include": ["entrypoints", "lib", "stores", "components", "wxt.config.ts"],
  "references": []
}
```

`apps/cookie-manager/wxt.config.ts`:
```ts
import { defineConfig } from 'wxt';

// Wafer manifest — minimal install-time permissions; host access requested at runtime.
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Wafer',
    version: '1.0.0',
    description: 'View, edit, add, delete, import, and export browser cookies.',
    minimum_chrome_version: '114',
    permissions: ['cookies', 'storage', 'sidePanel', 'unlimitedStorage'],
    optional_host_permissions: ['<all_urls>'],
    action: { default_title: 'Wafer' },
    side_panel: { default_path: 'sidepanel.html' },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
  },
});
```

- [ ] **Step 3: Create the background SW and side-panel entrypoints (minimal, expanded in Task 12)**

`apps/cookie-manager/entrypoints/background.ts`:
```ts
export default defineBackground(() => {
  // Open the side panel when the toolbar icon is clicked (no manifest field for this).
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error('[wafer] setPanelBehavior failed', err));
});
```

`apps/cookie-manager/entrypoints/sidepanel/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Wafer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

`apps/cookie-manager/entrypoints/sidepanel/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`apps/cookie-manager/entrypoints/sidepanel/App.tsx`:
```tsx
export function App() {
  return <main style={{ font: '13px system-ui', padding: 12 }}>Wafer</main>;
}
```

- [ ] **Step 4: Build and verify it loads**

Run: `pnpm install && pnpm --filter @wafer/cookie-manager build`
Expected: build succeeds; `apps/cookie-manager/.output/chrome-mv3/` contains `manifest.json` with `name: "Wafer"`, no `tabs` permission, and `optional_host_permissions: ["<all_urls>"]`.

Manual load: `chrome://extensions` → Developer mode → Load unpacked → select `.output/chrome-mv3`. Click the Wafer toolbar icon → the side panel opens showing "Wafer".

- [ ] **Step 5: Commit**

```bash
git add apps/cookie-manager
git commit -m "feat: scaffold WXT extension with minimal MV3 manifest + side panel"
```

---

## Task 3: Cookie types + validation library (TDD)

**Files:**
- Create: `apps/cookie-manager/lib/cookie-types.ts`
- Create: `apps/cookie-manager/lib/cookies/validation.ts`
- Test: `apps/cookie-manager/lib/cookies/validation.test.ts`
- Create: `apps/cookie-manager/vitest.config.ts`

**Interfaces:**
- Produces:
  - `type SameSite = 'no_restriction' | 'lax' | 'strict' | 'unspecified'`
  - `interface PartitionKey { topLevelSite?: string; hasCrossSiteAncestor?: boolean }`
  - `interface CookieAttrs { name: string; value: string; domain: string; path: string; secure: boolean; httpOnly: boolean; sameSite: SameSite; hostOnly: boolean; expirationDate?: number; storeId?: string; partitionKey?: PartitionKey }`
  - `interface ValidationIssue { field: keyof CookieAttrs | 'name'; message: string }`
  - `function validateCookie(c: CookieAttrs, ctx: { isSecureOrigin: boolean }): ValidationIssue[]`
  - constants `NAME_VALUE_MAX = 4096`, `ATTR_VALUE_MAX = 1024`, `SOFT_DOMAIN_COOKIE_WARN = 180`

- [ ] **Step 1: Add the Vitest config**

`apps/cookie-manager/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
});
```

- [ ] **Step 2: Write the failing tests**

`apps/cookie-manager/lib/cookies/validation.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { validateCookie, NAME_VALUE_MAX } from './validation';
import type { CookieAttrs } from '../cookie-types';

function base(overrides: Partial<CookieAttrs> = {}): CookieAttrs {
  return {
    name: 'sid',
    value: 'abc',
    domain: 'example.com',
    path: '/',
    secure: true,
    httpOnly: false,
    sameSite: 'lax',
    hostOnly: false,
    ...overrides,
  };
}

describe('validateCookie', () => {
  it('accepts a normal cookie on a secure origin', () => {
    expect(validateCookie(base(), { isSecureOrigin: true })).toEqual([]);
  });

  it('rejects __Host- without Path=/', () => {
    const issues = validateCookie(base({ name: '__Host-sid', hostOnly: true, path: '/app' }), { isSecureOrigin: true });
    expect(issues.map((i) => i.field)).toContain('path');
  });

  it('rejects __Host- that is not host-only (has Domain)', () => {
    const issues = validateCookie(base({ name: '__Host-sid', hostOnly: false, path: '/' }), { isSecureOrigin: true });
    expect(issues.some((i) => i.field === 'domain')).toBe(true);
  });

  it('rejects __Host- without Secure', () => {
    const issues = validateCookie(base({ name: '__Host-sid', hostOnly: true, path: '/', secure: false }), { isSecureOrigin: true });
    expect(issues.some((i) => i.field === 'secure')).toBe(true);
  });

  it('rejects __Secure- without Secure', () => {
    const issues = validateCookie(base({ name: '__Secure-sid', secure: false }), { isSecureOrigin: true });
    expect(issues.some((i) => i.field === 'secure')).toBe(true);
  });

  it('rejects __Secure- on a non-secure origin', () => {
    const issues = validateCookie(base({ name: '__Secure-sid' }), { isSecureOrigin: false });
    expect(issues.some((i) => i.field === 'name')).toBe(true);
  });

  it('rejects SameSite=None without Secure', () => {
    const issues = validateCookie(base({ sameSite: 'no_restriction', secure: false }), { isSecureOrigin: true });
    expect(issues.some((i) => i.field === 'sameSite')).toBe(true);
  });

  it('rejects name+value over the byte limit', () => {
    const issues = validateCookie(base({ value: 'x'.repeat(NAME_VALUE_MAX) }), { isSecureOrigin: true });
    expect(issues.some((i) => i.field === 'value')).toBe(true);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm --filter @wafer/cookie-manager test`
Expected: FAIL — `validation.ts` / `cookie-types.ts` not found.

- [ ] **Step 4: Write the types + implementation**

`apps/cookie-manager/lib/cookie-types.ts`:
```ts
export type SameSite = 'no_restriction' | 'lax' | 'strict' | 'unspecified';

export interface PartitionKey {
  topLevelSite?: string;
  hasCrossSiteAncestor?: boolean;
}

export interface CookieAttrs {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: SameSite;
  /** true = no Domain attribute (locked to the exact host). */
  hostOnly: boolean;
  /** absent = session cookie. */
  expirationDate?: number;
  storeId?: string;
  partitionKey?: PartitionKey;
}
```

`apps/cookie-manager/lib/cookies/validation.ts`:
```ts
import type { CookieAttrs } from '../cookie-types';

export const NAME_VALUE_MAX = 4096;
export const ATTR_VALUE_MAX = 1024;
export const SOFT_DOMAIN_COOKIE_WARN = 180;

export interface ValidationIssue {
  field: keyof CookieAttrs | 'name';
  message: string;
}

const byteLen = (s: string): number => new TextEncoder().encode(s).length;

export function validateCookie(c: CookieAttrs, ctx: { isSecureOrigin: boolean }): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (byteLen(c.name) + byteLen(c.value) > NAME_VALUE_MAX) {
    issues.push({ field: 'value', message: `name + value exceeds ${NAME_VALUE_MAX} bytes` });
  }

  if (c.name.startsWith('__Secure-')) {
    if (!c.secure) issues.push({ field: 'secure', message: '__Secure- cookies must be Secure' });
    if (!ctx.isSecureOrigin) issues.push({ field: 'name', message: '__Secure- requires an HTTPS origin' });
  }

  if (c.name.startsWith('__Host-')) {
    if (!c.secure) issues.push({ field: 'secure', message: '__Host- cookies must be Secure' });
    if (c.path !== '/') issues.push({ field: 'path', message: '__Host- cookies must have Path=/' });
    if (!c.hostOnly) issues.push({ field: 'domain', message: '__Host- cookies must not set a Domain' });
  }

  if (c.sameSite === 'no_restriction' && !c.secure) {
    issues.push({ field: 'sameSite', message: 'SameSite=None requires Secure' });
  }

  return issues;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @wafer/cookie-manager test`
Expected: PASS (8 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/cookie-manager/lib/cookie-types.ts apps/cookie-manager/lib/cookies/validation.ts apps/cookie-manager/lib/cookies/validation.test.ts apps/cookie-manager/vitest.config.ts
git commit -m "feat: cookie types + prefix/size/samesite validation (TDD)"
```

---

## Task 4: Cookie key + URL construction (TDD)

**Files:**
- Create: `apps/cookie-manager/lib/cookies/keys.ts`
- Test: `apps/cookie-manager/lib/cookies/keys.test.ts`

**Interfaces:**
- Consumes: `CookieAttrs`, `PartitionKey` from `../cookie-types`.
- Produces:
  - `function cookieId(c: Pick<CookieAttrs, 'name' | 'domain' | 'path' | 'storeId' | 'partitionKey'>): string`
  - `function cookieUrl(c: Pick<CookieAttrs, 'domain' | 'path' | 'secure'>): string`

- [ ] **Step 1: Write the failing tests**

`apps/cookie-manager/lib/cookies/keys.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { cookieId, cookieUrl } from './keys';

describe('cookieUrl', () => {
  it('builds an https url and strips a leading dot from the domain', () => {
    expect(cookieUrl({ domain: '.example.com', path: '/app', secure: true })).toBe('https://example.com/app');
  });
  it('builds an http url when not secure', () => {
    expect(cookieUrl({ domain: 'example.com', path: '/', secure: false })).toBe('http://example.com/');
  });
});

describe('cookieId', () => {
  it('is stable and distinguishes name/domain/path/store/partition', () => {
    const a = cookieId({ name: 'sid', domain: 'example.com', path: '/', storeId: '0' });
    const b = cookieId({ name: 'sid', domain: 'example.com', path: '/', storeId: '0' });
    const c = cookieId({ name: 'sid', domain: 'example.com', path: '/app', storeId: '0' });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
  it('incorporates the partition top-level site', () => {
    const unpart = cookieId({ name: 'sid', domain: 'example.com', path: '/' });
    const part = cookieId({ name: 'sid', domain: 'example.com', path: '/', partitionKey: { topLevelSite: 'https://top.example' } });
    expect(unpart).not.toBe(part);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @wafer/cookie-manager test`
Expected: FAIL — `keys.ts` not found.

- [ ] **Step 3: Implement**

`apps/cookie-manager/lib/cookies/keys.ts`:
```ts
import type { CookieAttrs } from '../cookie-types';

export function cookieUrl(c: Pick<CookieAttrs, 'domain' | 'path' | 'secure'>): string {
  const host = c.domain.replace(/^\./, '');
  return `${c.secure ? 'https' : 'http'}://${host}${c.path}`;
}

export function cookieId(
  c: Pick<CookieAttrs, 'name' | 'domain' | 'path' | 'storeId' | 'partitionKey'>,
): string {
  const store = c.storeId ?? '0';
  const top = c.partitionKey?.topLevelSite ?? '';
  return [store, top, c.domain, c.path, c.name].join('|');
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @wafer/cookie-manager test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cookie-manager/lib/cookies/keys.ts apps/cookie-manager/lib/cookies/keys.test.ts
git commit -m "feat: cookie identity + url construction (TDD)"
```

---

## Task 5: onChanged debouncer (TDD)

**Files:**
- Create: `apps/cookie-manager/lib/debounce.ts`
- Test: `apps/cookie-manager/lib/debounce.test.ts`

**Interfaces:**
- Produces: `function createDebouncer(fn: () => void, delayMs: number): { trigger: () => void; cancel: () => void }` — collapses a burst of `trigger()` calls (e.g. the `overwrite`+`explicit` double-fire) into one `fn()` call.

- [ ] **Step 1: Write the failing test (fake timers)**

`apps/cookie-manager/lib/debounce.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDebouncer } from './debounce';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('createDebouncer', () => {
  it('collapses a burst into a single call', () => {
    const fn = vi.fn();
    const d = createDebouncer(fn, 50);
    d.trigger();
    d.trigger();
    d.trigger();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancel() prevents a pending call', () => {
    const fn = vi.fn();
    const d = createDebouncer(fn, 50);
    d.trigger();
    d.cancel();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @wafer/cookie-manager test`
Expected: FAIL — `debounce.ts` not found.

- [ ] **Step 3: Implement**

`apps/cookie-manager/lib/debounce.ts`:
```ts
export function createDebouncer(fn: () => void, delayMs: number): { trigger: () => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const cancel = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
  const trigger = (): void => {
    cancel();
    timer = setTimeout(() => {
      timer = null;
      fn();
    }, delayMs);
  };
  return { trigger, cancel };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @wafer/cookie-manager test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cookie-manager/lib/debounce.ts apps/cookie-manager/lib/debounce.test.ts
git commit -m "feat: debouncer to coalesce cookies.onChanged double-fire (TDD)"
```

---

## Task 6: Permissions module

**Files:**
- Create: `apps/cookie-manager/lib/permissions.ts`

**Interfaces:**
- Produces:
  - `function hasAllUrlsPermission(): Promise<boolean>`
  - `function requestAllUrls(): Promise<boolean>` — MUST be called synchronously from a user-gesture handler.
  - `function onPermissionsChanged(cb: (granted: boolean) => void): () => void` — subscribe; returns an unsubscribe fn.

- [ ] **Step 1: Implement (no unit test — depends on `chrome.permissions`; verified via the panel in Task 9 and E2E in Milestone 5)**

`apps/cookie-manager/lib/permissions.ts`:
```ts
const ALL_URLS: chrome.permissions.Permissions = { origins: ['<all_urls>'] };

export function hasAllUrlsPermission(): Promise<boolean> {
  return chrome.permissions.contains(ALL_URLS);
}

/** Must run synchronously inside a user gesture — do not await anything before calling this. */
export function requestAllUrls(): Promise<boolean> {
  return chrome.permissions.request(ALL_URLS);
}

export function onPermissionsChanged(cb: (granted: boolean) => void): () => void {
  const handler = (): void => {
    void hasAllUrlsPermission().then(cb);
  };
  chrome.permissions.onAdded.addListener(handler);
  chrome.permissions.onRemoved.addListener(handler);
  return () => {
    chrome.permissions.onAdded.removeListener(handler);
    chrome.permissions.onRemoved.removeListener(handler);
  };
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter @wafer/cookie-manager exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/cookie-manager/lib/permissions.ts
git commit -m "feat: <all_urls> permission request/check/subscribe helpers"
```

---

## Task 7: chrome.cookies read wrapper

**Files:**
- Create: `apps/cookie-manager/lib/cookies/read.ts`

**Interfaces:**
- Consumes: `CookieAttrs`, `SameSite` from `../cookie-types`.
- Produces:
  - `function fromChrome(c: chrome.cookies.Cookie): CookieAttrs`
  - `function getCookiesForUrl(url: string): Promise<CookieAttrs[]>`
  - `function getActiveTabUrl(): Promise<string | null>` — reads the active tab's URL (works once `<all_urls>` is granted; returns null otherwise).

- [ ] **Step 1: Implement**

`apps/cookie-manager/lib/cookies/read.ts`:
```ts
import type { CookieAttrs, SameSite } from '../cookie-types';

export function fromChrome(c: chrome.cookies.Cookie): CookieAttrs {
  return {
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: (c.sameSite ?? 'unspecified') as SameSite,
    hostOnly: c.hostOnly,
    expirationDate: c.expirationDate,
    storeId: c.storeId,
    partitionKey: c.partitionKey
      ? { topLevelSite: c.partitionKey.topLevelSite, hasCrossSiteAncestor: c.partitionKey.hasCrossSiteAncestor }
      : undefined,
  };
}

export async function getCookiesForUrl(url: string): Promise<CookieAttrs[]> {
  const cookies = await chrome.cookies.getAll({ url });
  return cookies.map(fromChrome);
}

export async function getActiveTabUrl(): Promise<string | null> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  // tab.url is present only once <all_urls> host permission is granted (we don't declare "tabs").
  return tab?.url ?? null;
}
```

> Note: `chrome.tabs.query` is available without the `tabs` permission; `tab.url` is populated only when the extension holds a matching host permission (here, granted `<all_urls>`). Before the grant it is `undefined` → we return `null` and the panel shows the Grant-access state.

- [ ] **Step 2: Type-check**

Run: `pnpm --filter @wafer/cookie-manager exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/cookie-manager/lib/cookies/read.ts
git commit -m "feat: chrome.cookies read wrapper + active-tab url"
```

---

## Task 8: Zustand cookies store (storage-backed)

**Files:**
- Create: `apps/cookie-manager/stores/cookies-store.ts`

**Interfaces:**
- Consumes: `getActiveTabUrl`, `getCookiesForUrl` from `../lib/cookies/read`; `hasAllUrlsPermission` from `../lib/permissions`.
- Produces a Zustand store with state `{ granted: boolean; activeUrl: string | null; cookies: CookieAttrs[]; query: string; loading: boolean }` and actions `refresh(): Promise<void>`, `setQuery(q: string): void`, `setGranted(g: boolean): void`. Exports `useCookiesStore` (React hook) and `cookiesStore` (vanilla store).

- [ ] **Step 1: Implement (vanilla store + React binding; last-refresh cached to `chrome.storage.session`)**

`apps/cookie-manager/stores/cookies-store.ts`:
```ts
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { CookieAttrs } from '../lib/cookie-types';
import { getActiveTabUrl, getCookiesForUrl } from '../lib/cookies/read';
import { hasAllUrlsPermission } from '../lib/permissions';

interface CookiesState {
  granted: boolean;
  activeUrl: string | null;
  cookies: CookieAttrs[];
  query: string;
  loading: boolean;
  setQuery: (q: string) => void;
  setGranted: (g: boolean) => void;
  refresh: () => Promise<void>;
}

const SESSION_KEY = 'wafer:lastCookies';

export const cookiesStore = createStore<CookiesState>((set, get) => ({
  granted: false,
  activeUrl: null,
  cookies: [],
  query: '',
  loading: false,
  setQuery: (q) => set({ query: q }),
  setGranted: (granted) => set({ granted }),
  refresh: async () => {
    set({ loading: true });
    try {
      const granted = await hasAllUrlsPermission();
      if (!granted) {
        set({ granted: false, activeUrl: null, cookies: [], loading: false });
        return;
      }
      const activeUrl = await getActiveTabUrl();
      const cookies = activeUrl ? await getCookiesForUrl(activeUrl) : [];
      set({ granted: true, activeUrl, cookies, loading: false });
      // chrome.storage is the source of truth for cross-context rehydrate.
      await chrome.storage.session.set({ [SESSION_KEY]: { activeUrl, cookies } });
    } catch (err) {
      console.error('[wafer] refresh failed', err);
      set({ loading: false });
    }
  },
}));

/** Rehydrate synchronously-ish from session storage so a remounted panel shows last data instantly. */
export async function hydrateFromStorage(): Promise<void> {
  const stored = await chrome.storage.session.get(SESSION_KEY);
  const snap = stored[SESSION_KEY] as { activeUrl: string | null; cookies: CookieAttrs[] } | undefined;
  if (snap) cookiesStore.setState({ activeUrl: snap.activeUrl, cookies: snap.cookies });
}

export function useCookiesStore<T>(selector: (s: CookiesState) => T): T {
  return useStore(cookiesStore, selector);
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter @wafer/cookie-manager exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/cookie-manager/stores/cookies-store.ts
git commit -m "feat: storage-backed zustand cookies store"
```

---

## Task 9: Grant-access empty state + first-run flow

**Files:**
- Create: `apps/cookie-manager/components/GrantAccess.tsx`
- Modify: `apps/cookie-manager/entrypoints/sidepanel/App.tsx`

**Interfaces:**
- Consumes: `requestAllUrls`, `onPermissionsChanged` from `../../lib/permissions`; `useCookiesStore`, `cookiesStore`, `hydrateFromStorage` from `../../stores/cookies-store`.
- Produces: `<GrantAccess onGrant={() => void} />`.

- [ ] **Step 1: Create the GrantAccess component (the grant click is the user gesture)**

`apps/cookie-manager/components/GrantAccess.tsx`:
```tsx
import { requestAllUrls } from '../lib/permissions';

export function GrantAccess({ onGrant }: { onGrant: () => void }) {
  // requestAllUrls() is called synchronously in the click handler — no await before it.
  const handleClick = (): void => {
    void requestAllUrls().then((granted) => {
      if (granted) onGrant();
    });
  };
  return (
    <div style={{ padding: 16, font: '13px system-ui' }}>
      <h1 style={{ fontSize: 15, margin: '0 0 8px' }}>Wafer</h1>
      <p style={{ margin: '0 0 12px', color: '#555' }}>
        Grant access to read cookies for this site. Wafer requests no site access until you allow it.
      </p>
      <button type="button" onClick={handleClick} style={{ padding: '6px 12px', cursor: 'pointer' }}>
        Grant access
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Wire App to switch on grant state + subscribe to permission + tab changes**

`apps/cookie-manager/entrypoints/sidepanel/App.tsx`:
```tsx
import { useEffect } from 'react';
import { GrantAccess } from '../../components/GrantAccess';
import { useCookiesStore, cookiesStore, hydrateFromStorage } from '../../stores/cookies-store';
import { onPermissionsChanged } from '../../lib/permissions';

export function App() {
  const granted = useCookiesStore((s) => s.granted);
  const loading = useCookiesStore((s) => s.loading);
  const activeUrl = useCookiesStore((s) => s.activeUrl);
  const cookies = useCookiesStore((s) => s.cookies);

  useEffect(() => {
    void hydrateFromStorage().then(() => cookiesStore.getState().refresh());
    const unsub = onPermissionsChanged(() => void cookiesStore.getState().refresh());
    const onActivated = (): void => void cookiesStore.getState().refresh();
    chrome.tabs.onActivated.addListener(onActivated);
    return () => {
      unsub();
      chrome.tabs.onActivated.removeListener(onActivated);
    };
  }, []);

  if (!granted) return <GrantAccess onGrant={() => void cookiesStore.getState().refresh()} />;

  return (
    <main style={{ font: '13px system-ui', padding: 12 }}>
      <div style={{ color: '#555', marginBottom: 8 }}>
        {loading ? 'Loading…' : `${cookies.length} cookies · ${activeUrl ?? 'unknown site'}`}
      </div>
      {/* CookieList wired in Task 10 */}
    </main>
  );
}
```

- [ ] **Step 3: Verify the grant flow in a browser**

Run: `pnpm --filter @wafer/cookie-manager dev`
Load the dev build unpacked, open the side panel on `https://example.com`. Expected: "Grant access" shown; clicking it triggers Chrome's host-permission prompt; after allowing, the panel switches to the "N cookies · https://example.com" header.

- [ ] **Step 4: Commit**

```bash
git add apps/cookie-manager/components/GrantAccess.tsx apps/cookie-manager/entrypoints/sidepanel/App.tsx
git commit -m "feat: grant-access empty state + first-run permission flow"
```

---

## Task 10: Virtualized cookie list

**Files:**
- Create: `apps/cookie-manager/components/CookieRow.tsx`, `apps/cookie-manager/components/CookieList.tsx`
- Modify: `apps/cookie-manager/entrypoints/sidepanel/App.tsx`

**Interfaces:**
- Consumes: `CookieAttrs`; `useCookiesStore`; `@tanstack/react-virtual`.
- Produces: `<CookieList cookies={CookieAttrs[]} />`, `<CookieRow cookie={CookieAttrs} />`.

- [ ] **Step 1: Create the row (value rendered as a text node — XSS-safe)**

`apps/cookie-manager/components/CookieRow.tsx`:
```tsx
import type { CookieAttrs } from '../lib/cookie-types';

export function CookieRow({ cookie }: { cookie: CookieAttrs }) {
  return (
    <div style={{ padding: '6px 8px', borderBottom: '1px solid #eee', overflow: 'hidden' }}>
      <div style={{ fontWeight: 600 }}>{cookie.name}</div>
      {/* value is attacker-controlled → text node only, never HTML */}
      <div style={{ color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {cookie.value}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the virtualized list**

`apps/cookie-manager/components/CookieList.tsx`:
```tsx
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { CookieAttrs } from '../lib/cookie-types';
import { cookieId } from '../lib/cookies/keys';
import { CookieRow } from './CookieRow';

export function CookieList({ cookies }: { cookies: CookieAttrs[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: cookies.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 8,
    useFlushSync: false, // avoids flushSync scroll warnings under React 19
  });

  if (cookies.length === 0) return <div style={{ color: '#888', padding: 8 }}>No cookies.</div>;

  return (
    <div ref={parentRef} style={{ height: 'calc(100vh - 90px)', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((item) => {
          const cookie = cookies[item.index]!;
          return (
            <div
              key={cookieId(cookie)}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${item.start}px)` }}
            >
              <CookieRow cookie={cookie} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Render the list in App**

In `apps/cookie-manager/entrypoints/sidepanel/App.tsx`, add the import and replace the `{/* CookieList wired in Task 10 */}` comment:
```tsx
import { CookieList } from '../../components/CookieList';
```
```tsx
      <CookieList cookies={cookies} />
```

- [ ] **Step 4: Verify in the browser**

Run: `pnpm --filter @wafer/cookie-manager dev`
On a cookie-rich site (e.g. after logging into any site), open the panel and grant access. Expected: cookies list renders and scrolls smoothly.

- [ ] **Step 5: Commit**

```bash
git add apps/cookie-manager/components/CookieRow.tsx apps/cookie-manager/components/CookieList.tsx apps/cookie-manager/entrypoints/sidepanel/App.tsx
git commit -m "feat: virtualized cookie list (XSS-safe rows)"
```

---

## Task 11: Search/filter + XSS-safe render test

**Files:**
- Create: `apps/cookie-manager/components/SearchBar.tsx`
- Create: `apps/cookie-manager/components/CookieRow.test.tsx`
- Modify: `apps/cookie-manager/entrypoints/sidepanel/App.tsx`
- Modify: `apps/cookie-manager/vitest.config.ts` (add jsdom for the component test)

**Interfaces:**
- Consumes: `useCookiesStore`, `cookiesStore`.
- Produces: `<SearchBar />`; a filtered `cookies` view in App.

- [ ] **Step 1: Add jsdom + testing-library to dev deps and vitest config**

Append to `apps/cookie-manager/package.json` devDependencies:
```json
    "jsdom": "^25.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/dom": "^10.4.0"
```
Run: `pnpm install`

Update `apps/cookie-manager/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
    environmentMatchGlobs: [['components/**', 'jsdom']],
  },
});
```
And extend `include` to pick up the component test:
```ts
    include: ['lib/**/*.test.ts', 'components/**/*.test.tsx'],
```

- [ ] **Step 2: Write the failing XSS-safe render test**

`apps/cookie-manager/components/CookieRow.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CookieRow } from './CookieRow';
import type { CookieAttrs } from '../lib/cookie-types';

const malicious: CookieAttrs = {
  name: 'x',
  value: '<img src=x onerror="window.__pwned=1">',
  domain: 'example.com',
  path: '/',
  secure: true,
  httpOnly: false,
  sameSite: 'lax',
  hostOnly: false,
};

describe('CookieRow', () => {
  it('renders a malicious value as literal text, not HTML', () => {
    const { container } = render(<CookieRow cookie={malicious} />);
    // No <img> element should be created from the value.
    expect(container.querySelector('img')).toBeNull();
    // The literal string is present as text.
    expect(container.textContent).toContain('<img src=x onerror=');
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run to verify it passes immediately (React escapes by default)**

Run: `pnpm --filter @wafer/cookie-manager test`
Expected: PASS — this test *locks in* the XSS-safe behavior so a future regression (e.g. someone using `dangerouslySetInnerHTML`) fails CI.

- [ ] **Step 4: Create the SearchBar and wire filtering**

`apps/cookie-manager/components/SearchBar.tsx`:
```tsx
import { useCookiesStore, cookiesStore } from '../stores/cookies-store';

export function SearchBar() {
  const query = useCookiesStore((s) => s.query);
  return (
    <input
      type="search"
      value={query}
      onChange={(e) => cookiesStore.getState().setQuery(e.target.value)}
      placeholder="Search name, domain, value…"
      style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box', marginBottom: 8 }}
    />
  );
}
```

In `App.tsx`, import SearchBar and compute the filtered list:
```tsx
import { SearchBar } from '../../components/SearchBar';
```
```tsx
  const query = useCookiesStore((s) => s.query);
  const filtered = query
    ? cookies.filter((c) => {
        const q = query.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.domain.toLowerCase().includes(q) || c.value.toLowerCase().includes(q);
      })
    : cookies;
```
Render `<SearchBar />` above the header count and pass `filtered` to `<CookieList cookies={filtered} />`; update the count to `filtered.length`.

- [ ] **Step 5: Run tests + verify search in browser**

Run: `pnpm --filter @wafer/cookie-manager test`
Expected: PASS.
Browser: typing in the search box narrows the visible cookies.

- [ ] **Step 6: Commit**

```bash
git add apps/cookie-manager/components/SearchBar.tsx apps/cookie-manager/components/CookieRow.test.tsx apps/cookie-manager/entrypoints/sidepanel/App.tsx apps/cookie-manager/vitest.config.ts apps/cookie-manager/package.json
git commit -m "feat: search/filter + regression test for XSS-safe value rendering"
```

---

## Task 12: Background onChanged relay + live refresh

**Files:**
- Modify: `apps/cookie-manager/entrypoints/background.ts`
- Modify: `apps/cookie-manager/entrypoints/sidepanel/App.tsx`

**Interfaces:**
- Consumes: `createDebouncer` from `../lib/debounce`.
- Produces: a runtime message `{ type: 'wafer:cookies-changed' }` broadcast by the SW; the panel listens and refreshes.

- [ ] **Step 1: Broadcast a debounced change signal from the SW**

`apps/cookie-manager/entrypoints/background.ts`:
```ts
import { createDebouncer } from '../lib/debounce';

export default defineBackground(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error('[wafer] setPanelBehavior failed', err));

  // Coalesce the remove-then-write double-fire ("overwrite" then "explicit") into one signal.
  const notify = createDebouncer(() => {
    chrome.runtime.sendMessage({ type: 'wafer:cookies-changed' }).catch(() => {
      // No receiver (panel closed) — safe to ignore.
    });
  }, 120);

  chrome.cookies.onChanged.addListener(() => notify.trigger());
});
```

- [ ] **Step 2: Refresh the panel on the change signal**

In `App.tsx`, extend the `useEffect` to listen for the runtime message:
```tsx
    const onMessage = (msg: unknown): void => {
      if (typeof msg === 'object' && msg !== null && (msg as { type?: string }).type === 'wafer:cookies-changed') {
        void cookiesStore.getState().refresh();
      }
    };
    chrome.runtime.onMessage.addListener(onMessage);
```
And add `chrome.runtime.onMessage.removeListener(onMessage);` to the cleanup return.

- [ ] **Step 3: Verify live refresh**

Run: `pnpm --filter @wafer/cookie-manager dev`
With the panel open on a site, in DevTools console run `document.cookie = "watched=1"`. Expected: the list updates within ~120ms without a manual refresh, and a single cookie edit does not cause a visible double-flash (debounce working).

- [ ] **Step 4: Type-check, full test run, commit**

Run: `pnpm --filter @wafer/cookie-manager exec tsc --noEmit && pnpm --filter @wafer/cookie-manager test`
Expected: no type errors; all tests PASS.
```bash
git add apps/cookie-manager/entrypoints/background.ts apps/cookie-manager/entrypoints/sidepanel/App.tsx
git commit -m "feat: SW cookies.onChanged relay with debounced live refresh"
```

---

## Milestone 1 — Self-Review (spec coverage)

- Minimal manifest, no `tabs`, `optional_host_permissions` → Tasks 2, 6, 9. ✅
- Runtime grant inside a user gesture → Task 9 (Step 1). ✅
- Read cookies for the active domain; `tab.url` via host permission (no `tabs`) → Task 7. ✅
- Prefix/SameSite/size validation → Task 3 (wired into editing in Milestone 2). ✅
- CHIPS `hasCrossSiteAncestor` carried through the model → Tasks 3, 7. ✅ (inspector UI = Milestone 3)
- Virtualized list, `useFlushSync:false` → Task 10. ✅
- XSS-safe text-node rendering + regression test → Tasks 10, 11. ✅
- `chrome.storage` as source of truth, rehydrate → Task 8. ✅
- SW registers listeners at top level; debounced onChanged double-fire → Tasks 5, 12. ✅
- `setPanelBehavior({openPanelOnActionClick})` → Tasks 2, 12. ✅

**Deferred to later milestones (by design):** add/edit/delete UI + validation wiring (M2); import/export + dark mode + CHIPS inspector (M3); ExtPay + entitlement/grace/gating + local profiles + encryption (M4); Vitest fakeBrowser suite + Playwright E2E (`channel:'chromium'` headless) + CI + SW-termination test (M5); store-prep artifacts + trader checklist (M6).

---

## Milestone Roadmap (full MVP)

| # | Milestone | Delivers | Maps to doc |
|---|---|---|---|
| **M1** | Foundation & cookie listing | *(this plan)* monorepo, manifest, permission flow, read-only searchable XSS-safe list | Week 1–2 |
| **M2** | Cookie CRUD | add/edit/delete with validation, SameSite/secure/expiry controls, `set()`/`remove()` write wrapper, host-only handling | Week 2 |
| **M3** | Import/export · dark mode · CHIPS | Blob+anchor JSON/Netscape export, import round-trip, `ui-kit` dark mode, CHIPS partition inspector (`getPartitionKey`) | Week 3 |
| **M4** | Pro layer | `packages/pay` ExtPay wrapper (dev/mock), entitlement cache + 14-day grace + alarm re-check, dynamic-import gating, named local profiles + opt-in AES-GCM encryption | Week 4 |
| **M5** | Hardening & tests | Vitest fakeBrowser suite, Playwright E2E (`channel:'chromium'` headless), SW-termination test, redaction audit, threat-model doc, GitHub Actions CI | Week 5 |
| **M6** | Store-prep artifacts | privacy policy + Limited Use, data-use answers, permission justifications, listing copy, 1280×800 screenshots, icon/promo tiles, EU-DSA trader checklist | Week 6 |

Each subsequent milestone gets its own plan written just-in-time (informed by what M1 surfaces), following this same TDD/commit structure.
