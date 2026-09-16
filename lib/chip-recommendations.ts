export type AssessmentKey =
  | "ai-readiness"
  | "ai-opportunity"
  | "financial-clarity"
  | "business-intelligence";

export const ASSESSMENT_LABELS: Record<AssessmentKey, string> = {
  "ai-readiness": "AI Readiness Score™",
  "ai-opportunity": "AI Opportunity Finder™",
  "financial-clarity": "Financial Clarity Score™",
  "business-intelligence": "Business Intelligence Score™",
};

/** Chip label (as rendered in the markup) → the assessment it points at. */
export const CHIP_TO_ASSESSMENT: Record<string, AssessmentKey> = {
  "AI": "ai-readiness",
  "Efficiency": "ai-opportunity",
  "Financial Clarity": "financial-clarity",
  "Better Decisions": "business-intelligence",
  "Growth": "ai-opportunity",
};

export type Recommendation = {
  primary: AssessmentKey;
  message: string;
  checkboxValues: AssessmentKey[];
};

/**
 * "Not sure where to start?" answers with exactly one next step.
 *
 * One chip names that chip's assessment. Two or more names the free
 * AI Readiness Score, because the honest answer for someone with several
 * priorities is the free entry point rather than a paid assessment.
 */
export function recommendFromChips(chips: string[]): Recommendation | null {
  const matched = chips
    .map((chip) => CHIP_TO_ASSESSMENT[chip])
    .filter((key): key is AssessmentKey => Boolean(key));

  if (matched.length === 0) return null;

  if (matched.length === 1) {
    const primary = matched[0];
    return {
      primary,
      message: `Start with the ${ASSESSMENT_LABELS[primary]} →`,
      checkboxValues: [primary],
    };
  }

  const unique = Array.from(new Set<AssessmentKey>(["ai-readiness", ...matched]));
  return {
    primary: "ai-readiness",
    message: `Start with the ${ASSESSMENT_LABELS["ai-readiness"]} — it's free and covers all of these →`,
    checkboxValues: unique,
  };
}
