# Licensing notes

**Status: DECIDED (founder approved 2026-07-14) — Wafer is licensed `GPL-3.0-or-later`.**
`LICENSE` (canonical FSF GPL-3.0 text) is committed; `license` is set in every `package.json`;
dependency licenses are inventoried in [`THIRD-PARTY-NOTICES.md`](../THIRD-PARTY-NOTICES.md).
This closes the "open source, every line published" launch blocker.

The record of *why* follows, because the choice was constrained by a dependency rather than free.

## The constraint: ExtPay is copyleft

Wafer bundles [`extpay`](https://github.com/Glench/ExtPay) (payments) directly into the shipped
extension bundle. ExtPay's own licensing is **internally inconsistent**, which is itself worth
noting:

| Source | Declared license |
|---|---|
| `extpay/package.json` `"license"` field | `AGPL-3.0-or-later` |
| `extpay/LICENSE` file (first line) | `LGPL-3.0` |
| `ExtPay.module.js` source header comment | "AGPLv3 licensed" |

Two of three signals (and the one tooling reads — `package.json`) say **AGPL-3.0**, the strongest
copyleft. Treat it as AGPL-3.0-or-later unless the ExtPay author clarifies otherwise.

## Why this matters

Because ExtPay is **compiled/bundled into the distributed extension** (not merely called over a
network boundary), the shipped artifact is a *combined work*. Under (A)GPL copyleft, conveying that
combined work generally requires the whole to be distributed under an (A)GPL-compatible license.

**Consequence: a permissive license like MIT for Wafer would very likely be non-compliant.** You
cannot sublicense the AGPL portion under MIT.

## Options

1. **License Wafer under `GPL-3.0-or-later` (recommended default).**
   - Compatible with combining an AGPL dependency for distribution, keeps Wafer itself strongly
     open, and matches the "every line published, verify it yourself" ethos.
   - Downside: strong copyleft — anyone distributing a modified Wafer must also open their changes.
     For a trust-first tool that's arguably on-brand, but it does let competitors fork.
2. **License Wafer under `AGPL-3.0-or-later`** (mirror the dependency exactly).
   - Safest match to ExtPay's declared license. AGPL's §13 network clause is largely moot for a
     client-side extension, so in practice this behaves like GPL-3.0 here.
3. **Remove/replace ExtPay** to regain freedom to choose MIT.
   - Biggest change; only worth it if you specifically want a permissive license. Alternatives:
     self-host a minimal Stripe check, or another extension-payments lib with a permissive license.
4. **Get written clarification from the ExtPay author** on the AGPL-vs-LGPL discrepancy.
   - If it's genuinely LGPL-3.0, you have more freedom: LGPL allows a permissively-licensed larger
     work as long as the LGPL component stays replaceable and its source is provided. That could
     re-open MIT for Wafer's own code. Worth a quick email given the file literally says LGPL.

## Recommendation

- **Fastest safe path to unblock launch: adopt `GPL-3.0-or-later`** (option 1). Add a `LICENSE`
  file with the GPL-3.0 text and set `"license": "GPL-3.0-or-later"` in the root and app
  `package.json`. This is defensible today with no further research.
- **If you'd prefer MIT**, first resolve the ExtPay AGPL-vs-LGPL question (option 4) and/or plan to
  replace ExtPay (option 3) — don't ship MIT over a bundled AGPL dependency.
- Either way, add a `THIRD-PARTY-NOTICES` entry crediting ExtPay and its license, and confirm the
  `WAFERWALLET` / `WAFERKEY` live software trademarks don't collide with your intended use (this is
  a *name/trademark* question, separate from the copyright license above — see the naming note in
  the session report).

## What was done (2026-07-14)

Option 1 was adopted:

- `LICENSE` = canonical GPL-3.0 text from gnu.org (35,149 bytes).
- `"license": "GPL-3.0-or-later"` set in the root, `apps/cookie-manager`, `packages/ui-kit`, and
  `packages/tsconfig` `package.json` files.
- `THIRD-PARTY-NOTICES.md` added, crediting ExtPay and recording its AGPL/LGPL discrepancy.
- README states the license and the ExtPay constraint.

**Two things GPL does NOT do**, for the record: it does not stop you selling Wafer Pro (the GPL
explicitly permits charging), and it is not *less* protective than MIT against a paywall-stripping
fork — every open-source license permits forking, and GPL at least forces a forker to publish their
changes, where MIT would let them close theirs.

**Still open (a separate, non-copyright question):** the *name*. Trademark clearance for whatever
name ships is unrelated to this copyright license — see the naming research in the session notes.
