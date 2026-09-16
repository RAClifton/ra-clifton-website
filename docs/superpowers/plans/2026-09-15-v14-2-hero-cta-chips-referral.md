# v14.2 Hero, CTAs, Chips & Referral — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the raster hero with a live full-bleed HTML hero carrying two distinct CTAs, rebuild the desktop nav that currently exists only as a picture, make the "Not sure where to start?" chips work and capture their selections to Neon, and fix the referral email that ships with no URL in it.

**Architecture:** The page is a single large HTML string (`approvedV12Markup`) injected via `dangerouslySetInnerHTML` in `app/page.tsx`, styled by one global stylesheet, with all interactivity attached imperatively by `components/V12ClientController.tsx` after mount. This plan follows that existing architecture rather than restructuring it. The one new module is `lib/chip-recommendations.ts`, a pure function extracted so the recommendation rule can be unit-tested.

**Tech Stack:** Next.js 16.3.5 (App Router), React 19.1.1, TypeScript 5.7, Zod 4, Neon serverless Postgres, plain CSS, vitest (new, dev-only).

## Global Constraints

- Preserve the approved Minimal Luxury visual direction.
- Preserve AI Readiness Score™ as the primary conversion path; Research Report as secondary.
- Preserve all existing assessment CTAs targeting `#assessment-interest`.
- Responsive policy: `>=1024px` desktop, `768–1023px` tablet, `393px` primary phone, also 390/375/360, `<=359px` compact fallback.
- Brand mark is `R.A. Clifton™` (not `®`) — per commit `8a146df`.
- Do not convert to Tailwind, do not replace the CSS system, do not introduce an ORM, do not add runtime services.
- Server-only env vars (`DATABASE_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`) must never reach client code.
- **`app/page.tsx` line 16 is a single escaped JS string literal.** Every `"` inside the markup is written `\"`. All markup edits must preserve that escaping or the build breaks.
- Do not fabricate testimonials, logos, client results, or case studies.
- No production deploy. All work lands on branch `v14.2-hero-cta-chips`; `main` is untouched.

**Exact copy strings (do not paraphrase):**

| Element | Text |
|---|---|
| Primary hero CTA | `Discover Your AI Readiness Score →` |
| Secondary hero CTA | `AI for Small Business: The Case for Starting Now →` |
| Multi-chip recommendation | `Start with the AI Readiness Score™ — it's free and covers all of these →` |
| Single-chip recommendation | `Start with the <Assessment Name> →` |

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `lib/chip-recommendations.ts` | Pure chip→assessment mapping and recommendation rule | Create |
| `lib/chip-recommendations.test.ts` | Unit tests for the rule | Create |
| `vitest.config.ts` | Test runner config | Create |
| `db/003_add_focus_areas.sql` | Adds `focus_areas` column | Create |
| `lib/lead-schema.ts` | Accepts `focusAreas` | Modify |
| `app/api/leads/route.ts` | Persists `focus_areas` | Modify |
| `app/page.tsx` | Header nav, hero markup, chip/checkbox attributes | Modify |
| `app/globals.css` | Full-bleed hero, header nav, outline button, feature row | Modify |
| `components/V12ClientController.tsx` | Chip behaviour, pre-fill, referral mailto, attribution | Modify |
| `public/assets/hero-executive.webp` | Hero background plate (already converted) | Exists |
| `design-assets/` | Source PNGs, moved out of `public/` | Create |

---

## Task 1: Branch, asset hygiene, and the hero plate

**Files:**
- Move: `public/assets/RAC website background image/` → `design-assets/hero-source/`
- Delete: `public/assets/v12-7242292f4feb.webp`, `public/assets/v12-4d19b6827147.webp`, `public/assets/v12-24f43fbd9c88.webp`
- Verify: `public/assets/hero-executive.webp`

**Interfaces:**
- Produces: `/assets/hero-executive.webp` — the only image the hero references.

**Why:** Anything under `public/` is published to the internet and shipped to Vercel. The 19 MB of source PNGs are design material, not website assets. The three `v12-*` crops are the text-contaminated screenshots being replaced.

- [ ] **Step 1: Create the branch**

```bash
git checkout -b v14.2-hero-cta-chips
git branch --show-current
```

Expected: `v14.2-hero-cta-chips`

- [ ] **Step 2: Confirm the hero plate exists and is valid**

```bash
node -e "require('sharp')('public/assets/hero-executive.webp').metadata().then(m=>console.log(m.width+'x'+m.height, m.format))"
```

Expected: `1536x1024 webp`

If this fails, regenerate it:

```bash
node -e "
require('sharp')('design-assets/hero-source/RAC site bckg Image 2*_ChatGPT Image Sep 15, 2026, 10_11_45 PM.png')
  .webp({quality:82, effort:6}).toFile('public/assets/hero-executive.webp').then(i=>console.log(i.width+'x'+i.height, (i.size/1024).toFixed(0)+'KB'))"
```

- [ ] **Step 3: Move design sources out of the published folder**

```bash
mkdir -p design-assets
git mv "public/assets/RAC website background image" design-assets/hero-source 2>/dev/null \
  || mv "public/assets/RAC website background image" design-assets/hero-source
du -sh design-assets/hero-source
ls public/assets/
```

Expected: `design-assets/hero-source` is ~19M; `public/assets/` no longer lists the folder.

- [ ] **Step 4: Delete the superseded raster crops**

```bash
rm -f public/assets/v12-7242292f4feb.webp public/assets/v12-4d19b6827147.webp public/assets/v12-24f43fbd9c88.webp
ls public/assets/
```

Expected: only `hero-executive.webp` (plus any unrelated files).

- [ ] **Step 5: Verify nothing still references the deleted files**

```bash
grep -rn "v12-7242292f4feb\|v12-4d19b6827147\|v12-24f43fbd9c88" app components lib || echo "NO REFERENCES — expected to fail until Task 5"
```

Expected at this point: matches in `app/page.tsx`. That is correct — Task 5 removes them. Note them and continue.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Move design sources out of public/ and retire the raster hero crops

The RAC background PNGs are design material, not website assets; under
public/ they were being published and deployed (19MB). The three v12-*
crops are the text-contaminated screenshots the live hero replaces.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: Chip recommendation logic (pure module, unit tested)

**Files:**
- Create: `lib/chip-recommendations.ts`
- Create: `lib/chip-recommendations.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json` (devDependency + `test` script)

**Interfaces:**
- Produces:
  - `type AssessmentKey = "ai-readiness" | "ai-opportunity" | "financial-clarity" | "business-intelligence"`
  - `ASSESSMENT_LABELS: Record<AssessmentKey, string>`
  - `CHIP_TO_ASSESSMENT: Record<string, AssessmentKey>`
  - `type Recommendation = { primary: AssessmentKey; message: string; checkboxValues: AssessmentKey[] }`
  - `recommendFromChips(chips: string[]): Recommendation | null` — returns `null` when nothing recognisable is selected
- Consumed by: Task 6 (`V12ClientController.tsx`).

**The rule:** zero chips → `null`. One chip → recommend that chip's assessment. Two or more → recommend the free AI Readiness Score™, and pre-check it alongside every matched assessment.

- [ ] **Step 1: Install vitest**

```bash
npm install -D vitest@^3
```

Expected: `package.json` gains `vitest` under `devDependencies`. No production dependency changes.

- [ ] **Step 2: Add the test script**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Write the failing tests**

Create `lib/chip-recommendations.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { recommendFromChips, ASSESSMENT_LABELS } from "./chip-recommendations";

describe("recommendFromChips", () => {
  it("returns null when nothing is selected", () => {
    expect(recommendFromChips([])).toBeNull();
  });

  it("recommends the mapped assessment for a single chip", () => {
    const result = recommendFromChips(["Financial Clarity"]);
    expect(result).not.toBeNull();
    expect(result!.primary).toBe("financial-clarity");
    expect(result!.message).toBe("Start with the Financial Clarity Score™ →");
    expect(result!.checkboxValues).toEqual(["financial-clarity"]);
  });

  it("maps Growth to the AI Opportunity Finder", () => {
    const result = recommendFromChips(["Growth"]);
    expect(result!.primary).toBe("ai-opportunity");
    expect(result!.message).toBe("Start with the AI Opportunity Finder™ →");
  });

  it("maps AI to the free AI Readiness Score", () => {
    const result = recommendFromChips(["AI"]);
    expect(result!.primary).toBe("ai-readiness");
  });

  it("recommends the free AI Readiness Score when several chips are selected", () => {
    const result = recommendFromChips(["Efficiency", "Growth", "Better Decisions"]);
    expect(result!.primary).toBe("ai-readiness");
    expect(result!.message).toBe(
      "Start with the AI Readiness Score™ — it's free and covers all of these →"
    );
  });

  it("pre-checks the free assessment plus every match when several are selected", () => {
    const result = recommendFromChips(["Efficiency", "Better Decisions"]);
    expect(result!.checkboxValues).toEqual([
      "ai-readiness",
      "ai-opportunity",
      "business-intelligence",
    ]);
  });

  it("deduplicates chips that map to the same assessment", () => {
    const result = recommendFromChips(["Efficiency", "Growth"]);
    expect(result!.checkboxValues).toEqual(["ai-readiness", "ai-opportunity"]);
  });

  it("ignores unrecognised chip labels", () => {
    const result = recommendFromChips(["Efficiency", "Nonsense"]);
    expect(result!.primary).toBe("ai-readiness");
    expect(result!.checkboxValues).toEqual(["ai-readiness", "ai-opportunity"]);
  });

  it("returns null when every chip is unrecognised", () => {
    expect(recommendFromChips(["Nonsense", "Gibberish"])).toBeNull();
  });

  it("treats a single chip plus an unknown chip as a single recommendation", () => {
    const result = recommendFromChips(["Growth", "Nonsense"]);
    expect(result!.primary).toBe("ai-opportunity");
    expect(result!.checkboxValues).toEqual(["ai-opportunity"]);
  });

  it("labels every assessment key with a trademarked name", () => {
    for (const label of Object.values(ASSESSMENT_LABELS)) {
      expect(label.endsWith("™")).toBe(true);
    }
  });
});
```

- [ ] **Step 5: Run the tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `Failed to resolve import "./chip-recommendations"`.

- [ ] **Step 6: Write the implementation**

Create `lib/chip-recommendations.ts`:

```ts
export type AssessmentKey =
  | "ai-readiness"
  | "ai-opportunity"
  | "financial-clarity"
  | "business-intelligence";

export const ASSESSMENT_LABELS: Record<AssessmentKey, string> = {
  "ai-readiness": "AI Readiness Score™",
  "ai-opportunity": "AI Opportunity Finder™",
  "financial-clarity": "Financial Clarity Score™",
  "business-intelligence": "Business Intelligence Score™",
};

/** Chip label (as rendered in the markup) → the assessment it points at. */
export const CHIP_TO_ASSESSMENT: Record<string, AssessmentKey> = {
  "AI": "ai-readiness",
  "Efficiency": "ai-opportunity",
  "Financial Clarity": "financial-clarity",
  "Better Decisions": "business-intelligence",
  "Growth": "ai-opportunity",
};

export type Recommendation = {
  primary: AssessmentKey;
  message: string;
  checkboxValues: AssessmentKey[];
};

/**
 * "Not sure where to start?" answers with exactly one next step.
 *
 * One chip names that chip's assessment. Two or more names the free
 * AI Readiness Score, because the honest answer for someone with several
 * priorities is the free entry point rather than a paid assessment.
 */
export function recommendFromChips(chips: string[]): Recommendation | null {
  const matched = chips
    .map((chip) => CHIP_TO_ASSESSMENT[chip])
    .filter((key): key is AssessmentKey => Boolean(key));

  if (matched.length === 0) return null;

  if (matched.length === 1) {
    const primary = matched[0];
    return {
      primary,
      message: `Start with the ${ASSESSMENT_LABELS[primary]} →`,
      checkboxValues: [primary],
    };
  }

  const unique = Array.from(new Set<AssessmentKey>(["ai-readiness", ...matched]));
  return {
    primary: "ai-readiness",
    message: `Start with the ${ASSESSMENT_LABELS["ai-readiness"]} — it's free and covers all of these →`,
    checkboxValues: unique,
  };
}
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
npm test
```

Expected: PASS — 11 passed.

- [ ] **Step 8: Commit**

```bash
git add lib/chip-recommendations.ts lib/chip-recommendations.test.ts vitest.config.ts package.json package-lock.json
git commit -m "Add the chip recommendation rule as a tested pure module

One chip names that chip's assessment; two or more name the free AI
Readiness Score, since the honest answer for someone with several
priorities is the free entry point rather than a paid assessment.

Extracted from the controller so the branching rule is unit-testable.
Adds vitest as a dev-only dependency; no runtime dependency changes.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: Persist focus areas to Neon

**Files:**
- Create: `db/003_add_focus_areas.sql`
- Create: `lib/lead-schema.test.ts`
- Modify: `lib/lead-schema.ts`
- Modify: `app/api/leads/route.ts:22-27`

**Interfaces:**
- Consumes: `AssessmentKey` values are *not* what is stored — `focusAreas` holds the human-readable chip labels (`"Efficiency"`, `"Growth"`), so the sales view reads plainly.
- Produces: `leadSchema` accepts an optional `focusAreas: string[]`, defaulting to `[]`. Task 6 sends it.

- [ ] **Step 1: Write the migration**

Create `db/003_add_focus_areas.sql`:

```sql
-- v14.2: capture which improvement areas a lead selected in the
-- "Not sure where to start?" chips before they submitted the form.
ALTER TABLE website_leads
  ADD COLUMN IF NOT EXISTS focus_areas jsonb NOT NULL DEFAULT '[]'::jsonb;
```

This is additive and backward-compatible: the currently-deployed code never mentions the column, so applying it to the live database changes nothing until the new code ships.

- [ ] **Step 2: Write the failing schema tests**

Create `lib/lead-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { leadSchema } from "./lead-schema";

const base = { fullName: "Jane Doe", email: "jane@example.com" };

describe("leadSchema focusAreas", () => {
  it("defaults focusAreas to an empty array when omitted", () => {
    const parsed = leadSchema.parse(base);
    expect(parsed.focusAreas).toEqual([]);
  });

  it("accepts a list of focus areas", () => {
    const parsed = leadSchema.parse({ ...base, focusAreas: ["Efficiency", "Growth"] });
    expect(parsed.focusAreas).toEqual(["Efficiency", "Growth"]);
  });

  it("rejects more than ten focus areas", () => {
    const tooMany = Array.from({ length: 11 }, (_, i) => `Area ${i}`);
    expect(() => leadSchema.parse({ ...base, focusAreas: tooMany })).toThrow();
  });

  it("rejects an over-long focus area", () => {
    expect(() =>
      leadSchema.parse({ ...base, focusAreas: ["x".repeat(61)] })
    ).toThrow();
  });

  it("still requires a name and an email", () => {
    expect(() => leadSchema.parse({ focusAreas: ["Growth"] })).toThrow();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `expected undefined to deeply equal []`.

- [ ] **Step 4: Add the field to the schema**

In `lib/lead-schema.ts`, add one line directly after the `interests` line:

```ts
  focusAreas: z.array(z.string().trim().min(1).max(60)).max(10).default([]),
```

The full object becomes:

```ts
export const leadSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  interests: z.array(z.string().trim().min(1).max(160)).max(10).default([]),
  focusAreas: z.array(z.string().trim().min(1).max(60)).max(10).default([]),
  ctaOrigin: z.string().trim().max(160).optional(),
  referredBy: z.string().trim().max(80).optional(),
  sessionReferralCode: z.string().trim().max(80).optional(),
  researchReportLeadId: z.string().uuid().optional(),
});
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS — 16 passed.

- [ ] **Step 6: Persist the column in the API route**

In `app/api/leads/route.ts`, add `focusAreas` to the destructure and the INSERT. Replace lines 21–27 with:

```ts
  const referralCode = parsed.data.sessionReferralCode || `rac_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const { fullName, email, interests, focusAreas, ctaOrigin, referredBy, researchReportLeadId } = parsed.data;

  await sql`
    INSERT INTO website_leads
      (full_name, email, interests, focus_areas, cta_origin, referred_by, referral_code, research_report_lead_id, ip_address, user_agent)
    VALUES
      (${fullName}, ${email.toLowerCase()}, ${JSON.stringify(interests)}::jsonb, ${JSON.stringify(focusAreas)}::jsonb, ${ctaOrigin || null}, ${referredBy || null}, ${referralCode}, ${researchReportLeadId || null}, ${ip}, ${userAgent})
  `;
```

- [ ] **Step 7: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Apply the migration to Neon**

```bash
node -e "
const {neon}=require('@neondatabase/serverless');
require('fs');
const url=require('fs').readFileSync('.env.local','utf8').match(/DATABASE_URL=(.+)/)[1].trim().replace(/^[\"']|[\"']\$/g,'');
const sql=neon(url);
sql('ALTER TABLE website_leads ADD COLUMN IF NOT EXISTS focus_areas jsonb NOT NULL DEFAULT ' + String.fromCharCode(39) + '[]' + String.fromCharCode(39) + '::jsonb')
  .then(()=>sql(\"SELECT column_name FROM information_schema.columns WHERE table_name='website_leads' ORDER BY ordinal_position\"))
  .then(r=>console.log(r.map(x=>x.column_name).join(', ')))
  .catch(e=>{console.error('FAILED:', e.message); process.exit(1);});
"
```

Expected output includes `focus_areas` in the column list.

If `.env.local` parsing fails, apply `db/003_add_focus_areas.sql` by hand in the Neon SQL editor and re-run only the `SELECT` to confirm.

- [ ] **Step 9: Commit**

```bash
git add db/003_add_focus_areas.sql lib/lead-schema.ts lib/lead-schema.test.ts app/api/leads/route.ts
git commit -m "Capture chip focus areas with the lead

Chip selections are held in sessionStorage and handed over when the visitor
submits name and email, so sales sees what they wanted to improve alongside
which assessments they asked about.

The migration is additive with a default, so the deployed release keeps
working while the column sits unused.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: Real header navigation

**Files:**
- Modify: `app/page.tsx` — the `<header>` block inside `approvedV12Markup`
- Modify: `app/globals.css:7` (header rules), `:45` (desktop hide), `:774-776` (mobile hide)

**Interfaces:**
- Produces: a `<header>` containing `.brand`, `.header-nav` (two links), and `.header-cta`. The `☰` button and `.menu` class are gone.

**Why:** the real header is brand + a dead `☰`. The Solutions/Resources/About/Insights/Contact/search bar visible on the live site is painted into the hero picture. Three of those five destinations do not exist — the footer already links them to `#`.

- [ ] **Step 1: Replace the header markup**

In `app/page.tsx`, find this exact substring inside the string literal (note the `\"` escaping):

```
<header>\n<div class=\"container header-in\">\n<div class=\"brand\"><span class=\"bars\"><i></i><i></i><i></i><i></i></span><span><strong>R.A. Clifton™</strong><small>STRATEGY • ADVISORY • FINANCIAL INTELLIGENCE</small></span></div>\n<button aria-label=\"Open navigation\" class=\"menu\">☰</button>\n</div>\n</header>
```

Replace it with:

```
<header>\n<div class=\"container header-in\">\n<div class=\"brand\"><span class=\"bars\"><i></i><i></i><i></i><i></i></span><span><strong>R.A. Clifton™</strong><small>STRATEGY • ADVISORY • FINANCIAL INTELLIGENCE</small></span></div>\n<nav class=\"header-nav\" aria-label=\"Primary\"><a href=\"#assessments\">Solutions</a><a href=\"#insights\">Insights</a></nav>\n<a class=\"header-cta\" href=\"#assessment-interest\">Discover Your AI Readiness Score <span aria-hidden=\"true\">→</span></a>\n</div>\n</header>
```

Only two links are included because only `#assessments` and `#insights` exist as sections. The search icon is omitted — there is no search backend. The `☰` is removed — it had no handler and opened nothing.

- [ ] **Step 2: Stop hiding the header**

In `app/globals.css`, delete `header{display:none}` from the `@media(min-width:1024px)` block at line 44–48, so it becomes:

```css
@media(min-width:1024px){
  .desktop-hero-reference{display:block}
  .hero{display:none}
}
```

(Both remaining lines are removed in Task 5 — leave them for now so the page still renders.)

Then delete the entire mobile-header block at lines 773–776:

```css
/* === MOBILE HEADER DUPLICATION FIX === */
@media(max-width:767px){
  header{display:none !important}
}
```

- [ ] **Step 3: Style the header**

In `app/globals.css`, replace the `.menu` rule (line 10) with these rules:

```css
/* v14.2 — real header navigation, replacing the nav painted into the hero image */
.header-nav{display:none;gap:28px;margin-left:auto;margin-right:28px}
.header-nav a{font-size:13.5px;font-weight:600;color:rgba(255,255,255,.86);letter-spacing:.01em;min-height:44px;display:flex;align-items:center}
.header-nav a:hover,.header-nav a:focus-visible{color:var(--gold)}
.header-cta{display:none;align-items:center;gap:8px;min-height:42px;padding:0 18px;border-radius:7px;background:linear-gradient(90deg,var(--gold2),var(--gold));color:#17130b;font-weight:850;font-size:13px;white-space:nowrap}
@media(min-width:768px){
  .header-cta{display:inline-flex}
}
@media(min-width:1024px){
  .header-nav{display:flex}
}
```

Below 768px the header is brand-only; the existing bottom `.sticky` bar already carries the mobile CTA, so duplicating it in the header would crowd a 360px screen.

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: `✓ Compiled successfully`.

- [ ] **Step 5: Verify in a browser**

```bash
npm run dev
```

Open `http://localhost:3000`. At a window width above 1024px, confirm: brand visible, "Solutions" and "Insights" visible, gold CTA visible, **no `☰`**. Click "Solutions" — the page scrolls to the assessment cards. Click "Insights" — it scrolls to the Intelligence Brief section.

Narrow the window to 800px: nav links hide, gold CTA remains. Narrow to 393px: brand only.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/globals.css
git commit -m "Build the header navigation that existed only as a picture

The real header was a brand and a hamburger with no click handler; the
Solutions/Resources/About/Insights/Contact bar on the live site is painted
into the hero image, and header was display:none at both desktop and phone.

Ships only the two links with real destinations. Resources, About and
Contact have no pages - the footer already links them to '#' - and a nav
link that goes nowhere costs more trust than an absent one.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: Full-bleed live hero with dual CTAs

**Files:**
- Modify: `app/page.tsx` — remove two picture sections and the duplicate pre-launch band; rewrite the `.hero` section
- Modify: `app/globals.css` — lines 11–23 (hero rules), 42–48, 763–770, 817–860 (mobile supplement)

**Interfaces:**
- Consumes: `/assets/hero-executive.webp` from Task 1.
- Produces: `.hero-bg`, `.hero-actions`, `.btn-outline`, `.hero-features`, and a rescaled `.dash` metrics panel. The anchor `a[href="#why-ai-now"]` is created here and consumed by Task 7's attribution.

**This is the largest task.** The hero becomes a full-bleed photographic background with every word rendered as real HTML on top — including the metrics panel, whose figures are currently baked into pixels and cannot be edited.

- [ ] **Step 1: Delete the three superseded sections**

In `app/page.tsx`, delete these three complete sections from the markup string:

1. The phone hero picture — everything from `<section aria-label=\"Approved mobile R.A. Clifton hero\" class=\"approved-mobile-hero\">` through its closing `</section>`.
2. The phone-only pre-launch duplicate — everything from `<section class=\"mobile-prelaunch-supplement\">` through its closing `</section>`.
3. The desktop hero picture — everything from `<section aria-label=\"Approved R.A. Clifton desktop hero\" class=\"desktop-hero-reference\">` through its closing `</section>`.

Section 2 existed only because `.pre` was hidden on phones. Restoring `.pre` makes it a duplicate of the same message.

- [ ] **Step 2: Replace the hero section markup**

Replace the entire `<section class=\"hero\">…</section>` block with the following. Every `"` must be written `\"`:

```
<section class=\"hero\" id=\"top\">\n<div class=\"hero-bg\" aria-hidden=\"true\"></div>\n<div class=\"container hero-grid\">\n<div class=\"hero-copy\">\n<p class=\"eyebrow\">AI-FIRST CPA &amp; BUSINESS ADVISORY</p>\n<h1>See Your Business More Clearly.<span>Make Smarter Decisions.</span></h1>\n<p>R.A. Clifton helps ambitious small and mid-sized businesses turn financial and operational information into practical intelligence—combining CPA expertise, business advisory, AI, and automation to improve efficiency, profitability, and long-term growth.</p>\n<ul class=\"hero-features\" aria-label=\"What you get\">\n<li><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"3\" y=\"14\" width=\"3.4\" height=\"7\" rx=\"1\"/><rect x=\"8.6\" y=\"10\" width=\"3.4\" height=\"11\" rx=\"1\"/><rect x=\"14.2\" y=\"6\" width=\"3.4\" height=\"15\" rx=\"1\"/><rect x=\"19.8\" y=\"3\" width=\"1.2\" height=\"18\" rx=\".6\"/></svg><span>Real<br/>Insights</span></li>\n<li><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"3.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"/><path d=\"M12 2.6v3M12 18.4v3M2.6 12h3M18.4 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\"/></svg><span>Practical<br/>Solutions</span></li>\n<li><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"8.5\" cy=\"8\" r=\"3.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"/><circle cx=\"16.5\" cy=\"9.5\" r=\"2.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"/><path d=\"M2.8 19.4c0-3.1 2.5-5.2 5.7-5.2s5.7 2.1 5.7 5.2M15.2 14.6c3 .2 5.2 2.1 5.2 4.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\"/></svg><span>Experienced<br/>Guidance</span></li>\n<li><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M3 17.5 9.2 11l3.6 3.4L20.4 6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M15.4 6h5v5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg><span>A Stronger<br/>Tomorrow</span></li>\n</ul>\n<div class=\"hero-actions\">\n<a class=\"btn\" href=\"#assessment-interest\">Discover Your AI Readiness Score <span aria-hidden=\"true\">→</span></a>\n<a class=\"btn btn-outline\" href=\"#why-ai-now\">AI for Small Business: The Case for Starting Now <span aria-hidden=\"true\">→</span></a>\n</div>\n<ul class=\"trust\">\n<li><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\"/><path d=\"M12 7v5.3l3.4 2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"/></svg>About 5 minutes</li>\n<li><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 3.2 20 6.4v5.2c0 4.6-3.3 8.1-8 9.2-4.7-1.1-8-4.6-8-9.2V6.4z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linejoin=\"round\"/><path d=\"m8.6 12.2 2.4 2.3 4.4-4.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>No cost during pre-launch</li>\n<li><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"4.6\" y=\"10.4\" width=\"14.8\" height=\"10\" rx=\"2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\"/><path d=\"M8.4 10.4V7.8a3.6 3.6 0 0 1 7.2 0v2.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"/></svg>Private and secure</li>\n</ul>\n</div>\n<div class=\"hero-visual\">\n<div class=\"dash\">\n<small>REAL INSIGHTS. A STRONGER TOMORROW.</small>\n<div class=\"metrics\">\n<div class=\"metric\"><span>Revenue</span><strong>$7.4M</strong><em>↑ 12%</em></div>\n<div class=\"metric\"><span>Operating Margin</span><strong>36.7%</strong><em>↑ 3.2%</em></div>\n<div class=\"metric\"><span>Cash Position</span><strong>$963K</strong><em>↑ 18%</em></div>\n</div>\n<div class=\"spark\"></div>\n<div class=\"dash-score\">\n<div class=\"score-dial\"><strong>87</strong></div>\n<div class=\"score-note\"><span>Higher clarity.</span><span>Greater opportunity.</span><span>A stronger tomorrow.</span></div>\n</div>\n</div>\n</div>\n</div>\n</section>
```

Note `id=\"top\"` on the section — nothing links to it yet, but it gives the brand a target if you later make the logo clickable.

- [ ] **Step 3: Replace the hero CSS**

In `app/globals.css`, replace lines 11–23 (from `.hero{background:...` through the `.spark:after` rule) with:

```css
/* === v14.2 FULL-BLEED LIVE HERO ===
   Replaces the 773x515 raster hero that was stretched ~4x on high-DPI
   desktops. The photograph is now a clean background plate; every word,
   including the metrics panel, is real HTML and stays sharp and editable. */
.hero{position:relative;background:#07131b;color:white;overflow:hidden;isolation:isolate}
.hero-bg{position:absolute;inset:0;z-index:0;background-image:url("/assets/hero-executive.webp");background-size:cover;background-position:58% center;background-repeat:no-repeat}
.hero-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,14,20,.92) 0%,rgba(4,14,20,.80) 26%,rgba(4,14,20,.72) 60%,rgba(4,14,20,.94) 100%)}
.hero-grid{position:relative;z-index:1;padding-top:108px;padding-bottom:72px;display:grid;gap:32px}
.eyebrow{margin:0 0 14px;color:var(--gold);font-size:11px;letter-spacing:.115em;font-weight:800} .orange{color:#db7c2b}
h1,h2,h3{font-family:Georgia,serif} .hero h1{margin:0;font-size:42px;line-height:1.015;letter-spacing:-.035em;max-width:350px;text-shadow:0 2px 24px rgba(0,0,0,.45)} .hero h1 span{display:block;color:var(--gold);margin-top:5px}
.hero-copy>p:last-of-type{font-size:16px;line-height:1.6;color:rgba(255,255,255,.88);margin:24px 0 0;max-width:560px;text-shadow:0 1px 12px rgba(0,0,0,.5)}

.hero-features{list-style:none;padding:0;margin:30px 0 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 20px;max-width:520px}
.hero-features li{display:flex;align-items:center;gap:10px;font-size:12.5px;line-height:1.25;font-weight:700;color:rgba(255,255,255,.92)}
.hero-features svg{flex:0 0 22px;width:22px;height:22px;fill:var(--gold);color:var(--gold)}

.hero-actions{display:grid;gap:12px;margin-top:30px;max-width:560px}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;min-height:56px;padding:0 20px;border-radius:7px;background:linear-gradient(90deg,var(--gold2),var(--gold));color:#17130b;font-weight:850;margin-top:28px;text-align:center;line-height:1.2}
.btn-outline{background:transparent;border:1px solid rgba(239,189,85,.55);color:var(--gold2);font-weight:800;backdrop-filter:blur(4px)}
.btn-outline:hover,.btn-outline:focus-visible{background:rgba(239,189,85,.14);border-color:var(--gold)}
.hero-actions .btn{margin-top:0}

.trust{list-style:none;padding:0;margin:26px 0 0;display:grid;gap:10px;font-size:12.5px;color:rgba(255,255,255,.86)} .trust li{min-height:28px;display:flex;align-items:center;gap:9px}
.trust svg{flex:0 0 18px;width:18px;height:18px;color:var(--gold);fill:none}

.hero-visual{position:relative;width:100%;max-width:420px}
.dash{width:100%;padding:16px;border:1px solid rgba(40,208,230,.26);border-radius:12px;background:rgba(4,19,27,.74);backdrop-filter:blur(14px);box-shadow:0 22px 60px rgba(0,0,0,.42);color:white}
.dash small{display:block;font-size:9.5px;font-weight:800;letter-spacing:.06em;color:rgba(255,255,255,.72)}
.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.metric{padding:10px 8px;background:rgba(255,255,255,.05);border-radius:7px}
.metric span{display:block;font-size:7.5px;opacity:.72;text-transform:uppercase;letter-spacing:.05em;line-height:1.3}
.metric strong{display:block;font-size:17px;margin-top:3px}
.metric em{display:block;color:#2ad8bd;font-size:9px;font-style:normal;margin-top:2px}
.spark{height:58px;margin-top:10px;border-radius:7px;background:linear-gradient(135deg,transparent 25%,rgba(32,199,223,.12));position:relative}
.spark:after{content:"";position:absolute;left:10px;right:10px;top:31px;height:2px;background:linear-gradient(90deg,#20c7df 0 15%,transparent 15% 18%,#20c7df 18% 34%,transparent 34% 37%,#20c7df 37% 52%,transparent 52% 55%,#20c7df 55% 72%,transparent 72% 75%,#20c7df 75% 100%);transform:skewY(-7deg)}
.dash-score{display:flex;align-items:center;gap:14px;margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.1)}
.score-dial{flex:0 0 58px;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--cyan) 0 87%,rgba(255,255,255,.12) 87% 100%)}
.score-dial strong{width:44px;height:44px;border-radius:50%;background:#071a23;display:grid;place-items:center;font-size:17px}
.score-note{display:grid;gap:2px;font-size:10px;color:rgba(255,255,255,.76)}
```

- [ ] **Step 4: Remove the hero-hiding media queries**

Delete the whole block at lines 42–48:

```css
.desktop-hero-reference{display:none;background:#07131b}
.desktop-hero-reference img{display:block;width:100%;height:auto}
@media(min-width:1024px){
  .desktop-hero-reference{display:block}
  .hero{display:none}
}
```

Then, in the `@media(max-width:767px)` block around line 762, delete the `.approved-mobile-hero` and `.hero`/`.pre` hiding rules so the block is removed entirely:

```css
@media(max-width:767px){
  .approved-mobile-hero{display:block}
  .hero{display:none !important}
  .pre{display:none !important}
}
```

Also delete the now-unused `.approved-mobile-hero*` rules (roughly lines 734–770) and the `.mobile-prelaunch-supplement` rules (roughly lines 817–860). Search for each class name to be sure nothing is left:

```bash
grep -n "approved-mobile-hero\|desktop-hero-reference\|mobile-prelaunch-supplement\|hero-photo\|\.menu{" app/globals.css || echo "ALL REMOVED"
```

Expected: `ALL REMOVED`.

- [ ] **Step 5: Add responsive hero rules**

In the `@media(min-width:768px)` block (line ~38), replace `.hero-visual{max-width:680px}.hero-photo{height:560px}` with:

```css
.hero-features{grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.hero-actions{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;max-width:none}
.hero-visual{max-width:420px}
```

In the `@media(min-width:1024px)` block (line ~39), replace `.hero-photo{height:620px}` with:

```css
.hero-grid{grid-template-columns:minmax(0,1.05fr) minmax(0,.62fr);align-items:center;padding-top:132px;padding-bottom:104px;gap:48px}
.hero-bg::after{background:linear-gradient(90deg,rgba(4,14,20,.95) 0%,rgba(4,14,20,.88) 30%,rgba(4,14,20,.55) 62%,rgba(4,14,20,.42) 100%),linear-gradient(180deg,rgba(4,14,20,.55) 0%,transparent 30%,transparent 72%,rgba(4,14,20,.72) 100%)}
.hero h1{font-size:64px;max-width:700px}
.hero-actions{max-width:640px}
.hero-visual{max-width:100%;justify-self:end}
```

In the `@media(min-width:1280px)` block (line ~40), replace `.hero-photo{height:690px}` with:

```css
.hero h1{font-size:72px}
```

- [ ] **Step 6: Add the compact-phone fallback**

In the `@media(max-width:359px)` block (line ~89), delete `.hero-photo{height:405px}` and the `.dash{...}`, `.metric strong`, `.metric span` overrides, replacing them with:

```css
.hero-features{grid-template-columns:1fr;gap:12px}
.metric strong{font-size:14px}
.metric span{font-size:7px}
```

- [ ] **Step 7: Build**

```bash
npm run build
```

Expected: `✓ Compiled successfully`. If it fails with a string/JSX error, the `\"` escaping in `app/page.tsx` was broken — re-check Step 2.

- [ ] **Step 8: Verify in a browser at every breakpoint**

```bash
npm run dev
```

At **1440px**: full-bleed photograph, headline crisp over the dark left side, four feature icons in a row, gold button beside outlined button, metrics panel floating right over the skyline, trust row below. No horizontal scrollbar.

At **1024px**, **768px**, **393px**, **360px**: content stacks, both buttons full-width and legible, the photograph still reads, no horizontal scroll, no overlapping text.

Click **"Discover Your AI Readiness Score →"** — scrolls to the form. Click **"AI for Small Business: The Case for Starting Now →"** — scrolls to the R.A. CLIFTON RESEARCH section.

Confirm the gold PRE-LAUNCH ACCESS band appears **exactly once** on a phone-width window.

- [ ] **Step 9: Commit**

```bash
git add app/page.tsx app/globals.css
git commit -m "Replace the raster hero with a full-bleed live hero and dual CTAs

Desktop and phone were showing flattened screenshots - 773x515 stretched
roughly 4x on high-DPI displays, which is the fuzziness that was reported.
The live HTML hero only ever rendered between 768 and 1023px.

Every word is now real HTML over a clean background plate, including the
metrics panel, so \$7.4M, 36.7%, \$963K and the 87 dial are editable
content rather than pixels.

The hero carries two CTAs: the gold primary still goes to the assessment
form, and a new outlined secondary scrolls to the research report, giving
the report a route in from the hero for the first time.

Also removes the phone-only pre-launch duplicate, which existed only
because .pre was hidden behind the phone hero image.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: Make the chips work

**Files:**
- Modify: `app/page.tsx` — `.selector` block and the five form checkboxes
- Modify: `components/V12ClientController.tsx` — add chip handling, extend the form payload
- Modify: `app/globals.css:29` — chip focus/hover states

**Interfaces:**
- Consumes: `recommendFromChips`, `AssessmentKey` from `lib/chip-recommendations.ts` (Task 2); `focusAreas` on the payload (Task 3).
- Produces: `sessionStorage["rac_focus_areas"]` — a JSON array of selected chip labels.

- [ ] **Step 1: Add `type="button"` to the chips and `value` to the checkboxes**

In `app/page.tsx`, replace the chips block:

```
<div class=\"chips\">\n<button>AI</button>\n<button>Efficiency</button>\n<button>Financial Clarity</button>\n<button>Better Decisions</button>\n<button>Growth</button>\n</div>
```

with:

```
<div class=\"chips\">\n<button type=\"button\" aria-pressed=\"false\">AI</button>\n<button type=\"button\" aria-pressed=\"false\">Efficiency</button>\n<button type=\"button\" aria-pressed=\"false\">Financial Clarity</button>\n<button type=\"button\" aria-pressed=\"false\">Better Decisions</button>\n<button type=\"button\" aria-pressed=\"false\">Growth</button>\n</div>
```

Then give each form checkbox a `value`. Replace the five `<label>` lines in `#assessment-interest` with:

```
<label><input type=\"checkbox\" value=\"ai-readiness\"/> <span>AI Readiness Score™ <em>(Free - Notify Me)</em></span></label>\n<label><input type=\"checkbox\" value=\"ai-opportunity\"/> <span>AI Opportunity Finder™ <em>(Fee)</em></span></label>\n<label><input type=\"checkbox\" value=\"financial-clarity\"/> <span>Financial Clarity Score™ <em>(Fee)</em></span></label>\n<label><input type=\"checkbox\" value=\"business-intelligence\"/> <span>Business Intelligence Score™ <em>(Fee)</em></span></label>\n<label><input type=\"checkbox\" value=\"intelligence-brief\"/> <span>Join the R.A. Clifton Intelligence Brief <em>(Free)</em></span></label>
```

The existing interest capture reads the label text first and only falls back to `value`, so what gets stored in `interests` does not change.

- [ ] **Step 2: Style the chip states**

In `app/globals.css`, replace the `.chips button` and `.chips button.sel` rules (line 29) with:

```css
.chips button{min-height:42px;padding:0 15px;border:1px solid rgba(9,27,36,.18);background:white;border-radius:999px;cursor:pointer;transition:background .15s ease,border-color .15s ease,color .15s ease}
.chips button:hover{border-color:rgba(9,27,36,.38)}
.chips button:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.chips button.sel{background:var(--gold);border-color:var(--gold);font-weight:800;color:#17130b}
#chip-result a{color:#8a6412;font-weight:800;text-decoration:underline;text-underline-offset:3px}
#chip-result a:hover{color:#5f4409}
```

- [ ] **Step 3: Add the chip controller logic**

In `components/V12ClientController.tsx`, add the import at the top:

```ts
import { recommendFromChips, type AssessmentKey } from "@/lib/chip-recommendations";
```

Then insert this block inside the `useEffect`, immediately before the `const form = document.querySelector<HTMLFormElement>(".brief-image9-form");` line:

```ts
    // "Not sure where to start?" — chips record intent and recommend one next step.
    const chipButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".chips button"));
    const chipResult = document.getElementById("chip-result");
    if (chipButtons.length && chipResult) {
      const selected = new Set<string>();

      const applyRecommendation = () => {
        const labels = Array.from(selected);
        sessionStorage.setItem("rac_focus_areas", JSON.stringify(labels));

        const recommendation = recommendFromChips(labels);
        chipResult.textContent = "";
        if (!recommendation) return;

        const link = document.createElement("a");
        link.href = "#assessment-interest";
        link.textContent = recommendation.message;
        link.addEventListener("click", () => {
          recommendation.checkboxValues.forEach((value: AssessmentKey) => {
            const box = document.querySelector<HTMLInputElement>(
              `#assessment-interest input[type=checkbox][value="${value}"]`
            );
            if (box) box.checked = true;
          });
          sessionStorage.setItem("rac_cta_origin", `chip recommendation: ${recommendation.primary}`);
        });
        chipResult.appendChild(link);
      };

      chipButtons.forEach((button) => {
        const label = (button.textContent || "").trim();
        const onChipClick = () => {
          if (selected.has(label)) {
            selected.delete(label);
            button.classList.remove("sel");
            button.setAttribute("aria-pressed", "false");
          } else {
            selected.add(label);
            button.classList.add("sel");
            button.setAttribute("aria-pressed", "true");
          }
          applyRecommendation();
        };
        button.addEventListener("click", onChipClick);
        cleanups.push(() => button.removeEventListener("click", onChipClick));
      });
    }
```

- [ ] **Step 4: Send focus areas with the lead**

In the same file, add `focusAreas` to the `LeadPayload` type:

```ts
type LeadPayload = {
  fullName: string;
  email: string;
  interests: string[];
  focusAreas: string[];
  ctaOrigin?: string;
  referredBy?: string;
  sessionReferralCode?: string;
  researchReportLeadId?: string;
};
```

Then in the submit handler, add one line to the payload object directly after `interests`:

```ts
          focusAreas: JSON.parse(sessionStorage.getItem("rac_focus_areas") || "[]"),
```

- [ ] **Step 5: Typecheck and build**

```bash
npx tsc --noEmit && npm run build
```

Expected: no errors, `✓ Compiled successfully`.

- [ ] **Step 6: Verify in a browser**

```bash
npm run dev
```

Scroll to "Not sure where to start?".

1. Click **Financial Clarity** → it turns gold; the line reads `Start with the Financial Clarity Score™ →`.
2. Click it again → gold clears, line empties.
3. Click **Efficiency**, **Growth**, **Better Decisions** → all three gold; line reads `Start with the AI Readiness Score™ — it's free and covers all of these →`.
4. Click that link → page scrolls to the form, and **AI Readiness Score™**, **AI Opportunity Finder™** and **Business Intelligence Score™** are already checked.
5. In DevTools console: `sessionStorage.getItem("rac_focus_areas")` → `["Efficiency","Growth","Better Decisions"]`.
6. Tab to a chip and press Enter — it toggles, and a gold focus ring is visible.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx app/globals.css components/V12ClientController.tsx
git commit -m "Wire up the 'Not sure where to start?' chips

The chips had no click handler anywhere in the codebase and #chip-result
was never written to, so the section asked a question and never answered
it. The gold .sel styling already existed and had simply never been
switched on.

Selecting chips now recommends one next step, pre-checks the matching
assessments on the form, and carries the selections to Neon with the lead
so sales sees what the person said they wanted to improve.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: Fix the referral email and track the research CTA

**Files:**
- Modify: `app/page.tsx` — the `.referral-secondary` anchor
- Modify: `components/V12ClientController.tsx:29` — attribution selector; add mailto builder

**Interfaces:**
- Consumes: `buildSessionReferralCode()` — already defined at `V12ClientController.tsx:15`.
- Produces: nothing new; both share paths now emit the same referral URL.

**Why:** the mailto body says *"Open this page"* with no URL anywhere in it, and it is hard-coded, so it also carries no referral code. Every email referral has been both unusable and invisible to attribution.

- [ ] **Step 1: Strip the hard-coded body from the markup**

In `app/page.tsx`, replace the `.referral-secondary` anchor:

```
<a class=\"referral-secondary\" href=\"mailto:?subject=Complimentary AI Readiness Score&amp;body=I thought you might find this useful. R.A. Clifton is offering complimentary pre-launch access to its AI Readiness Score. Open this page and enter your own name and email to get started.\">\n      Share by Email\n    </a>
```

with:

```
<a class=\"referral-secondary\" href=\"mailto:\">\n      Share by Email\n    </a>
```

The body is now built at click time so it can carry the live referral URL.

- [ ] **Step 2: Build the mailto at click time**

In `components/V12ClientController.tsx`, insert this block immediately after the `copyBtn` block (after its `cleanups.push(...)` closing brace, before the sticky-bar block):

```ts
    // Share by Email must carry the same referral URL the copy button produces.
    // The markup ships an empty mailto: because the body needs the live code.
    const shareBtn = document.querySelector<HTMLAnchorElement>(".referral-secondary");
    if (shareBtn) {
      const onShare = () => {
        const code = buildSessionReferralCode();
        const url = new URL(window.location.href);
        url.hash = "assessment-interest";
        url.searchParams.set("ref", code);
        const subject = "Complimentary AI Readiness Score";
        const body = [
          "I thought you might find this useful. R.A. Clifton is offering complimentary pre-launch access to its AI Readiness Score.",
          "",
          `Get started here: ${url.toString()}`,
        ].join("\n");
        shareBtn.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      };
      shareBtn.addEventListener("mousedown", onShare);
      shareBtn.addEventListener("touchstart", onShare, { passive: true });
      shareBtn.addEventListener("focus", onShare);
      onShare();
      cleanups.push(() => {
        shareBtn.removeEventListener("mousedown", onShare);
        shareBtn.removeEventListener("touchstart", onShare);
        shareBtn.removeEventListener("focus", onShare);
      });
    }
```

`onShare()` is called once on mount so the link is valid even if the visitor uses a context menu to copy it. The listeners refresh it in case the URL changes.

- [ ] **Step 3: Track the research CTA too**

In the same file, replace the attribution selector at line 29:

```ts
    document.querySelectorAll<HTMLAnchorElement>('a[href="#assessment-interest"]').forEach((a) => {
```

with:

```ts
    document.querySelectorAll<HTMLAnchorElement>('a[href="#assessment-interest"], a[href="#why-ai-now"]').forEach((a) => {
```

This records the hero's research button as a lead origin, so the database distinguishes research-led from score-led visitors.

- [ ] **Step 4: Typecheck and build**

```bash
npx tsc --noEmit && npm run build
```

Expected: no errors, `✓ Compiled successfully`.

- [ ] **Step 5: Verify in a browser**

```bash
npm run dev
```

Scroll to "Know a business owner who could benefit?".

1. Click **Copy Referral Link →**, paste into a text editor. Note the URL.
2. Click **Share by Email**. Your mail client opens a draft. Confirm the body contains `Get started here: http://localhost:3000/?ref=rac_...#assessment-interest` — an actual clickable URL, with the **same referral code** as step 1.
3. Open that URL in a private window; confirm the page scrolls to the form.
4. Click the hero's research button, then in the console check `sessionStorage.getItem("rac_cta_origin")` → it should name the research CTA.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx components/V12ClientController.tsx
git commit -m "Put a working link in the referral email

The mailto body told the recipient to 'open this page' without containing
a URL, and being hard-coded it also carried no referral code - so every
email referral was both unusable and invisible to attribution, while the
adjacent copy button built a correct tracked link.

Both share paths now emit the same URL. Also records the hero's research
CTA as a lead origin so research-led and score-led visitors can be told
apart.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 8: Full verification and preview deploy

**Files:** none modified — this task is verification only.

- [ ] **Step 1: Run the full check**

```bash
npm test && npx tsc --noEmit && npm run lint && npm run build
```

Expected: tests pass, no type errors, no lint errors, build succeeds. **Do not proceed past a failure — fix it first.**

- [ ] **Step 2: Confirm no dead references remain**

```bash
grep -rn "approved-mobile-hero\|desktop-hero-reference\|mobile-prelaunch-supplement\|hero-photo\|v12-7242292f4feb\|v12-4d19b6827147\|v12-24f43fbd9c88\|class=\\\\\"menu\\\\\"" app components lib || echo "CLEAN"
```

Expected: `CLEAN`.

- [ ] **Step 3: Confirm the published folder is lean**

```bash
du -sh public/ && ls public/assets/
```

Expected: `public/` is well under 1 MB; `public/assets/` contains `hero-executive.webp` and no source PNGs.

- [ ] **Step 4: Browser QA at every required width**

```bash
npm run dev
```

For each of **1440px, 1024px, 768px, 393px, 360px**, confirm:

| Check | Pass criteria |
|---|---|
| Hero text | Crisp at every zoom level; no raster text anywhere |
| Hero buttons | Both visible, correct weighting, no overlap or clipping |
| Primary CTA | Scrolls to the assessment form |
| Secondary CTA | Scrolls to the R.A. CLIFTON RESEARCH section |
| Header | Renders; links land correctly at ≥1024px; no `☰` |
| Pre-launch band | Appears exactly once |
| Horizontal scroll | None at any width |
| Metrics panel | Legible; does not overlap the headline |

- [ ] **Step 5: End-to-end lead test**

With `npm run dev` running: select two chips, click the recommendation, confirm the boxes are pre-checked, fill in a test name and email, submit. Confirm the success message appears, then verify the row:

```bash
node -e "
const {neon}=require('@neondatabase/serverless');
const url=require('fs').readFileSync('.env.local','utf8').match(/DATABASE_URL=(.+)/)[1].trim().replace(/^[\"']|[\"']\$/g,'');
neon(url)('SELECT full_name, email, interests, focus_areas, cta_origin FROM website_leads ORDER BY created_at DESC LIMIT 1')
  .then(r=>console.log(JSON.stringify(r[0],null,2)));
"
```

Expected: `focus_areas` contains the two chip labels, `interests` lists the pre-checked assessments, `cta_origin` is populated.

- [ ] **Step 6: Push the branch**

```bash
git push -u origin v14.2-hero-cta-chips
```

Vercel builds a preview deployment automatically. **Do not merge to `main`.**

- [ ] **Step 7: Verify the preview deployment**

Find the preview URL (Vercel dashboard, or the deployment check on the branch). Repeat Step 4's checks against the live preview URL, and submit one real lead through it to confirm the production database path works.

- [ ] **Step 8: Hand over**

Report to the user: the preview URL, the results of Steps 4 and 5, and the two known limitations — the hero plate is 1536px rather than the 2048px target, and anonymous chip clicks from visitors who never submit the form are not captured.

**Merge to `main` only on explicit approval.**

---

## Rollback

Everything is on a branch. To abandon:

```bash
git checkout main
git branch -D v14.2-hero-cta-chips
git push origin --delete v14.2-hero-cta-chips
```

The `focus_areas` column can stay — it is additive with a default and harmless to the deployed release.
