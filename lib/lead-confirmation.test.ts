import { describe, expect, it } from "vitest";
import {
  firstName,
  humanList,
  leadConfirmationHtml,
  leadConfirmationSubject,
  leadConfirmationText,
  type LeadConfirmation,
} from "./lead-confirmation";

const SITE = "https://www.raclifton.com";

const base: LeadConfirmation = {
  fullName: "Dana Whitfield",
  email: "dana@example.com",
  interests: ["AI Readiness Score™ (Free - Notify Me)"],
  wantsConversation: false,
  focusAreas: ["Efficiency", "Growth"],
  alreadyHasReport: false,
};

describe("greeting", () => {
  it("uses the first name, because full names read like a database wrote it", () => {
    expect(firstName("Dana Whitfield")).toBe("Dana");
    expect(firstName("  Marcus   Bell ")).toBe("Marcus");
    expect(firstName("Cher")).toBe("Cher");
  });

  it("puts the first name in the subject line", () => {
    expect(leadConfirmationSubject(base)).toBe("Thank you, Dana — here's what happens next");
  });
});

describe("reading their selections back to them", () => {
  it("writes lists the way a person would", () => {
    expect(humanList(["Growth"])).toBe("Growth");
    expect(humanList(["Efficiency", "Growth"])).toBe("Efficiency and Growth");
    expect(humanList(["AI", "Efficiency", "Growth"])).toBe("AI, Efficiency, and Growth");
  });

  it("reflects what they said they want to improve", () => {
    expect(leadConfirmationHtml(base, SITE)).toContain("Efficiency and Growth");
    expect(leadConfirmationText(base, SITE)).toContain("Efficiency and Growth");
  });

  it("still reads naturally when they selected no improvement areas", () => {
    const html = leadConfirmationHtml({ ...base, focusAreas: [] }, SITE);
    expect(html).toContain("Knowing which of these interests you");
    expect(html).not.toContain("focus on <strong");
  });

  it("does not leave an awkward blank when nothing at all was ticked", () => {
    const html = leadConfirmationHtml({ ...base, interests: [], focusAreas: [] }, SITE);
    expect(html).toContain("Tell me what's on your mind");
  });
});

describe("promises it must not break", () => {
  it("always states the two-business-day reply", () => {
    expect(leadConfirmationHtml(base, SITE)).toContain("within two business days");
    expect(leadConfirmationText(base, SITE)).toContain("within two business days");
  });

  /** The Score is not built. Implying they can take it today is a broken promise. */
  it("treats the AI Readiness Score as early access, not something available now", () => {
    const html = leadConfirmationHtml(base, SITE);
    expect(html).toContain("early-access list");
    expect(html).not.toMatch(/take (the|your) (AI Readiness )?Score now/i);
  });

  it("mentions the Intelligence Brief only when they signed up for it", () => {
    expect(leadConfirmationHtml(base, SITE)).not.toContain("Intelligence Brief.");
    const joined = leadConfirmationHtml(
      { ...base, interests: ["Join the R.A. Clifton Intelligence Brief (Free)"] },
      SITE
    );
    expect(joined).toContain("Intelligence Brief");
  });
});

describe("the research report offer", () => {
  it("offers the report, with a working link, to people who do not have it", () => {
    const html = leadConfirmationHtml(base, SITE);
    expect(html).toContain("Read the Report");
    expect(html).toContain(`${SITE}/research/ai-for-a-small-business-the-case-for-starting-now.pdf`);
  });

  it("does not re-pitch the report at someone who already downloaded it", () => {
    const html = leadConfirmationHtml({ ...base, alreadyHasReport: true }, SITE);
    expect(html).not.toContain("Read the Report");
    expect(html).toContain("You already have a copy");
  });
});

/** The name arrives from the browser and lands inside an HTML document. */
it("escapes visitor-supplied values instead of rendering them as markup", () => {
  const html = leadConfirmationHtml(
    { ...base, fullName: '<script>alert("x")</script>', interests: ["<b>ticked</b>"] },
    SITE
  );
  expect(html).not.toContain("<script>");
  expect(html).not.toContain("<b>ticked</b>");
  expect(html).toContain("&lt;script&gt;");
});

describe("conversation request", () => {
  const booking: LeadConfirmation = { ...base, wantsConversation: true };

  it("promises one business day, never two, when a conversation was requested", () => {
    for (const body of [leadConfirmationHtml(booking, SITE), leadConfirmationText(booking, SITE)]) {
      expect(body).toContain("one business day");
      expect(body).not.toContain("two business days");
    }
  });

  it("acknowledges the request specifically", () => {
    expect(leadConfirmationText(booking, SITE)).toContain("You asked to book a Discovery Call.");
  });

  it("states the call length, in both formats", () => {
    for (const body of [leadConfirmationHtml(booking, SITE), leadConfirmationText(booking, SITE)]) {
      expect(body).toContain("15-minute call");
    }
  });

  it("makes no call-length promise when none was requested", () => {
    for (const body of [leadConfirmationHtml(base, SITE), leadConfirmationText(base, SITE)]) {
      expect(body).not.toContain("15-minute");
      expect(body).not.toContain("Discovery Call");
    }
  });

  it("leaves the two-business-day wording alone when no conversation was requested", () => {
    for (const body of [leadConfirmationHtml(base, SITE), leadConfirmationText(base, SITE)]) {
      expect(body).toContain("two business days");
      expect(body).not.toContain("one business day");
    }
  });
});
