import { describe, expect, it } from "vitest";
import {
  leadNotificationHtml,
  leadNotificationSubject,
  leadNotificationText,
  type LeadNotification,
} from "./lead-notification";

const base: LeadNotification = {
  fullName: "Dana Whitfield",
  email: "dana@example.com",
  interests: ["AI Readiness Score™ (Free - Notify Me)"],
  focusAreas: ["Efficiency"],
  message: null,
  ctaOrigin: null,
  referredBy: null,
  cameFromResearchReport: false,
  receivedAt: new Date("2026-09-18T16:25:50.279Z"),
};

describe("lead notification email", () => {
  it("puts the lead's name in the subject so the inbox list is readable", () => {
    expect(leadNotificationSubject(base)).toBe("New assessment lead — Dana Whitfield");
  });

  it("flags the warmer leads who read the research report first", () => {
    const subject = leadNotificationSubject({ ...base, cameFromResearchReport: true });
    expect(subject).toBe("New lead (read the report first) — Dana Whitfield");
  });

  it("shows the address and everything they selected", () => {
    const html = leadNotificationHtml(base);
    expect(html).toContain("dana@example.com");
    expect(html).toContain("mailto:dana@example.com");
    expect(html).toContain("AI Readiness Score™ (Free - Notify Me)");
    expect(html).toContain("Efficiency");
  });

  it("says so plainly when nothing was selected, rather than showing a blank gap", () => {
    const html = leadNotificationHtml({ ...base, interests: [], focusAreas: [] });
    expect(html).toContain("None selected");
  });

  it("includes the message only when one was written", () => {
    expect(leadNotificationHtml(base)).not.toContain("WHAT THEY WROTE");
    const withMessage = leadNotificationHtml({ ...base, message: "  Please call mornings.  " });
    expect(withMessage).toContain("WHAT THEY WROTE");
    expect(withMessage).toContain("Please call mornings.");
  });

  /**
   * Name and message arrive from the browser and land inside an HTML document.
   * If these are not escaped, a visitor controls the markup of an email sent to
   * Clifton's own inbox.
   */
  it("escapes visitor-supplied values instead of rendering them as markup", () => {
    const html = leadNotificationHtml({
      ...base,
      fullName: '<script>alert("x")</script>',
      message: "<img src=x onerror=alert(1)>",
      interests: ["<b>ticked</b>"],
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<b>ticked</b>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("gives the plain-text version everything it needs to stand alone", () => {
    const text = leadNotificationText({ ...base, message: "Call mornings.", ctaOrigin: "Get My Score →" });
    expect(text).toContain("Dana Whitfield");
    expect(text).toContain("dana@example.com");
    expect(text).toContain("AI Readiness Score™ (Free - Notify Me)");
    expect(text).toContain("Call mornings.");
    expect(text).toContain("Get My Score →");
  });
});
