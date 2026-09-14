# R.A. Clifton® Website — Claude Code Project Instructions

## Governing release
**v14.1.2 — Resend / Vercel deployment candidate**

This is an existing approved Next.js website. Do not scaffold a new app and do not redesign the site while preparing deployment.

## Primary objective
Get the current repository running locally, build-clean, connected to Neon + Resend, committed to GitHub, and deployed to Vercel with the smallest safe set of technical changes.

## Locked product / design rules
- Preserve the approved Minimal Luxury visual direction.
- Preserve the approved copy unless the user explicitly requests a copy change.
- Preserve AI Readiness Score™ as the primary conversion path.
- Preserve the Research Report as the secondary conversion path.
- Preserve all major assessment CTAs targeting `#assessment-interest`.
- Preserve the approved responsive policy:
  - `>=1024px`: desktop / large iPad landscape
  - `768–1023px`: tablet / iPad portrait
  - `393px`: primary phone reference
  - also support 390 / 375 / 360
  - `<=359px`: compact fallback
- Do not add v15 Proof of Practice or technology-ecosystem sections.
- Do not fabricate testimonials, logos, client results, or case studies.

## Stack for this deployment
- Next.js App Router
- Vercel hosting
- Neon Postgres
- Resend transactional email
- GitHub source control
- VS Code + Claude Code development workflow

## Environment variables
Server-only variables must never be exposed to client code or committed:
- `DATABASE_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Public/site variable:
- `NEXT_PUBLIC_SITE_URL`

Local values go in `.env.local` only.

## Deployment workflow
1. `npm install`
2. `npm run dev`
3. Inspect visual parity before making changes.
4. `npm run build`
5. If build fails, diagnose first and make only the minimum technical fix.
6. Apply Neon migrations in order:
   - `db/001_create_website_leads.sql`
   - `db/002_research_report_leads.sql`
7. Configure and verify the Resend sending domain / sender.
8. Test report capture + immediate PDF + email + attribution.
9. Commit a known-good local baseline to Git.
10. Push to GitHub.
11. Import GitHub repository into Vercel.
12. Add environment variables in Vercel.
13. Validate the Vercel preview deployment.
14. Connect production domain only after preview QA passes.

## Change discipline
Do not:
- convert the project to Tailwind
- replace the CSS system
- introduce an ORM
- replace Neon
- introduce Clerk, Redis, Inngest, or another service for this launch
- refactor components merely for cleanliness
- upgrade dependencies unless required to fix a concrete build/security problem
- alter DOM/layout behavior without explicit approval

## When an error occurs
Before editing:
1. explain the root cause,
2. identify the smallest change that should resolve it,
3. preserve rendered output and funnel behavior,
4. run the relevant verification again.

## Success definition
Deployment is complete when:
- `npm run build` succeeds,
- forms write to Neon,
- research-report email sends through Resend,
- immediate report access works even if email fails,
- report-to-assessment attribution is preserved,
- Vercel preview passes desktop/tablet/mobile QA,
- production domain works over HTTPS,
- no secrets are committed to GitHub.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
