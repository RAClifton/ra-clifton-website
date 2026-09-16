import { describe, expect, it } from "vitest";
import { recommendFromChips, ASSESSMENT_LABELS } from "./chip-recommendations";

describe("recommendFromChips", () => {
  it("returns null when nothing is selected", () => {
    expect(recommendFromChips([])).toBeNull();
  });

  it("recommends the mapped assessment for a single chip", () => {
    const result = recommendFromChips(["Financial Clarity"]);
    expect(result).not.toBeNull();
    expect(result!.primary).toBe("financial-clarity");
    expect(result!.message).toBe("Start with the Financial Clarity Score™ →");
    expect(result!.checkboxValues).toEqual(["financial-clarity"]);
  });

  it("maps Growth to the AI Opportunity Finder", () => {
    const result = recommendFromChips(["Growth"]);
    expect(result!.primary).toBe("ai-opportunity");
    expect(result!.message).toBe("Start with the AI Opportunity Finder™ →");
  });

  it("maps AI to the free AI Readiness Score", () => {
    const result = recommendFromChips(["AI"]);
    expect(result!.primary).toBe("ai-readiness");
  });

  it("recommends the free AI Readiness Score when several chips are selected", () => {
    const result = recommendFromChips(["Efficiency", "Growth", "Better Decisions"]);
    expect(result!.primary).toBe("ai-readiness");
    expect(result!.message).toBe(
      "Start with the AI Readiness Score™ — it's free and covers all of these →"
    );
  });

  it("pre-checks the free assessment plus every match when several are selected", () => {
    const result = recommendFromChips(["Efficiency", "Better Decisions"]);
    expect(result!.checkboxValues).toEqual([
      "ai-readiness",
      "ai-opportunity",
      "business-intelligence",
    ]);
  });

  it("deduplicates chips that map to the same assessment", () => {
    const result = recommendFromChips(["Efficiency", "Growth"]);
    expect(result!.checkboxValues).toEqual(["ai-readiness", "ai-opportunity"]);
  });

  it("ignores unrecognised chip labels", () => {
    const result = recommendFromChips(["Efficiency", "Growth", "Nonsense"]);
    expect(result!.primary).toBe("ai-readiness");
    expect(result!.checkboxValues).toEqual(["ai-readiness", "ai-opportunity"]);
  });

  it("returns null when every chip is unrecognised", () => {
    expect(recommendFromChips(["Nonsense", "Gibberish"])).toBeNull();
  });

  it("treats a single chip plus an unknown chip as a single recommendation", () => {
    const result = recommendFromChips(["Growth", "Nonsense"]);
    expect(result!.primary).toBe("ai-opportunity");
    expect(result!.checkboxValues).toEqual(["ai-opportunity"]);
  });

  it("labels every assessment key with a trademarked name", () => {
    for (const label of Object.values(ASSESSMENT_LABELS)) {
      expect(label.endsWith("™")).toBe(true);
    }
  });
});
