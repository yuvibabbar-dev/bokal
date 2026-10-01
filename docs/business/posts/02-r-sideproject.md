# r/SideProject — Day 2, builder narrative

> **Gate / rules:** No karma/age/flair gate. Must show a *working* product (Bokal is live on the CWS ✓). No affiliate links ✓. Commercial products are explicitly fine here **if framed as a story, not a sales pitch** — so this post leads with the build and the failure, not the features.

> **Rewritten 2026-10-01.** The earlier draft said "I told literally nobody / posted none of it". That was false: on 2026-07-16 there were three launch posts (one HN link, two r/webdev posts) — all dead within minutes. The story below is the true one. **Two things to check before posting:** (1) every number — the user count moves; (2) the sentences about *why* you went quiet are my inference, so replace them with what was actually true for you. Verified against source. Do NOT claim Edge availability.

---

### r/SideProject

**Title:** My entire launch was 3 posts in 14 minutes: 2 removed by mods, 1 got a single upvote (mine). Then I hid for 11 weeks. 106 users, $0.

**Body:**

Posting this as much for the postmortem as the product, because the interesting part isn't the build — it's how thoroughly I fumbled the last 5%.

**The why.** In December 2024 EditThisCookie — a cookie editor a lot of us had used for years, reportedly ~3M users — vanished from the Chrome Web Store. Google never gave an official reason; the most plausible one is it never migrated to Manifest V3. Then a copycat grabbed the "EditThisCookie" name and got caught harvesting login credentials and tokens, growing past 50k users first. For a tool whose entire job is handling your session cookies, that's about the worst possible outcome, and it bothered me enough to build a replacement.

**What I actually optimized for.** Not features — the permission model. The published manifest is the whole pitch:

    permissions: ['cookies', 'storage', 'sidePanel', 'unlimitedStorage', 'alarms', 'activeTab']
    optional_host_permissions: ['<all_urls>']
    // no host_permissions

No `tabs` permission. No host permissions at install. `<all_urls>` exists only as an *optional* grant — the set it's allowed to ask for. By default it requests access to just the origin of the tab you opened it on, and all-sites is a separate explicit opt-in. It's GPL-3.0, so none of that is a claim you have to take on faith.

**The parts that were genuinely hard:**

- **The activeTab → per-site permission dance.** Getting host access for exactly one origin, triggered by a toolbar click, without the `tabs` permission and without an install-time warning, took far longer to get right than the entire cookie CRUD layer.
- **MV3 service workers dying mid-operation.** Everything stateful had to survive being killed at an arbitrary moment.
- **CHIPS / partitioned cookies.** The partition key changes what "the same cookie" even means, and most tools quietly ignore it.
- **Restoring a cookie set *into a live session in place*** — across HttpOnly and partitioned cookies — rather than the export-a-file-then-reimport-it thing. That's the one paid feature, and it was by far the fiddliest code in the project.
- **Not lying in the copy.** I have a test that asserts a free user makes zero network calls, and another that asserts cookie values are never logged. Writing marketing that stays literally true against the code turned out to be a real engineering constraint, and a good one. (Case in point: I caught myself claiming "Netscape import" in a draft of this very post back when 1.0.2 was live — Bokal exported Netscape but did not import it. I cut the claim rather than fudge it, and then shipped the feature in 1.1.0.)

**Now the embarrassing part.** It went live on the Chrome Web Store on July 15. On July 16 I "launched" it, and the whole launch took fourteen minutes.

First, a Hacker News submission — from an account I had created that morning, as a bare link to my landing page, without the "Show HN" prefix and without a single comment saying what it was. Twelve minutes later, the same pitch to r/webdev. Two minutes after that, the same post to r/webdev *again*. On a Thursday. r/webdev only allows project posts on Showoff Saturday, which I would have known if I had read the rules first.

Results: both Reddit posts removed by a moderator, and one point on Hacker News — my own. Three posts, fourteen minutes, zero humans reached.

And then I didn't post again for eleven weeks. I wrote a launch kit instead. I researched every subreddit's rules, which is how I found out exactly what I'd done wrong. I built comparison pages. I shipped a 1.1.0. All of it was real work, and none of it was the thing.

Current numbers, honestly: **106 users, 5.0★ from 2 ratings, $0 revenue.** Every one of those installs came from Chrome Web Store search — and not from "cookie editor", where I'm nowhere near the first page. They come from long-tail queries like "playwright cookies", where I rank second. Zero GitHub stars, because no post of mine has ever stayed up long enough to send anyone there.

**What I think I got wrong:** I took three dead-on-arrival posts as the market's verdict on the product, when all they measured was that I hadn't read the rules. Then I used polishing as a way to avoid the genuinely uncomfortable part, which is walking back into the room and saying "I made this, please look at it" — properly this time. Writing a launch kit *felt* like launching. It isn't. This post is me doing the actual thing.

**What I'd like from you:** if you've been through the same "built it, couldn't promote it" wall — what actually broke the logjam? And if you install it, I want the permission model torn apart specifically. If you can make it see more than it should, that's the bug report I most want.

- Chrome Web Store: https://chromewebstore.google.com/detail/bokal-cookie-editor-manag/oidemgbbhocfepdadkmfdlbjgdcjdldd
- Source (GPL-3.0): https://github.com/yuvibabbar-dev/bokal
- Site: https://bokal.dev

Free tier is the whole cookie manager — CRUD including HttpOnly, search, rules, cleanup, CHIPS inspector, DevTools panel, export to JSON/Netscape/cookie-header/Playwright/Puppeteer. One paid feature (named local cookie profiles, $29.99 one-time or $4.99/mo) which I'm mentioning once, here, and not again.
