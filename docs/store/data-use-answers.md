# Wafer — Chrome Web Store "Data Use" Form Answers

> Source: `docs/business/2026-07-13-business-recommendations.md` §6b–§6e. Paste-ready for the
> CWS "Privacy practices" tab. Re-affirm this (and the privacy policy + Limited Use statement)
> on every publish — certification is re-required each time.

## Data collected — check EXACTLY TWO categories

| Category | Check? | Reason |
|---|---|---|
| **Authentication information** | YES | Google's definition = "logins, passwords, and authentication cookies"; Wafer reads/edits auth cookies |
| **Website content** | YES | Google's definition literally lists "cookies" as website content |
| Personally identifiable information | No | Wafer touches no name/email/ID |
| Health information | No | — |
| Financial and payment information | No | Handled by ExtPay/Stripe as processors, not by Wafer |
| Personal communications | No | — |
| Location | No | — |
| **Web history** | No | Wafer logs no domains visited — do NOT check even though reviewers associate cookies with tracking |
| **User activity** | No | Wafer logs no clicks/keystrokes/actions |

## Collected / Transmitted

- **Collected (handled locally):** YES for Authentication information + Website content only —
  because "handle" includes local-only storage (login/auth functionality requires the
  disclosure even when nothing leaves the device).
- **Transmitted off device:** **NO** for everything. Nothing is sent anywhere.

## Certifications — check ALL THREE (all true)

- [x] "I do not sell or transfer user data to third parties, outside of the approved use cases."
- [x] "I do not use or transfer user data for purposes that are unrelated to my item's single
  purpose."
- [x] "I do not use or transfer user data to determine creditworthiness or for lending
  purposes."

## Single-purpose statement

> "Wafer is a cookie manager: it lets users view, add, edit, delete, search, import and export
> the cookies of the site they are working on. All data stays on the user's device."
