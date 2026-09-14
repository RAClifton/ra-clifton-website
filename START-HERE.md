# START HERE — R.A. Clifton® v14.1.2

## Your immediate goal
Do not build more website features yet. First get this exact production candidate running locally and deployed to Vercel.

## Files to read in order
1. `CLAUDE.md` — Claude Code project rules and locked scope
2. `DEPLOYMENT-VERCEL.md` — step-by-step deployment runbook
3. `RESEND-SETUP.md` — transactional email setup
4. `LAUNCH-CHECKLIST.md` — acceptance checklist

## First 8 actions
1. Put this folder where you want the permanent project to live.
2. Open the **folder itself** in VS Code.
3. Open the VS Code integrated terminal.
4. Confirm you are in the project root (the folder containing `package.json`).
5. Start Claude Code from this project root.
6. Run `npm install`.
7. Run `cp .env.example .env.local` and add your credentials when available.
8. Run `npm run dev`, then open `http://localhost:3000`.

## Important
Do **not** run `create-next-app`. This folder is already the application.

## Deployment architecture
- Development: VS Code + Claude Code
- Source control: GitHub
- Hosting: Vercel
- Database: Neon Postgres
- Transactional email: Resend
- DNS: Cloudflare may remain the DNS provider if desired

## Production environment variables
- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## Stop point before more site build-out
Resume website enhancements only after:
- local production build passes,
- Vercel preview passes QA,
- the production domain works,
- both lead paths work end-to-end.
