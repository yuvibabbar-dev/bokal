# Contributing to Wafer

Thanks for your interest. Wafer's whole value is being a cookie manager people can *trust*, so the
bar for changes is: **the code must keep every privacy and permission claim literally true.**

## Setup

- **Node ≥ 24**, **pnpm 9.9.0** (`corepack enable`).
- `pnpm install`
- `pnpm --filter @wafer/cookie-manager dev` — WXT dev server; load
  `apps/cookie-manager/.output/chrome-mv3` unpacked at `chrome://extensions`.

## Before you open a PR

Run the full local gate (the same checks CI runs):

```bash
pnpm -r test
pnpm --filter @wafer/cookie-manager exec tsc --noEmit
pnpm --filter @wafer/cookie-manager build
pnpm --filter @wafer/cookie-manager e2e
```

New behavior needs a test. This project is built test-first — write a failing test, watch it fail,
then make it pass.

## Invariants — do not regress these

These are the guarantees the store copy and threat model depend on. A change that breaks one is a
change that makes Wafer's marketing a lie, so it will not be merged.

1. **No `tabs` permission; no install-time `host_permissions`.** Host access is
   `optional_host_permissions: ['<all_urls>']`, requested at runtime. The `WAFER_E2E=1` build adds
   `host_permissions` **for E2E only** — the published build must never ship it (enforced by the
   `wxt.config.ts` env gate + a manifest check).
2. **The Pro UI stays code-split and lazy.** `ProfilesPanel` loads via dynamic `import()` only when
   entitled and must stay a separate chunk — the always-loaded bundle must contain no Pro logic.
   Don't add a static import of it or of `lib/pay` into the always-loaded path. (No CI guard
   enforces this chunk split yet — see the follow-up in the session report.)
3. **Free users make zero network calls / zero off-device writes.** All ExtPay contact is gated
   behind Pro engagement (`lib/pay/engagement.ts`). Don't construct ExtPay at service-worker top
   level or on a free path.
4. **Never log cookie values or passphrases.** Enforced by `lib/security/redaction.test.ts` (runs
   in CI; scans the app + `@wafer/ui-kit`).
5. **Cookie values render as text nodes only** — never `dangerouslySetInnerHTML`. An XSS regression
   test locks this.
6. **Profile encryption decrypts before removing** (AES-GCM + PBKDF2 600k), so a wrong passphrase
   can never wipe cookies. `chrome.storage` (local/session) is the source of truth; the theme pref
   is `storage.local` (deliberately **not** `sync`, so "nothing leaves your device" holds).
7. **`refresh()` seq-guards** in `cookies-store` and `entitlement-store` must stay — compute state
   before the `if (seq !== …) return;` check.

## Development workflow

Each milestone has been built the same way (see [`docs/build-log.md`](docs/build-log.md)):

1. Branch per topic: `git checkout -b feat/<topic>` off `master`.
2. Plan under `docs/superpowers/plans/` when the change is non-trivial.
3. TDD each task; keep the suite green.
4. A whole-branch review before merging; fix Important/Critical findings.
5. Merge `--no-ff`, delete the branch.

## Commit style

Conventional-commit-ish prefixes are used throughout history: `feat:`, `fix:`, `test:`, `docs:`,
`chore:`. Keep the subject imperative and under ~72 chars; explain the "why" in the body.
