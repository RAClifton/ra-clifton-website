# Session Handoff — R.A. Clifton® Website

**Last updated:** 15 September 2026, end of session 2
**Status:** 🟢 **LIVE** at https://www.raclifton.com

Operating detail and step-by-step procedures live in
[OPERATIONS.md](OPERATIONS.md). Current checklist state lives in
[../LAUNCH-CHECKLIST.md](../LAUNCH-CHECKLIST.md). A detailed account of how
session 2 went is in [SESSION-2-TRANSCRIPT.md](SESSION-2-TRANSCRIPT.md).

---

## Quick reference

| Thing | Value |
|---|---|
| **Live site** | https://www.raclifton.com (public since 15 Sep 2026) |
| **Apex** | https://raclifton.com → 308 → www |
| **Production tag** | `v14.1.2-live` |
| **Latest commit** | `95a516e` |
| **Vercel project** | `prj_jy6MvHCgCaSeTYqY9zRACtcL2eoC` |
| **Vercel team** | `team_UKZCLZYnq61v3vUYRQsJMoBr` |
| **Cloudflare zone** | `a6300e75ca596fef9695eb21fe9d8441` |
| **Cloudflare account** | `5f241903ddae66f188647be0e53f2077` |
| **Neon project** | `billowing-union-62928118` |
| **Protection setting** | `ssoProtection.deploymentType = all_except_custom_domains` |
| **Vercel token expires** | **14 October 2026** |
| **TLS cert expires** | 14 December 2026 (auto-renews) |
| **Project root** | `~/Desktop/Claude Code Projects_temp d260629/ra-clifton-website/ra-clifton-website` |
| **Research report live** | 15-page merged edition, 489,498 bytes |
| **Local master** | `~/Desktop/RA_Clifton_AI_for_Small_Business_v3_MERGED.pdf` |
| **Report HTML source** | session scratchpad — regenerate via headless Chrome |
| **Report review page** | https://claude.ai/artifact/3mFdeShK3sQMJtPji5GNJ8 |
| **Brand mark** | **™** everywhere — not registered, so ® would be improper |

Credentials: `.env.local` (app), `~/.raclifton-setup-tokens` (Cloudflare +
Vercel), `~/.raclifton-db` (Neon). Never committed, never pasted into chat.

---

## Continuation prompt

Paste this into a **new Claude Code session** started from the project root.

```text
Resume work on the R.A. Clifton website (v14.1.2).

Read these first, in order:
  1. CLAUDE.md                     - locked scope and change discipline
  2. docs/OPERATIONS.md            - operating manual, credentials map, SOPs 1-8
  3. LAUNCH-CHECKLIST.md           - what is done vs outstanding
  4. docs/SESSION-HANDOFF.md       - this file
  5. docs/SESSION-2-TRANSCRIPT.md  - how the launch session actually went

STATE AS OF 15 SEP 2026 - THE SITE IS LIVE
https://www.raclifton.com is public. Protection is
ssoProtection.deploymentType = "all_except_custom_domains", so the custom
domain serves everyone while raw *.vercel.app URLs stay behind Vercel login.
Production baseline tagged v14.1.2-live. Latest commit 95a516e, tree clean.

VERIFIED WORKING
  - both lead paths through a REAL browser (Chrome via DevTools Protocol):
    the report modal stores rac_research_lead_id itself, the assessment form
    reads it back, and the database join returned true. SOP 6 is closed.
  - inbound mail to research@raclifton.com forwards to Gmail (header-verified,
    SRS Return-Path and a cloudflare-email.net hop)
  - report emails send and their links resolve to www.raclifton.com
  - the 15-page research report serves at /research/ (489,498 bytes)

THE BRAND MARK IS NOW ™, NOT ®
R.A. Clifton is not a registered mark, so ® was improper. All seven site
occurrences were swapped to ™ (page title, OpenGraph description, header and
footer lockups, and the report email in both plain text and HTML). Product
marks - AI Readiness Score™ and the rest - were already correct and untouched.
If the mark is ever registered, swap all seven back to ® in one pass.

FIRST THING TO DO: PURGE TEST DATA
The lead tables hold 7 test rows, all from alphaonerac@gmail.com:
  research_report_leads : Tom Jones, R So, Ne Report, New Report2, Taz Ja
  website_leads         : R Test, Tom J
Confirm with Clifton that none are real, then delete them so the tables are
clean for genuine leads. OPERATIONS.md SOP 2 has the queries.

Note both assessment rows show research_report_lead_id = null. That is
CORRECT, not a bug - neither came through the report modal. Attribution only
populates when someone requests the report and then clicks through from the
success screen in the same tab without reloading.

OPEN ITEMS
  1. Three passages in the research report are Claude's copy, not Clifton's,
     and have never been signed off. They are marked NEW COPY inline at
     https://claude.ai/artifact/3mFdeShK3sQMJtPji5GNJ8 - section 2 "The
     practical test" callout, the closing paragraph of section 3 on
     deliberateness, and the section 4 "If you are not in professional
     services" callout plus the paragraph after it. Cut any Clifton rejects
     and republish.
  2. Safari has still never been opened against the live site.
  3. A deeper evidence pass is available. The pre-merge edition is in git at
     37e78cc~1:public/research/... and still contains material not folded in:
     Federal Reserve adoption growth, BCG leader/laggard multiples, METR's
     finding that experienced developers were SLOWER with AI, hallucination
     rate ranges, AI incident counts, wage premium data, and a
     profession-specific 90-day plan.
  4. Delete ~/.raclifton-setup-tokens and ~/.raclifton-db when Clifton says
     so. Not automatic - the Vercel token is the only way to change deployment
     protection from here and the Neon URL the only way to read leads.
  5. Vercel token expires 14 Oct 2026. OPERATIONS.md SOP 4.
  6. Recommended to Clifton, not yet acted on: register copyright in the
     research report. Copyright, not trademark, is what protects the content,
     and US law requires registration before you can sue. Registering within
     three months of publication unlocks statutory damages and fees.

CONSTRAINTS
  - CLAUDE.md governs: smallest safe changes only. No redesign, no Tailwind,
    no ORM, no refactors, no dependency upgrades without a concrete reason.
  - Never paste secrets into chat. Use the scoped-api-token-workflow skill.
  - The project root is nested: ra-clifton-website/ra-clifton-website
  - Do NOT use the Vercel MCP tool to change deployment protection. Its enum
    omits "all_except_custom_domains" and the nearest option leaves the main
    alias publicly readable. Use the REST API - SOP 7.
  - Two elements are intentionally inert: the header hamburger and the five
    "Not sure where to start?" chips. Styling but no JavaScript. Not bugs.
  - If you regenerate the research report PDF, keep the filename. Every
    report email ever sent points at that exact path - SOP 8.

TRAPS - DO NOT RE-LEARN THESE
  - A gated Vercel site returns 200, because its login page is a real page.
    Check the page title or grep for vercel.com/login, never the status code.
  - Testing email forwarding with a Bcc to yourself proves nothing. Gmail
    deduplicates by Message-ID and you see the Bcc copy. Cloudflare also
    refuses mail whose sender domain is the routed domain, so Resend can
    never be the test sender. Personal skill: verify-email-routing.
  - Georgia ships only old-style figures. Digits vary in height by design and
    no font property fixes it. globals.css has a worked example.
  - Date every Census figure. 30.6% (Nov 2025-Feb 2026 supplement) and 37%
    (May 2026) are both correct; an undated figure looks wrong to a checker.
  - next dev rewrites next-env.d.ts to .next/dev/types. Never commit that -
    revert it and re-run npm run build first.
  - LOOK AT THE RENDERED PAGE, not just the PDF. A CSS bug shipped through
    seven artifact publishes because only the PDF was ever screenshotted.
  - display:grid on an <li> makes EVERY child a grid item, so a leading <b>
    takes column 2 and the following text wraps into column 1. Position such
    markers absolutely instead.
  - Chrome headless clamps --window-size to ~485px and a local artifact file
    has no viewport meta (the publish wrapper adds it), so it falls back to
    980px. Neither tests phone layout. Use CDP
    Emulation.setDeviceMetricsOverride against a copy with the meta injected.

Start by confirming current state rather than trusting this summary: check
git status, that npm run build passes, that the site is publicly reachable
while *.vercel.app URLs are still gated, and what is actually in the lead
tables.
```

---

## What happened in session 2

| # | Step | Result |
|---|---|---|
| 1 | Confirmed real state vs the day-1 summary | Site still gated, tree clean |
| 2 | Proved inbound email forwarding works | Took 4 attempts — see below |
| 3 | Browser QA at 8 widths, Chrome | Passed; 2 defects found |
| 4 | Fixed tablet hero overlap and the "5 HOURS" numeral | Commit `9e25f8e` |
| 5 | Reviewed the research report | 14 issues raised |
| 6 | Rebuilt the report as a 14-page PDF + web review page | Overflow check caught a real clipping bug |
| 7 | Verified every load-bearing figure against its source | One restored, one corrected |
| 8 | Made the site public, tested both paths, tagged baseline | Commit `7885e4b`, tag `v14.1.2-live` |

---

## Decisions worth not relitigating

**The stacked tablet dashboard reuses an existing approved rule.** The CSS to
stack the dashboard below the portrait already existed but was scoped to
`max-width:767px`, where it never ran. Widening it to `1023px` was the minimal
fix; no new layout was invented.

**The "5 HOURS" fix is a transform, not a font property, and cannot be
otherwise.** Georgia ships only old-style figures and exposes no `lnum`
OpenType feature. `font-variant-numeric` is a no-op in this typeface. The
`.178em` nudge is exactly one descender depth, measured from the font file.
There is a comment in `globals.css` saying so — do not "simplify" it.

**The `5` in `58%` deliberately keeps Georgia's stagger.** Fixing it would
require changing the typeface for digits. Clifton chose surgical over
consistent.

**Desktop ≥1280px was deliberately left untouched** during the tablet fix.

**The report PDF uses Baskerville, not Georgia.** Georgia and Charter both
use old-style figures — the same problem just fixed on the site. In a
numbers-heavy report that would have been a poor choice.

**Nothing was published without a verified source.** Where a figure could not
be confirmed it was flagged, never filled in with a plausible-looking citation.

---

## Traps that cost time — don't re-learn these

| Looked like | Actually was |
|---|---|
| Inbound email test succeeded | It was the **Bcc copy**, delivered Gmail-to-Gmail. The real forwarded copy was deduplicated by `Message-ID`. Check `Return-Path` for an SRS rewrite and look for a `cloudflare-email.net` hop. |
| Cloudflare was rejecting Claude's test mail | Cloudflare refuses mail whose **sender domain is the routed domain** (loop prevention). Resend can only send from `raclifton.com`, so it can never be the test sender. |
| A report email had a truncated UUID | Quoted-printable encoding. `rr=3D3ddc0e5a…` decodes to `rr=3ddc0e5a…`. Gmail's text extractor mis-decoded it; the raw bytes were fine. |
| The "5" was a CSS alignment bug | Georgia's **old-style figures**. The `5` glyph spans −365..1073 against a cap height of 1419. Not fixable with a font property. |
| The page looked fine in the PDF | Page 7 was **clipping an entire paragraph**. Fixed-height pages hide overflow silently — measure it, don't eyeball it. |
| A data point looked fabricated | The 2024 "40%" was **real** — it was missing from the prose, not invented. Verify before deleting. |
| `next-env.d.ts` showed as modified | `next dev` rewrites it to `.next/dev/types/`. Never commit that — revert it and re-run `npm run build` before committing. |

Also still true from day 1: `curl -L` follows redirects to Vercel's login page,
which returns **200**. Check the landing page content, not the status code.

---

## Current state

- Site public, HTTPS, apex redirecting, deployment URLs still gated
- Both lead tables at 0 rows, ready for real leads
- Inbound and outbound email both proven end-to-end
- Production baseline tagged, working tree clean, in sync with GitHub
- Revised research report exists as a PDF and a web page, **not yet published
  to the site**
