# r/indiehackers — Wave 2 (relationship venue)

> **Gate / notes:** Norm-based rather than rule-based; "Show IH"-style posts do fine. This room rewards **numbers and process**, punishes polish. Weak for installs, decent for feedback and for people who follow the build.
>
> Post after the main Reddit wave so you have real data from it to report — that is what makes the post worth reading here.

> **Rewritten 2026-10-01.** The earlier draft claimed "Marketing posts made: 0 / told nobody". That was false — there were three launch posts on 2026-07-16, all dead within minutes. Numbers and store-search ranks below were measured 2026-10-01. **Update every number, and re-measure the ranks, before posting.**

---

### r/indiehackers

**Title:** Shipped a Chrome extension in July. My whole launch was 3 dead posts in 14 minutes. Here's what 11 weeks of pure store-search traffic looks like.

**Body:**

Numbers first, because that's why you're here.

**Bokal** — an open-source cookie manager for Chrome. Free tier is the whole tool; one paid feature at $29.99 one-time / $4.99 mo.

| | |
|---|---|
| Live on Chrome Web Store | 15 Jul 2026 |
| Users | 13 → 56 (late Aug) → **106** (1 Oct) |
| Revenue | **$0** |
| GitHub stars | **0** |
| Launch posts | **3**, all on day one — 2 removed by mods, 1 Hacker News link with 1 point |
| Posts since | **0** |
| Marketing spend | **$0** |

Every one of those installs is organic Chrome Web Store search. Not from the head term — I'm nowhere near page one for "cookie editor", which a free, open-source, 2M-user incumbent owns. From the long tail: I rank #2 for "playwright cookies", #3 for "partitioned cookies", #5 for "edit httponly cookies".

**The interesting bit:** the count sat flat at 56 for nine days. Then I shipped an update whose 132-character store summary named Playwright and Puppeteer, and it started climbing again — to 106. I can't prove causation from the outside, but the timing fits, and it's the cheapest growth lever I've found: the words in that one-line summary decide which searches you exist in.

**The embarrassing bit:** my launch took fourteen minutes. A Hacker News link from an account created that morning — no "Show HN", no comment. Twelve minutes later the same pitch to r/webdev, then two minutes after that the same post *again*, on a Thursday, in a sub that only allows project posts on Saturdays. Two mod removals and one upvote (mine). Then I went quiet for eleven weeks and built a launch kit instead of launching. Writing the kit *felt* like launching. It isn't.

**Four things I've learned that might be worth something to you:**

1. **Store search is a real channel, and the lever is the summary line.** No posts that stuck, no backlinks, no spend, and it still doubled after a metadata change. If you're shipping into an app store, the listing copy deserves more of your attention than your launch tweet.
2. **Three dead posts are not market feedback.** A removed post and a 1-point link measure whether you read the rules, not whether anyone wants the thing. I treated them as a verdict for eleven weeks.
3. **Verify your differentiators against the competitor's actual source before you write copy.** I discovered that the incumbent is also GPL-3.0 and has used optional host permissions since 2023. Two of my three headline claims were table stakes. Twenty minutes of reading their manifest would have saved me from finding out in a comment thread.
4. **Check that people can find you for the thing you charge for.** At ~100 installs, $0 barely counts as a pricing signal — a healthy 1% conversion predicts about one sale. What the store data told me was more useful: I rank for the features I give away, and not at all for the one I sell ("cookie profiles", "account switcher"). The paywall isn't too expensive. It's standing in a room nobody walks into.

**What's next:** posting properly — r/chrome_extensions first, then a real Show HN with the prefix, a maker comment, and a weekday morning.

Happy to answer anything about the CWS review process, MV3, or the pricing reasoning.

- https://bokal.dev · https://github.com/yuvibabbar-dev/bokal
