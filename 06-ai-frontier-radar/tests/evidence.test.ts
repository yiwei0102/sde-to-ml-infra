import { describe, expect, it } from "vitest";
import { enforceEvidence } from "../src/lib/synthesis/evidence";
import type { GeneratedSynthesis } from "../src/lib/synthesis/schema";
import type { Source } from "../src/lib/sources/normalize";

// Synthetic records, not real research claims.
const sentence =
  "The synthetic model does not improve accuracy on this benchmark.";
const source: Source = {
  id: "test-source",
  provider: "arxiv",
  title: "Synthetic paper",
  url: "https://arxiv.org/abs/2303.08774v1",
  canonicalUrl: "https://arxiv.org/abs/2303.08774",
  published: "2023-03-15",
  updated: null,
  retrievedAt: "2026-10-24T00:00:00.000Z",
  authors: ["Synthetic author"],
  evidence: {
    text: sentence + " More experiments are needed before deployment.",
    kind: "abstract",
    url: "https://arxiv.org/abs/2303.08774v1",
  },
};
const supplied = [{ id: source.id, evidence: source.evidence.text }];
function data(text = sentence, quote = sentence): GeneratedSynthesis {
  return {
    findings: [
      {
        title: "Synthetic finding",
        sourceIds: [source.id],
        claims: [
          {
            text,
            sourceIds: [source.id],
            evidence: [{ sourceId: source.id, quote }],
          },
        ],
        technicalSignificance: "Consider evaluating your own workload.",
        experiment: {
          hypothesis: "A proposal.",
          steps: ["Measure a baseline."],
          successCriteria: "Record results.",
        },
        limitations: ["Synthetic excerpt only."],
      },
    ],
  };
}
function check(value = data(), sent = supplied) {
  return enforceEvidence(value, [source], sent);
}
function reason(value: GeneratedSynthesis, expected: string, sent = supplied) {
  const result = check(value, sent);
  expect(result.findings).toEqual([]);
  expect(result.evidenceValidation.withheldClaims[0]).toMatchObject({
    support: "unsupported",
    reason: expected,
  });
  expect(result.evidenceValidation.withheldFindings[0].reason).toBe(
    "no-source-reported-claims",
  );
}

describe("extractive evidence policy", () => {
  it("accepts a full source sentence and resolves citation metadata from the registry", () => {
    const result = check();
    expect(result.findings[0].claims[0]).toMatchObject({
      text: sentence,
      support: "source-reported",
      citations: [
        {
          url: source.url,
          published: source.published,
          title: source.title,
          quote: sentence,
          context: source.evidence.text,
        },
      ],
    });
    expect(result.evidenceValidation.acceptedClaims).toBe(1);
    expect(result.evidenceValidation.limitation).toContain(
      "does not establish truth",
    );
  });
  it("rejects changed numbers, removed negation, and paraphrases even with a real source ID", () => {
    for (const text of [
      "The synthetic model improves accuracy on this benchmark.",
      "The synthetic model achieves 100% accuracy.",
      "This approach fails to improve the benchmark.",
    ])
      reason(data(text), "paraphrase-needs-semantic-review");
  });
  it("rejects fabricated quotes and cross-source quote substitution", () => {
    reason(
      data("The model has 100% accuracy.", "The model has 100% accuracy."),
      "quote-not-in-supplied-evidence",
    );
  });
  it("does not borrow a matching quote from a different source", () => {
    const foreign = "Another synthetic model achieves 50% accuracy.";
    const second = {
      ...source,
      id: "second",
      evidence: { ...source.evidence, text: foreign },
    };
    const result = enforceEvidence(
      data(foreign, foreign),
      [source, second],
      [...supplied, { id: second.id, evidence: foreign }],
    );
    expect(result.findings).toEqual([]);
    expect(result.evidenceValidation.withheldClaims[0].reason).toBe(
      "quote-not-in-supplied-evidence",
    );
  });
  it("rejects substrings that drop a sentence qualification", () => {
    reason(
      data(
        "improve accuracy on this benchmark.",
        "improve accuracy on this benchmark.",
      ),
      "quote-not-complete-sentence",
    );
  });
  it("checks the supplied excerpt, not just the longer original source", () => {
    reason(
      data(
        "More experiments are needed before deployment.",
        "More experiments are needed before deployment.",
      ),
      "quote-not-in-supplied-evidence",
      [{ id: source.id, evidence: sentence }],
    );
  });
  it("rejects a clipped sentence even when it exactly matches the prompt tail", () => {
    const clipped = sentence.slice(0, -10);
    reason(data(clipped, clipped), "quote-not-complete-sentence", [
      { id: source.id, evidence: clipped },
    ]);
  });
  it("normalizes whitespace but preserves case, punctuation and negation", () => {
    expect(check(data(sentence.replaceAll(" ", "\n"))).findings).toHaveLength(
      1,
    );
    reason(data(sentence.toLowerCase()), "paraphrase-needs-semantic-review");
  });
  it("requires an evidence quote for every claimed source, without duplicates", () => {
    const missing = data();
    missing.findings[0].claims[0].evidence = [];
    reason(missing, "missing-evidence");
    const duplicated = data();
    duplicated.findings[0].claims[0].evidence.push(
      duplicated.findings[0].claims[0].evidence[0],
    );
    reason(duplicated, "incomplete-or-duplicate-evidence");
    const second = { ...source, id: "second" };
    const incomplete = data();
    incomplete.findings[0].sourceIds.push(second.id);
    incomplete.findings[0].claims[0].sourceIds.push(second.id);
    const result = enforceEvidence(
      incomplete,
      [source, second],
      [...supplied, { id: second.id, evidence: sentence }],
    );
    expect(result.evidenceValidation.withheldClaims[0].reason).toBe(
      "incomplete-or-duplicate-evidence",
    );
  });
  it("rejects unknown, omitted, and finding-external source references", () => {
    const unknown = data();
    unknown.findings[0].sourceIds = ["unknown"];
    expect(() => check(unknown)).toThrow();
    expect(() => check(data(), [])).toThrow();
    const outside = data();
    outside.findings[0].claims[0].evidence[0].sourceId = "unknown";
    expect(() => check(outside)).toThrow();
  });
  it("retains valid claims and explicitly withholds unsupported ones", () => {
    const value = data();
    value.findings[0].claims.push({
      text: "An unsupported statement.",
      sourceIds: [],
      evidence: [],
    });
    const result = check(value);
    expect(result.findings[0].claims).toHaveLength(1);
    expect(result.evidenceValidation.withheldClaims[0].reason).toBe(
      "missing-evidence",
    );
    expect(result.findings[0].interpretationLabel).toContain(
      "not evidence-verified",
    );
  });
  it("drops unrelated finding-level sources from accepted citations", () => {
    const second = { ...source, id: "second" };
    const value = data();
    value.findings[0].sourceIds.push(second.id);
    expect(
      enforceEvidence(
        value,
        [source, second],
        [...supplied, { id: second.id, evidence: sentence }],
      ).findings[0].sourceIds,
    ).toEqual([source.id]);
  });
  it("blocks model-authored links and DOI/Markdown citations in narrative fields", () => {
    for (const citation of [
      "https://invented.example",
      "www.invented.example",
      "doi:10.0000/test",
      "[paper](invented)",
    ]) {
      const value = data();
      value.findings[0].technicalSignificance = citation;
      expect(() => check(value)).toThrow(/citation/);
    }
    const result = check(data("See https://invented.example"));
    expect(result.evidenceValidation.withheldClaims[0].text).not.toContain(
      "invented.example",
    );
  });
  it("handles empty output without inventing accepted claims", () => {
    expect(check({ findings: [] }).evidenceValidation.acceptedClaims).toBe(0);
  });
});
