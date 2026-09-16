import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  recommendFromChips,
  ASSESSMENT_LABELS,
  CHIP_TO_ASSESSMENT,
  type AssessmentKey,
} from "./chip-recommendations";

/**
 * app/page.tsx holds the approved markup as one escaped JS string literal.
 * Decode it so the tests below can assert against the HTML that actually ships.
 */
function loadApprovedMarkup(): string {
  const source = readFileSync(fileURLToPath(new URL("../app/page.tsx", import.meta.url)), "utf8");
  const literal = source.match(/const approvedV12Markup = ("(?:[^"\\]|\\[\s\S])*")/);
  if (!literal) throw new Error("Could not find the approvedV12Markup string literal in app/page.tsx");
  return JSON.parse(literal[1]) as string;
}

const markup = loadApprovedMarkup();

function chipLabelsFromMarkup(): string[] {
  const block = markup.match(/<div class="chips">([\s\S]*?)<\/div>/);
  if (!block) throw new Error('Could not find the <div class="chips"> block in app/page.tsx');
  return Array.from(block[1].matchAll(/<button[^>]*>([^<]*)<\/button>/g)).map((m) => m[1].trim());
}

function checkboxValuesFromMarkup(): string[] {
  return Array.from(
    markup.matchAll(/<input[^>]*type="checkbox"[^>]*value="([^"]+)"/g)
  ).map((m) => m[1]);
}

/** Runtime view of the AssessmentKey union: ASSESSMENT_LABELS is Record<AssessmentKey,string>. */
const ASSESSMENT_KEYS = Object.keys(ASSESSMENT_LABELS) as AssessmentKey[];

/** Deliberately not an AssessmentKey: the brief is a newsletter, not an assessment. */
const NON_ASSESSMENT_CHECKBOX = "intelligence-brief";

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

/**
 * V12ClientController reads chip labels straight off the DOM (button.textContent)
 * and looks them up in CHIP_TO_ASSESSMENT. Editing a chip label in app/page.tsx —
 * an ordinary marketing tweak — would silently stop recommendations appearing and
 * start writing unmapped labels into focus_areas. These tests are the tripwire.
 */
describe("markup ↔ mapping coupling", () => {
  it("extracts exactly the five chips from app/page.tsx", () => {
    const labels = chipLabelsFromMarkup();
    expect(labels.length).toBe(5);
    expect(labels.every((label) => label.length > 0)).toBe(true);
  });

  it("maps every chip label rendered in app/page.tsx", () => {
    for (const label of chipLabelsFromMarkup()) {
      expect(
        Object.prototype.hasOwnProperty.call(CHIP_TO_ASSESSMENT, label),
        `chip label "${label}" in app/page.tsx has no entry in CHIP_TO_ASSESSMENT ` +
          `(lib/chip-recommendations.ts). Add it there, or restore the previous label in the markup.`
      ).toBe(true);
    }
  });

  it("renders a chip for every CHIP_TO_ASSESSMENT key", () => {
    const labels = chipLabelsFromMarkup();
    for (const key of Object.keys(CHIP_TO_ASSESSMENT)) {
      expect(
        labels.includes(key),
        `CHIP_TO_ASSESSMENT key "${key}" (lib/chip-recommendations.ts) matches no chip ` +
          `in the .chips block of app/page.tsx. Remove the entry, or restore the chip label.`
      ).toBe(true);
    }
  });

  it("keeps the chip label set and the mapping key set identical", () => {
    expect([...chipLabelsFromMarkup()].sort()).toEqual(Object.keys(CHIP_TO_ASSESSMENT).sort());
  });

  it("points every chip at an assessment the form can actually pre-check", () => {
    const checkboxValues = checkboxValuesFromMarkup();
    for (const [label, key] of Object.entries(CHIP_TO_ASSESSMENT)) {
      expect(
        checkboxValues.includes(key),
        `chip "${label}" maps to "${key}", but no #assessment-interest checkbox in ` +
          `app/page.tsx carries value="${key}", so the recommendation link would check nothing.`
      ).toBe(true);
    }
  });

  it("renders one checkbox per AssessmentKey, plus the non-assessment brief opt-in", () => {
    const checkboxValues = checkboxValuesFromMarkup();
    for (const key of ASSESSMENT_KEYS) {
      expect(
        checkboxValues.includes(key),
        `AssessmentKey "${key}" has no checkbox with value="${key}" in app/page.tsx.`
      ).toBe(true);
    }
    for (const value of checkboxValues) {
      expect(
        value === NON_ASSESSMENT_CHECKBOX || (ASSESSMENT_KEYS as string[]).includes(value),
        `assessment checkbox value "${value}" in app/page.tsx is not an AssessmentKey ` +
          `(lib/chip-recommendations.ts) and is not the known "${NON_ASSESSMENT_CHECKBOX}" opt-in.`
      ).toBe(true);
    }
    expect([...checkboxValues].sort()).toEqual(
      [...ASSESSMENT_KEYS, NON_ASSESSMENT_CHECKBOX].sort()
    );
  });

  it("keeps intelligence-brief out of the AssessmentKey union", () => {
    expect((ASSESSMENT_KEYS as string[]).includes(NON_ASSESSMENT_CHECKBOX)).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(ASSESSMENT_LABELS, NON_ASSESSMENT_CHECKBOX)).toBe(false);
  });
});
