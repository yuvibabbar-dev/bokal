# Bokal — Manual QA checklist (real browser)

The automated suite (124 unit tests + 5 Playwright E2E specs) already covers cookie CRUD, the
free/Pro bundle split, the ExtPay purchase sequence against a mocked backend, encrypted
snapshot→restore, and "a free user makes zero network calls."

**This checklist covers only what automation structurally CANNOT reach:**

- the **real Chrome side panel** opened from the toolbar icon (the E2E harness loads
  `sidepanel.html` as a standalone page — it can never test the real panel surface)
- the **real per-site permission dialog** (`activeTab` timing — ⚠ never verified in a real browser)
- the **real DevTools panel**
- a **real ExtPay payment**

Budget ~15 minutes. Tick as you go.

## Setup

```bash
pnpm --filter @bokal/cookie-manager build
```
`chrome://extensions` → **Developer mode** ON → **Load unpacked** →
`apps/cookie-manager/.output/chrome-mv3`

> Unpacked ⇒ ExtPay is automatically in **TEST mode**. Use card `4242 4242 4242 4242`.
> **Never use a real card here.**

---

## ⚠ 1. The per-site permission grant (HIGHEST PRIORITY — never tested in a real browser)

This is the one genuinely unverified path in the product. `activeTab` only exposes the tab URL after
the user invokes the extension from the toolbar, and the timing of that on side-panel open could not
be exercised in the E2E harness. If it misbehaves, the flow is *designed* to degrade safely to the
all-sites fallback — but confirm which one you actually get.

- [ ] Visit a normal site (e.g. `https://github.com`)
- [ ] Click the **Bokal toolbar icon** → the side panel opens
- [ ] **Expected:** a grant prompt naming **that specific site** (not "all sites")
- [ ] Click grant → Chrome's permission dialog appears → Allow
- [ ] **Expected:** the cookie list for that site appears

**If it instead asks for access to ALL SITES, stop and report it.** That's the safe fallback, but it
weakens the "minimal permissions" claim that the entire store listing rests on.

## 2. Free tier — cookie CRUD on a real site

- [ ] Cookie list shows real cookies, and the header reads `N cookies · <the site>`
- [ ] **Add**: `＋ Add cookie` → name `qa_test`, value `hello` → Save → it appears in the list
- [ ] Verify in DevTools → Application → Cookies that `qa_test` really exists
- [ ] **Edit**: click the row → change the value → Save → the value updates and there is **no
      duplicate row** (edit must replace, not duplicate)
- [ ] **Delete**: click ✕ → confirm → the row disappears and it's gone from DevTools too
- [ ] **Search**: filter by name — the list narrows
- [ ] **HttpOnly**: confirm HttpOnly cookies are listed (the ones DevTools-only tools can't edit)

## 3. Rules

- [ ] Click 🔓 on a cookie to **protect** it → the ✕ delete button becomes disabled
- [ ] Click 📌 to **pin** → it jumps to the top of the list
- [ ] Expand **Blocked domains** → add a domain → reload a page that sets a cookie for it → the
      cookie is auto-removed

## 4. Import / export

- [ ] **Export JSON** → a file downloads → open it: the cookies are there
- [ ] **Export Netscape** → downloads a `cookies.txt`
- [ ] **Copy header** → paste somewhere → it's a valid `Cookie:` header string
- [ ] **Import** the JSON you just exported → cookies restore
- [ ] Try importing a **Cookie-Editor / EditThisCookie** export if you have one (compatibility is a
      listing claim)

## 5. All-sites view + cleanup

- [ ] Scope selector → **All cookies** → prompts for all-sites access → grant → cookies from many
      sites list
- [ ] **Cleanup** → add a keep-list domain → **Clean now** → confirm → cookies outside the
      keep-list are cleared, keep-list ones survive
- [ ] Confirm a **protected** cookie survives a cleanup

## 6. DevTools panel

- [ ] Open DevTools (F12) on a site → find the **Bokal** tab
- [ ] It lists that tab's cookies and edits work there too

## 7. Theme + panel behaviour

- [ ] Toggle dark/light → it persists after closing and reopening the panel
- [ ] Switch browser tabs → the cookie list follows the active tab

## 8. 💳 Pro purchase (real ExtPay, test mode)

- [ ] Panel shows **★ Unlock Pro** and **Restore purchase**
- [ ] Open DevTools → **Network** tab, filter `extensionpay` → **before clicking anything, there
      must be ZERO requests.** This is the flagship privacy claim — a free user contacts no server.
- [ ] Click **★ Unlock Pro** → the checkout tab opens, titled **Bokal**, showing all three plans
      ($4.99/mo · $19.99/yr · $29.99 lifetime)
- [ ] Pay with `4242 4242 4242 4242`, any future expiry, any CVC
- [ ] Return to the panel — **Pro unlocks within ~3 seconds without reopening it**
- [ ] **Cookie profiles (Pro)** appears

## 9. Pro — encrypted profiles

- [ ] Type a profile name, tick **Encrypt**, enter a passphrase → **Save current cookies**
- [ ] The profile is listed with a 🔒
- [ ] Delete a cookie from the site
- [ ] Click **Apply** → enter the **WRONG** passphrase → **it must fail AND destroy nothing** (the
      remaining cookies must still be there — apply decrypts *before* it removes)
- [ ] Click **Apply** → correct passphrase → the deleted cookie is **restored**

## 10. Restore / manage

- [ ] Click **Manage subscription** → the ExtPay account page opens
- [ ] (Optional) Clear the extension's storage → Pro locks → click **Restore purchase** → sign in
      with the email you paid with → Pro comes back **without paying again**

## 11. Confirm what ExtPay stored (needed for the CWS privacy answer)

- [ ] `chrome://extensions` → Bokal → **service worker** → console:
      ```js
      chrome.storage.sync.get(null).then(console.log)
      ```
- [ ] Confirm `extensionpay_user` contains an **email** — this is why "Personally identifiable
      information" is ticked on the store's privacy tab

---

## If you find a bug while the review is pending

You can keep testing during review. To ship a fix:

```bash
# bump the version in apps/cookie-manager/wxt.config.ts (e.g. 1.0.0 -> 1.0.1)
pnpm -r test && pnpm --filter @bokal/cookie-manager build
pnpm --filter @bokal/cookie-manager check:bundle
pnpm --filter @bokal/cookie-manager zip
```
Then upload the new zip in the dashboard. A new upload replaces the pending submission.
