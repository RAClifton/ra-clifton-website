# R.A. Clifton® v14.1.2 — Research Report Lead Magnet + Resend Deployment Update

Governing baseline: v14. This release does not include deferred v15 Proof of Practice or technology-ecosystem work.

## Implemented
- Activated the understated `Get the Research Report →` CTA in the approved Why AI / Why Now section.
- Added a premium journal-style modal with only Full Name + Email Address.
- Uses the authoritative completed PDF: `AI for a Small Business: The Case for Starting Now`.
- Provides immediate Read Report and Download PDF access after successful capture.
- Sends the email access link through **Resend** when production email environment variables are configured.
- Stores report leads separately in `research_report_leads` with:
  - `lead_source = research_report`
  - `lead_magnet = ai_case_for_starting_now`
  - `cta_origin = why_ai_research_section`
- Carries `research_report_lead_id` into a later website lead / assessment-interest submission to support funnel attribution.
- Preserves AI Readiness Score™ as the primary conversion path.

## v14.1.1 launch polish
- Corrected the `5 HOURS` research proof-point typography so the numeral and unit share one consistent display size and baseline.
- No content, funnel, layout, or lead-magnet behavior changes were introduced.
- Duplicate-content compression remains a post-launch P1 optimization, not a launch blocker.

## v14.1.2 deployment update
- Replaced the Postmark integration with Resend.
- Environment variables now use `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
- Added `CLAUDE.md` for Claude Code guardrails.
- Added a Vercel deployment runbook, Resend setup guide, and launch checklist.
- Target deployment architecture: GitHub → Vercel, Neon for database, Resend for transactional email, Cloudflare optional for DNS only.

## Production setup
1. Apply `db/001_create_website_leads.sql` if not already applied.
2. Apply `db/002_research_report_leads.sql`.
3. Configure `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL`.
4. Verify the Resend sending domain/sender before production email testing.
5. Test modal keyboard/Escape behavior and widths 1440/1280/1024/834/393/390/375/360.

## Intentional non-changes
No redesign, no new homepage section, no changes to assessment CTA destinations, no v15 proof modules, no fabricated testimonials/results, and no changes to approved responsive strategy.
