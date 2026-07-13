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

<!-- Added in Task 5: build + zip commands for Chrome and Edge packages. -->
