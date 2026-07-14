# Bokal — Chrome Web Store Submission Guide

**Current as of 2026-07-14** (rewritten after the pre-launch audit — the earlier version predated
several fixes and would have walked you into a false data-use certification).

Work top to bottom. Everything you need to paste is inline or linked.

---

## STEP 0 — Test the purchase first (5 min, before anything else)

**Use the test card. Do NOT use a real credit card.** ExtPay auto-detects test mode from the install
type: an **unpacked** extension always gets test mode; a **Web Store** install gets live mode. A real
card isn't needed and would be rejected in test mode anyway.

```bash
pnpm --filter @bokal/cookie-manager build     # -> apps/cookie-manager/.output/chrome-mv3
```

1. `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
   `apps/cookie-manager/.output/chrome-mv3`
2. Open a site with cookies → open Bokal's side panel → the cookie list should appear
3. Click **★ Unlock Pro** → the checkout page should say **Bokal** and list all three plans
4. Pay with **`4242 4242 4242 4242`**, any future expiry, any CVC, any postcode
5. Return to the panel — **Pro should unlock within ~3 seconds** without reopening it, and
   **Cookie profiles (Pro)** should appear
6. Click **Manage subscription** → the ExtPay account page should open
7. **Confirm the PII answer** (needed in Step 3): in the extension's service-worker console run
   ```js
   chrome.storage.sync.get(null).then(console.log)
   ```
   You should see `extensionpay_user` containing an **email**. That's why PII is ticked below.

If Pro unlocks, your payment integration is done.

---

## STEP 1 — Developer account + upload

1. Register at <https://chrome.google.com/webstore/devconsole> — **$5 one-time** fee.
2. **Add new item** → upload **`apps/cookie-manager/.output/bokalcookie-manager-1.0.0-chrome.zip`**

   Rebuild fresh if unsure:
   ```bash
   pnpm --filter @bokal/cookie-manager build && pnpm --filter @bokal/cookie-manager zip
   ```

> **The listing's TITLE and SUMMARY come from the manifest, not the dashboard** — they're already set:
> - name: `Bokal - Cookie Editor & Manager (Open Source, No Tracking)` (58/75)
> - description: the 126/132-char summary
>
> Don't expect to edit them in the console.

---

## STEP 2 — "Store listing" tab

| Field | Use |
|---|---|
| **Description** | The full description block in [`listing.md`](listing.md) |
| **Category** | Developer Tools |
| **Language** | English |
| **Screenshots** | All 5 in `docs/store/screenshots/` (1280×800) |
| **Homepage URL** | `https://yuvibabbar-dev.github.io/bokal/` |
| **Support URL** | `https://github.com/yuvibabbar-dev/bokal/issues` |

⚠ **Do NOT put "EditThisCookie" or "Cookie-Editor" in the title or summary** — impersonation /
trademark risk and a suspension trigger. Mentioning import *compatibility* in the description body is
fine.

---

## STEP 3 — "Privacy practices" tab (the one that gets extensions rejected)

### Single purpose
```
Bokal is a cookie manager: it lets users view, add, edit, delete, search, import and export
the cookies of the site they are working on. Cookie data stays on the user's device.
```

### Permission justifications
Paste each from [`permission-justifications.md`](permission-justifications.md) — one box per
permission: `cookies`, `storage`, `sidePanel`, `unlimitedStorage`, `alarms`, `activeTab`, host access.

⚠ `alarms` powers **two** things — the Pro-licence re-check **and** the optional daily cleanup sweep.
State both. Under-describing a permission is a rejection trigger.

### Data usage — tick EXACTLY these three
- ✅ **Authentication information** — Bokal reads/edits auth cookies
- ✅ **Website content** — Google's definition literally lists cookies
- ✅ **Personally identifiable information** — **email.** When a user buys Pro, ExtPay returns the
  purchaser's email and stores it in `chrome.storage.sync`. Verified against the live API.
  **Ticking this is not optional.**

Leave unticked: health, financial, personal communications, location, web history, user activity.

### Data transmission
- Cookie data / website content → **not transmitted.** True, enforced in code, asserted in E2E.
- Licence data (incl. the buyer's email) → **transmitted to ExtensionPay/Stripe, only if the user buys
  Pro.** Free users transmit nothing at all.

> ❌ **Never certify "nothing is transmitted."** The build ships a payment SDK. Reasoning:
> [`data-use-answers.md`](data-use-answers.md).

### Certifications — all three are true, tick all three
- ✅ I do not sell or transfer user data to third parties, outside of the approved use cases
- ✅ I do not use or transfer user data for purposes unrelated to my item's single purpose
- ✅ I do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy policy URL
```
https://yuvibabbar-dev.github.io/bokal/privacy.html
```
Live and verified. The Limited Use statement also appears on the homepage, as Google requires.

---

## STEP 4 — Distribution & monetization

- **Visibility:** Public · **Regions:** All
- ✅ **Tick the in-app purchases / paid features disclosure.** Bokal Pro is a **live** paid tier
  ($4.99/mo · $19.99/yr · $29.99 lifetime) sold via ExtensionPay + Stripe. Not declaring it is a
  policy violation.

---

## STEP 5 — EU-DSA trader verification

Required to stay distributed in the EU. You must supply a **legal name, physical business address,
email and phone** — and Google **publishes these on the listing**.

⚠ **Use a business or registered-agent address, not your home address.** Checklist:
[`trader-verification-checklist.md`](trader-verification-checklist.md).

---

## STEP 6 — Submit

Review usually takes a few days. Extensions requesting `cookies` + host access get extra scrutiny —
which is exactly why the justifications and data-use answers above must be precise.

---

## After it's live

1. **Edge Add-ons** — <https://partner.microsoft.com/dashboard/microsoftedge> — free, **same zip**, no
   rebuild.
2. **Update the landing page:** swap the "Coming soon to Chrome" button in `site/index.html` for the
   real store link, then republish the `gh-pages` branch.
3. **Raise the lifetime price:** it's at the **$29.99 launch price** — go to **$39** after ~60 days.
4. **Watch the first reviews** — the one-time in-panel review prompt fires after a user's 3rd cookie
   action.

---

## Sanity check before you hit submit

```bash
pnpm -r test                                             # 124 passing
pnpm --filter @bokal/cookie-manager exec tsc --noEmit     # clean
pnpm --filter @bokal/cookie-manager build
pnpm --filter @bokal/cookie-manager check:bundle          # Pro code isolated from the free bundle
pnpm --filter @bokal/cookie-manager zip

# the zip you upload must have NO host_permissions:
unzip -p apps/cookie-manager/.output/*.zip manifest.json | python3 -m json.tool | grep -i host
#   -> only "optional_host_permissions" should appear
```

⚠ If you last ran `build:e2e`, `.output/chrome-mv3` holds the **E2E build**, which *does* declare
`host_permissions`. Always run a plain `build` before zipping — and check the **zip**, not the folder.
