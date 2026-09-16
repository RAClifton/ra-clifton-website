/**
 * The improvement areas offered as pills, in display order.
 *
 * They appear TWICE on the page — under "Not sure where to start?" and again
 * inside the "Interested in Our Assessments?" box — and the two sets must stay
 * identical, because a visitor's selection is mirrored between them. The test
 * beside this file reads the real markup and fails if either set drifts.
 *
 * These are captured verbatim into website_leads.focus_areas, so they are also
 * what a human reads in the leads table. Keep them plain.
 */
export const FOCUS_AREAS = [
  "AI",
  "Efficiency",
  "Financial Clarity",
  "Better Decisions",
  "Growth",
] as const;

export type FocusArea = (typeof FOCUS_AREAS)[number];
