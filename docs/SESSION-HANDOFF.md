# Session Handoff — 15 September 2026

**Session goal:** take the approved v14.1.2 Next.js site from local files to a
live, secured deployment on `raclifton.com`.

**Outcome:** complete except for a human browser-QA pass and the final
go-public switch.

Operating detail and procedures live in [OPERATIONS.md](OPERATIONS.md).
Current status lives in [../LAUNCH-CHECKLIST.md](../LAUNCH-CHECKLIST.md).

---

## Continuation prompt

Paste this into a **new Claude Code session** started from the project root to
resume with full context.

```text
Resume work on the R.A. Clifton website (v14.1.2).

Read these first, in order:
  1. CLAUDE.md                 - locked scope and change discipline
  2. docs/OPERATIONS.md        - full operating manual, credentials map, SOPs
  3. LAUNCH-CHECKLIST.md       - what is done vs outstanding
  4. docs/SESSION-HANDOFF.md   - this file

STATE AS OF 15 SEP 2026
The site is fully deployed and working at https://www.raclifton.com but is
deliberately PRIVATE - Vercel Authentication is set to "all", which gates the
custom domain as well as the vercel.app URLs. Anonymous visitors get a Vercel
login page and zero site content. This was intentional: the domain was attached
early so DNS could propagate during QA.

Verified working on the live site (via API, not a browser):
  - homepage and the 1.2MB research PDF serve correctly
  - research-report form writes to Neon with correct attribution values
  - email sends from research@raclifton.com, email_sent flips to true
  - report access still works when email delivery fails (deliberately tested)
  - assessment form writes to Neon and links back to the report lead
  - HTTPS via Let's Encrypt, valid to 14 Dec 2026
  - Cloudflare Email Routing forwards research@raclifton.com to
    smartofficecentral@gmail.com

Both database tables are empty. Test data was deleted.

OUTSTANDING
  1. Clifton's browser QA: 8 widths (1440/1280/1024/834/393/390/375/360),
     Chrome + Safari, plus submitting BOTH forms through the real UI in order
     (research report first, then assessment) to exercise the session-storage
     attribution that API tests bypassed.
  2. Confirm the "Round-trip test - reply routing" email arrived in Gmail.
     This is the only proof that INBOUND mail works. Sending is confirmed.
  3. Go public: PATCH ssoProtection.deploymentType from "all" back to
     "all_except_custom_domains" on Vercel project
     prj_jy6MvHCgCaSeTYqY9zRACtcL2eoC. Do NOT use the MCP tool for this - its
     enum lacks that value and using the nearest option leaves the main alias
     publicly readable. Use the REST API directly.
  4. Delete ~/.raclifton-setup-tokens and ~/.raclifton-db once go-live is done.
  5. Tag the production baseline before any new site build-out.
  6. After go-live, re-test the links inside a freshly generated report email.
     The existing test emails predate the canonical-URL switch and point at
     localhost and the old vercel.app address respectively.

CONSTRAINTS
  - CLAUDE.md governs: smallest safe changes only. No redesign, no Tailwind,
    no ORM, no refactors, no dependency upgrades without a concrete reason.
  - Never paste secrets into chat. Use the scoped-api-token-workflow skill.
  - Credentials: .env.local (app), ~/.raclifton-setup-tokens (Cloudflare +
    Vercel + Cloudflare email), ~/.raclifton-db (Neon). Never commit these.
  - The project root is nested: ra-clifton-website/ra-clifton-website

Start by confirming current state rather than trusting this summary:
check git status, that the build passes, and whether the site is still gated.
```

---

## What happened, in sequence

| # | Step | Result |
|---|---|---|
| 1 | `npm install` | 30 packages, 0 vulnerabilities |
| 2 | First production build | **Failed** — TypeScript error TS2352 |
| 3 | Fixed the handler type in `V12ClientController.tsx` | Build passed |
| 4 | Created `.env.local` | |
| 5 | Added `raclifton.com` to Resend, wrote 3 DNS records via API | Domain verified |
| 6 | Connected Neon, ran migrations 001 → 002 | Schema + attribution FK verified |
| 7 | Tested both lead paths locally, including forced email failure | All passed |
| 8 | `git init`, baseline commit, pushed to private GitHub repo | 35 files, no secrets |
| 9 | Created Vercel project linked to GitHub | Auto-deploy on push enabled |
| 10 | Set 4 environment variables, redeployed | |
| 11 | Tested both lead paths on the **live** site | All passed |
| 12 | Deleted test leads; rotated Resend key to sending-only; revoked old key | Tables at 0 rows |
| 13 | Attached `www.raclifton.com` + apex redirect, wrote DNS via API | Let's Encrypt cert issued |
| 14 | Extended Vercel Auth to cover custom domains **before** attaching | No exposure window |
| 15 | Set up Cloudflare Email Routing | Replies forward to Gmail |
| 16 | Wrote OPERATIONS.md, updated LAUNCH-CHECKLIST.md | Committed and pushed |

## Decisions worth not relitigating

**Only one line of site code changed.** The build failure was a type-level
mismatch: a submit handler typed `SubmitEvent` registered as a general
`EventListener`. Widening the parameter to `Event` fixed it with zero runtime
or layout change. Nothing else in the approved site was touched.

**www is canonical; the apex 308-redirects to it.** Matches the runbook's
`NEXT_PUBLIC_SITE_URL` and avoids splitting SEO across two hostnames.

**Domain attached early, but gated.** DNS propagation is the slow part, so it
was started during QA rather than after. Protection was widened to cover custom
domains *before* attaching, so there was never an exposure window.

**Least privilege, deliberately.** The Vercel token reaches only this project
(the team holds five others). Cloudflare tokens are limited to this zone. The
Resend key in production can send email and nothing else — the full-access key
used during setup was revoked.

**No secret ever entered the chat.** Every credential was captured via a hidden
terminal prompt writing to a `600`-permission file outside the repo. This
pattern was extracted into the personal skill `scoped-api-token-workflow`.

## Traps that cost time — don't re-learn these

| Looked like | Actually was |
|---|---|
| "5 HOURS" missing from the page | Split across two `<span>`s for styling; plain-text search can't find it |
| Python couldn't reach any API | python.org build on macOS ships without CA certificates — use `curl` |
| GitHub SSH timed out | Port 22 blocked on this network — HTTPS works, keychain already had the credential |
| Live site returned "200 OK" while supposedly locked | `curl -L` had followed the redirect to Vercel's *login page*, which returns 200. **Check the landing page, not the status code.** |
| Email Routing missing from Cloudflare's Email menu | Moved to **Compute → Email Service → Email Routing**, at account level |
| Vercel Auth restore appeared to succeed but left the alias open | The MCP tool's enum omits `all_except_custom_domains`; the nearest option only protects raw deployment URLs. Restored via REST API. |

**Cloudflare appends the zone to DNS record names.** If a service says to create
`send.raclifton.com`, type only `send`. The full name creates
`send.raclifton.com.raclifton.com`, which looks correct and never verifies.

## Known-good reference points

| | |
|---|---|
| Last commit | `570d510` |
| Baseline commit | `521b78e` |
| Vercel project | `prj_jy6MvHCgCaSeTYqY9zRACtcL2eoC` |
| Vercel team | `team_UKZCLZYnq61v3vUYRQsJMoBr` |
| Cloudflare zone | `a6300e75ca596fef9695eb21fe9d8441` |
| Cloudflare account | `5f241903ddae66f188647be0e53f2077` |
| Neon project | `billowing-union-62928118` |
| Vercel token expires | **14 October 2026** |
| TLS cert expires | 14 December 2026 (auto-renews) |
