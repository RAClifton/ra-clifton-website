# Session 2 — Detailed Transcript

**Date:** 15 September 2026
**Outcome:** raclifton.com went live. Two visual defects found and fixed. The
research report was reviewed, rebuilt and fact-checked.

This is a chronological record of what was attempted, what failed, what the
evidence actually said, and what was decided. It is written for someone who
was not there. It records reasoning, not literal wording.

For the current state of the project, read
[SESSION-HANDOFF.md](SESSION-HANDOFF.md). For step-by-step procedures, read
[OPERATIONS.md](OPERATIONS.md).

---

## Phase 1 — Orientation

**Question asked:** "Based on the project file, what do we do next?"

Read `START-HERE.md`, `CLAUDE.md`, `LAUNCH-CHECKLIST.md` and
`docs/SESSION-HANDOFF.md` from the previous session, then checked the real
state rather than trusting the summary:

- Working tree clean, in sync at commit `95111b5`, no tags
- `curl https://www.raclifton.com` redirected to `vercel.com/login` — the site
  was still private
- Both credential files still present on the Mac

**Conclusion:** everything was done except a human browser QA pass and the
go-public switch. Three items were outstanding and two of them needed Clifton,
not Claude.

---

## Phase 2 — Proving inbound email actually worked

This took four attempts and is the most instructive part of the session.

### Why it mattered

`research@raclifton.com` forwards to `smartofficecentral@gmail.com` through
Cloudflare Email Routing. Outbound sending (via Resend) was already proven.
Inbound forwarding was not. Without it, a client replying to a report email
would vanish silently.

### Attempt 1 — day 1, already on record

Sent from `smartofficecentral@gmail.com` → `research@raclifton.com`. The
message never appeared. Cloudflare sent a "Are you missing an email?" notice
explaining that Gmail deduplicates messages when sender and destination are
the same mailbox.

**What it proved:** Cloudflare *received* the mail and ran the forwarding
rule. What happened at the final hop into Gmail was unknown.

### Attempt 2 — the false positive

Clifton sent from `racliftoncpa@gmail.com` → `research@raclifton.com`, **with
a Bcc to `smartofficecentral@gmail.com`**. It arrived. It looked like success.

Pulling the raw headers showed it was not:

```
Return-Path: <racliftoncpa@gmail.com>          ← not rewritten by a forwarder
Received: from mail-sor-f41.google.com
          by mx.google.com
          for <smartofficecentral@gmail.com>   ← the only hop
Bcc: smartofficecentral@gmail.com
```

No `mx.cloudflare.net` hop anywhere. The message in the inbox was the **Bcc
copy**, delivered Gmail-to-Gmail. The genuinely forwarded copy would have
carried an identical `Message-ID` and been silently deduplicated by Gmail.

The Cloudflare notice from attempt 1 had warned about exactly this trap.
Changing the *sender* fixed half the problem; the Bcc re-created the other
half.

**Side check:** queried the Cloudflare API directly and confirmed the
configuration was correct — rule `research → gmail` enabled, destination
verified, catch-all disabled, MX records `route1/2/3.mx.cloudflare.net`, SPF
`include:_spf.mx.cloudflare.net`. The plumbing was never in doubt.

### Attempt 3 — Claude's own probes, both failed

Sent two messages through Resend to `research@raclifton.com`:

| Probe | From | Result |
|---|---|---|
| A | `research@raclifton.com` | never arrived |
| B | `noreply@raclifton.com` | never arrived |

**Why the method was flawed:** Resend can only send from `raclifton.com`,
because that is the only verified domain on the account. Cloudflare Email
Routing refuses mail whose sender domain is itself a domain with Email Routing
enabled — loop prevention. Both probes shared that defect.

Two attempts to diagnose it further also failed: outbound port 25 is blocked
on this network (the same restriction that blocked SSH on port 22 during
setup), and the production Resend key is send-only so its delivery log could
not be read. That 401 was itself useful — it confirmed the key rotation from
day 1 had held.

**Recorded honestly at the time:** the approach could not answer the question,
and the failure said nothing about whether forwarding worked.

### Attempt 4 — clean, and conclusive

Clifton sent from `racliftoncpa@gmail.com` → `research@raclifton.com` with
**no Cc and no Bcc**. Forwarding became the only possible delivery route.

Raw headers showed the full path:

```
Received: from mail-lf2-x10.google.com
        by cloudflare-email.net (cloudflare) id qYo1dhemoLzk
        for <research@raclifton.com>          ← Cloudflare accepted it
X-Forwarded-For: research@raclifton.com smartofficecentral@gmail.com
Feedback-ID:     raclifton.com:1:1:Cloudflare
Received: from ba-eg.cloudflare-email.net [104.30.10.46]
        by mx.google.com
        for <smartofficecentral@gmail.com>    ← Cloudflare handed it to Gmail
Return-Path: <SRS0=l1EJ=hh=gmail.com=racliftoncpa@raclifton.com>
```

That last line is the proof: Cloudflare rewrote the envelope sender (SRS),
which only a forwarder does. Authentication was clean — `spf=pass`, three
`dkim=pass` results, `dmarc=pass`, spam score 0. Inbox, not spam.

**Lesson recorded in the checklist:** never re-test this with a Bcc to
yourself or from an `@raclifton.com` sender.

---

## Phase 3 — Browser QA

Clifton asked to be walked through the responsive QA pass.

Before writing the instructions, the page source was read so the guidance
named real things. Two findings worth knowing came out of that:

- The header hamburger (`☰`) has styling but **no JavaScript attached** — it
  does nothing.
- The five chips under "Not sure where to start?" have a `.sel` "selected"
  style defined but nothing wires them up — clicking does nothing and
  `#chip-result` stays empty.

Both came from the approved v12 baseline. `CLAUDE.md` forbids behaviour
changes during launch, so they were flagged as *not bugs, don't log them*
rather than fixed.

A per-width expectation table was produced from the CSS, because the hero
deliberately changes at different sizes and would otherwise look broken:

| Width | Hero | Sticky bar |
|---|---|---|
| 1440, 1280 | Live hero, photo + dashboard | never |
| 1024 | Flat approved hero **image** | never |
| 834 | Live hero, tablet layout | after scrolling |
| 393–360 | Mobile hero **image** | after scrolling |

Clifton hit Chrome's "Don't paste code into the DevTools Console" guard. Rather
than just telling him to bypass it, the overflow-detection snippet was
explained line by line first — the warning's advice is sound, and honouring it
costs nothing.

**Result:** all eight widths passed, no console errors, no horizontal scroll.

---

## Phase 4 — Two defects, diagnosed from evidence

Clifton reported two problems with screenshots.

### Defect 1 — the tablet dashboard covered the executive's face

At 834px the "REAL INSIGHTS" dashboard panel sat on top of the portrait.

Reading `globals.css` turned up a rule block at line 653 already commented
*"MOBILE HERO FIX: dashboard may never cover the executive's face"* which
stacks the dashboard below the photo — scoped to `max-width:767px`.

**It was dead code.** Below 768px, `.hero` is `display:none` and the flat
mobile artwork is used instead, so the rule never ran. At 768–1023px the live
hero renders and nothing stopped the overlap.

**Fix:** widened that block to `max-width:1023px`. An already-approved pattern
reused, not new layout invented. A tablet type scale was added too, because
the dashboard's 6px labels are sized for a 270px overlay card and would look
lost in a 720px-wide panel.

### Defect 2 — the "5" in "5 HOURS" sat low

Not a layout bug. Georgia uses **old-style figures**, where digits vary in
height by design. Measured directly from `/System/Library/Fonts/Supplemental/Georgia.ttf`:

| Glyph | Bottom | Top |
|---|---|---|
| `5` | **−365** | **1073** |
| `8` | −34 | 1456 |
| `H` | 0 | 1419 |

The `5` is roughly 24% shorter than the caps and hangs below the baseline.

The CSS was already trying to fix this with `font-variant-numeric:normal`.
Inspecting Georgia's OpenType tables showed it exposes only `aalt` and `locl`
— **there is no lining-figure set to switch to**. That property was a no-op.

Since total glyph heights nearly match (1438 vs 1419, a 1.3% difference nobody
can see), the correct fix was a pure vertical nudge of exactly one descender:
`365/2048em = .178em`. A comment recording the measurements was left in the
CSS so nobody "simplifies" it back to a font property that cannot work.

### Two clarifying questions asked before editing

1. **Numerals — fix "5 HOURS" only, or all stat numbers?** Fixing all would
   require changing the typeface for digits, since Georgia physically cannot do
   it. Clifton chose surgical. The `5` in `58%` keeps its stagger.
2. **Which widths get the stacked dashboard?** Clifton chose tablet only
   (768–1023px), leaving the approved desktop composition untouched.

Both fixes verified locally (`npm run dev`, served CSS inspected), built
clean, then committed as `9e25f8e` and pushed. Vercel deployed in 18 seconds.

**One trap avoided at commit time:** running `next dev` had rewritten
`next-env.d.ts` to point at `.next/dev/types/`. Committing that would have
aimed production types at a dev-only path — the exact problem a previous
session had to make a dedicated commit to fix. The file was reverted and the
dev server stopped before committing.

---

## Phase 5 — Reviewing the research report

Clifton uploaded a branded PDF of *AI for a Small Business: The Case for
Starting Now* and asked for a review.

Fourteen issues were raised. The four that gated publication:

1. **A 2024 "40%" bar appeared in the adoption chart but nowhere in the
   text.** Flagged as either a real figure missing from the prose, or an
   interpolation presented as survey data.
2. **Internal production notes were still in the client-facing document** —
   an "Editorial Status" section with instructions to the production team, and
   a line telling the reader the publication was not finalised.
3. **"Publication v2" appeared in reader-facing prose** three times.
4. **No disclaimer anywhere** in eleven pages of a CPA's operational and risk
   guidance.

Plus visible layout defects: `20%of organizations` with a missing space, a
chart running past the right margin, the 90-day timeline splitting
mid-sentence across a page break, and no page numbers.

And a conversion gap: the brief discussed the AI Readiness Score™ then ended
with **no URL, no link, nothing clickable** — despite being the secondary
conversion path that should feed the primary one.

---

## Phase 6 — Rebuilding the report

Clifton said to make the changes and produce a PDF.

**Approach:** rebuilt as HTML with fixed Letter-size page divs, rendered
through headless Chrome. No tooling was available for PDF work (no weasyprint,
wkhtmltopdf, pandoc, or Homebrew), but Chrome was.

**Typeface decision:** body set in **Baskerville**, not Georgia. Both Georgia
and Charter were measured and both use old-style figures — the exact problem
just fixed on the website. Putting it into a numbers-heavy report would have
been a poor choice. Baskerville and Times New Roman were confirmed to have
lining figures; Baskerville was chosen for character.

### The overflow check that caught a real bug

Fixed-height pages clip silently. Rather than eyeballing, a script measured
every page's lowest content element against its footer:

```
PAGE 7 clearance=-97px  <<< OVERFLOW: P
```

Page 7 had a callout colliding with the footer and a closing paragraph cut off
entirely — invisible in the PDF, would have shipped. Sections 3 and 4 were
split onto separate pages, footers and the table of contents renumbered, and
the check re-run until it reported **zero overflows across all 14 pages**.

A follow-up bug in the renumbering script left the last contents row pointing
at the wrong page; caught by printing the final table and reading it.

### Web version

Clifton then asked where the download link was — a fair complaint, since only
a local file had been produced. A web version was published as an artifact,
designed as a **review surface**: it opens with a "What changed in this
revision" panel listing every edit, and marks the three passages written by
Claude inline so they could be spotted rather than hunted.

---

## Phase 7 — Verifying the figures

Clifton delegated the remaining decisions. The citation gap was the one worth
real work, so every load-bearing figure was checked against its source.

### The correction

**The 40% was real.** The U.S. Chamber's fourth-edition report states 58% in
2025, "up from 40% in 2024." Removing it had deleted a legitimate data point.
It was restored with a citation, and the 2024 figure was added to the
executive summary where it had been missing — which is the outcome that should
have happened in the first place.

### What verification found

| Figure | Outcome |
|---|---|
| 23 / 40 / 58% adoption | ✅ U.S. Chamber, 4th ed., Aug 2025 |
| 5 and 11.5 hours, 66% revenue | ✅ SBE Council, March 2026 |
| 19.8% Census, Nov 2025 wording change | ✅ Confirmed, 17 Nov 2025 |
| 57% in three or fewer functions | ✅ BTOS AI supplement, Nov 2025–Jan 2026 |
| 20% capture 74% | ✅ PwC 2026 AI Performance Study, April 2026 |
| 8% → 21%, and 53% planning | ✅ Thomson Reuters, 2025 GenAI report |
| 14% fully embedded | ✅ Goldman Sachs 10,000 Small Businesses |
| NBER customer-support study | ✅ Brynjolfsson, Li & Raymond, WP 31161 |
| **30.6% for firms with 250+** | ❌ **Census publishes 37%** |

The size gradient was rewritten to the published figures with the reference
week stated. The argument is unchanged; the numbers now survive checking.

**No citation was invented.** Where a source could not be confirmed it was
flagged rather than filled in with something plausible.

---

## Phase 8 — Go live

Clifton said to go. One concern was stated for the record — neither lead form
had been submitted through a real browser — and then the switch was thrown.

**The change:** `ssoProtection.deploymentType` from `all` to
`all_except_custom_domains`, via the **Vercel REST API**. The Vercel MCP tool
was deliberately not used: its enum omits that value, and its nearest option
leaves the main alias publicly readable. This trap was documented on day 1.

**Verified anonymously**, checking landing-page *content* rather than status
codes — the day-1 trap was a `curl -L` that followed a redirect to Vercel's
login page, which returns 200:

| Check | Result |
|---|---|
| `www.raclifton.com` | Real page, correct title, **zero** login markers |
| `raclifton.com` | 308 → www |
| Research PDF | 200, `application/pdf`, 1.2 MB |
| Raw `*.vercel.app` URLs | **Still gated** ✓ |

### Both lead paths tested against the public site

First attempt failed with validation errors on both endpoints. Reading the
route code showed why: `ctaOrigin` in `/api/research-report` is
`z.literal("why_ai_research_section")`, so the made-up value was rejected —
and the second call then inherited an empty UUID from the first failure.

Retried correctly: report lead written, `emailSent: true`, assessment lead
written and joined back. The attribution join was confirmed by direct query,
then both test rows were purged. Tables back to 0.

### One false alarm, checked properly

Gmail's text extraction showed the UUID in the report email two characters
short, which would have broken attribution from email clicks. Pulling the raw
bytes showed `rr=3D3ddc0e5a…` — quoted-printable encoding for `rr=3ddc0e5a…`.
The link was intact; the extractor had mis-decoded it. Both links were then
fetched and confirmed to resolve.

This also closed the long-standing stale-link item: the earlier test emails
predated the canonical-URL switch and pointed at `localhost` and an old
`*.vercel.app` address.

**Tagged `v14.1.2-live`** and pushed.

---

## What is still not done

The site is public, but **neither lead form has been submitted through an
actual browser.** Every test has gone to the API, which bypasses the
`sessionStorage` handoff carrying `rac_research_lead_id` from the research
report modal to the assessment form.

The database join is proven. The browser-side step that populates it is not.
If it is broken, live attribution will silently record `null`.

Safari has also never been opened against the site.
