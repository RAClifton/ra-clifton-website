# R.A. Clifton® v14.1.2 — Launch Checklist

**Status: LIVE as of 15 September 2026.** Full detail in [docs/OPERATIONS.md](docs/OPERATIONS.md).

**Legend:** `[x]` done and verified · `[~]` partially done, see note · `[ ]` outstanding

---

## Local
- [x] Node/npm/git available — Node v24.16.0, npm 11.13.0, git 2.50.1
- [x] `npm install` succeeds — 30 packages, 0 vulnerabilities
- [x] `.env.local` created and not committed
- [x] `npm run dev` succeeds
- [ ] **desktop/tablet/mobile visual parity checked** ← *your QA pass, still outstanding*
- [x] `npm run build` succeeds — required one TypeScript fix, see OPERATIONS.md

## Neon
- [x] production Neon database created — `billowing-union-62928118`, PostgreSQL 17.11
- [x] migration 001 applied — `website_leads`
- [x] migration 002 applied — `research_report_leads` + attribution foreign key
- [x] main lead form writes successfully — verified on the live site
- [x] research report form writes successfully — verified on the live site
- [x] test data removed — both tables at 0 rows, ready for real leads

## Resend
- [x] sending domain verified — `raclifton.com`, all 3 DNS records verified
- [x] API key created — `raclifton-production`, **sending access only**
- [x] `RESEND_API_KEY` configured — locally and in Vercel
- [x] `RESEND_FROM_EMAIL` configured — `R.A. Clifton <research@raclifton.com>`
- [x] full-access setup key revoked — confirmed dead
- [x] report email received in test inbox — **confirmed 15 Sep**, delivered to
      Gmail **Inbox (not spam)**, from `research@raclifton.com`
- [x] email report link works — re-tested after go-live, resolves 200 application/pdf
- [x] email AI Readiness link works — re-tested after go-live, loads the live page

> **Note on the two test emails already received.** Both were sent before
> `NEXT_PUBLIC_SITE_URL` was switched to the live domain, so their links are
> stale: the 9:23 PM one points to `http://localhost:3000` and the 9:57 PM one
> to the old `*.vercel.app` address. This is expected, not a fault. Vercel now
> holds `https://www.raclifton.com`, so all future emails build correct links.
> Verify them by submitting the real form once the site is public.

## Email receiving *(not in the original checklist)*
- [x] Cloudflare Email Routing activated on `raclifton.com`
- [x] destination `smartofficecentral@gmail.com` verified
- [x] rule `research@raclifton.com` → Gmail, enabled
- [x] catch-all left disabled (correct — prevents spam)
- [x] confirmed Resend sending records untouched by the change
- [x] **inbound forwarding verified end-to-end — 15 Sep.** Sent from
      `racliftoncpa@gmail.com` → `research@raclifton.com`, no Cc/Bcc, so
      forwarding was the only possible delivery route. Landed in the Gmail
      **Inbox**. Raw headers confirm the Cloudflare hop:
      `Received: from ba-eg.cloudflare-email.net [104.30.10.46]`,
      `X-Forwarded-For: research@raclifton.com smartofficecentral@gmail.com`,
      and an SRS-rewritten `Return-Path: <SRS0=…@raclifton.com>`.
      Auth all green at Google: `spf=pass dkim=pass dmarc=pass`,
      `X-CF-SpamH-Score: 0`.

> **Don't re-test this with a Bcc to yourself, or from an `@raclifton.com`
> sender.** A Bcc to the destination mailbox delivers a direct Gmail-to-Gmail
> copy that looks identical in the UI while the real forwarded copy is silently
> deduplicated by Message-ID — the test then proves nothing. Separately,
> Cloudflare Email Routing will not accept mail whose sender domain is
> `raclifton.com` itself (loop prevention), so Resend cannot be used as the
> test sender. Use a third-party address with no Cc/Bcc, and read the headers.

## GitHub
- [x] repository is private — anonymous access returns 404
- [x] `.env.local` absent
- [x] `node_modules` absent
- [x] `.next` absent
- [x] known-good baseline committed — `521b78e`, plus `6b306bf`
- [x] pushed and in sync with remote
- [x] scanned pushed content for live secrets — clean

## Vercel
- [x] GitHub repo imported — auto-deploys on every push to `main`
- [x] environment variables configured — all 4, secrets encrypted
- [x] deployment succeeds
- [x] Chrome tested — 15 Sep
- [~] Safari tested — *forms yes, visuals no.* Four of the seven purged test
      rows carried a macOS Safari 26.5.2 user agent and submitted successfully
      (both lead paths). **Nobody has viewed the live site in Safari at the
      eight widths** — that is the part still outstanding.
- [x] 1440 tested
- [x] 1280 tested
- [x] 1024 tested
- [x] 834 tested — *fixed: see below*
- [x] 393 tested
- [x] 390 tested
- [x] 375 tested
- [x] 360 tested
- [x] no major console errors
- [x] no unexpected horizontal scrolling

### Issues found in QA and fixed — commit `9e25f8e`, 15 Sep
- **Tablet hero (768–1023px):** the dashboard panel overlapped the executive's
  portrait. The rule that stacks it below the photo already existed but was
  scoped to `max-width:767px`, where `.hero` is hidden and the flat artwork is
  used — so it never ran. Widened to `max-width:1023px` and added a tablet type
  scale for the panel. Desktop ≥1280px deliberately untouched.
- **"5 HOURS" stat:** the `5` sat low and read as undersized. Georgia ships only
  old-style figures — measured from the font, `5` spans −365..1073 against a cap
  height of 1419, and Georgia exposes no `lnum` set, so the pre-existing
  `font-variant-numeric:normal` was a no-op. Fixed with a `.178em` vertical
  nudge (exactly one descender). The `5` in `58%` keeps Georgia's stagger, by
  decision.

## Production
- [x] custom domain connected — `www.raclifton.com` canonical, apex 308-redirects
- [x] HTTPS works — Let's Encrypt, valid to 14 Dec 2026, auto-renews
- [x] `NEXT_PUBLIC_SITE_URL` set to canonical production URL
- [x] production redeployed after URL change
- [x] Path A tested end-to-end — **through a real browser**, 15 Sep (SOP 6)
- [x] Path B tested end-to-end — **through a real browser**, 15 Sep (SOP 6)
- [x] report-to-assessment attribution confirmed — join verified in the database
- [x] report access survives an email failure — deliberately tested
- [x] **site made public — 15 Sep 2026.** `ssoProtection.deploymentType` moved `all` → `all_except_custom_domains` via the Vercel REST API (not the MCP tool, whose enum omits that value). Verified anonymously: www serves the real page, apex 308s to www, and raw `*.vercel.app` deployment URLs remain gated.
- [x] production baseline tagged `v14.1.2-live`

## Security cleanup *(not in the original checklist)*
- [x] no secrets in Git
- [x] Resend key reduced to least privilege
- [x] Vercel token scoped to this project only
- [x] Cloudflare tokens scoped to `raclifton.com` only
- [ ] delete `~/.raclifton-setup-tokens` and `~/.raclifton-db` ← *after go-live*
- [ ] Vercel token expires **14 Oct 2026** — see OPERATIONS.md SOP 4

---

## What's actually left

1. ~~**You:** browser QA at all 8 widths~~ — Chrome done 15 Sep; two defects found and
   fixed (`9e25f8e`). ~~Real-browser pass through both forms~~ — **done 15 Sep**,
   see below. **Safari is still outstanding.**
2. ~~**You:** confirm inbound mail arrives~~ — **done 15 Sep**, header-verified.
3. ~~**Claude:** flip the site public~~ — **done 15 Sep.** The site is live.
4. ~~**Claude:** re-test report-email links~~ — **done 15 Sep**, both resolve.
5. ~~**Then:** tag the production baseline~~ — **done**, `v14.1.2-live`.
6. **Claude, on your say-so:** delete `~/.raclifton-setup-tokens` and
   `~/.raclifton-db`. Not done automatically — the Vercel token is still the only
   way to change deployment protection from here, and the Neon URL is the only
   way to read leads outside the app. Deleting them is safe but not reversible
   without re-issuing, so it is your call.

## Browser verification — closed 15 Sep 2026

Both lead paths were driven through a real Chrome instance via the DevTools
Protocol, so the site's own JavaScript ran exactly as it does for a visitor.

The thing that needed proving was the `sessionStorage` handoff: the research
report modal must store `rac_research_lead_id`, and the assessment form must
read it back. API tests set that value by hand and prove nothing about it.

Observed, in one tab, without reloading:

1. `sessionStorage` empty at start
2. Research report submitted → success screen → **the page itself stored**
   `rac_research_lead_id = dc8c9bf3-…`
3. Clicked through to the assessment; `rac_cta_origin` became
   `research_report_success`
4. Assessment submitted → *"Thank you. Your information has been received."*
5. Database join confirmed: `research_report_lead_id` matched the stored value,
   `joined = true`

Test rows purged afterwards.

**Still not done:** nobody has looked at the live site with human eyes at every
width since go-live, in any browser. Safari specifically has processed both
lead forms successfully (proven by the user agents on the purged test rows) but
has never been used for a *visual* pass.

## Test data purged — 15 September 2026

The seven test rows left over from launch day, all from `alphaonerac@gmail.com`,
were exported and then deleted. Both tables are back to **0 rows**, so anything
appearing from now on is a genuine lead.

The export lives at `~/Desktop/raclifton-test-leads-purged-2026-09-15.csv` —
deliberately outside the repository, because a CSV of lead data inside the
project folder would be committed to Git on the next `git add -A`.

Deletion was done by explicit row ID rather than by email address, so a real
lead arriving later from that same address could not be caught by a re-run.

> **No longer true as of 16 September.** v14.2 testing put rows back into both
> tables — see below. They need purging again before real leads arrive.


---

# v14.2 — shipped 16 September 2026

Tagged `v14.2-live`, merge commit `e8f6433`. Full account in
[docs/SESSION-3-TRANSCRIPT.md](docs/SESSION-3-TRANSCRIPT.md).

## What shipped

- [x] "Not sure where to start?" pills select, and show which one you clicked
- [x] The same five pills mirrored into the "Interested in Our Assessments?"
      box under "What would you like to improve?", kept in sync as one answer
- [x] Pill selections captured to `website_leads.focus_areas` — **verified on
      production with a real row**
- [x] Referral email carries a real tracked URL with the sharer's referral code
- [x] Referral email ships in the markup, so it works with no JavaScript
- [x] Open Graph card so the shared link previews with the report cover
- [x] Research report email redesigned — cover, button, preheader, disclosure
- [x] Report cover added to the lead-magnet modal, where the arrow points
- [x] Invisible hotspots over the painted desktop hero and header buttons, both
      of which had never been clickable
- [x] `sessionStorage` hardened — a `SecurityError` in Safari with cookies
      blocked was aborting the mount effect before the form's submit listener
      registered, losing leads silently with no error shown
- [x] `focus_areas` migration applied to Neon (additive, backward-compatible)
- [x] Test suite added; `npm run lint` replaced with `npm run typecheck`
      because `next lint` was removed in Next 16
- [x] 19 MB of design source images moved out of the published folder

## Deliberately not shipped

- [ ] **The header and hero text is still fuzzy.** This was the original ask.
      It is still a 773×515 image stretched roughly 4× on high-DPI screens. A
      rebuild was attempted, went wrong over four rounds, and was reverted in
      full. Clifton is addressing it separately
- [ ] **Second hero CTA pointing at the research report.** Not possible while
      the hero is a flat image — a button that is not painted into the artwork
      cannot be added without changing the design

## Verified on production, 16 September

- [x] 16 structural checks against `www.raclifton.com`
- [x] Hero and header confirmed byte-identical to the previous live version
- [x] `share-card.jpg`, `report-cover.jpg` and the report PDF all serve `200`
- [x] A real lead POSTed to the production API, confirmed in Neon, then deleted

## Still outstanding after v14.2

- [ ] **Purge the lead tables again.** `website_leads` has 2 rows and
      `research_report_leads` has 3, all from Clifton's own testing.
      **Preview deployments write to the production database** — they share
      `DATABASE_URL`
- [ ] Look at the redesigned report email. The three sends on record went out
      under the old plain version; request the report once to see the new one
- [ ] Confirm the share card renders — paste `www.raclifton.com` into Slack,
      iMessage or LinkedIn
- [ ] Safari **visual** pass, still never done
- [ ] Footer "Resources", "About" and "Contact" link to `#`; "Privacy" and
      "Terms" are plain text, not links, on a site that stores emails and IPs
- [ ] `POST /api/leads` has no rate limit, honeypot or CAPTCHA
