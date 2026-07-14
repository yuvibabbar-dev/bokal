# Bokal Privacy Policy

> Source: `docs/business/2026-07-13-business-recommendations.md` §6a. Paste-ready — host this
> page at a stable public URL and paste that URL into the Chrome Web Store dashboard's privacy
> field (and the Edge Partner Center equivalent).

Privacy Policy — Bokal (last updated 2026-07-13)

Bokal is a local-first cookie manager.

What Bokal accesses: to do its job, Bokal reads and writes the cookies of the
site you choose to manage, using Chrome's cookies API. This includes
authentication cookies and other data stored in the site's browser storage.

What Bokal does NOT do: Bokal collects no personal information, tracks no
browsing history, and contains no analytics, telemetry, ads, or remote code.

Where your cookie data goes: nowhere. Bokal never transmits your cookies — or any
browsing data — off your device. There is no Bokal server and no account. The
ONLY time Bokal contacts a network service is if you choose to buy Bokal Pro:
it then verifies your license with ExtensionPay and processes payment through
Stripe (see Payments below). If you never open the upgrade page, Bokal contacts
no server at all.

Local storage: everything BOKAL stores lives only on your device and is never
synced. Your theme preference, cookie rules, and Pro entitlement status are
stored via chrome.storage.local; the current cookie list is cached temporarily
via chrome.storage.session so re-opening the panel is instant; if you use Pro
cookie profiles, your saved profiles/snapshots are stored only on your device in
IndexedDB (not chrome.storage.local), and can be encrypted at rest with a
passphrase you set. (If you purchase Pro, the ExtensionPay library stores its own
license markers in browser storage, which your browser may sync — this concerns
your license only, never your cookies or browsing data, and never happens for
free users.)

Third parties: we never sell, share, or transfer your cookie or browsing data to
anyone — it does not leave your device at all. The only third parties involved
anywhere in Bokal are ExtensionPay and Stripe, and only if you choose to buy Pro,
and only to verify your license and take payment (see Payments below). A free
user's data reaches no third party, because a free user contacts no server.

Payments (Pro): if you buy Pro, purchases are processed by ExtensionPay and
Stripe, and Bokal verifies your license status with ExtensionPay. Bokal never
sees or stores your payment details, and no cookie or browsing data is ever
shared with them — only your license status is checked. These checks happen only
after you choose to purchase (or open the upgrade page); free users are never
contacted.

Permissions: 'cookies' and host access are used solely to manage cookies for
sites you choose; 'storage' persists your local preferences, entitlement
status, and cookie snapshot on your device; 'unlimitedStorage' lifts the
default IndexedDB quota so your Pro cookie-profile library isn't capped;
'sidePanel' renders the optional side-panel UI; 'activeTab' reads the current
tab's address (only when you open Bokal) so it can request access to just that
one site — it is not the 'tabs' permission; 'alarms' schedules purely local
periodic tasks (a re-check of your Pro license, and — only if you enable it —
the daily cookie-cleanup sweep), and transmits nothing.

Changes: if data practices ever change, we will update this policy and disclose
it before the change takes effect.

Contact: yuvisbabbar@gmail.com

Limited Use: Bokal's use of information received from Chrome APIs and any user
data adheres to the Chrome Web Store User Data Policy, including the Limited Use
requirements.

---

**Last updated: 2026-07-13**

---

## Also required: on the extension's homepage

Google requires the affirmative Limited Use statement to appear visibly on the
extension's homepage/landing page, one click from home. Place this exact
sentence there:

> "Bokal's use of information received from Chrome APIs and any user data
> adheres to the Chrome Web Store User Data Policy, including the Limited Use
> requirements."
