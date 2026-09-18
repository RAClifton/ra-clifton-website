import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { leadSchema } from "@/lib/lead-schema";
import { sendLeadNotification } from "@/lib/lead-notification";
import { sendLeadConfirmation } from "@/lib/lead-confirmation";

export const runtime = "edge";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const userAgent = request.headers.get("user-agent") || null;
  const parsed = leadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your name, email, and selections." }, { status: 400 });
  }

  const sql = getSql();
  if (!sql) {
    return NextResponse.json({ error: "Lead capture is not configured yet." }, { status: 503 });
  }

  const referralCode = parsed.data.sessionReferralCode || `rac_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const { fullName, email, interests, focusAreas, message, ctaOrigin, referredBy, researchReportLeadId } = parsed.data;

  await sql`
    INSERT INTO website_leads
      (full_name, email, interests, focus_areas, message, cta_origin, referred_by, referral_code, research_report_lead_id, ip_address, user_agent)
    VALUES
      (${fullName}, ${email.toLowerCase()}, ${JSON.stringify(interests)}::jsonb, ${JSON.stringify(focusAreas)}::jsonb, ${message || null}, ${ctaOrigin || null}, ${referredBy || null}, ${referralCode}, ${researchReportLeadId || null}, ${ip}, ${userAgent})
  `;

  // The lead is saved. Both emails from here are best-effort: if either fails,
  // the lead is still captured and the visitor still sees a success. Failing
  // loudly here would throw away a lead over a mail problem.
  //
  // allSettled, not sequential awaits: the visitor is waiting on this response,
  // and one slow send should not be stacked on top of the other.
  await Promise.allSettled([
    sendLeadNotification({
      fullName,
      email: email.toLowerCase(),
      interests,
      focusAreas,
      message,
      ctaOrigin,
      referredBy,
      cameFromResearchReport: Boolean(researchReportLeadId),
      receivedAt: new Date(),
    }),
    sendLeadConfirmation({
      fullName,
      email: email.toLowerCase(),
      interests,
      focusAreas,
      alreadyHasReport: Boolean(researchReportLeadId),
    }),
  ]);

  return NextResponse.json({ ok: true, referralCode }, { status: 201 });
}
