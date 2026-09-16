# Session Handoff — R.A. Clifton™ Website

**Last updated:** 16 September 2026, end of session 3
**Status:** 🟢 **LIVE** at https://www.raclifton.com — v14.2 shipped

Operating detail and step-by-step procedures live in
[OPERATIONS.md](OPERATIONS.md). Current checklist state lives in
[../LAUNCH-CHECKLIST.md](../LAUNCH-CHECKLIST.md). Detailed accounts of each
session: [SESSION-2-TRANSCRIPT.md](SESSION-2-TRANSCRIPT.md) (launch),
[SESSION-3-TRANSCRIPT.md](SESSION-3-TRANSCRIPT.md) (v14.2).

---

## Quick reference

| Thing | Value |
|---|---|
| **Live site** | https://www.raclifton.com |
| **Apex** | https://raclifton.com → 308 → www |
| **Latest commit** | `e8f6433` (merge of v14.2) |
| **Production tags** | `v14.1.2-live`, `v14.2-live` |
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
| **Report cover image** | `public/assets/report-cover.jpg` (560×726, 24 KB) |
| **Link-preview card** | `public/assets/share-card.jpg` (1200×630, 55 KB) |
| **Report review page** | https://claude.ai/artifact/3mFdeShK3sQMJtPji5GNJ8 |
| **v14.2 QA checklist** | https://claude.ai/artifact/TaQSXfXPf26aLtS18nu54X |
| **Brand mark** | **™** everywhere — not registered, so ® would be improper |
| **Checks that must pass** | `npm test` · `npm run typecheck` · `npm run build` |

Credentials: `.env.local` (app), `~/.raclifton-setup-tokens` (Cloudflare +
Vercel), `~/.raclifton-db` (Neon). Never committed, never pasted into chat.

---

## Continuation prompt

Paste this into a **new Claude Code session** started from the project root.

```text
Resume work on the R.A. Clifton website (v14.2, live).

Read these first, in order:
  1. CLAUDE.md                     - locked scope and change discipline
  2. docs/OPERATIONS.md            - operating manual, credentials map, SOPs
  3. LAUNCH-CHECKLIST.md           - what is done vs outstanding
  4. docs/SESSION-HANDOFF.md       - this file
  5. docs/SESSION-3-TRANSCRIPT.md  - how session 3 went, including what went
                                     wrong with the hero. Read this before
                                     touching the hero or header.

STATE AS OF 16 SEP 2026
https://www.raclifton.com is public and serving v14.2. Latest commit e8f6433,
tagged v14.2-live. Protection is ssoProtection.deploymentType =
"all_except_custom_domains", so the custom domain serves everyone while raw
*.vercel.app URLs stay behind Vercel login.

WHAT v14.2 SHIPPED
  - The five "Not sure where to start?" pills work. They select, and the same
    five are mirrored inside the "Interested in Our Assessments?" box under
    "What would you like to improve?" as ONE answer shown twice.
  - Those answers land in website_leads.focus_areas beside the name, email and
    requested assessments. Verified on production with a real row.
  - The Share by Email referral body used to say "open this page" and contain
    no page. It now carries a real tracked URL with the sharer's referral code,
    and ships in the markup so it works with no JavaScript.
  - The site publishes Open Graph metadata, so that link renders as a card with
    the report cover in Mail, iMessage, Slack, WhatsApp and LinkedIn.
  - The research report email was four bare <p> tags; it is now a designed
    email with the brief's actual cover, a real button, a preheader, a reason
    the recipient is receiving it, and an advice disclaimer.
  - The report cover also sits in the lead-magnet modal, where the submit
    arrow points at it. Clicking it focuses the first field.
  - The desktop hero artwork has a header button and a hero button painted into
    it with no links behind either. Both now have invisible hotspots and work.
  - CRITICAL FIX: sessionStorage throws SecurityError in Safari with "Block All
    Cookies" and in some in-app browsers. Every listener is registered inside
    one mount effect, so the throw aborted it BEFORE the lead form's submit
    listener registered. The form silently did nothing and the lead was lost.
    Every storage access now goes through safeGet/safeSet/safeGetJSON.

THE HERO AND HEADER ARE UNCHANGED - AND THAT WAS DELIBERATE
Session 3 rebuilt the hero as live HTML to fix the fuzzy text, got it wrong
four times, and reverted it in full. app/page.tsx and app/globals.css were
restored to ce068f3 and verified byte-identical to the live site. Only 24
additive CSS lines and one markup line sit on top.

THE ROOT MISTAKE, so it is not repeated: the photograph used in the rebuild was
generated fresh from a written prompt. It was never the artwork on the live
site. Every round of adjustment refined a composition built on the wrong
picture, and nobody in the loop could see the page to notice. If you cannot see
the page, do not iterate on visual design - reproduce the existing thing by
measuring the existing asset, or leave it alone.

LEAD TABLES ARE NOT EMPTY
website_leads has 2 rows and research_report_leads has 3, all Clifton's own
testing from the preview and the live site. PREVIEW DEPLOYMENTS WRITE TO THE
PRODUCTION DATABASE - they share DATABASE_URL. Purge before real leads arrive;
export first, outside the repo. OPERATIONS.md has the procedure.

OPEN ITEMS
  1. THE ORIGINAL ASK IS STILL NOT DONE. The header and hero text is still
     fuzzy, because it is still a 773x515 image stretched ~4x on high-DPI
     screens. Clifton said he would address it separately. Fixing it means
     rebuilding the hero as real text over the EXISTING artwork - not a new
     photograph - and needs someone who can actually see the rendered page.
  2. Also not done: the second hero CTA pointing at the research report. A
     button that is not painted into the artwork cannot be added while the
     hero is a flat image.
  3. The redesigned report email has not been seen by a human. The three sends
     in the database went out under the old plain version. Request the report
     once on the live site to see the new one.
  4. The share card has not been confirmed rendering. Paste www.raclifton.com
     into Slack, iMessage or LinkedIn to check.
  5. Footer "Resources", "About" and "Contact" link to "#" - they go nowhere.
     "Privacy" and "Terms" are plain text, not links, on a site whose form
     stores emails and IP addresses.
  6. POST /api/leads has no rate limit, honeypot or CAPTCHA. The table is
     floodable. Pre-existing.
  7. Three passages in the research report are Claude's copy, not Clifton's,
     and have never been signed off. Marked NEW COPY inline at
     https://claude.ai/artifact/3mFdeShK3sQMJtPji5GNJ8
  8. Safari VISUAL pass has still never been done. Form submission is proven
     from Safari; nobody has LOOKED at the live site in it at the eight widths.
  9. Delete ~/.raclifton-setup-tokens and ~/.raclifton-db when Clifton says so.
     Not automatic - the Vercel token is the only way to change deployment
     protection from here and the Neon URL the only way to read leads.
 10. Vercel token expires 14 Oct 2026. OPERATIONS.md SOP 4.
 11. Recommended, not yet acted on: register copyright in the research report.

CONSTRAINTS
  - CLAUDE.md governs: smallest safe changes only. No redesign, no Tailwind,
    no ORM, no refactors, no dependency upgrades without a concrete reason.
  - Never paste secrets into chat. Use the scoped-api-token-workflow skill.
  - The project root is nested: ra-clifton-website/ra-clifton-website
  - Do NOT use the Vercel MCP tool to change deployment protection. Its enum
    omits "all_except_custom_domains" and the nearest option leaves the main
    alias publicly readable. Use the REST API - SOP 7.
  - The header hamburger is still intentionally inert. The pills are NOT any
    more - that changed in v14.2.
  - If you regenerate the research report PDF, keep the filename. Every report
    email ever sent points at that exact path - SOP 8.
  - Nothing reaches production without Clifton previewing and approving it.

TRAPS - DO NOT RE-LEARN THESE
  - The live site and the preview look identical. Two rounds were lost to
    Clifton testing www.raclifton.com and reporting the new work as broken.
    Send the branch alias and tell him to check the address bar says v142, in
    a private window.
  - A mailto: body is text/plain by specification. No HTML, no images, ever.
    To style a referral email the SITE has to send it, which means collecting
    a third party's address.
  - .bars belongs to the R.A. Clifton logo's gold bar mark. A second .bars rule
    later in globals.css restyles the logo itself in header and footer.
  - .report-modal-form button paints EVERY button in that form gold. New
    buttons there need extra specificity, and type="button" or they submit.
  - Inter is declared in the body font stack and loaded nowhere. Text renders
    in Inter on machines that have it and Arial elsewhere, so any layout that
    depends on a few pixels of label width is unreliable by machine.
  - next lint was removed in Next 16. The script is now npm run typecheck.
  - A gated Vercel site returns 200, because its login page is a real page.
    Check the page title or grep for vercel.com/login, never the status code.
  - Testing email forwarding with a Bcc to yourself proves nothing. Personal
    skill: verify-email-routing.
  - Georgia ships only old-style figures. Digits vary in height by design.
  - Date every Census figure. 30.6% (Nov 2025-Feb 2026) and 37% (May 2026) are
    both correct; an undated figure looks wrong to a checker.
  - next dev rewrites next-env.d.ts. Never commit that - revert it and re-run
    npm run build first.
  - LOOK AT THE RENDERED PAGE, not just the PDF.
  - display:grid on an <li> makes EVERY child a grid item.
  - Chrome headless clamps --window-size to ~485px. Use CDP
    Emulation.setDeviceMetricsOverride.

Start by confirming current state rather than trusting this summary: check git
status, that npm test / npm run typecheck / npm run build all pass, that the
site is publicly reachable while *.vercel.app URLs are still gated, and what is
actually in the lead tables.
```

---

## What happened in session 3

| # | Step | Result |
|---|---|---|
| 1 | Investigated the three reported items | Found the hero is a flat image at desktop and phone, which explained the fuzziness and made the CTA change impossible as asked |
| 2 | Found three unreported defects | Desktop hero and header buttons had no links; the site header existed only as pixels; the referral email contained no URL |
| 3 | Wrote a spec and an eight-task plan | Approved by Clifton |
| 4 | Built it with per-task review | A reviewer found a bug in the plan; another caught a `.bars` collision before it shipped |
| 5 | Final whole-branch review | Found a Critical no task-scoped review could see: a `sessionStorage` throw killed the form and lost leads silently |
| 6 | Clifton's QA pass | 6 of 8 passed; both failures were the hero |
| 7 | Four rounds on the hero | All wrong. Root cause: the photograph was never the one on the live site |
| 8 | Reverted the hero and header in full | Verified byte-identical to production |
| 9 | Rebuilt the referral email to need no JavaScript | Removed a whole class of failure |
| 10 | Redesigned the pills as Clifton specified | Mirrored into the signup box, recommender removed |
| 11 | Redesigned the report email, added the share card and modal cover | |
| 12 | Merged and verified on production | 16 checks, all assets `200`, a real lead POSTed and confirmed in Neon |

---

## SOP 9 — Ship a change safely

The process that worked, after the process that did not.

1. `cd ~/Desktop/"Claude Code Projects_temp d260629"/ra-clifton-website/ra-clifton-website`
2. `git checkout main && git pull`
3. `git checkout -b <short-branch-name>` — **never work on `main`**
4. Make the change. Keep it additive where possible; `git diff ce068f3 -- app`
   is a good sanity check on how far it has drifted from the approved design
5. Run all three checks. All must pass:
   ```
   npm test
   npm run typecheck
   npm run build
   ```
6. `git add <specific files>` — **never `git add -A`**. `LAUNCH-CHECKLIST.md`,
   `docs/OPERATIONS.md`, `docs/SESSION-HANDOFF.md` and `next-env.d.ts` carry
   unrelated edits that should not be swept in
7. Commit, then `git push -u origin <branch-name>`
8. Vercel builds a preview automatically. Its URL is
   `ra-clifton-website-git-<branch-with-dots-as-dashes>-raclifton.vercel.app`
9. **Send Clifton that URL and tell him to open it in a private window and
   check the address bar.** He has twice tested the live site by mistake and
   reported new work as broken
10. Only after he approves: `git checkout main && git merge --no-ff <branch>`
    then `git push origin main`
11. Wait for production to actually serve it:
    ```
    until curl -s https://www.raclifton.com | grep -q '<something new>'; do sleep 5; done
    ```
12. Verify on the live site, not the preview. Tag it: `git tag v14.x-live && git push origin v14.x-live`

## SOP 10 — Read the leads

1. From the project root, with `.env.local` present:
   ```
   node -e '
   const fs=require("fs");
   const {neon}=require("@neondatabase/serverless");
   const url=fs.readFileSync(".env.local","utf8").match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["\x27]|["\x27]$/g,"");
   neon(url)("SELECT created_at, full_name, email, interests, focus_areas, cta_origin, referred_by FROM website_leads ORDER BY created_at DESC")
     .then(r=>r.forEach(x=>console.log(JSON.stringify(x,null,2))));
   '
   ```
2. `interests` = the assessment checkboxes they ticked
3. `focus_areas` = the improvement pills they selected — **new in v14.2**
4. `cta_origin` = which button they clicked before converting
5. `referred_by` = the referral code of whoever shared the link with them
6. For report leads, use `research_report_leads` and check `email_sent`

## SOP 11 — Purge test rows before real leads arrive

1. Export first, **outside the repo** so lead data can never be committed:
   ```
   node -e '...' > ~/Desktop/raclifton-test-leads-purged-<date>.csv
   ```
2. Delete by email address, never by a date range — real leads may be interleaved
3. Confirm the counts afterwards
4. Remember preview deployments write here too, so this needs doing again after
   any round of preview testing

## SOP 12 — Regenerate the report cover and the share card

Needed if the research report PDF is ever replaced.

1. Render page one of the PDF:
   ```
   qlmanage -t -s 1400 -o <outdir> public/research/<report>.pdf
   ```
2. Trim and resize it to the email cover:
   ```
   node -e "require('sharp')('<the png>').trim({threshold:10}).resize({width:560}).jpeg({quality:86,mozjpeg:true}).toFile('public/assets/report-cover.jpg')"
   ```
3. Rebuild the 1200×630 link-preview card the same way it was built in session
   3 — an SVG for the text and brand, with the cover composited on the right.
   The script is in the session 3 history; `sharp` is already a dependency
4. Check both are under ~60 KB, then `npm run build` and preview
