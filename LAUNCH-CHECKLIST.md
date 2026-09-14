# R.A. Clifton® v14.1.2 — Launch Checklist

## Local
- [ ] Node/npm/git available
- [ ] `npm install` succeeds
- [ ] `.env.local` created and not committed
- [ ] `npm run dev` succeeds
- [ ] desktop/tablet/mobile visual parity checked
- [ ] `npm run build` succeeds

## Neon
- [ ] production Neon database created
- [ ] migration 001 applied
- [ ] migration 002 applied
- [ ] main lead form writes successfully
- [ ] research report form writes successfully

## Resend
- [ ] sending domain verified
- [ ] API key created
- [ ] `RESEND_API_KEY` configured
- [ ] `RESEND_FROM_EMAIL` configured
- [ ] report email received in test inbox
- [ ] email report link works
- [ ] email AI Readiness link works

## GitHub
- [ ] repository is private
- [ ] `.env.local` absent
- [ ] `node_modules` absent
- [ ] `.next` absent
- [ ] known-good baseline committed

## Vercel preview
- [ ] GitHub repo imported
- [ ] environment variables configured
- [ ] deployment succeeds
- [ ] Chrome tested
- [ ] Safari tested
- [ ] 1440 tested
- [ ] 1280 tested
- [ ] 1024 tested
- [ ] 834 tested
- [ ] 393 tested
- [ ] 390 tested
- [ ] 375 tested
- [ ] 360 tested
- [ ] no major console errors
- [ ] no unexpected horizontal scrolling

## Production
- [ ] custom domain connected
- [ ] HTTPS works
- [ ] `NEXT_PUBLIC_SITE_URL` set to canonical production URL
- [ ] production redeployed after URL change
- [ ] Path A tested end-to-end
- [ ] Path B tested end-to-end
- [ ] report-to-assessment attribution confirmed
- [ ] production baseline committed/tagged before new site build-out
