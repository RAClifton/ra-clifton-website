# Assessments copy, report cover, and social links — design

**Date:** 2026-09-19
**Status:** approved by Clifton
**Scope:** five changes to the single-page site. Copy and presentation only. No
funnel, form, API, or database behavior changes.

## Premise check

Clifton supplied a screenshot of the assessments section. It did **not** match
either the live site or the local repository:

| | Screenshot | Live site + repo |
|---|---|---|
| Eyebrow | R.A. CLIFTON BUSINESS ASSESSMENTS | COMPLIMENTARY BUSINESS ASSESSMENTS |
| Card 1 time | 7–10 minutes | ~5 minutes |
| Card 2 subtitle | WHERE CAN AI CREATE THE MOST VALUE? | Where are our biggest AI opportunities? |
| Card 3 description | …support clearer reporting, stronger decisions, and better control. | …measure up and where to improve for clearer, more confident decisions. |

Confirmed with Clifton before designing: the screenshot is a **mockup of the
target**, not a picture of a deployed page. Card copy is therefore transcribed
from the mockup.

All layout decisions below were measured from the rendered page via Playwright
against `npm run dev`, not estimated from the mockup.

## 1. Section eyebrow

`.assessment-image14-copy .eyebrow`:
`COMPLIMENTARY BUSINESS ASSESSMENTS` → `BUSINESS INTELLIGENCE ASSESSMENTS`

The mockup shows `R.A. CLIFTON BUSINESS ASSESSMENTS`; Clifton's written
instruction supersedes it and he confirmed the exact string.

## 2. Assessment card copy

| Card | `.q` subtitle | `.desc` | `.meta` |
|---|---|---|---|
| AI Readiness Score™ | How ready is your business? | See where you stand, what's working, and where AI can create the most value. | ◷ 7–10 minutes |
| AI Opportunity Finder™ | Where can AI create the most value? | Identify the highest-impact opportunities to save time, reduce costs, and improve growth. | ◷ ~5 minutes |
| Financial Clarity Score™ | Can you trust your numbers? | See how your financial systems support clearer reporting, stronger decisions, and better control. | ◷ ~5 minutes |
| Business Intelligence Score™ | Are you turning information into action? | Understand how well your business turns data into insights, decisions, and practical growth. | ◷ ~5 minutes |

Badges, card artwork, titles, and button labels are unchanged. `.q` is uppercased
by CSS (`text-transform:uppercase`), so source stays sentence case.

## 3. Description alignment

Measured line boxes: `.card h3` = 26px per line, `.q` = 11px per line.

Measured description offsets before the change:

| Viewport | Card layout | Description tops |
|---|---|---|
| 1440 / 1280 | 4 columns | 1759, 1770, 1759, 1770 — **11px out** |
| 1024 | 2 columns | aligned within each row |
| 820 / 393 | carousel, 308px cards | 2137, 2174, 2163, 2174 — **37px out** |

Cause: cards 2 and 4 have two-line subtitles and cards 1 and 3 have one-line;
on narrow cards the titles differ in line count too.

Fix: reserve two lines on both.

```css
.card h3{min-height:52px}
.q{min-height:22px}
```

`min-height` is a floor, so a title that genuinely needs three lines at ≤359px
still renders in full. `.meta` and the CTA already align via
`.desc{min-height:92px}` + `.meta{margin-top:auto}` and are untouched.

## 4. Research report cover image

**Rejected placement.** At ≥1024px `.why-ai-now-wrap` is already a two-column
grid: `.why-ai-now-intro` left, `.why-ai-evidence` (the 01/02/03 stat cards)
right. The right column is not free.

**Chosen placement.** The left column runs out of content roughly 250px before
the stat column ends. The cover fills that gap, sitting beside the existing
trigger:

- New wrapper `.why-ai-report-offer` holds a cover button and the existing
  `.research-report-trigger`, side by side from 768px up, stacked below that.
- Cover is `/assets/report-cover.jpg` (560×726, already in the repo and already
  used inside the modal), rendered at 180px wide.
- The cover is a `<button>` carrying the `research-report-trigger` class, so the
  existing listener in `ResearchReportLeadMagnet.tsx` opens the same modal. That
  component currently binds `querySelector` (first match only) — it must move to
  `querySelectorAll` so both the cover and the text link stay live.
- `aria-label` on the cover; the `<img>` keeps descriptive alt text.

## 5. Footer social links

A row of four links between `.footnav` and `.legal`:

| Network | URL |
|---|---|
| LinkedIn | https://www.linkedin.com/in/raclifton1 |
| YouTube | https://www.youtube.com/@raclifton |
| X (Twitter) | https://x.com/RACliftonCPA |
| Facebook | https://www.facebook.com/racliftoncpa |

- Inline SVG paths — no icon font, no third-party request.
- `target="_blank" rel="noopener noreferrer"`, `aria-label` per link.
- 44×44px hit targets, matching the existing `.footnav a` minimum.
- `currentColor` fill at `rgba(255,255,255,.8)`, gold on hover — matching the
  footer links already there.

## 6. Year count consistency

Clifton asked for "Trusted Experience / 20+ Years" in the closing section. The
"Who We Are" card separately claims "30+ years". He confirmed both change:

- `.trust-box`: `Trusted Expertise` / `30+ Years` → `Trusted Experience` / `20+ Years`
- `.firm-image8-card`: `30+ years of accounting, finance, and business experience`
  → `20+ years …`

## Out of scope

- The footer renders as one narrow left-hand column with ~75% of the width empty
  at 1440px. Noted, not changed — no approval to restyle the footer.
- No change to the hero, forms, referral module, or the report email.

## Verification

1. `npm run build` clean.
2. `npx tsc --noEmit` clean.
3. Re-measure description tops at 1440 / 1280 / 1024 / 820 / 393 — all four
   cards equal within each row.
4. Screenshot assessments, research, close, and footer sections at 1440 and 393
   and compare against the before captures.
5. Confirm both the cover and the text link open the report modal.
