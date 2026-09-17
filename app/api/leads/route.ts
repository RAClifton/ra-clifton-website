import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { leadSchema } from "@/lib/lead-schema";

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

  return NextResponse.json({ ok: true, referralCode }, { status: 201 });
}
