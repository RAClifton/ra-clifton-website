# v14.2 — Live Hero, Dual CTAs, Working Chips, Referral Link Fix

**Date:** 2026-09-15
**Status:** Awaiting approval
**Governing release:** v14.1.2 → v14.2
**Requested by:** R.A. Clifton

---

## 1. Why this change

Four problems were raised, plus two more found while investigating.

| # | Problem | Source |
|---|---------|--------|
| 1 | Hero has one CTA; needs two, pointing at different sections | Requested |
| 2 | Hero content looks fuzzy and unclear | Requested |
| 3 | "Not sure where to start?" chips don't respond to clicks | Requested |
| 4 | Chip selections aren't captured for marketing/sales | Requested |
| 5 | Referral email contains no link | Requested (screenshot) |
| 6 | Desktop nav bar exists only as a picture | Found during investigation |

### Root cause of 1, 2 and 6

The hero is not one component. It renders three different ways:

| Breakpoint | What the hero is |
|---|---|
| ≥1024px | Flat WEBP, `773 × 515px`, stretched to full window width |
| 768–1023px | Live HTML |
| ≤767px | Flat WEBP, `851 × 1697px`, with one invisible tap-target |

`app/globals.css:44-48` and `app/globals.css:763-767` switch the live hero off above and below the tablet range.

**Fuzziness:** a 773px-wide image stretched across a 1440–1920px window is a 2× enlargement in CSS pixels and roughly 4× in device pixels on a high-DPI display. The dark background treatment is not the problem; raster magnification is.

**One CTA:** text baked into a raster image cannot be re-worded. Item 1 is therefore impossible without fixing item 2. They are one change.

**Dead button:** `.desktop-hero-reference` contains an `<img>` and no anchor. Above 1024px the hero CTA is a picture of a button and does nothing when clicked.

**Missing nav:** the real `<header>` contains a brand and a `☰` button with no click handler. The Solutions / Resources / About / Insights / Contact / search nav visible on the live site is painted into the hero image. `header` is additionally set to `display:none` at both ≥1024px and ≤767px, so the real header only ever renders on tablet.

### A complication: there is no clean hero photograph

`public/assets/v12-24f43fbd9c88.webp` (380 × 470), used by the live HTML hero, is itself a crop of a screenshot of the original design comp. Baked into its pixels: `"REAL INSIGHTS. A STRONG…"`, a metrics dashboard showing `$7.4M` and `36.7%`, `"A Stronger Tomorrow"`, `"Private and secure."`, and sliced word fragments from the original body paragraph.

The live hero currently layers a real `.dash` card on top of a photo that already has a dashboard printed on it. A new photograph is required.

### Root cause of 3 and 4

No click handler for `.chips button` exists anywhere in the codebase. `#chip-result` is never written to. The selected-state styling `.chips button.sel` **already exists** at `app/globals.css:29` and has simply never been activated. This is wiring, not design.

### Root cause of 5

The `mailto:` in `app/page.tsx` is static and its body reads *"Open this page and enter your own name and email"* — with no URL anywhere in it. It also carries no referral code, so email referrals have been invisible to attribution, while the adjacent "Copy Referral Link" button correctly builds `?ref=<code>#assessment-interest`.

---

## 2. Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Hero approach | Live HTML at all breakpoints | Sharp text at any size and zoom; copy stays editable; ~300KB lighter; readable by search engines and screen readers |
| Button hierarchy | Score = gold primary, Research = outline secondary | Project rules name the Score as primary conversion path and the Report as secondary; two equal-weight buttons force a choice, and choosing is friction |
| Research button copy | Full headline verbatim | User preference; continuity with the section it lands on |
| Chip behaviour | Light up + recommend + pre-fill form | Actually answers the question the heading poses; a pre-filled form converts better than an empty one |
| Multi-select rule | 2+ chips → recommend free AI Readiness Score™ | The honest answer for someone with several priorities is the free entry point; protects the primary conversion path |
| Growth chip → | AI Opportunity Finder™ | Its own card copy ends "save time, reduce costs, and drive growth"; routing Growth to Business Intelligence would duplicate the Better Decisions chip and strand Opportunity Finder |
| Header nav | Working links + gold CTA only | A nav link that does nothing costs more trust than an absent one |
| Hero photograph | User generates from supplied prompt; build proceeds with gradient placeholder | No image generation tool is available in this session; placeholder keeps the preview unblocked |
| Anonymous chip analytics | Out of scope | Pre-launch traffic is too low for the numbers to be decision-useful; adds a privacy-policy obligation |

---

## 3. Design

### 3.1 Hero — live HTML everywhere

Remove three rules that disable the live hero:

- `app/globals.css:45` — `header{display:none}` at ≥1024px
- `app/globals.css:47` — `.hero{display:none}` at ≥1024px
- `app/globals.css:764-765` — `.hero{display:none!important}` and `.pre{display:none!important}` at ≤767px
- `app/globals.css:774-776` — `header{display:none!important}` at ≤767px

Delete from `app/page.tsx`:

- `<section class="approved-mobile-hero">` — the phone hero picture
- `<section class="desktop-hero-reference">` — the desktop hero picture
- `<section class="mobile-prelaunch-supplement">` — a phone-only duplicate of the pre-launch band, which existed only because `.pre` was hidden. Restoring `.pre` makes it a duplicate.

Delete `public/assets/v12-7242292f4feb.webp` and `public/assets/v12-4d19b6827147.webp`.

The hero visual column keeps the live `.dash` metrics card and gains the four-item feature row from the approved composition (Real Insights / Practical Solutions / Experienced Guidance / A Stronger Tomorrow), rebuilt as real HTML with inline SVG icons. The trust row's text glyphs (`◷ ◇ ▣`) are replaced with inline SVG clock, shield and lock icons to match the approved design.

### 3.2 Hero buttons

```
┏━━━━━━━━━━━━━━━━━━━━━┓  ┌───────────────────────┐
┃ Discover Your AI     ┃  │ AI for Small Business:│
┃ Readiness Score →    ┃  │ The Case for Starting │
┗━━━━━━━ GOLD ━━━━━━━━━┛  │ Now →                 │
                          └─────── OUTLINE ───────┘
     → #assessment-interest       → #why-ai-now
```

New markup inside `.hero-copy`:

```html
<div class="hero-actions">
  <a class="btn" href="#assessment-interest">Discover Your AI Readiness Score →</a>
  <a class="btn btn-outline" href="#why-ai-now">AI for Small Business: The Case for Starting Now →</a>
</div>
```

New CSS: `.hero-actions{display:flex;gap:14px;flex-wrap:wrap;margin-top:28px}` and a `.btn-outline` variant (transparent fill, gold border, gold text, gold-fill on hover). Buttons stack vertically below 768px.

Smooth scrolling needs no new code — `html{scroll-behavior:smooth}` is already set at `app/globals.css:7`.

`#why-ai-now` and `#assessment-interest` both need `scroll-margin-top` sized to the restored header, so landings aren't hidden beneath it.

The research CTA lands at the top of the R.A. Clifton Research section. The existing "Get the Research Report →" button and its download flow are untouched.

**Attribution:** `V12ClientController.tsx:29` currently records `rac_cta_origin` only for `a[href="#assessment-interest"]`. Extend the selector to include `a[href="#why-ai-now"]` so the database distinguishes research-led from score-led leads.

### 3.3 Header

```
┌────────────────────────────────────────────────┐
│ ▐▐█ R.A. Clifton™     Solutions  Insights      │
│ STRATEGY · ADVISORY           ┏━━━━━━━━━━━━━━┓ │
│ · FINANCIAL INTELLIGENCE      ┃ AI Readiness ┃ │
│                               ┃   Score →    ┃ │
│                               ┗━━━━━━━━━━━━━━┛ │
└────────────────────────────────────────────────┘
```

- **Solutions** → `#assessments`
- **Insights** → `#insights`
- Gold CTA → `#assessment-interest`
- Search icon: omitted — no search backend exists
- Resources / About / Contact: omitted — no destinations exist
- `☰`: **removed entirely.** It has no click handler today and opens nothing. With only two nav links, a disclosure menu is not warranted. Below 768px the header renders brand + gold CTA only, with the two nav links hidden — they point at sections the visitor will scroll past anyway.

The brand renders `R.A. Clifton™`, matching the correction made in commit `8a146df`. The current picture still shows `®` and cannot be corrected.

### 3.4 Chips

```
Not sure where to start?
Tell us what you want to improve.

[ AI ] [█EFFICIENCY█] [ Financial Clarity ]
[ Better Decisions ] [█GROWTH█]

→ Start with the AI Readiness Score™ —
  it's free and covers all of these →
```

**Mapping:**

| Chip | Assessment |
|---|---|
| AI | AI Readiness Score™ *(free)* |
| Efficiency | AI Opportunity Finder™ |
| Financial Clarity | Financial Clarity Score™ |
| Better Decisions | Business Intelligence Score™ |
| Growth | AI Opportunity Finder™ |

**Behaviour:**

1. Click toggles `.sel` (existing gold styling) and `aria-pressed`. Multi-select; click again to deselect.
2. `#chip-result` updates:
   - 0 selected → empty
   - 1 selected → "Start with the *<assessment>* →"
   - 2+ selected → "Start with the **AI Readiness Score™** — it's free and covers all of these →"
3. The `→` is a link. Clicking it checks every matching checkbox in `#assessment-interest` and scrolls there.
4. Selections persist to `sessionStorage` under `rac_focus_areas`.

Chips get `type="button"` (currently absent). Form checkboxes get `value` attributes (`ai-readiness`, `ai-opportunity`, `financial-clarity`, `business-intelligence`, `intelligence-brief`) so matching is explicit rather than positional. The existing interest-capture reads label text first and falls back to `value`, so this does not change what is stored.

### 3.5 Referral email

Convert `.referral-secondary` from a static `mailto:` anchor into one whose `href` is built at click time, reusing the URL that `buildSessionReferralCode()` already produces for the copy button:

```
I thought you might find this useful. R.A. Clifton is offering
complimentary pre-launch access to its AI Readiness Score.

Get started here: https://raclifton.com/?ref=rac_a1b2c3#assessment-interest
```

Body is URL-encoded. Both sharing paths now carry identical referral attribution.

### 3.6 Data

```
Clicks chips  →  sessionStorage (their browser)  →  submits name + email
                                                            ↓
                                                  Neon: website_leads
```

New migration `db/003_add_focus_areas.sql`:

```sql
ALTER TABLE website_leads
  ADD COLUMN IF NOT EXISTS focus_areas jsonb NOT NULL DEFAULT '[]'::jsonb;
```

Additive and backward-compatible: the live site keeps working with the column present and unused, so it is safe to apply before any deployment.

`lib/lead-schema.ts` gains:

```ts
focusAreas: z.array(z.string().trim().min(1).max(60)).max(10).default([]),
```

`app/api/leads/route.ts` writes it to `focus_areas` as JSONB, matching the existing `interests` pattern.

Resulting sales view:

| full_name | email | interests | focus_areas | cta_origin |
|---|---|---|---|---|
| Jane Doe | jane@acme.com | ["AI Readiness Score™"] | ["Efficiency","Growth"] | "Discover Your AI Readiness Score" |

---

## 4. Files touched

| File | Change |
|---|---|
| `app/globals.css` | Remove 4 hero/header-hiding rules; add `.hero-actions`, `.btn-outline`, header nav, feature row, scroll offsets |
| `app/page.tsx` | Second hero button; header nav; feature row; remove 3 sections; `type="button"` on chips; `value` on checkboxes |
| `components/V12ClientController.tsx` | Chip logic; recommendation; pre-fill; `focusAreas` in payload; research-CTA attribution; dynamic referral mailto |
| `lib/lead-schema.ts` | Accept `focusAreas` |
| `app/api/leads/route.ts` | Persist `focus_areas` |
| `db/003_add_focus_areas.sql` | **New** |
| `public/assets/v12-7242292f4feb.webp` | **Delete** |
| `public/assets/v12-4d19b6827147.webp` | **Delete** |
| `public/assets/hero-executive.webp` | **New** — supplied by user (see Appendix A) |

---

## 5. Verification

1. `npm run build` passes clean
2. Browser check at **1440px, 1024px, 768px, 393px, 360px**:
   - hero text renders sharp, no raster hero anywhere
   - both hero buttons visible, correctly weighted, and scrolling to the right sections
   - header nav present, both links land correctly, gold CTA works
   - no duplicate pre-launch band on phones
3. Chips: click, verify gold state, verify recommendation text for 1 and for 3 selections, verify pre-fill and scroll
4. Submit a test lead; confirm `focus_areas` and `cta_origin` land in Neon
5. Click "Share by Email"; confirm the draft contains a working URL with `?ref=`
6. Click "Copy Referral Link"; confirm both paths produce the same URL shape
7. Push branch → Vercel preview URL → user review
8. **Merge to production only on explicit approval**

Migration `003` is applied to Neon before the preview deploy.

---

## 6. Out of scope

- Anonymous chip-click analytics for visitors who never submit the form
- Resources / About / Contact pages
- Site search
- Any change to the research report content, PDF, or email flow
- Any change to assessment copy, pricing, or the five-W's, firm, or closing sections

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Live hero won't be pixel-identical to the approved screenshots | Reviewed on preview URL before merge; composition, copy and palette preserved |
| Desktop gains a header bar it visually lacked | Intended — it replaces a blurry painted one whose links never worked |
| Hero photo not ready at preview time | Gradient placeholder; swapping in the real file is a one-line change |
| Production disruption | All work on a branch; `main` and raclifton.com untouched until approval |

---

## Appendix A — Hero photograph specification

**File:** save as `public/assets/hero-executive.webp` (or `.jpg`/`.png` — conversion is trivial)

**Dimensions:** minimum **2000 × 2500px** (4:5 portrait). Larger is fine. This covers a ~950px-wide slot at 2× on high-DPI displays.

**Hard requirements:**

- **No text of any kind in the image** — no labels, no UI, no charts, no dashboards, no numbers, no watermark. This is what ruined the current asset.
- Subject positioned **centre-to-right**, leaving the left third quieter — the headline sits over that side on tablet.
- Dark, low-key exposure. It sits on a `#07131b` navy background and must blend, not float.

**Prompt to paste into your image generator:**

> Photorealistic editorial portrait of a confident executive business advisor in their fifties, wearing a well-tailored charcoal suit, standing in a darkened modern high-rise office at dusk. Floor-to-ceiling windows behind them reveal an out-of-focus city skyline with warm amber lights. Low-key cinematic lighting with a warm gold rim light along the subject's shoulder and jaw, deep navy and charcoal shadows filling the frame. Shot on an 85mm lens at f/1.8, shallow depth of field, subtle film grain. The subject is positioned right of centre, leaving calm negative space on the left. Restrained, premium, corporate-editorial mood. No text, no graphics, no charts, no user interface elements, no logos, no watermarks.

**Negative prompt, if your tool supports one:**

> text, words, letters, numbers, charts, graphs, dashboards, UI elements, logos, watermarks, captions, subtitles, signage

Iterate until the left third is calm and there is genuinely no text anywhere in the frame, then hand the file over.
