# Bokal — Chrome Web Store "Data Use" Form Answers

> Source: `docs/business/2026-07-13-business-recommendations.md` §6b–§6e. Paste-ready for the
> CWS "Privacy practices" tab. Re-affirm this (and the privacy policy + Limited Use statement)
> on every publish — certification is re-required each time.

> **⚠ CORRECTED 2026-07-14.** An earlier version of this file said *"Transmitted off device: **NO**
> for everything. Nothing is sent anywhere."* That was written before ExtPay shipped and is now
> **false** — the extension bundles a payment SDK that contacts `extensionpay.com` once a user
> chooses to buy Pro. **Certifying "nothing is transmitted" while shipping a payment SDK is a false
> certification and grounds for rejection or takedown.** The answers below are scoped to what the
> code actually does.

## Data collected — check EXACTLY TWO categories

| Category | Check? | Reason |
|---|---|---|
| **Authentication information** | YES | Google's definition = "logins, passwords, and authentication cookies"; Bokal reads/edits auth cookies |
| **Website content** | YES | Google's definition literally lists "cookies" as website content |
| **Personally identifiable information** | **YES** | **Email.** ExtPay's user payload has an `email` field, populated once a user buys Pro, and ExtPay writes that payload to `chrome.storage.sync` (which Chrome replicates off-device). See the resolved note below. |
| Health information | No | — |
| Financial and payment information | No | Bokal never sees card data — checkout is hosted by ExtensionPay/Stripe, off-extension |
| Personal communications | No | — |
| Location | No | — |
| **Web history** | No | Bokal logs no domains visited — do NOT check, even though reviewers associate cookies with tracking |
| **User activity** | No | Bokal logs no clicks/keystrokes/actions |

## Collected / Transmitted — the important distinction

- **Collected (handled locally):** YES for Authentication information + Website content only —
  because "handle" includes local-only storage (login/auth functionality requires the disclosure
  even when nothing leaves the device).
- **Transmitted off device — Authentication information: NO. Website content: NO.**
  Cookie values and browsing data are **never** transmitted. This is the claim that matters, it is
  true, and it is enforced in code (`lib/pay/engagement.ts` gates all billing calls) and asserted in
  a real browser by `e2e/crud.spec.ts` ("a free user makes zero requests to extensionpay.com").
- **What IS transmitted, and only if the user chooses to buy Pro:** license/account data to
  **ExtensionPay** (and payment data directly to **Stripe**, on their hosted page — never through
  Bokal). A free user who never opens the upgrade page transmits **nothing at all**.

## ✅ RESOLVED (2026-07-14): ExtPay DOES handle PII — an email address

This was checked against the live ExtPay API rather than guessed. Minting a key against the real app
and fetching the user endpoint returns:

```json
{ "email": null, "installedAt": "…", "paid": false, "paidAt": null, "trialStartedAt": null, "plan": null }
```

There is an **`email` field**. It is `null` for a free/unpaid install, and is **populated with the
buyer's email address once they purchase Pro**. ExtPay's `fetch_user()` then writes that whole
payload to `chrome.storage.sync` as `extensionpay_user`, and **Chrome Sync replicates
`storage.sync` off-device**.

**Therefore, for the CWS Privacy tab:**

- **Check "Personally identifiable information."** A paid install stores and syncs the customer's
  email.
- **Its transmission:** the email originates from ExtensionPay (the payment processor) and is used
  solely to verify the licence. It is **never** joined to cookie or browsing data, and it does not
  exist at all for free users — who make no network calls whatsoever.
- Cookie data and website content remain **not transmitted**. That distinction is the whole point:
  say it precisely.

If you ever drop ExtPay, this becomes a "No" again.

## Certifications — all three remain TRUE

- [x] "I do not sell or transfer user data to third parties, outside of the approved use cases."
      *(ExtensionPay/Stripe act as payment processors — an approved use case. No data is sold.)*
- [x] "I do not use or transfer user data for purposes that are unrelated to my item's single
  purpose."
- [x] "I do not use or transfer user data to determine creditworthiness or for lending
  purposes."

## Single-purpose statement

> "Bokal is a cookie manager: it lets users view, add, edit, delete, search, import and export
> the cookies of the site they are working on. Cookie data stays on the user's device."

## Also required

- Tick the **in-app purchases / paid features** disclosure — Bokal ships a live paid tier
  (Bokal Pro), so the listing must declare it.
