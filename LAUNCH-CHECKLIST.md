# R.A. Clifton® v14.1.2 — Launch Checklist

**Status as of 15 September 2026.** Full detail in [docs/OPERATIONS.md](docs/OPERATIONS.md).

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
- [ ] email report link works ← *must be re-tested AFTER go-live, see note*
- [ ] email AI Readiness link works ← *must be re-tested AFTER go-live, see note*

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
- [~] round-trip test sent — *awaiting your confirmation it arrived*

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
- [ ] Chrome tested ← *your QA*
- [ ] Safari tested ← *your QA*
- [ ] 1440 tested
- [ ] 1280 tested
- [ ] 1024 tested
- [ ] 834 tested
- [ ] 393 tested
- [ ] 390 tested
- [ ] 375 tested
- [ ] 360 tested
- [ ] no major console errors ← *your QA*
- [ ] no unexpected horizontal scrolling ← *your QA*

## Production
- [x] custom domain connected — `www.raclifton.com` canonical, apex 308-redirects
- [x] HTTPS works — Let's Encrypt, valid to 14 Dec 2026, auto-renews
- [x] `NEXT_PUBLIC_SITE_URL` set to canonical production URL
- [x] production redeployed after URL change
- [~] Path A tested end-to-end — *API verified; **not yet through a real browser***
- [~] Path B tested end-to-end — *API verified; **not yet through a real browser***
- [x] report-to-assessment attribution confirmed — join verified in the database
- [x] report access survives an email failure — deliberately tested
- [ ] **site made public** ← *the actual go-live; currently behind Vercel login*
- [ ] production baseline committed/tagged before new site build-out

## Security cleanup *(not in the original checklist)*
- [x] no secrets in Git
- [x] Resend key reduced to least privilege
- [x] Vercel token scoped to this project only
- [x] Cloudflare tokens scoped to `raclifton.com` only
- [ ] delete `~/.raclifton-setup-tokens` and `~/.raclifton-db` ← *after go-live*
- [ ] Vercel token expires **14 Oct 2026** — see OPERATIONS.md SOP 4

---

## What's actually left

1. **You:** browser QA at all 8 widths, Chrome + Safari, and submit both forms
   through the real interface
2. **You:** confirm the test emails arrived and their links work
3. **Claude:** flip the site public — one setting change
4. **Claude:** delete the temporary token files
5. **Then:** tag the production baseline before any new build-out

Everything else is done and verified.
