# R.A. Clifton® v14.1.2 — VS Code + Claude Code + Vercel Deployment Runbook

## 1. Open the existing project
Do **not** run `create-next-app`. Open this repository folder directly in VS Code.

```bash
cd /path/to/ra-clifton-website
code .
```

Start Claude Code from this same project root so `CLAUDE.md` is automatically available as project guidance.

## 2. Verify local prerequisites
Recommended: Node.js 22 LTS.

```bash
node --version
npm --version
git --version
```

## 3. Install dependencies

```bash
npm install
```

## 4. Create local environment configuration

```bash
cp .env.example .env.local
```

Fill in:

```env
DATABASE_URL=your_neon_connection_string
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=R.A. Clifton <research@raclifton.com>
```

Never commit `.env.local`.

## 5. Run locally

```bash
npm run dev
```

Open `http://localhost:3000` and verify the approved site before making any code changes.

### Required viewport checks
- 1440
- 1280
- 1024
- 834
- 393
- 390
- 375
- 360

Check especially:
- hero composition
- assessment cards / swipe discoverability
- corrected `5 HOURS` typography
- research CTA + modal
- modal keyboard / Escape behavior
- assessment scroll behavior
- no horizontal overflow

## 6. Configure Neon
Create / select the production Neon project and copy its Postgres connection string into `DATABASE_URL`.

Apply SQL in this exact order:

1. `db/001_create_website_leads.sql`
2. `db/002_research_report_leads.sql`

The site uses:
- `website_leads` for main assessment / website leads
- `research_report_leads` for research-report leads

## 7. Configure Resend
1. Create a Resend account/project.
2. Add and verify the sending domain used by R.A. Clifton.
3. Add the DNS records Resend provides at the DNS host (Cloudflare can remain the DNS provider).
4. Create a Resend API key.
5. Put the API key in `RESEND_API_KEY`.
6. Set `RESEND_FROM_EMAIL` to a verified sender, for example:
   `R.A. Clifton <research@raclifton.com>`

The research-report route calls Resend from the server. The browser never receives the API key.

## 8. Test the research-report flow locally
Test:

`Get the Research Report → Full Name + Email → Submit`

Confirm:
- database row created in `research_report_leads`
- success state appears
- Read Report works immediately
- Download PDF works immediately
- Resend email arrives
- email report link works
- email AI Readiness link works
- `email_sent` becomes true after successful delivery request

Attribution values should remain:
- `lead_source = research_report`
- `lead_magnet = ai_case_for_starting_now`
- `cta_origin = why_ai_research_section`

## 9. Test report-to-assessment attribution
1. Submit the research-report form.
2. Continue to AI Readiness.
3. Submit the assessment-interest form.
4. Verify the website lead contains the research-report lead identifier.

## 10. Run a production build

```bash
npm run build
```

Do not move to Vercel until this succeeds.

Then optionally test the production server locally:

```bash
npm run start
```

## 11. Create the Git baseline

```bash
git init
git status
git add .
git status
git commit -m "R.A. Clifton v14.1.2 Resend production baseline"
```

Before committing, verify these are **not** staged:
- `.env.local`
- `node_modules/`
- `.next/`

## 12. Push to GitHub
Create a private GitHub repository named `ra-clifton-website`, then use the exact remote commands GitHub provides, typically:

```bash
git remote add origin git@github.com:YOUR-ACCOUNT/ra-clifton-website.git
git branch -M main
git push -u origin main
```

## 13. Import into Vercel
In Vercel:
1. Add New → Project
2. Import `ra-clifton-website` from GitHub
3. Confirm framework: Next.js
4. Keep the standard Next.js build settings unless Vercel reports a concrete issue

## 14. Add Vercel environment variables
Add these to Preview and Production as appropriate:

- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

For the first preview, set `NEXT_PUBLIC_SITE_URL` to the actual preview URL if you are testing emailed absolute links. For production, replace it with the canonical production domain and redeploy.

## 15. Vercel preview QA
Before connecting the domain, repeat:
- Chrome + Safari
- 1440 / 1280 / 1024 / 834 / 393 / 390 / 375 / 360
- main assessment lead capture
- research report capture
- immediate report read/download
- Resend email
- attribution
- browser console check

## 16. Connect the production domain
Connect the production hostname in Vercel. If DNS is hosted by Cloudflare, leave DNS there and add the DNS records Vercel instructs you to use.

Then update:

```env
NEXT_PUBLIC_SITE_URL=https://www.raclifton.com
```

(or the final canonical hostname) in Vercel Production and redeploy.

## 17. Final production acceptance test
On the real domain, verify:

### Path A
Homepage → AI Readiness → assessment lead → Neon

### Path B
Homepage → Research Report → Neon → immediate PDF → Resend email → AI Readiness → attributed assessment lead

When both paths work and responsive QA passes, tag/commit this as the production baseline before resuming website build-out.
