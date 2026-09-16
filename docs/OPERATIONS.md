# R.A. Clifton® Website — Operations Manual

**Last updated:** 15 September 2026 (session 2 — launch)
**Covers:** v14.1.2 — local setup through public launch
**Status:** 🟢 LIVE at https://www.raclifton.com · tagged `v14.1.2-live`

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
| **Live site** | https://www.raclifton.com — **public since 15 Sep 2026** |
| | https://raclifton.com → 308 redirect to www |
| **Production tag** | `v14.1.2-live` |
| **Protection** | `ssoProtection.deploymentType = all_except_custom_domains` (domain public, `*.vercel.app` gated) |
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

### Current state (as of 15 September 2026, end of session 2)

🟢 **The site is LIVE and public** at `https://www.raclifton.com`. Deployment
protection is set to `all_except_custom_domains`, so the custom domain serves
everyone while raw `*.vercel.app` deployment URLs stay behind Vercel login.
The production baseline is tagged `v14.1.2-live`.

Verified working on the **public** site, not just locally:

- Homepage and the 1.2 MB research PDF serve correctly
- Research-report form writes to Neon with correct attribution values
- Email sends from `research@raclifton.com` and `email_sent` flips to true
- If email fails, the visitor still gets the report immediately
- Assessment form writes to Neon and links back to the report lead
- HTTPS with a Let's Encrypt certificate (expires 14 December 2026, auto-renews)
- Replies to `research@raclifton.com` forward to Gmail

The database held **zero rows** at the end of session 2. It does not any more:
v14.2 testing put 2 rows into `website_leads` and 3 into
`research_report_leads`, all Clifton's own. **Preview deployments write to the
production database** — they share `DATABASE_URL` — so testing a preview
creates real rows in real tables. Purge again before real leads arrive.

### Open items

| # | Item | Owner |
|---|---|---|
| 1 | ~~Submit both forms through a real browser~~ — **done 15 Sep**, `joined = true` | Closed |
| 2 | Safari **visual** pass at a couple of widths — its form handling is already proven | **Clifton** |
| 3 | Decide whether to publish the revised research report PDF to the site | **Clifton** |
| 4 | Delete `~/.raclifton-setup-tokens` and `~/.raclifton-db` | Claude, on your say-so |
| 5 | Vercel token expires **14 October 2026** | Note only — see SOP 4 |
| 6 | **Hero and header text is still fuzzy** — the original v14.2 ask, attempted and reverted. See SESSION-3-TRANSCRIPT.md before retrying | **Clifton** |
| 7 | Purge the lead tables again — v14.2 testing put rows back | Claude, on your say-so |
| 8 | Look at the redesigned report email; the sends on record used the old one | **Clifton** |
| 9 | Confirm the share card renders — paste the site into Slack or iMessage | **Clifton** |
| 10 | Footer *Resources / About / Contact* go nowhere; *Privacy* and *Terms* are not links | **Clifton** |
| 11 | `POST /api/leads` has no rate limit, honeypot or CAPTCHA | Pre-existing |

**This was closed on 15 September.** Both paths were driven through a real
Chrome instance and the attribution join came back `true`. SOP 6 is kept below
because it is the right check to re-run after any change to the forms, the
modal, or the session-storage keys.

Why it mattered: API tests call the site's endpoints directly, bypassing all
the browser JavaScript.
When someone requests the research report, the page quietly stores an ID in
that browser tab; the assessment form later reads it back and that is what
links the two records together. API calls set that ID by hand, so they prove
the *database* join works — not the browser step that fills it in.

If that step is broken, real attribution silently records `null` and nothing
will alert you. It is fifteen minutes of work to rule out. See SOP 6.

**Two elements are intentionally inert** in the approved design: the header
hamburger menu and the five "Not sure where to start?" chips. Both have
styling but no code behind them. They are not bugs — `CLAUDE.md` forbids
behaviour changes — but they are also not finished features. Raise them
deliberately if you ever want them working.

---

## 3. SOPs

### SOP 1 — Make a change to the site and publish it

> **Superseded by SOP 9 in [SESSION-HANDOFF.md](SESSION-HANDOFF.md).** That
> version branches, previews, and waits for Clifton's approval before anything
> reaches production, which is how v14.2 was shipped. Use it instead. The
> original is kept below because its individual commands are still correct.


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

### SOP 6 — Prove the two lead paths work through a real browser

**Do this once.** It is the only outstanding gate on the launch. It tests the
browser step that links an assessment lead back to the research report that
introduced them — something no API test can check.

**The rule: one tab, in order, no reloads.** The link is carried in the
browser tab's temporary memory. Opening a new tab, reloading, or doing the
assessment first will break it, and the test will look like a failure when it
is really just the wrong order.

1. Open **https://www.raclifton.com** in Chrome. One tab.
2. Scroll to **"AI for Small Business: The Case for Starting Now."**
3. Click **Get the Research Report →**. A popup opens.
4. Enter a name you will recognise later — use `QA Test` and your own email.
5. Click **Get the Research Report →**. Within a few seconds you should see a
   success screen with **Read Report →**, **Download PDF**, and a link to the
   AI Readiness Score.
6. **Do not close the tab.** In that same popup, click
   **Discover Your AI Readiness Score™ →**. The popup closes and the page
   scrolls to the form.
7. Tick two or three checkboxes.
8. Enter the **same** name and email.
9. Click **Get Started →**. Expect **"Thank you. Your information has been
   received."**
10. Ask Claude to run the attribution check below. The answer you want is a
    row where `joined` is `true` — not `null`.

```bash
cd "<project root>"
node --input-type=module -e '
import fs from "node:fs";
import { neon } from "@neondatabase/serverless";
const url = fs.readFileSync(process.env.HOME + "/.raclifton-db","utf8")
  .split("\n").find(l=>l.startsWith("DATABASE_URL=")).slice(13).trim();
const sql = neon(url);
console.table(await sql`
  SELECT w.full_name, w.cta_origin, r.full_name AS report_lead, r.email_sent,
         (w.research_report_lead_id = r.id) AS joined
  FROM website_leads w
  LEFT JOIN research_report_leads r ON r.id = w.research_report_lead_id
  ORDER BY w.created_at DESC LIMIT 5`);
'
```

11. **Delete the test rows afterwards** so your lead tables stay clean:

```bash
node --input-type=module -e '
import fs from "node:fs";
import { neon } from "@neondatabase/serverless";
const url = fs.readFileSync(process.env.HOME + "/.raclifton-db","utf8")
  .split("\n").find(l=>l.startsWith("DATABASE_URL=")).slice(13).trim();
const sql = neon(url);
await sql`DELETE FROM website_leads WHERE full_name = ${"QA Test"}`;
await sql`DELETE FROM research_report_leads WHERE full_name = ${"QA Test"}`;
console.log("purged");
'
```

**If `joined` comes back `null`:** the browser handoff is broken. That is a
real bug worth fixing — tell Claude, and point it at
`components/V12ClientController.tsx` and
`components/ResearchReportLeadMagnet.tsx`, which read and write
`rac_research_lead_id` in session storage.

---

### SOP 7 — Take the site public, or put it back behind a login

You will need this if you ever want to hide the site again — during a big
redesign, for example.

**Do not use the Vercel MCP tool for this.** Its list of options omits the one
you need, and the closest alternative leaves your main address publicly
readable while appearing to have worked. Use the REST API.

1. Load the Vercel token:

```bash
set -a; . ~/.raclifton-setup-tokens; set +a
P=prj_jy6MvHCgCaSeTYqY9zRACtcL2eoC
T=team_UKZCLZYnq61v3vUYRQsJMoBr
```

2. Check the current setting:

```bash
curl -sS -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/$P?teamId=$T" \
  | python3 -c "import sys,json;print(json.load(sys.stdin).get('ssoProtection'))"
```

3. Change it. The value you want depends on the goal:

| Goal | `deploymentType` |
|---|---|
| **Public site** (normal) | `all_except_custom_domains` |
| **Fully private**, including raclifton.com | `all` |

```bash
curl -sS -X PATCH -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ssoProtection":{"deploymentType":"all_except_custom_domains"}}' \
  "https://api.vercel.com/v9/projects/$P?teamId=$T" \
  | python3 -c "import sys,json;print(json.load(sys.stdin).get('ssoProtection'))"
```

4. **Verify by reading the page, not the status code.** A gated site returns
   `200` — because Vercel's login page is itself a working page. This has
   fooled two sessions now.

```bash
curl -sS -o /tmp/check.html -L https://www.raclifton.com
grep -o '<title>[^<]*</title>' /tmp/check.html   # want R.A. Clifton, not "Login – Vercel"
grep -c 'vercel.com/login' /tmp/check.html        # want 0 when public
```

5. When public, also confirm the raw deployment URLs are **still** gated —
   that is the difference between the two settings, and the thing the MCP tool
   gets wrong:

```bash
curl -sS -L https://ra-clifton-website-raclifton.vercel.app \
  | grep -o '<title>[^<]*</title>'    # want "Login – Vercel"
```

---

### SOP 8 — Replace the research report PDF on the site

The report is a plain file, not a database record. Swapping it is a normal
site change.

1. Put the new PDF in `public/research/`.
2. **Keep the existing filename**
   (`ai-for-a-small-business-the-case-for-starting-now.pdf`) unless you have a
   reason not to. Every report email ever sent points at that exact path — if
   you rename it, all those links break.
3. Follow **SOP 1** to publish (build, commit, push; Vercel deploys itself).
4. Confirm the live file is actually the new one — check the byte size
   changed, not just that it loads:

```bash
curl -sS -o /dev/null -w "%{http_code} %{content_type} %{size_download}\n" -L \
  https://www.raclifton.com/research/ai-for-a-small-business-the-case-for-starting-now.pdf
```

5. Hard-refresh in your browser (**⌘⇧R**) before deciding it hasn't updated —
   PDFs cache aggressively.

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

**Vercel Authentication was what kept the site private.** It was switched on
15 September 2026 so the custom domain is public while raw deployment URLs
stay gated. See SOP 7 to reverse it.

**A gated Vercel site returns `200`, not `403`.** Vercel's login page is a
working page, so any check based on the status code will report success on a
site nobody can see. Always read the page title or look for
`vercel.com/login` in the body.

**Georgia has old-style figures.** Its digits deliberately vary in height —
`5`, `3`, `4`, `7` and `9` hang below the baseline; `6` and `8` rise above
it. The site uses Georgia for headings and big numbers, so any new stat may
look misaligned. It is the typeface, not a CSS bug, and no font property can
change it — Georgia ships no lining-figure set. `globals.css` has a worked
example with the measurements.

**Email delivery is deliberately not a blocker.** If Resend is down, the
visitor still gets their report immediately and the lead is still saved. The
only loss is the email copy — which is why `email_sent` exists as a column.
