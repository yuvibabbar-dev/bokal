# Licensing notes — READ BEFORE PUBLISHING THE REPO

**Status: OPEN DECISION (founder). No `LICENSE` file has been committed yet, on purpose.**

The store copy claims Wafer is "open source, every line published," so a real license is a launch
blocker. But the choice is constrained by a dependency, and picking wrong has legal consequences —
so this is your call, not one to default into.

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

## To adopt GPL-3.0 (if you agree)

```bash
# from repo root
curl -sSL https://www.gnu.org/licenses/gpl-3.0.txt -o LICENSE
# then set "license": "GPL-3.0-or-later" in package.json (root) and apps/cookie-manager/package.json
```

(Or ask me to do it next session — I left it out precisely because it's a legal commitment I
shouldn't make unilaterally.)
