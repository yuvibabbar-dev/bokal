# Third-party notices

Wafer is licensed under **GPL-3.0-or-later** (see [`LICENSE`](LICENSE)). It bundles or depends on
the third-party software below, each under its own license.

## Bundled into the shipped extension

| Package | License | Notes |
|---|---|---|
| [`extpay`](https://github.com/Glench/ExtPay) | **AGPL-3.0-or-later** (see note) | Payments/licensing. Bundled into the extension. **This is the copyleft dependency that determines Wafer's own license** — see [`docs/licensing-notes.md`](docs/licensing-notes.md). |
| [`react`](https://github.com/facebook/react), `react-dom` | MIT | UI runtime. |
| [`zustand`](https://github.com/pmndrs/zustand) | MIT | State stores. |
| [`@tanstack/react-virtual`](https://github.com/TanStack/virtual) | MIT | List virtualization. |

### Note on ExtPay's license

ExtPay declares its license inconsistently:

- `package.json` → `AGPL-3.0-or-later` (this is what tooling reads)
- its bundled `LICENSE` file → first line reads `LGPL-3.0`
- its source header comment → "AGPLv3 licensed"

Wafer treats it as **AGPL-3.0-or-later** (the strictest of the three, and the one declared in
`package.json`). Because AGPL code is compiled into the distributed extension, the combined work is
conveyed under GPL-compatible copyleft terms — which is why Wafer is GPL-3.0-or-later rather than a
permissive license. If the ExtPay author clarifies that it is genuinely LGPL-3.0, Wafer would regain
the option of a permissive license.

## Build-time only (not shipped in the extension)

`wxt`, `vite`, `typescript`, `vitest`, `@playwright/test`, `jsdom`, `fake-indexeddb`,
`@testing-library/*` — each under its own license (MIT / Apache-2.0 / BSD). These are development
dependencies and are not distributed as part of the extension package.

---

Run `pnpm licenses list` for the full, current dependency-license inventory.
