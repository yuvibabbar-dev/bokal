# Promotion assets — index

Every piece is paste-ready and was verified against the shipped v1.0.2 source, and against
Cookie-Editor's published `manifest.chrome.json`, on 2026-08-26.

**Three rules that apply to all of them:**
1. **Edge: live, but one release behind (corrected 2026-10-01).** Bokal IS in the Edge Add-ons store
   (https://microsoftedge.microsoft.com/addons/detail/bokal-cookie-editor-m/hoopoalcgejkjdpmgjlblilojhdfchhj) at **v1.0.2** with the original July description. Earlier notes saying it was "not in the
   Edge store" were never properly verified — the store is JavaScript-rendered and the checks used a
   search index. Until 1.1.0 is uploaded there, either leave Edge out of a post or say "Edge build is
   one version behind"; do not pair "on Edge" with 1.1.0-only features (Netscape import). The per-file
   "Do NOT claim Edge availability" notes predate this and should be read in that light.
2. **Netscape import shipped in v1.1.0.** Bokal both writes and reads `cookies.txt` (import understands curl's `#HttpOnly_` marker).
3. **Open source / MV3 / optional host permissions are NOT differentiators** — Cookie-Editor has all
   three. The real deltas are `tabs` vs `activeTab`, CHIPS, and Playwright/Puppeteer export.

## What has actually been posted (corrected 2026-10-01)

Earlier notes in this repo said nothing had ever been posted. That was wrong — it was inferred from
zero GitHub stars and never checked. The record, from HN's Algolia API and a Reddit archive:

| When | Where | What happened |
|---|---|---|
| Thu 2026-07-16 13:05 ET | Hacker News — [48937187](https://news.ycombinator.com/item?id=48937187), from an account created that day | Bare link to bokal.dev, no "Show HN:", no comment → **1 point, 0 comments** |
| Thu 2026-07-16 13:17 ET | r/webdev | **Removed by moderator** (project posts are Saturday-only) |
| Thu 2026-07-16 13:19 ET | r/webdev, same account | Duplicate two minutes later → **removed by moderator** |

Nothing since. All three failed on mechanics, not on the pitch — none was seen by enough people to
count as feedback. Files 03 and 04 carry the specific do-it-differently notes.

## Sequenced launch

| # | File | Venue | When | Gate |
|---|---|---|---|---|
| 01 | `01-r-chrome_extensions.md` | r/chrome_extensions | Day 1 | none — flagship, best room |
| 02 | `02-r-sideproject.md` | r/SideProject | Day 2 | none — re-check the user count, it moves |
| 03 | `03-r-webdev-showoff-saturday.md` | r/webdev | **Saturday only** | Showoff Saturday flair; **zero pricing** (Rule 3 = ban) |
| 07 | `07-r-opensource.md` | r/opensource | Day 4 | **Promotional flair**; no-AI-content rule — reword before posting |
| 08 | `08-r-coolgithubprojects.md` | r/coolgithubprojects | Day 5 | title tag must match language flair or automod eats it |
| 09 | `09-r-software.md` | r/software | **Wednesday only** | OSS-only; missing Rule 3 = **permanent ban**; silent karma filter |
| 04 | `04-show-hn.md` | Show HN | after the Reddit wave | title + first comment; clear 4–6 hours |
| 05 | `05-product-hunt.md` | Product Hunt | last | 12:01am PT |

## Evergreen (no day gates, no sub rules — safest to publish any time)

| # | File | What |
|---|---|---|
| 13 | `13-devto-essay.md` | The long-form trust essay |
| 14 | `14-devto-manifest-postmortem.md` | **Original piece** — "I read my competitor's manifest and my pitch fell apart". Strongest asset here; publish before Show HN so the self-correction reads as an established position |
| 12 | `12-alternativeto.md` | AlternativeTo directory entry — keeps returning traffic for years |
| 10 | `10-x-thread.md` | X thread |
| 11 | `11-linkedin.md` | LinkedIn (put the link in the first comment) |

## Wave 2 — feedback venues, not install channels

| # | File | What |
|---|---|---|
| 15 | `15-wave2-roastmystartup.md` | Roast the pricing. Few installs, but one good critique beats fifty |
| 16 | `16-wave2-indiehackers.md` | Numbers + process post. **Update every figure before posting** |

## Red rooms — helper only, never post the launch

r/privacy, r/QualityAssurance (`06-r-qualityassurance.md` exists but Rule 1 makes it risky),
r/softwaretesting, r/selenium, r/Playwright, r/chrome. Answer real questions, disclose you're the
maker, share a link only when directly asked. This participation is what stops the promo posts from
being auto-filtered elsewhere.
