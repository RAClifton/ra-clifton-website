import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FOCUS_AREAS } from "./focus-areas";

/**
 * The page is one escaped HTML string in app/page.tsx. Pull every `.chips`
 * group out of it and read back the button labels, so a copy edit in the markup
 * that breaks the mirroring fails here instead of silently shipping.
 */
function chipGroupsFromMarkup(): string[][] {
  const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const groups = source.match(/<div class=\\"chips[^"]*\\"[^>]*>(.*?)<\/div>/g) ?? [];
  return groups.map((group) =>
    Array.from(group.matchAll(/<button[^>]*>([^<]+)<\/button>/g)).map((m) => m[1].trim())
  );
}

describe("focus area pills", () => {
  const groups = chipGroupsFromMarkup();

  it("finds both pill groups in the markup", () => {
    expect(groups.length).toBe(2);
  });

  it("every group offers exactly the canonical labels, in order", () => {
    for (const group of groups) {
      expect(group).toEqual([...FOCUS_AREAS]);
    }
  });

  it("the two groups mirror each other exactly", () => {
    expect(groups[0]).toEqual(groups[1]);
  });

  it("labels are plain enough to read in a leads table", () => {
    for (const label of FOCUS_AREAS) {
      expect(label).toMatch(/^[A-Za-z][A-Za-z ]*[A-Za-z]$/);
      expect(label.length).toBeLessThanOrEqual(60);
    }
  });
});
