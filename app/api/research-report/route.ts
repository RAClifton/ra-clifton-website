import { NextResponse } from "next/server";
import { z } from "zod";
import { getSql } from "@/lib/db";

export const runtime = "edge";

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  ctaOrigin: z.literal("why_ai_research_section").default("why_ai_research_section"),
});

const REPORT_PATH = "/research/ai-for-a-small-business-the-case-for-starting-now.pdf";

async function sendReportEmail(email: string, fullName: string, leadId: string) {
  const token = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!token || !from || !site) return false;
  const reportUrl = `${site}${REPORT_PATH}?rr=${encodeURIComponent(leadId)}`;
  const readinessUrl = `${site}/?rr=${encodeURIComponent(leadId)}#assessment-interest`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your R.A. Clifton Research Report",
      text: `Hello ${fullName},\n\nYour research report is ready: ${reportUrl}\n\nWhen you're ready, discover your AI readiness: ${readinessUrl}\n\nR.A. Clifton®`,
      html: `<p>Hello ${fullName},</p><p>Your R.A. Clifton® research report is ready.</p><p><a href="${reportUrl}">Read / Download the Research Report</a></p><p>When you're ready for the next step: <a href="${readinessUrl}">Discover Your AI Readiness Score™</a>.</p><p>R.A. Clifton®</p>`,
    }),
  });
  return response.ok;
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please enter your full name and a valid email address." }, { status: 400 });
  const sql = getSql();
  if (!sql) return NextResponse.json({ error: "Lead capture is not configured yet." }, { status: 503 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const userAgent = request.headers.get("user-agent") || null;
  const { fullName, email, ctaOrigin } = parsed.data;
  const [lead] = await sql`
    INSERT INTO research_report_leads
      (full_name, email, lead_source, lead_magnet, cta_origin, ip_address, user_agent)
    VALUES
      (${fullName}, ${email.toLowerCase()}, 'research_report', 'ai_case_for_starting_now', ${ctaOrigin}, ${ip}, ${userAgent})
    RETURNING id
  `;
  const leadId = String(lead.id);
  const emailSent = await sendReportEmail(email.toLowerCase(), fullName, leadId).catch(() => false);
  if (emailSent) await sql`UPDATE research_report_leads SET email_sent = true WHERE id = ${leadId}::uuid`;
  return NextResponse.json({ ok: true, leadId, reportUrl: `${REPORT_PATH}?rr=${encodeURIComponent(leadId)}`, emailSent }, { status: 201 });
}
