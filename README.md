# R.A. Clifton® Website — v14.1.2 Deployment Candidate

This repository is the approved R.A. Clifton® premium website production candidate prepared for **VS Code + Claude Code development and Vercel deployment**.

## Governing scope
- Governing visual/content baseline: v14
- Research-report lead magnet: v14.1
- `5 HOURS` typography correction: v14.1.1
- Resend + Vercel deployment update: v14.1.2
- Deferred: v15 Proof of Practice / technology-ecosystem additions

## Production stack
- Next.js App Router
- Vercel
- Neon Postgres
- Resend transactional email
- GitHub
- VS Code + Claude Code

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure `.env.local`:

```env
DATABASE_URL=your_neon_connection_string
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=R.A. Clifton <research@raclifton.com>
```

Apply database migrations in order:

1. `db/001_create_website_leads.sql`
2. `db/002_research_report_leads.sql`

Then verify production build:

```bash
npm run build
```

## Key documentation
- `CLAUDE.md` — project guardrails for Claude Code
- `DEPLOYMENT-VERCEL.md` — complete local → GitHub → Vercel runbook
- `RESEND-SETUP.md` — Resend setup and security notes
- `LAUNCH-CHECKLIST.md` — deployment acceptance checklist
- `MIGRATION-NOTES.md` — locked migration / responsive guardrails
- `EXPERT-EVALUATION-MATRIX.md` — evaluation reference

## Research report lead magnet
The approved research CTA captures only Full Name + Email, writes a dedicated `research_report_leads` record, immediately provides the authoritative PDF, and then sends an additional access email through Resend.

Attribution remains:
- `lead_source = research_report`
- `lead_magnet = ai_case_for_starting_now`
- `cta_origin = why_ai_research_section`

The research lead ID can carry into a later assessment-interest submission so report → AI Readiness → assessment can be measured.

## Locked implementation rules
No redesign, no new homepage content, no funnel changes, no v15 credibility modules, and no technology-stack expansion during deployment. The goal is a stable production baseline first.
