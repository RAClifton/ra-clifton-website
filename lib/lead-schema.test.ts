import { describe, expect, it } from "vitest";
import { leadSchema } from "./lead-schema";

const base = { fullName: "Jane Doe", email: "jane@example.com" };

describe("leadSchema focusAreas", () => {
  it("defaults focusAreas to an empty array when omitted", () => {
    const parsed = leadSchema.parse(base);
    expect(parsed.focusAreas).toEqual([]);
  });

  it("accepts a list of focus areas", () => {
    const parsed = leadSchema.parse({ ...base, focusAreas: ["Efficiency", "Growth"] });
    expect(parsed.focusAreas).toEqual(["Efficiency", "Growth"]);
  });

  it("rejects more than ten focus areas", () => {
    const tooMany = Array.from({ length: 11 }, (_, i) => `Area ${i}`);
    expect(() => leadSchema.parse({ ...base, focusAreas: tooMany })).toThrow();
  });

  it("rejects an over-long focus area", () => {
    expect(() =>
      leadSchema.parse({ ...base, focusAreas: ["x".repeat(61)] })
    ).toThrow();
  });

  it("still requires a name and an email", () => {
    expect(() => leadSchema.parse({ focusAreas: ["Growth"] })).toThrow();
  });
});

describe("leadSchema message", () => {
  it("is optional — a lead with no message still parses", () => {
    const parsed = leadSchema.parse(base);
    expect(parsed.message).toBeUndefined();
  });

  it("keeps a normal message", () => {
    const parsed = leadSchema.parse({ ...base, message: "How should we start with AI?" });
    expect(parsed.message).toBe("How should we start with AI?");
  });

  it("accepts a message at the 1,000 character cap", () => {
    const parsed = leadSchema.parse({ ...base, message: "x".repeat(1000) });
    expect(parsed.message).toHaveLength(1000);
  });

  it("rejects a message over 1,000 characters", () => {
    expect(() => leadSchema.parse({ ...base, message: "x".repeat(1001) })).toThrow();
  });

  it("trims surrounding whitespace", () => {
    const parsed = leadSchema.parse({ ...base, message: "  padded  " });
    expect(parsed.message).toBe("padded");
  });
});
