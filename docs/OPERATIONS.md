# R.A. Clifton® Website — Operations Manual

**Last updated:** 15 September 2026
**Covers:** v14.1.2 deployment — local setup through live custom domain

This document exists so you (or a future Claude Code session) can pick up this
project without re-reading a transcript or re-explaining anything. It records
what was built, why certain choices were made, and step-by-step procedures for
the things you'll need to do again.

**It contains no passwords or keys** — only the names of credentials and where
they are stored.

---

## 1. Quick reference

| Thing | Value |
|---|---|
| **Live site** | https://www.raclifton.com (canonical) |
| | https://raclifton.com → redirects to www |
| **Vercel URL** | https://ra-clifton-website-raclifton.vercel.app |
| **Project folder** | `~/Desktop/Claude Code Projects_temp d260629/ra-clifton-website/ra-clifton-website` |
| **GitHub repo** | `RAClifton/ra-clifton-website` (**private**) |
| **Vercel team** | R Clifton's projects (`raclifton`) — Hobby plan |
| **Vercel project** | `ra-clifton-website` |
| **Database** | Neon — project `billowing-union-62928118`, database `neondb`, PostgreSQL 17.11 |
| **Database region** | AWS `us-east-1` (same as Vercel `iad1` — deliberate, keeps queries fast) |
| **Email sending** | Resend — domain `raclifton.com` **verified** |
| **Sends from** | `R.A. Clifton <research@raclifton.com>` |
| **Email receiving** | Cloudflare Email Routing — `research@raclifton.com` → `smartofficecentral@gmail.com` |
| **DNS host** | Cloudflare (nameservers `jay` / `kristina.ns.cloudflare.com`) |
| **Node version** | v24.16.0, npm 11.13.0 |

### Where credentials live

**Never commit these. Never paste them into a chat.**

| File | Contains | Notes |
|---|---|---|
| `<project>/.env.local` | `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Git-ignored. This is what the site reads when running on your Mac. |
| `~/.raclifton-setup-tokens` | `CLOUDFLARE_API_TOKEN`, `VERCEL_TOKEN`, `CLOUDFLARE_EMAIL_TOKEN` | Outside the project folder so it can never be committed. Permissions `600` (only you can read it). |
| `~/.raclifton-db` | `DATABASE_URL` | Same protection. |

The live site does **not** read `.env.local` — Vercel keeps its own copy of
those four variables. Changing one locally does **not** change the live site,
and vice versa. See SOP 3.

### Database tables

| Table | Holds |
|---|---|
| `research_report_leads` | People who requested the research report (Path B) |
| `website_leads` | People who submitted the AI Readiness assessment form (Path A) |

`website_leads.research_report_lead_id` links an assessment lead back to the
report request that introduced them. That link is the attribution chain — it
tells you which assessment leads came through the research report.

### DNS records on raclifton.com (10 total)

Three services share this domain without interfering:

| Record | Purpose |
|---|---|
| `CNAME raclifton.com` → Vercel | Website (apex) |
| `CNAME www.raclifton.com` → Vercel | Website (canonical) |
| `MX raclifton.com` ×3 → `route1/2/3.mx.cloudflare.net` | **Receiving** mail |
| `TXT raclifton.com` (SPF, Cloudflare) | Receiving |
| `TXT cf2024-1._domainkey` | Receiving (Cloudflare DKIM) |
| `MX send.raclifton.com` → Amazon SES | **Sending** mail (Resend bounces) |
| `TXT send.raclifton.com` (SPF, Amazon) | Sending |
| `TXT resend._domainkey` | Sending (Resend DKIM) |

**Why sending and receiving don't clash:** Resend's records all live on the
`send.` subdomain and use the `resend` DKIM selector. Cloudflare's live on the
root and use the `cf2024-1` selector. Different names, no overlap.

---

## 2. Session handoff

### The goal

Take an already-approved Next.js website (v14.1.2) that existed only as files
on the Mac, and get it running live on the internet at `raclifton.com` — with
a working database capturing leads, working transactional email, and nothing
about the approved design or copy changed.

The explicit rule throughout, from `CLAUDE.md`: **make the smallest technical
changes necessary.** Not a redesign, not a refactor, not a rebuild.

### Key decisions and why

**Only one line of site code was changed.** The production build failed on a
TypeScript error in `components/V12ClientController.tsx`. The form submit
handler was typed to accept only `SubmitEvent` but registered as a general
`EventListener`, which newer TypeScript rejects. The fix was to widen the
parameter to `Event` — the handler only calls `preventDefault()`, which exists
on both. Zero change to how anything renders or behaves.

**www is the canonical address, not the bare domain.** `raclifton.com` issues a
permanent (308) redirect to `www.raclifton.com`. This matches the
`NEXT_PUBLIC_SITE_URL=https://www.raclifton.com` in the original runbook, and
having one canonical address avoids splitting search rankings between two
versions of every page.

**Credentials were never pasted into chat.** Every key was entered through a
terminal prompt that hides typing and writes straight to a protected file. This
keeps live credentials out of the conversation transcript permanently.

**Tokens were scoped as narrowly as the job allowed.** The Vercel token covers
only the `ra-clifton-website` project, not the five other projects in that
team. Cloudflare tokens are limited to the `raclifton.com` zone. See SOP 4 and
the `scoped-api-token-workflow` skill.

**The full-access Resend key was replaced before launch.** Setup needed a
full-access key to read domain records. That key was then swapped for a
sending-only key and revoked. The key now sitting in Vercel can send email and
nothing else — if it ever leaked, no one could delete domains or mint new keys
with it.

**The site was attached to the domain but kept private.** DNS propagation takes
time, so the domain was connected early while Vercel Authentication was
extended to cover custom domains. This starts the clock on DNS without exposing
an un-QA'd site. Going public is now a single setting change.

### What was built, in order

1. `npm install` — 30 packages, no vulnerabilities
2. Fixed the TypeScript build error (above); build passed
3. Created `.env.local`
4. Added `raclifton.com` to Resend; wrote its 3 DNS records into Cloudflare via
   API; domain verified
5. Connected Neon; ran migrations `001` then `002`; verified schema and the
   attribution foreign key
6. Tested both lead paths locally, including a deliberate email-failure test
7. Initialised Git, committed a baseline, pushed to a new private GitHub repo
8. Created the Vercel project linked to GitHub — every push now auto-deploys
9. Set the four environment variables in Vercel; redeployed
10. Tested both lead paths against the **live** site
11. Deleted all test leads; rotated the Resend key to sending-only; revoked the
    old one
12. Attached `www.raclifton.com` and `raclifton.com`; wrote Vercel's DNS records
    into Cloudflare; Let's Encrypt certificate issued
13. Set up Cloudflare Email Routing so replies reach Gmail

### Snags hit, and what they actually were

Keep these — each one looked like a failure but wasn't.

**"5 HOURS doesn't appear on the page."** It does. It's split across two HTML
elements (`<span>5</span><span>HOURS</span>`) so the number and unit can be
styled separately. A plain text search finds nothing. Nothing is wrong.

**Python couldn't reach any API — SSL certificate errors.** A known quirk of
Python installed from python.org on macOS: it ships without the certificate
bundle. Worked around by using `curl` for network calls. Not a project problem.

**GitHub over SSH timed out.** Port 22 is blocked on this network. HTTPS works
fine and the GitHub credential was already in the Mac keychain. Use HTTPS.

**The live site returned "200 OK" when it was supposed to be locked.** It was
following the redirect to Vercel's *login page*, which itself returns 200. The
site was correctly gated. **Lesson: check what page you actually land on, not
just the status code.**

**Vercel Authentication was briefly left more open than intended.** While
testing the live site, protection was turned off for about a minute. The tool
used to restore it didn't offer the original setting, so the first restore left
the main URL publicly reachable for a couple of minutes. Caught on verification
and fixed via the API with the exact original value
(`all_except_custom_domains`). No harm on an unlinked URL, but worth recording.

**Cloudflare Email Routing wasn't in the Email menu.** Cloudflare moved it to
**Compute → Email Service → Email Routing**, at the account level rather than
per-domain. Direct URL:
`https://dash.cloudflare.com/<account-id>/email-service/routing`

**Cloudflare auto-appends your domain to DNS record names.** If a service tells
you to create `send.raclifton.com`, you type only `send` into Cloudflare.
Typing the full name creates `send.raclifton.com.raclifton.com`, which looks
right in the dashboard and never works.

### Current state (as of 15 September 2026)

Everything is built, deployed, tested and secured. The site sits at
`https://www.raclifton.com` behind a Vercel login.

Verified working on the **live** site, not just locally:

- Homepage and the 1.2 MB research PDF serve correctly
- Research-report form writes to Neon with correct attribution values
- Email sends from `research@raclifton.com` and `email_sent` flips to true
- If email fails, the visitor still gets the report immediately
- Assessment form writes to Neon and links back to the report lead
- HTTPS with a Let's Encrypt certificate (expires 14 December 2026, auto-renews)
- Replies to `research@raclifton.com` forward to Gmail

The database currently holds **zero rows** — all test data was deleted, so
anything that appears from now on is a real lead.

### Open items

| # | Item | Owner |
|---|---|---|
| 1 | Browser QA at 8 widths in Chrome and Safari; submit both forms through the actual UI | **Clifton** |
| 2 | Flip the site public (one setting change) | Claude, once QA passes |
| 3 | Delete `~/.raclifton-setup-tokens` and `~/.raclifton-db` | Claude, after #2 |
| 4 | Vercel token expires **14 October 2026** | Note only — see SOP 4 |

**Why the QA still matters:** every test so far called the site's APIs
directly, bypassing all the browser JavaScript. The form wiring, the stored
session data that carries attribution between the two paths, and the success
messages have not been exercised by a real browser.

---

## 3. SOPs

### SOP 1 — Make a change to the site and publish it

The thing you'll do most often. Roughly ten minutes.

1. Open the project folder in VS Code:
   `~/Desktop/Claude Code Projects_temp d260629/ra-clifton-website/ra-clifton-website`
2. Open the integrated terminal: **Terminal → New Terminal**
3. Start the local site: `npm run dev`
4. Open `http://localhost:3000` in your browser
5. Make your edit. The browser updates as you save.
6. When happy, check it builds for production: `npm run build`
   **If this fails, stop.** Do not push. A failing build here means a failing
   deploy. Ask Claude to diagnose it.
7. Save your work to version control:
   ```bash
   git add -A
   git commit -m "short description of what you changed"
   git push
   ```
8. **The push is the deploy.** Vercel sees it and rebuilds automatically —
   nothing else to click.
9. Wait 1–2 minutes, then check https://www.raclifton.com

**If the live site looks unchanged:** hard-refresh with **Cmd + Shift + R**.
Your browser is probably showing a cached copy.

**To undo a bad change that's already live:** in Vercel → your project →
**Deployments**, find the last known-good one, click the "..." menu, choose
**Promote to Production**. Instant rollback, no rebuild.

---

### SOP 2 — Check and export your leads

Both forms write to the Neon database. There's no admin screen in the site
itself — this is how you see who signed up.

**The quick way:** ask Claude Code, "show me the leads in the database." It
reads `DATABASE_URL` from `.env.local` and queries directly.

**The manual way:**

1. Go to https://console.neon.tech
2. Open project **billowing-union-62928118**
3. Left sidebar → **SQL Editor**
4. Make sure the database selector shows `neondb`
5. Paste a query and click **Run**

**Everyone who asked for the research report, newest first:**
```sql
SELECT created_at, full_name, email, email_sent
FROM research_report_leads
ORDER BY created_at DESC;
```

**Everyone who submitted the assessment form:**
```sql
SELECT created_at, full_name, email, interests, referral_code
FROM website_leads
ORDER BY created_at DESC;
```

**The valuable one — assessment leads that came via the research report:**
```sql
SELECT w.created_at, w.full_name, w.email, w.interests,
       r.created_at AS requested_report_on
FROM website_leads w
JOIN research_report_leads r ON r.id = w.research_report_lead_id
ORDER BY w.created_at DESC;
```
These people read the report first and then asked about the assessment. That's
your warmest audience.

**To export:** run the query, then use the **Download / Export** button above
the results grid to get a CSV for Excel or Google Sheets.

**If a query returns nothing**, the database may have gone to sleep — Neon's
free plan pauses idle databases. Run it again; the first query wakes it and may
take a few seconds.

**A note on `email_sent`:** `false` means the email didn't send, but the person
still got the report on screen immediately. It's a delivery problem, not a lost
lead. Follow up manually.

---

### SOP 3 — Change an environment variable (keys, URLs, settings)

There are **two separate copies** of these settings and changing one does not
change the other:

- `.env.local` on your Mac — used when you run the site locally
- Vercel's stored variables — used by the live site

**To change the live site:**

1. Go to https://vercel.com/raclifton/ra-clifton-website/settings/environment-variables
2. Find the variable, click the "..." menu → **Edit**
3. Change the value → **Save**
4. **Crucially: this does not take effect yet.** Environment variables only
   apply to a *new* build. Go to **Deployments**, find the most recent one,
   "..." → **Redeploy**.
5. Wait for it to finish, then verify the live site

**To change your local copy:** open `.env.local` in VS Code, edit the line,
save. Restart `npm run dev`.

**Keep both in sync** unless you're deliberately testing something.

**The four variables:**

| Variable | What it does | Careful |
|---|---|---|
| `DATABASE_URL` | Connects to Neon | Must be the **pooled** string (contains `-pooler`) |
| `RESEND_API_KEY` | Lets the site send email | Sending-access only — never full access |
| `RESEND_FROM_EMAIL` | The "from" address | Must be on the verified `raclifton.com` domain |
| `NEXT_PUBLIC_SITE_URL` | Builds links inside emails | Must be `https://www.raclifton.com` in production, or emailed links break |

---

### SOP 4 — Rotate or replace a credential

Do this if a key leaks, expires, or you want to retire one. **Always create the
replacement and confirm it works before destroying the old one.**

#### Resend key (the site's email sender)

1. https://resend.com → **API Keys** → **Create API Key**
2. Name it (e.g. `raclifton-production-2`), permission **Sending access**,
   Domain **All domains**
3. Copy the key — it's shown once
4. Update it in **both** places: `.env.local` on your Mac, and in Vercel
   (SOP 3 — remember the redeploy)
5. Test that email still works — submit the research-report form
6. Only now: Resend → API Keys → delete the old one

> **Why "All domains" and not `raclifton.com`:** that setting restricts which
> domain the key may send *from*. Restricting it would block Resend's
> `onboarding@resend.dev` test sender, which is useful for diagnosing problems.

#### Vercel token — **expires 14 October 2026**

This token exists only so Claude Code can manage the project for you. The
website does not use it, and nothing breaks when it expires.

1. https://vercel.com/account/settings/tokens → **Create Token**
2. Scope: **ra-clifton-website** (the project, not the whole team)
3. Expiration: 30 days
4. Save it following the pattern in the `scoped-api-token-workflow` skill

#### Cloudflare tokens

Same principle. https://dash.cloudflare.com/profile/api-tokens
Always restrict **Zone Resources** to **Specific zone → raclifton.com**.

#### Neon database password

1. Neon Console → your project → **Connect**
2. Click **Reset password**
3. Copy the new pooled connection string
4. Update `DATABASE_URL` in `.env.local` *and* Vercel, then redeploy

> ⚠️ Resetting the password **immediately breaks the live site** until Vercel
> is updated and redeployed. Only do this if a credential has actually leaked,
> and do steps 3–4 straight away.

---

### SOP 5 — Add an email address or change where mail goes

Two different systems, depending on what you want:

- **Receiving** mail (someone emails you) → Cloudflare Email Routing
- **Sending** mail (the site emails someone) → Resend

#### Add a new receiving address (e.g. hello@raclifton.com)

1. Go to `https://dash.cloudflare.com/<your-account-id>/email-service/routing`
   (**not** the domain's Email menu — Cloudflare moved this)
2. **Routing rules** tab → **Create address**
3. Custom address: the part before the @ (e.g. `hello`)
4. Action: **Send to an email** → choose `smartofficecentral@gmail.com`
5. Save. Live within about a minute — no DNS changes needed.

#### Forward to a different mailbox

1. Same page → **Destination addresses** tab → **Add destination**
2. Enter the new address
3. **Cloudflare emails that address a verification link.** It must be clicked
   before any mail will route there.
4. Once verified, go back to **Routing rules** and point the rule at it

#### Send from a new address (e.g. hello@raclifton.com)

No setup needed. Any address on the verified `raclifton.com` domain can send.
Just change `RESEND_FROM_EMAIL` (SOP 3).

> **But make sure you can receive replies first.** Sending from an address with
> no receiving rule means replies vanish silently. Do the receiving side first.

#### The catch-all — leave it off

Cloudflare offers to accept mail for *every* address at your domain. It's
currently **disabled**, which is correct. Turning it on invites spam to
thousands of guessed addresses.

---

## 4. Things worth knowing

**The project folder is nested.** The real project is one level deeper than you
might expect — `ra-clifton-website/ra-clifton-website`. The inner folder is the
one containing `package.json`. Always open that one.

**Next.js rewrites two files by itself.** It appends a block to `CLAUDE.md`
every time `npm run dev` runs, and flips a line in `next-env.d.ts` between dev
and build modes. Both are normal. Commit them; don't fight them.

**Your Neon database sleeps.** On the free plan it pauses when idle and takes a
few seconds to wake. A first slow request after a quiet period is expected, not
a fault.

**Vercel Authentication is what's keeping the site private.** Once it's turned
off, the site is public to everyone including search engines. That's the actual
go-live moment.

**Email delivery is deliberately not a blocker.** If Resend is down, the
visitor still gets their report immediately and the lead is still saved. The
only loss is the email copy — which is why `email_sent` exists as a column.
