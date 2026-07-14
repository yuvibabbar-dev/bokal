# Security Policy

Wafer manages cookies — including authentication cookies — so security is the product, not a
feature. We take reports seriously.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Email **yuvisbabbar@gmail.com** with:

- a description of the issue and its impact,
- steps to reproduce (or a proof of concept), and
- the Wafer version / commit and your browser + OS.

You'll get an acknowledgement as quickly as possible. Please give us a reasonable window to ship a
fix before any public disclosure. We're grateful for responsible disclosure and will credit
reporters who want it.

## What Wafer guarantees

These are the security-relevant invariants the code is built to hold (see
[`docs/threat-model.md`](docs/threat-model.md) for the full model):

- **Nothing leaves your device.** No Wafer server, no account, no telemetry. The only network path
  is the optional Pro license check via ExtensionPay (ExtPay → Stripe), and only after you open the
  upgrade page — free users make zero network calls.
- **No `tabs` permission and no install-time host permissions.** Host access is requested at
  runtime for the specific site you manage.
- **Cookie values are never logged** and are rendered as text nodes only (XSS-safe). Both are
  enforced by tests that run in CI.
- **Pro cookie profiles can be encrypted at rest** with AES-GCM + PBKDF2 (600k iterations); the
  apply path decrypts before removing, so a wrong passphrase can't destroy cookies.
- **No remote code** — everything Wafer executes ships in the published package.

## Scope

In scope: the extension in `apps/cookie-manager/` and the shared `packages/`. Out of scope:
third-party services (Chrome, ExtPay, Stripe) and the static `site/` landing page content.
