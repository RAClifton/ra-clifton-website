/**
 * The confirmation email the visitor receives after the assessment form.
 *
 * Tone, agreed with Clifton: professional but warm, first person, and
 * *reflective* — it reads back what they actually selected so the note could
 * not have been sent to anyone else. It promises a reply within two business
 * days and offers the research brief as the single next step.
 *
 * Two things it must never do:
 *
 *  - imply the AI Readiness Score can be taken today. It is not built. Those
 *    boxes say "Notify Me", and the copy here has to match that.
 *  - re-pitch the research brief at someone who already downloaded it. For
 *    those people it acknowledges they have it instead.
 *
 * Email HTML is not web HTML — see the note in app/api/research-report/route.ts.
 * Tables for layout, every style inline, one 600px column.
 */

import { REPORT_PATH } from "./report";

export type LeadConfirmation = {
  fullName: string;
  email: string;
  interests: string[];
  focusAreas: string[];
  alreadyHasReport: boolean;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * "Dana Whitfield" -> "Dana". Greeting someone by their full name reads like a
 * database wrote it. Falls back to the whole string when there is no space.
 */
export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName.trim();
}

/** ["AI", "Growth"] -> "AI and Growth"; three or more get Oxford commas. */
export function humanList(items: string[]) {
  const clean = items.map((item) => item.trim()).filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
}

const mentions = (interests: string[], needle: string) =>
  interests.some((item) => item.toLowerCase().includes(needle));

export function leadConfirmationSubject(lead: LeadConfirmation) {
  return `Thank you, ${firstName(lead.fullName)} — here's what happens next`;
}

/**
 * The reflective paragraph. Built from what they chose, so it says something
 * true about them rather than something generic about us.
 */
function reflection(lead: LeadConfirmation) {
  const areas = humanList(lead.focusAreas);
  if (areas) {
    return `You mentioned you'd like to focus on <strong style="color:#101820;">${escapeHtml(
      areas
    )}</strong>. That's a practical place to begin, and it tells me a great deal about what would genuinely be useful to you — which is exactly what I'd rather know before we talk.`;
  }
  return `Knowing which of these interests you is genuinely useful — it tells me where to start, and it means our first conversation can be about your business rather than about ours.`;
}

function reflectionText(lead: LeadConfirmation) {
  const areas = humanList(lead.focusAreas);
  if (areas) {
    return `You mentioned you'd like to focus on ${areas}. That's a practical place to begin, and it tells me a great deal about what would genuinely be useful to you — which is exactly what I'd rather know before we talk.`;
  }
  return `Knowing which of these interests you is genuinely useful — it tells me where to start, and it means our first conversation can be about your business rather than about ours.`;
}

/** Honest pre-launch notes, only shown when they apply. */
function notes(lead: LeadConfirmation) {
  const lines: string[] = [];
  if (mentions(lead.interests, "readiness")) {
    lines.push(
      "The AI Readiness Score™ is still being finalised. You're on the early-access list, so you'll be among the first to know the moment it opens — complimentary, as promised."
    );
  }
  if (mentions(lead.interests, "intelligence brief")) {
    lines.push("You're also signed up for the Intelligence Brief. No noise, and you can stop it any time.");
  }
  return lines;
}

export function leadConfirmationHtml(lead: LeadConfirmation, site: string) {
  const name = escapeHtml(firstName(lead.fullName));
  const reportUrl = `${site}${REPORT_PATH}`;
  const cover = `${site}/assets/report-cover.jpg`;

  const interestRows = lead.interests.length
    ? lead.interests
        .map(
          (item) =>
            `<p style="margin:0 0 6px;font-size:14.5px;line-height:1.5;color:#101820;">&#8226;&nbsp;${escapeHtml(
              item
            )}</p>`
        )
        .join("")
    : `<p style="margin:0;font-size:14.5px;line-height:1.5;color:#46545d;">You didn't tick anything in particular &#8212; that's completely fine. Tell me what's on your mind and we'll start there.</p>`;

  const noteLines = notes(lead);
  const notesBlock = noteLines.length
    ? `<tr><td style="padding:0 32px 26px;font-family:Arial,Helvetica,sans-serif;">
        ${noteLines
          .map(
            (line) =>
              `<p style="margin:0 0 10px;font-size:14.5px;line-height:1.6;color:#46545d;">${escapeHtml(line)}</p>`
          )
          .join("")}
      </td></tr>`
    : "";

  const reportBlock = lead.alreadyHasReport
    ? `<tr><td style="padding:0 32px 30px;font-family:Arial,Helvetica,sans-serif;">
        <p style="margin:0;font-size:15px;line-height:1.6;color:#46545d;">You already have a copy of <em>AI for a Small Business: The Case for Starting Now</em>. If it raised anything you'd like to dig into, that's a good thing to bring to our conversation &#8212; just reply and tell me which part.</p>
      </td></tr>`
    : `<tr><td style="padding:0 32px 6px;font-family:Arial,Helvetica,sans-serif;">
        <p style="margin:0 0 8px;font-size:10px;letter-spacing:1.4px;font-weight:bold;color:#9b6a18;">SOMETHING TO READ MEANWHILE</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#46545d;">If you'd like a head start, our research brief <strong style="color:#101820;">AI for a Small Business: The Case for Starting Now</strong> covers what the evidence actually supports for a business your size &#8212; and, just as usefully, what it doesn't. About a twelve minute read, no sign-in.</p>
      </td></tr>

      <tr><td align="center" style="padding:22px 32px 4px;">
        <a href="${reportUrl}" style="text-decoration:none;">
          <img src="${cover}" width="210" alt="Cover of the R.A. Clifton decision brief, AI for a Small Business: The Case for Starting Now" style="width:210px;max-width:100%;height:auto;display:block;border:1px solid #dcd7cc;border-radius:5px;">
        </a>
      </td></tr>

      <tr><td align="center" style="padding:18px 32px 30px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" bgcolor="#efbd55" style="border-radius:6px;">
            <a href="${reportUrl}" style="display:inline-block;padding:15px 34px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#17130b;text-decoration:none;border-radius:6px;">Read the Report &#8594;</a>
          </td>
        </tr></table>
      </td></tr>`;

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Thank you from R.A. Clifton</title></head>
<body style="margin:0;padding:0;background:#eeeae1;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">I have your details, and I'll be in touch within two business days.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eeeae1;">
<tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:10px;overflow:hidden;">

  <tr><td style="background:#07131b;padding:26px 32px;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:bold;color:#ffffff;">R.A. Clifton&#8482;</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:1.6px;color:#efbd55;padding-top:6px;">STRATEGY &#8226; ADVISORY &#8226; FINANCIAL INTELLIGENCE</div>
  </td></tr>

  <tr><td style="padding:34px 32px 0;font-family:Arial,Helvetica,sans-serif;">
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#101820;">Hello ${name},</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#46545d;">Thank you for getting in touch &#8212; your details came through, and I'm glad you did.</p>
    <p style="margin:0;font-size:16px;line-height:1.65;color:#46545d;">${reflection(lead)}</p>
  </td></tr>

  <tr><td style="padding:26px 32px 0;"><div style="border-top:1px solid #e6e1d7;font-size:0;line-height:0;">&nbsp;</div></td></tr>

  <tr><td style="padding:24px 32px 26px;font-family:Arial,Helvetica,sans-serif;">
    <p style="margin:0 0 9px;font-size:10px;letter-spacing:1.4px;font-weight:bold;color:#9b6a18;">WHAT YOU ASKED ABOUT</p>
    ${interestRows}
  </td></tr>

  ${notesBlock}

  <tr><td style="padding:0 32px 28px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="background:#fdf7e8;border-left:3px solid #efbd55;padding:18px 20px;">
        <p style="margin:0 0 6px;font-size:10px;letter-spacing:1.4px;font-weight:bold;color:#9b6a18;">WHAT HAPPENS NEXT</p>
        <p style="margin:0;font-size:15.5px;line-height:1.6;color:#101820;">I'll look at this personally and come back to you within two business days. No obligation, and nothing to prepare &#8212; it's a conversation, not a pitch.</p>
      </td></tr>
    </table>
  </td></tr>

  ${reportBlock}

  <tr><td style="padding:0 32px 34px;font-family:Arial,Helvetica,sans-serif;">
    <p style="margin:0 0 4px;font-size:15.5px;line-height:1.6;color:#46545d;">Talk soon,</p>
    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#101820;">R.A. Clifton, CPA</p>
    <p style="margin:4px 0 0;font-size:13px;line-height:1.5;color:#7b8790;">You can simply reply to this email &#8212; it reaches me directly.</p>
  </td></tr>

  <tr><td style="background:#07131b;padding:22px 32px;font-family:Arial,Helvetica,sans-serif;">
    <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.78);">R.A. Clifton&#8482; &#8226; AI-First CPA &amp; Business Advisory</p>
    <a href="${site}" style="font-size:12px;color:#efbd55;text-decoration:none;">www.raclifton.com</a>
    <p style="margin:12px 0 0;font-size:10.5px;line-height:1.5;color:rgba(255,255,255,0.45);">You're receiving this because you asked about our assessments at www.raclifton.com. This note is general information, not accounting, tax or legal advice for your specific situation.</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

/** Plain-text alternative. Some clients show only this, so it has to stand alone. */
export function leadConfirmationText(lead: LeadConfirmation, site: string) {
  const lines = [
    `Hello ${firstName(lead.fullName)},`,
    "",
    "Thank you for getting in touch — your details came through, and I'm glad you did.",
    "",
    reflectionText(lead),
    "",
    "WHAT YOU ASKED ABOUT",
    ...(lead.interests.length
      ? lead.interests.map((item) => `  - ${item}`)
      : ["  Nothing in particular — that's completely fine. Tell me what's on your mind and we'll start there."]),
  ];

  const noteLines = notes(lead);
  if (noteLines.length) lines.push("", ...noteLines);

  lines.push(
    "",
    "WHAT HAPPENS NEXT",
    "I'll look at this personally and come back to you within two business days.",
    "No obligation, and nothing to prepare — it's a conversation, not a pitch."
  );

  if (lead.alreadyHasReport) {
    lines.push(
      "",
      "You already have a copy of “AI for a Small Business: The Case for Starting Now”.",
      "If it raised anything you'd like to dig into, just reply and tell me which part."
    );
  } else {
    lines.push(
      "",
      "SOMETHING TO READ MEANWHILE",
      "Our research brief “AI for a Small Business: The Case for Starting Now” covers",
      "what the evidence actually supports for a business your size — and what it doesn't.",
      "About a twelve minute read, no sign-in.",
      "",
      `Read it here: ${site}${REPORT_PATH}`
    );
  }

  lines.push(
    "",
    "Talk soon,",
    "R.A. Clifton, CPA",
    "You can simply reply to this email — it reaches me directly.",
    "",
    "R.A. Clifton™ — AI-First CPA & Business Advisory",
    "www.raclifton.com"
  );

  return lines.join("\n");
}

/**
 * Returns false rather than throwing. The lead is already in the database by
 * the time this runs; a mail failure must never turn a captured lead into an
 * error for the visitor.
 */
export async function sendLeadConfirmation(lead: LeadConfirmation): Promise<boolean> {
  const token = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!token || !from || !site) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      from,
      to: [lead.email],
      subject: leadConfirmationSubject(lead),
      text: leadConfirmationText(lead, site),
      html: leadConfirmationHtml(lead, site),
    }),
  });
  return response.ok;
}
