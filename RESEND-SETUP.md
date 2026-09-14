# Resend Setup — R.A. Clifton® Website

## Purpose
Resend is used only for transactional delivery of the requested research-report email. It does not control the website UI, PDF access, or database capture.

The site intentionally gives the visitor immediate report access after the database capture succeeds. Email is an additional delivery channel, not a blocker.

## Required environment variables

```env
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=R.A. Clifton <research@raclifton.com>
NEXT_PUBLIC_SITE_URL=https://www.raclifton.com
```

## Production setup
1. Add the R.A. Clifton sending domain in Resend.
2. Add Resend's supplied DNS authentication records at your DNS provider.
3. Wait until the domain shows verified.
4. Create a production API key with only the permissions needed for sending.
5. Store it only in `.env.local` locally and Vercel Environment Variables in deployment.
6. Never expose it using a `NEXT_PUBLIC_` prefix.

## Current integration
Server route:

`app/api/research-report/route.ts`

API call:

`POST https://api.resend.com/emails`

Authentication:

`Authorization: Bearer $RESEND_API_KEY`

The route records the lead first, then requests email delivery. If Resend is unavailable, the visitor still receives the success state and immediate report access.
