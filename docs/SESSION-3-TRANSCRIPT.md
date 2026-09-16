# Session 3 — Detailed Transcript

**Date:** 15–16 September 2026
**Outcome:** v14.2 shipped to production. The "Not sure where to start?" pills
work and are captured as lead data. The referral email carries a real link. The
research report email was redesigned. A hero rebuild was attempted, went badly
wrong over four rounds, and was reverted in full.

This is a chronological record of what was attempted, what failed, what the
evidence said, and what was decided. It is written for someone who was not
there. It records reasoning, not literal wording.

Current state: [SESSION-HANDOFF.md](SESSION-HANDOFF.md).
Procedures: [OPERATIONS.md](OPERATIONS.md).

---

## The brief

Clifton opened with three items:

1. In the hero, change one "Discover Your AI Readiness Score →" to the research
   report title and scroll to the research section; point the other at the
   signup form.
2. Content in the header and hero "looks fuzzy and not clear."
3. The "Not sure where to start?" pills don't show which one you clicked, and
   it isn't clear how the information would ever reach sales.

Plus: *"Don't change the live version until I approve a pre-live version."*

**That instruction held for the entire session.** Nothing reached
www.raclifton.com until Clifton said "go" at the very end.

---

## Phase 1 — Investigation

Reading the code rather than trusting the brief turned up more than was asked
about.

**The hero was not one thing. It was three.**

| Width | What the hero actually was |
|---|---|
| ≥1024px | A flat image, `773 × 515` pixels, stretched to full window width |
| 768–1023px | Real HTML text |
| ≤767px | A flat image, `851 × 1697`, with one invisible tap-target |

This explained item 2 exactly. A 773px-wide picture stretched across a 1440px
window is roughly a 2× enlargement, and about 4× in device pixels on a Retina
screen. Every word in the desktop hero was a magnified screenshot. The dark
background treatment Clifton suspected was not the cause.

It also made item 1 impossible as stated: **you cannot retype words inside a
JPEG.** Items 1 and 2 were the same job.

**Three further findings nobody had asked about:**

- The desktop hero's gold button had **no link behind it**. It was a picture of
  a button. Clicking it did nothing. Same for the header CTA painted into that
  image.
- The site header seen on the live site — Solutions, Resources, About,
  Insights, Contact, a search icon, a gold CTA — **existed only as pixels
  inside the hero image.** The real `<header>` contained a brand and a `☰` with
  no click handler. `header` was `display:none` at both ≥1024px and ≤767px, so
  the real one only ever rendered on tablet.
- The referral email was worse than reported. Its body said *"Open this page
  and enter your own name and email"* — **with no URL anywhere in it.** Being
  hard-coded, it also carried no referral code, so every emailed referral was
  both unusable to the recipient and invisible to attribution, while the
  adjacent "Copy Referral Link" button built a correct tracked URL.

**And a complication.** The photograph the live HTML hero used,
`v12-24f43fbd9c88.webp`, was itself a crop of a screenshot of the original
design comp, with other people's text baked into the pixels — "REAL INSIGHTS. A
STRONGER TOMORROW.", a dashboard showing `$7.4M` and `36.7%`, and sliced word
fragments from the body paragraph. There was **no clean hero photograph
anywhere in the repository.**

The pills, meanwhile, had **no click handler anywhere in the codebase**. The
gold selected-state CSS (`.chips button.sel`) already existed in the approved
stylesheet and had simply never been switched on.

---

## Phase 2 — Design and plan

A spec was written and approved
(`docs/superpowers/specs/2026-09-15-hero-cta-chips-referral-design.md`), then an
eight-task implementation plan
(`docs/superpowers/plans/2026-09-15-v14-2-hero-cta-chips-referral.md`).

Decisions taken, with reasoning:

| Decision | Choice | Why |
|---|---|---|
| Hero approach | Rebuild as live HTML | Sharp at any zoom, copy stays editable, lighter, readable by search engines |
| Button hierarchy | Score gold / Research outlined | Project rules name the Score as the primary path; two equal-weight buttons dilute each other |
| Pill behaviour | Light up, recommend, pre-fill the form | Answers the question the heading asks |
| Multi-select rule | 2+ pills → recommend the free Score | The honest answer for someone with several priorities is the free entry point |
| "Growth" maps to | AI Opportunity Finder™ | Its own card copy ends "drive growth"; routing it elsewhere would duplicate the "Better Decisions" pill |
| Header nav | Only links that work | A nav link that goes nowhere costs more trust than an absent one |
| Anonymous pill analytics | Out of scope | Pre-launch traffic is too small for the numbers to decide anything, and it adds a privacy-policy obligation |

**No hero photograph existed, and no image-generation tool was available in the
session.** A detailed prompt was written instead; Clifton generated ten
candidates in ChatGPT and picked one. **This later turned out to be the root
mistake of the whole session — see Phase 5.**

---

## Phase 3 — Execution

Eight tasks, each built by a fresh subagent, each reviewed by a second agent
before the next began.

Notable events:

- **Task 2's reviewer found a bug in the plan**, not the code. A test fixture
  had a dropped array element, making it unsatisfiable. The implementer
  corrected the input and left the assertions and implementation untouched; an
  independent reviewer confirmed no coverage was lost.
- **Task 5's reviewer measured actual pixel luminance** in the hero photograph
  to compute text contrast — about 9:1 at the thinnest point of the scrim.
- **A `.bars` class collision** was caught before shipping: the R.A. Clifton
  logo's gold bar mark uses `.bars`, and a new rule of the same name would have
  rendered the logo cyan and stretched in both header and footer.

**The final whole-branch review found a Critical that every task-scoped review
had missed,** because it only existed at the seam between two tasks:

> `sessionStorage` throws `SecurityError` in Safari with "Block All Cookies"
> and in some in-app browsers. Every listener was registered inside one mount
> effect, so an unguarded throw aborted the effect *before the lead form's
> submit listener registered*. The form then fell back to a native GET submit,
> and because the inputs carry `id` but no `name`, the browser navigated to
> `/?` and **the lead was lost with no error shown to anyone.**

This was a regression this branch introduced: before it, the only eager storage
access was conditional on an inbound `?ref=`. The fix routed every storage
access through `safeGet` / `safeSet` / `safeGetJSON` helpers, and the fixer
found two more instances of the same defect class in
`ResearchReportLeadMagnet.tsx` — one of which told visitors the report had
failed *after* their details were already saved.

---

## Phase 4 — Clifton's QA pass

A preflight checklist was published as an artifact
(https://claude.ai/artifact/TaQSXfXPf26aLtS18nu54X) so results could be ticked
off on one device and read on another.

**Result: 6 of 8 passed.** Both failures were the hero.

- Hero copy was too large and ran across the executive's face. Cause: the copy
  column was **63% of the width** carrying a 64–72px headline.
- The metrics panel should be small, upper-right, on his eyeline, "like a
  hologram."

---

## Phase 5 — Four rounds of getting the hero wrong

This is the part worth reading.

**Round 1** — Copy narrowed to 40%, panel shrunk to 300px and given a cyan
hologram treatment. Clifton: *"This is even worse."*

**Round 2** — Clifton supplied the original composition as a reference image.
The plate was re-cropped, the panel rebuilt larger with bar charts and a
labelled outlook chart. Still wrong.

**Round 3** — Held the build against the reference and corrected seven
differences: opacity, white figures instead of cyan-tinted, green deltas, no
tilt, taller, dial above its caption, softer corners. Still wrong.

**Round 4** — Diagnosed the cause as structural rather than aesthetic. The old
hero was one flat image, so widening the window scaled the whole composition by
a single factor. The rebuild used fixed pixel sizes, which do not scale, so
every element's share of the width changed with the viewport. The original
raster was recovered from git and measured, and every value re-expressed as a
fraction of viewport width — headline `3.45vw`, copy column ending at `37%`,
hero locked to `1.50:1`. Five of six matched the original to within 0.05%.

**Clifton's reply:** *"what you provided is not the original and current image
on the live site."*

**That was the actual root cause, and it had been true since Phase 2.** The
photograph in use was one generated fresh from a written prompt. It was never
the artwork on the live site. Every round of adjustment had been refining a
composition built on the wrong picture. No amount of measuring proportions
could fix that, and nobody in the loop could see the page to notice.

### What should have happened

The ask was *"the text looks fuzzy."* The correct minimal job was to reproduce
the existing hero **exactly**, in real text, using the existing artwork. Instead
the hero was rebuilt from a different layout with a different photograph, then
steered back by feel, blind, four times.

**Lesson for any future session: blind CSS iteration on a pixel-perfect
composition does not converge.** If you cannot see the page, either reproduce
the existing thing by measurement from the existing asset, or do not touch it.

---

## Phase 6 — The revert

Clifton: *"Can you only change the functional related thing like the buttons,
pills, etc."*

`app/page.tsx` and `app/globals.css` were restored to `ce068f3`, and the three
original artwork files restored to `public/assets/`. The hero, header and
dashboard panel were then verified **byte-identical to www.raclifton.com** by
fetching both pages and comparing character by character.

What was re-applied on top: 24 additive CSS lines and one markup line. Nothing
existing was modified.

One addition was made beyond pure repair, and flagged as vetoable: **invisible
hotspots over the painted desktop hero and header buttons**, positioned as
percentages of the 773×515 artwork, so that the buttons that had never worked
now do.

---

## Phase 7 — Two rounds lost to live-vs-preview confusion

Clifton twice reported the pills and the referral email as broken, with a
screenshot showing the old email.

Both times he was looking at **www.raclifton.com**, not the preview. The
symptoms matched the live site exactly, and the diagnosis was decisive: the
preview's markup was `href="mailto:"` — completely empty — which cannot produce
the old subject line in the screenshot. That text only existed in the old code.

Rather than repeat the explanation a third time, the referral email was
**rebuilt to not depend on JavaScript at all.** The complete subject and body
now ship inside the `href` in the page's HTML; the script only *upgrades* it by
appending the referral code. This removed an entire class of failure — a cached
bundle, a blocked script, or an error earlier in the mount effect used to leave
the anchor empty.

---

## Phase 8 — The pills, redesigned

Clifton: mirror the pills into the "Interested in Our Assessments?" box, stop
recommending a specific assessment, and capture at name-and-email.

He was right, and the reasoning is worth keeping: **the recommender was
answering a question nobody asked.** Someone clicked "Efficiency" to say what
they cared about, and the site replied by naming an assessment and silently
ticking checkboxes on their behalf. That is the site talking when it should be
listening. It also sat 1,500 pixels from the form, so a visitor could select
three pills, never scroll, and nothing would be captured.

What shipped:

- The same five pills appear **twice** — under "Not sure where to start?" and
  again inside the signup box under "What would you like to improve?"
- They are **one answer shown twice**: clicking either copy updates every button
  carrying that label, and a previous selection is rehydrated on load
- The signup box is dark, so its pills take a light-on-dark treatment; the gold
  selected state is the same in both
- The recommendation and the automatic checkbox ticking are gone
- Under "Not sure where to start?" a plain link to the signup box appears only
  once something is selected, so nobody gets the page moved under them on a
  first click
- `focus_areas` is read **off the page** at submit rather than out of session
  storage — the pills now sit inside the form, so what is on screen when the
  button is pressed is the honest answer

`lib/chip-recommendations.ts` was deleted and replaced by `lib/focus-areas.ts`,
whose test reads the real markup and fails if the two pill groups ever drift
apart. That is the real risk now.

---

## Phase 9 — The emails

**The referral email cannot be HTML.** A `mailto:` body is `text/plain` by
specification (RFC 6068). The email is composed in the sender's own mail app,
which is handed words and nothing else. This was explained twice before the
right alternative was offered, which was a failure of helpfulness rather than
of fact.

Three routes were put to Clifton. He chose the link-preview card.

**What shipped instead of a styled referral email:**

1. **The research report email was redesigned.** It was four bare `<p>` tags
   and goes to every report lead, so it was the one worth designing. It now has
   a dark branded header, the **actual cover of the brief** rendered from page
   one of the PDF, a gold button, a second section pointing at the AI Readiness
   Score, a preheader line for the inbox preview, a line saying why the
   recipient is receiving it, and a note that a general brief is not advice for
   their specific situation. Built for mail clients: tables, inline styles, one
   600px column, a button made from a padded table cell so it survives Outlook.
   The visitor's name now passes through `escapeHtml`.

2. **The site publishes Open Graph metadata,** so the link inside the plain-text
   referral email renders as a card — cover artwork, headline, description — in
   Mail, iMessage, Slack, WhatsApp, LinkedIn and Facebook. This costs nobody a
   third party's email address and raises no consent question, and it improves
   every place the site gets shared.

3. **The report cover was added to the lead-magnet modal,** at the end of the
   submit row so the arrow on "Get the Research Report →" points straight at it.
   Clicking the cover focuses the first field.

A trap here: `.report-modal-form button` paints **every** button in that form
with the gold gradient. The cover would have rendered as a gold slab without
extra specificity, and a bare `<button>` inside a form submits it — hence
`type="button"`.

---

## Phase 10 — Go live

Merged to `main` and deployed. Verified against the production site: 16
structural checks passed, all three assets served (`200`), and a real lead was
POSTed to the production API, confirmed in Neon, and deleted.

**A real row was found in the database and deliberately left alone** — one of
Clifton's own preview submissions, showing four pill selections captured
alongside the assessment requested and the button he arrived from. That is the
whole feature working on real data rather than a synthetic test.

---

## Things learned that are worth not re-learning

1. **Preview deployments write to the production database.** They share
   `DATABASE_URL`. Preview testing creates real rows in real tables.
2. **The live site and the preview look identical.** Two rounds were lost to
   this. The only reliable check is the address bar.
3. **A `mailto:` body is plain text.** No styling, no images, ever.
4. **`next lint` was removed in Next 16.** The script had been failing since
   that upgrade, on `main` as well. Replaced with `npm run typecheck`.
5. **`.bars` belongs to the brand logo.** Do not reuse that class name.
6. **`.report-modal-form button` styles every button in that form.**
7. **Inter is declared in the body font stack but never loaded** — no
   `@font-face`, no `next/font`, no Google Fonts link. Text renders in Inter on
   machines that happen to have it and Arial everywhere else, so any layout
   depending on a few pixels of label width is unreliable by machine.
8. **If you cannot see the page, do not iterate on visual design.** Measure
   from the existing asset, or leave it alone.
