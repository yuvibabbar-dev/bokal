# Wafer — Store Submission Guide

> Ordered checklist to submit Wafer to the Chrome Web Store and Microsoft Edge Add-ons.
> References the other files in `docs/store/`. Packaging commands are appended in Task 5 —
> see the "## Packaging" placeholder below.

## Prerequisites (account-bound, founder-only — business doc §7)

- [ ] Chrome Web Store developer account — pay the one-time $5 registration fee, verify the
  publisher email.
- [ ] Microsoft Edge Add-ons developer account — register in Partner Center (no fee).
- [ ] ExtPay account registered at extensionpay.com, connected to your own Stripe account, with
  the three products created (Monthly $4.99, Annual $19, Lifetime $39 / $29 launch price) and
  Lifetime set as default-selected.
- [ ] Stripe account onboarding complete (payout details, tax/identity verification).
- [ ] Privacy policy hosted at a stable public URL — see `docs/store/privacy-policy.md`. Paste
  that URL into the CWS dashboard privacy field.
- [ ] Limited Use statement placed visibly on the extension's homepage, one click from home
  (exact sentence in `docs/store/privacy-policy.md`).
- [ ] EU-DSA trader verification completed — see `docs/store/trader-verification-checklist.md`.
- [ ] (Recommended) Landing-page domain registered and the open-source repo link published, so
  trust claims are verifiable at review time.

## Chrome Web Store submission steps

1. **Build and package the extension.** See "## Packaging" below (added in Task 5).
2. **Create/open the item** in the Chrome Web Store Developer Dashboard.
3. **Upload the packaged zip.**
4. **Store listing tab:**
   - Paste TITLE, SUMMARY (single-line description), and DESCRIPTION from
     `docs/store/listing.md`.
   - Add category, language, and the 5 screenshots + captions once available (see the
     "## Screenshots" placeholder in `docs/store/listing.md`, filled in Task 4).
5. **Privacy practices tab:**
   - Paste the privacy policy URL from `docs/store/privacy-policy.md`.
   - Enter the data-use answers from `docs/store/data-use-answers.md` (two data-collected
     categories, collected/transmitted answers, all three certifications, single-purpose
     statement).
   - Paste each permission justification from `docs/store/permission-justifications.md` into
     its matching field (cookies, storage, sidePanel, unlimitedStorage, alarms, host
     permissions).
6. **Trader verification:** complete the steps in
   `docs/store/trader-verification-checklist.md` (legal name, business address, email, SMS
   phone; DUNS optional).
7. **Distribution:** publish at **100% rollout** — no staged rollout for a brand-new item.
8. **Submit for review.**

## Microsoft Edge Add-ons (Partner Center) submission steps

1. Create a new extension in Partner Center.
2. Upload the same packaged zip built for Chrome (Edge accepts standard MV3 packages; confirm
   no Chrome-only APIs are required).
3. Paste the same TITLE, SUMMARY, DESCRIPTION, and screenshots from `docs/store/listing.md`.
4. Paste the same privacy policy URL and permission justifications used for Chrome.
5. Submit for certification (Edge does not require separate EU-DSA trader verification at time
   of writing, but keep the same business details on file for consistency).

## Post-submission

- [ ] Monitor both dashboards for reviewer questions or rejections.
- [ ] Once live, verify the Limited Use statement is reachable from the listing's homepage link.
- [ ] Confirm the ExtPay paywall shows Lifetime ($29 launch price) as the default-selected
  option.

## Packaging

Run from the repo root:

```bash
pnpm --filter @wafer/cookie-manager build
pnpm --filter @wafer/cookie-manager zip
```

- `build` runs `wxt build`, producing the unpacked Chrome MV3 extension at
  `apps/cookie-manager/.output/chrome-mv3/`.
- `zip` runs `wxt zip`, which rebuilds and packages the same output into
  `apps/cookie-manager/.output/wafercookie-manager-<version>-chrome.zip` (e.g.
  `wafercookie-manager-1.0.0-chrome.zip`, ~83 KB). This is the artifact to upload to the Chrome
  Web Store Developer Dashboard in step 3 above. Neither `.output/` nor the zip is committed to
  the repo (both are gitignored) — regenerate the zip from source before each submission.
- Do **not** set `WAFER_E2E=1` when building the artifact for submission — that env var (used
  only by `build:e2e` for Playwright) adds an install-time `host_permissions: ["<all_urls>"]`
  entry to the manifest that must never ship to a store listing. A plain `build`/`zip` run
  produces a manifest with no `host_permissions` key at all; host access is requested only at
  runtime via `optional_host_permissions`.
- Before uploading, spot-check `apps/cookie-manager/.output/chrome-mv3/manifest.json`: no
  `host_permissions` key, `permissions` is exactly `["cookies","storage","sidePanel",
  "unlimitedStorage","alarms","activeTab"]`, `optional_host_permissions` is `["<all_urls>"]`,
  `icons` has all four sizes, and `content_security_policy.extension_pages` is present.
  **⚠ Run a plain `pnpm --filter @wafer/cookie-manager build` first.** If you last ran `build:e2e`
  (or the E2E suite), `.output/chrome-mv3` holds the E2E build, which *does* declare
  `host_permissions` — spot-checking that directory would show a false failure. Safest: check the
  zip you're actually uploading (`unzip -p .output/*.zip manifest.json`).

**Edge:** upload this same zip to Partner Center — no separate Edge build step. Edge accepts
standard MV3 packages, so the artifact built for Chrome is reused as-is (see the Edge submission
steps above).

**Firefox (later):** WXT can emit a Firefox build via `wxt build -b firefox` /
`wxt zip -b firefox`, but Wafer does not target Firefox yet. Firefox's MV3 implementation uses
`sidebar_action` instead of Chrome's `side_panel` API, so the sidebar UI would need a
Firefox-specific manifest entry (and possible behavioral differences) before a Firefox package
could be submitted. Treat this as a follow-up, not part of the current release.
