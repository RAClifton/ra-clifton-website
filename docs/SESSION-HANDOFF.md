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
| **Latest commit** | `f8095c2` |
| **Vercel project** | `prj_jy6MvHCgCaSeTYqY9zRACtcL2eoC` |
| **Vercel team** | `team_UKZCLZYnq61v3vUYRQsJMoBr` |
| **Cloudflare zone** | `a6300e75ca596fef9695eb21fe9d8441` |
| **Cloudflare account** | `5f241903ddae66f188647be0e53f2077` |
| **Neon project** | `billowing-union-62928118` |
| **Protection setting** | `ssoProtection.deploymentType = all_except_custom_domains` |
| **Vercel token expires** | **14 October 2026** |
| **TLS cert expires** | 14 December 2026 (auto-renews) |
| **Project root** | `~/Desktop/Claude Code Projects_temp d260629/ra-clifton-website/ra-clifton-website` |
| **Revised research report** | `~/Desktop/RA_Clifton_AI_for_Small_Business_v2_2_REVISED.pdf` |
| **Report review page** | https://claude.ai/artifact/3mFdeShK3sQMJtPji5GNJ8 |

Credentials: `.env.local` (app), `~/.raclifton-setup-tokens` (Cloudflare +
Vercel), `~/.raclifton-db` (Neon). Never committed, never pasted into chat.

---

## Continuation prompt

Paste this into a **new Claude Code session** started from the project root.

```text
Resume work on the R.A. Clifton website (v14.1.2).

Read these first, in order:
  1. CLAUDE.md                     - locked scope and change discipline
  2. docs/OPERATIONS.md            - operating manual, credentials map, SOPs
  3. LAUNCH-CHECKLIST.md           - what is done vs outstanding
  4. docs/SESSION-HANDOFF.md       - this file
  5. docs/SESSION-2-TRANSCRIPT.md  - how the launch session actually went

STATE AS OF 15 SEP 2026
The site is LIVE and public at https://www.raclifton.com. Deployment
protection is set to "all_except_custom_domains", so the custom domain is
public while raw *.vercel.app deployment URLs stay gated behind Vercel login.
Production baseline is tagged v14.1.2-live. Both lead tables are at 0 rows.

Verified working on the public site (via API, not a browser):
  - homepage, the 1.2MB research PDF, and the apex redirect
  - research-report form writes to Neon and sends email (email_sent=true)
  - assessment form writes to Neon and joins back to the report lead
  - report email links point at www.raclifton.com and resolve
  - inbound mail to research@raclifton.com forwards to Gmail (header-verified)

THE ONE REAL GAP
Neither lead form has been submitted through an actual browser. Every test
has gone straight to the API, which bypasses the sessionStorage handoff that
carries rac_research_lead_id from the research report modal to the assessment
form. The database join is proven; the browser step that populates it is not.
If it is broken, live attribution silently records null.

To close it: open https://www.raclifton.com in ONE tab, submit the research
report form, then click "Discover Your AI Readiness Score" from the success
screen and submit the assessment form. Do not reload or open a new tab
between the two. Then query the join (OPERATIONS.md SOP 2) to confirm
research_report_lead_id is populated rather than null.

Safari has also never been opened against the site.

OTHER OPEN ITEMS
  1. Delete ~/.raclifton-setup-tokens and ~/.raclifton-db when Clifton says
     so. Not done automatically - the Vercel token is the only way to change
     deployment protection from here, and the Neon URL the only way to read
     leads outside the app.
  2. Vercel token expires 14 Oct 2026. See OPERATIONS.md SOP 4.
  3. The revised research report PDF has not been published to the site. The
     live /research/ PDF is still the older file. Swapping it is a decision
     Clifton has not made yet.
  4. Two elements are intentionally inert in the approved baseline: the header
     hamburger menu and the five "Not sure where to start?" chips. Both have
     styling but no JavaScript. Do not "fix" them without explicit approval.

CONSTRAINTS
  - CLAUDE.md governs: smallest safe changes only. No redesign, no Tailwind,
    no ORM, no refactors, no dependency upgrades without a concrete reason.
  - Never paste secrets into chat. Use the scoped-api-token-workflow skill.
  - The project root is nested: ra-clifton-website/ra-clifton-website
  - Do NOT use the Vercel MCP tool to change deployment protection. Its enum
    omits "all_except_custom_domains" and the nearest option leaves the main
    alias publicly readable. Use the REST API.

Start by confirming current state rather than trusting this summary: check
git status, that the build passes, and that the site is still publicly
reachable while *.vercel.app URLs are still gated.
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
