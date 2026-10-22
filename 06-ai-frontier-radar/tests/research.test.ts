import { describe, expect, it } from "vitest";
import {
  demoFindings,
  filterFindings,
  findingSchema,
  formatDate,
  initialQuery,
  researchQuerySchema,
} from "../src/lib/research";

describe("research input", () => {
  it("trims topics and rejects empty or overlong input", () => {
    expect(
      researchQuerySchema.parse({ ...initialQuery, topic: "  agents  " }).topic,
    ).toBe("agents");
    for (const topic of [" ", "x".repeat(161)])
      expect(
        researchQuerySchema.safeParse({ ...initialQuery, topic }).success,
      ).toBe(false);
  });
  it("rejects invalid dates and reversed ranges", () => {
    for (const changes of [
      { start: "2023-02-30" },
      { end: "invalid" },
      { start: "2024-01-01" },
    ]) {
      expect(
        researchQuerySchema.safeParse({ ...initialQuery, ...changes }).success,
      ).toBe(false);
    }
  });
});
describe("fixture filtering", () => {
  it("validates fixture records and their unique identifiers", () => {
    demoFindings.forEach((finding) =>
      expect(findingSchema.safeParse(finding).success).toBe(true),
    );
    expect(new Set(demoFindings.map((finding) => finding.id)).size).toBe(
      demoFindings.length,
    );
  });
  it("matches topic terms case-insensitively and sorts newest first", () => {
    expect(
      filterFindings(demoFindings, {
        ...initialQuery,
        topic: "LANGUAGE   models",
      }).map((finding) => finding.id),
    ).toEqual(["llama-2", "gpt-4", "react"]);
    expect(
      filterFindings(demoFindings, { ...initialQuery, topic: "agents" }).map(
        (finding) => finding.id,
      ),
    ).toEqual(["react"]);
  });
  it("includes exact calendar boundaries and excludes outside dates", () => {
    expect(
      filterFindings(demoFindings, {
        topic: "AI",
        start: "2023-03-15",
        end: "2023-03-15",
      }).map((finding) => finding.id),
    ).toEqual(["gpt-4"]);
    expect(
      filterFindings(demoFindings, {
        ...initialQuery,
        start: "2024-01-01",
        end: "2024-12-31",
      }),
    ).toEqual([]);
  });
  it("returns no findings for unrelated topics and does not mutate input", () => {
    const before = [...demoFindings];
    expect(
      filterFindings(demoFindings, { ...initialQuery, topic: "quantum" }),
    ).toEqual([]);
    expect(demoFindings).toEqual(before);
  });
  it("formats dates consistently in UTC", () =>
    expect(formatDate("2023-03-15")).toBe("Mar 15, 2023"));
});
