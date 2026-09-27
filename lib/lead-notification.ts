/**
 * The internal "you have a new lead" email.
 *
 * This goes to Clifton, not to the visitor, so it is written to be *read at a
 * glance on a phone* and acted on: who, how to reach them, what they asked for,
 * what they said. No marketing, no cover image, no call to action.
 *
 * Two deliberate choices:
 *
 *  - Reply-To is set to the lead's own address, so replying from Gmail goes
 *    straight to them. That is the whole point of the email.
 *  - Every visitor-supplied value is escaped. Name, message, ticked labels and
 *    CTA origin all arrive from the browser and land inside an HTML document.
 *
 * Email HTML is not web HTML — see the note in app/api/research-report/route.ts.
 * Tables for layout, every style inline, one 600px column.
 */

export type LeadNotification = {
  fullName: string;
  email: string;
  interests: string[];
  wantsConversation: boolean;
  focusAreas: string[];
  message?: string | null;
  ctaOrigin?: string | null;
  referredBy?: string | null;
  cameFromResearchReport: boolean;
  receivedAt: Date;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Eastern time, because that is the clock Clifton actually works to. */
function formatReceived(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(date);
}

export function leadNotificationSubject(lead: LeadNotification) {
  const name = lead.fullName.replace(/\s+/g, " ").trim();
  return lead.cameFromResearchReport
    ? `New lead (read the report first) — ${name}`
    : `New assessment lead — ${name}`;
}

/** One label per line, so a long list stays readable on a phone. */
function listRows(items: string[]) {
  if (!items.length) return `<p style="margin:0;font-size:14px;line-height:1.5;color:#98a3ab;">None selected</p>`;
  return items
    .map(
      (item) =>
        `<p style="margin:0 0 6px;font-size:14.5px;line-height:1.5;color:#101820;">&#8226;&nbsp;${escapeHtml(item)}</p>`
    )
    .join("");
}

function sectionLabel(text: string) {
  return `<p style="margin:0 0 9px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:1.4px;font-weight:bold;color:#9b6a18;">${text}</p>`;
}

export function leadNotificationHtml(lead: LeadNotification) {
  const name = escapeHtml(lead.fullName);
  const email = escapeHtml(lead.email);
  const hasMessage = Boolean(lead.message && lead.message.trim());

  const messageBlock = hasMessage
    ? `<tr><td style="padding:0 32px 26px;font-family:Arial,Helvetica,sans-serif;">
        ${sectionLabel("WHAT THEY WROTE")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="background:#fdf7e8;border-left:3px solid #efbd55;padding:16px 18px;">
            <p style="margin:0;font-size:15px;line-height:1.65;color:#101820;white-space:pre-wrap;">${escapeHtml(
              lead.message!.trim()
            )}</p>
          </td></tr>
        </table>
      </td></tr>`
    : "";

  const reportBadge = lead.cameFromResearchReport
    ? `<tr><td style="padding:0 32px 22px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td bgcolor="#07131b" style="border-radius:5px;padding:9px 14px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;color:#efbd55;">
            Read the research report before signing up
          </td>
        </tr></table>
      </td></tr>`
    : "";

  const context: string[] = [];
  if (lead.ctaOrigin) context.push(`Clicked: ${escapeHtml(lead.ctaOrigin)}`);
  if (lead.referredBy) context.push(`Referred by code: ${escapeHtml(lead.referredBy)}`);
  const contextBlock = context.length
    ? `<tr><td style="padding:0 32px 26px;font-family:Arial,Helvetica,sans-serif;">
        ${sectionLabel("HOW THEY GOT HERE")}
        ${context
          .map((line) => `<p style="margin:0 0 5px;font-size:13px;line-height:1.5;color:#6b7780;">${line}</p>`)
          .join("")}
      </td></tr>`
    : "";

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New lead</title></head>
<body style="margin:0;padding:0;background:#eeeae1;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${name} &#8212; ${email}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eeeae1;">
<tr><td align="center" style="padding:24px 14px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:10px;overflow:hidden;">

  <tr><td style="background:#07131b;padding:20px 32px;font-family:Arial,Helvetica,sans-serif;">
    <div style="font-size:10px;letter-spacing:1.6px;color:#efbd55;font-weight:bold;">NEW WEBSITE LEAD</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.6);padding-top:5px;">${escapeHtml(
      formatReceived(lead.receivedAt)
    )} ET</div>
  </td></tr>

  <tr><td style="padding:30px 32px 6px;font-family:Arial,Helvetica,sans-serif;">
    <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.25;color:#101820;">${name}</p>
    <a href="mailto:${email}" style="font-size:16px;color:#8a6410;text-decoration:underline;">${email}</a>
    <p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:#7b8790;">Just hit Reply &#8212; it goes straight to them.</p>
  </td></tr>

  <tr><td style="padding:24px 32px 0;"><div style="border-top:1px solid #e6e1d7;font-size:0;line-height:0;">&nbsp;</div></td></tr>

  ${lead.wantsConversation ? `
  <tr><td style="padding:24px 32px 4px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="border:1px solid #efbd55;border-radius:7px;background:#fdf6e6;">
      <tr><td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;">
        <p style="margin:0 0 3px;font-size:11px;letter-spacing:.12em;color:#8a6410;font-weight:bold;">ASKED TO BOOK A DISCOVERY CALL</p>
        <p style="margin:0;font-size:15px;line-height:1.5;color:#101820;"><strong>15 minutes.</strong> Reply within one business day to arrange a time.</p>
      </td></tr>
    </table>
  </td></tr>` : ""}

  <tr><td style="padding:24px 32px 26px;font-family:Arial,Helvetica,sans-serif;">
    ${sectionLabel("ASSESSMENTS THEY ASKED ABOUT")}
    ${listRows(lead.interests)}
  </td></tr>

  <tr><td style="padding:0 32px 26px;font-family:Arial,Helvetica,sans-serif;">
    ${sectionLabel("WHAT THEY WANT TO IMPROVE")}
    ${listRows(lead.focusAreas)}
  </td></tr>

  ${messageBlock}
  ${reportBadge}
  ${contextBlock}

  <tr><td style="background:#f6f3ec;padding:18px 32px;font-family:Arial,Helvetica,sans-serif;">
    <p style="margin:0;font-size:11.5px;line-height:1.55;color:#7b8790;">Saved to the <strong style="color:#46545d;">website_leads</strong> table. This notice is sent to you only &#8212; the visitor does not receive a copy.</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

/** Plain-text alternative. Some clients show only this, so it has to stand alone. */
export function leadNotificationText(lead: LeadNotification) {
  const lines = [
    "NEW WEBSITE LEAD",
    `${formatReceived(lead.receivedAt)} ET`,
    "",
    lead.fullName,
    lead.email,
    "Reply to this email to reach them directly.",
    ...(lead.wantsConversation
      ? ["", "ASKED TO BOOK A DISCOVERY CALL", "  15 minutes. Reply within one business day to arrange a time."]
      : []),
    "",
    "ASSESSMENTS THEY ASKED ABOUT",
    ...(lead.interests.length ? lead.interests.map((i) => `  - ${i}`) : ["  None selected"]),
    "",
    "WHAT THEY WANT TO IMPROVE",
    ...(lead.focusAreas.length ? lead.focusAreas.map((f) => `  - ${f}`) : ["  None selected"]),
  ];

  if (lead.message && lead.message.trim()) {
    lines.push("", "WHAT THEY WROTE", lead.message.trim());
  }
  if (lead.cameFromResearchReport) {
    lines.push("", "They read the research report before signing up.");
  }
  if (lead.ctaOrigin) lines.push("", `Clicked: ${lead.ctaOrigin}`);
  if (lead.referredBy) lines.push(`Referred by code: ${lead.referredBy}`);

  lines.push("", "Saved to the website_leads table. The visitor does not receive a copy.");
  return lines.join("\n");
}

/**
 * Returns false rather than throwing. The lead is already safely in the
 * database by the time this runs; a mail failure must never turn a captured
 * lead into an error for the visitor.
 */
export async function sendLeadNotification(lead: LeadNotification): Promise<boolean> {
  const token = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  if (!token || !from || !to) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      from,
      to: to.split(",").map((address) => address.trim()).filter(Boolean),
      reply_to: lead.email,
      subject: leadNotificationSubject(lead),
      text: leadNotificationText(lead),
      html: leadNotificationHtml(lead),
    }),
  });
  return response.ok;
}
