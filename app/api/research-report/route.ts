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

/**
 * Email HTML is not web HTML. Outlook renders through Word, Gmail strips <style>
 * blocks, and neither supports flexbox or grid. So: tables for layout, every
 * style inline, one 600px column, absolute image URLs, and a button built from a
 * padded table cell rather than a styled anchor.
 */
function reportEmailHtml(fullName: string, reportUrl: string, readinessUrl: string, site: string) {
  const name = escapeHtml(fullName);
  const cover = `${site}/assets/report-cover.jpg`;
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your R.A. Clifton Research Report</title></head>
<body style="margin:0;padding:0;background:#eeeae1;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your decision brief on AI for small business is ready to read.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eeeae1;">
<tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:10px;overflow:hidden;">

  <tr><td style="background:#07131b;padding:26px 32px;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:bold;color:#ffffff;">R.A. Clifton&#8482;</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:1.6px;color:#efbd55;padding-top:6px;">STRATEGY &#8226; ADVISORY &#8226; FINANCIAL INTELLIGENCE</div>
  </td></tr>

  <tr><td style="padding:34px 32px 8px;font-family:Arial,Helvetica,sans-serif;">
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#101820;">Hello ${name},</p>
    <p style="margin:0;font-size:16px;line-height:1.6;color:#46545d;">Your copy of <strong style="color:#101820;">AI for a Small Business: The Case for Starting Now</strong> is ready. It is a short, evidence-based brief written for owners who are interested in AI but not interested in betting the company on it.</p>
  </td></tr>

  <tr><td align="center" style="padding:26px 32px 6px;">
    <a href="${reportUrl}" style="text-decoration:none;">
      <img src="${cover}" width="260" alt="Cover of the R.A. Clifton decision brief, AI for a Small Business: The Case for Starting Now" style="width:260px;max-width:100%;height:auto;display:block;border:1px solid #dcd7cc;border-radius:5px;">
    </a>
  </td></tr>

  <tr><td align="center" style="padding:22px 32px 6px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="center" bgcolor="#efbd55" style="border-radius:6px;">
        <a href="${reportUrl}" style="display:inline-block;padding:15px 34px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#17130b;text-decoration:none;border-radius:6px;">Read the Report &#8594;</a>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:10px 32px 30px;font-family:Arial,Helvetica,sans-serif;">
    <p style="margin:0;font-size:12.5px;line-height:1.5;color:#7b8790;text-align:center;">No sign-in needed &#8226; About a 12 minute read</p>
  </td></tr>

  <tr><td style="padding:0 32px;"><div style="border-top:1px solid #e6e1d7;font-size:0;line-height:0;">&nbsp;</div></td></tr>

  <tr><td style="padding:26px 32px 34px;font-family:Arial,Helvetica,sans-serif;">
    <p style="margin:0 0 8px;font-size:10px;letter-spacing:1.4px;color:#9b6a18;font-weight:bold;">A GOOD FIRST STEP</p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#46545d;">Once you have read it, the natural next question is where your own business actually stands. The AI Readiness Score&#8482; takes about five minutes and is complimentary during pre-launch.</p>
    <a href="${readinessUrl}" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#8a6410;text-decoration:underline;">Discover Your AI Readiness Score&#8482; &#8594;</a>
  </td></tr>

  <tr><td style="background:#07131b;padding:22px 32px;font-family:Arial,Helvetica,sans-serif;">
    <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.78);">R.A. Clifton&#8482; &#8226; AI-First CPA &amp; Business Advisory</p>
    <a href="${site}" style="font-size:12px;color:#efbd55;text-decoration:none;">www.raclifton.com</a>
    <p style="margin:12px 0 0;font-size:10.5px;line-height:1.5;color:rgba(255,255,255,0.45);">You are receiving this because you requested this report at www.raclifton.com. This brief is general information, not accounting, tax or legal advice for your specific situation.</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

/** Plain-text alternative. Some clients show only this, so it has to stand alone. */
function reportEmailText(fullName: string, reportUrl: string, readinessUrl: string) {
  return [
    `Hello ${fullName},`,
    "",
    "Your copy of “AI for a Small Business: The Case for Starting Now” is ready.",
    "It is a short, evidence-based brief written for owners who are interested in AI",
    "but not interested in betting the company on it.",
    "",
    `Read the report: ${reportUrl}`,
    "No sign-in needed. About a 12 minute read.",
    "",
    "A GOOD FIRST STEP",
    "Once you have read it, the natural next question is where your own business",
    "actually stands. The AI Readiness Score is complimentary during pre-launch and",
    "takes about five minutes.",
    "",
    `Discover your AI Readiness Score: ${readinessUrl}`,
    "",
    "R.A. Clifton™ — AI-First CPA & Business Advisory",
    "www.raclifton.com",
  ].join("\n");
}

/** The name is visitor-supplied and lands inside an HTML document. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
      text: reportEmailText(fullName, reportUrl, readinessUrl),
      html: reportEmailHtml(fullName, reportUrl, readinessUrl, site),
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
