import type { GeneratedSynthesis } from "./schema";
import type { Source } from "../sources/normalize";

export const EVIDENCE_POLICY_VERSION = "extractive-v1";
export type SuppliedEvidence = { id: string; evidence: string };
export class EvidenceValidationError extends Error {}

function normalize(text: string) {
  // Keep case, numbers, punctuation and negation. Only normalize Unicode/spacing.
  return text.normalize("NFC").replace(/\s+/g, " ").trim();
}
function containsCitationText(text: string) {
  return /https?:\/\/|www\.|doi\s*:|arxiv:\d{4}|10\.\d{4,9}\/|\[[^\]]*\]\([^)]*\)/i.test(
    text,
  );
}
const sentences = new Intl.Segmenter("en", { granularity: "sentence" });
function isCompleteSentence(quote: string, original: string) {
  return (
    /[.!?]["'”’)\]]*$/.test(quote) &&
    [...sentences.segment(normalize(original))].some(
      (segment) => normalize(segment.segment) === quote,
    )
  );
}

export function enforceEvidence(
  generated: GeneratedSynthesis,
  sources: Source[],
  supplied: SuppliedEvidence[],
) {
  const registry = new Map(sources.map((source) => [source.id, source]));
  const sent = new Map(supplied.map((source) => [source.id, source.evidence]));
  const withheldClaims: {
    findingIndex: number;
    claimIndex: number;
    text: string;
    support: "unsupported";
    reason: string;
  }[] = [];
  const withheldFindings: { findingIndex: number; reason: string }[] = [];
  const findings = generated.findings.flatMap((finding, findingIndex) => {
    // Never accept model-authored citation links in narrative fields. Citation
    // objects are built below from server-owned source records only.
    const narrative = [
      finding.title,
      finding.technicalSignificance,
      finding.experiment.hypothesis,
      ...finding.experiment.steps,
      finding.experiment.successCriteria,
      ...finding.limitations,
    ];
    if (narrative.some(containsCitationText))
      throw new EvidenceValidationError("Model-authored citation text");
    if (finding.sourceIds.some((id) => !registry.has(id) || !sent.has(id)))
      throw new EvidenceValidationError("Unknown or unsupplied source");
    const claims = finding.claims.flatMap((claim, claimIndex) => {
      const reject = (reason: string) => {
        // Link-looking diagnostic text is replaced, not presented as a citation.
        withheldClaims.push({
          findingIndex,
          claimIndex,
          text: containsCitationText(claim.text)
            ? "Claim withheld: model-authored citation text."
            : claim.text,
          support: "unsupported",
          reason,
        });
        return [];
      };
      if (
        claim.sourceIds.some((id) => !finding.sourceIds.includes(id)) ||
        claim.evidence.some((ref) => !claim.sourceIds.includes(ref.sourceId))
      )
        throw new EvidenceValidationError(
          "Claim reference outside its finding",
        );
      if (containsCitationText(claim.text))
        return reject("model-authored-citation");
      if (!claim.sourceIds.length || !claim.evidence.length)
        return reject("missing-evidence");
      const ids = [...new Set(claim.sourceIds)];
      if (
        ids.some(
          (id) =>
            claim.evidence.filter((ref) => ref.sourceId === id).length !== 1,
        )
      )
        return reject("incomplete-or-duplicate-evidence");
      const normalizedClaim = normalize(claim.text);
      for (const ref of claim.evidence) {
        const source = registry.get(ref.sourceId)!;
        const quote = normalize(ref.quote);
        if (
          !normalize(sent.get(ref.sourceId)!).includes(quote) ||
          !normalize(source.evidence.text).includes(quote)
        )
          return reject("quote-not-in-supplied-evidence");
        if (
          quote.length < 20 ||
          !isCompleteSentence(quote, source.evidence.text)
        )
          return reject("quote-not-complete-sentence");
        if (normalizedClaim !== quote)
          return reject("paraphrase-needs-semantic-review");
      }
      return [
        {
          text: claim.text,
          sourceIds: ids,
          support: "source-reported" as const,
          citations: claim.evidence.map((ref) => {
            const source = registry.get(ref.sourceId)!;
            return {
              sourceId: source.id,
              url: source.evidence.url,
              title: source.title,
              published: source.published,
              quote: ref.quote,
              context: sent.get(ref.sourceId)!,
            };
          }),
        },
      ];
    });
    if (!claims.length) {
      withheldFindings.push({
        findingIndex,
        reason: "no-source-reported-claims",
      });
      return [];
    }
    // A finding's citation list cannot keep unrelated model-suggested sources.
    return [
      {
        ...finding,
        sourceIds: [...new Set(claims.flatMap((claim) => claim.sourceIds))],
        claims,
        titleLabel: "Model-generated title — not evidence-verified" as const,
        interpretationLabel:
          "Model interpretation — not evidence-verified" as const,
        experimentLabel: "Proposed experiment — not executed" as const,
      },
    ];
  });
  return {
    findings,
    evidenceValidation: {
      policyVersion: EVIDENCE_POLICY_VERSION,
      acceptedClaims: findings.reduce(
        (count, finding) => count + finding.claims.length,
        0,
      ),
      withheldClaims,
      withheldFindings,
      limitation:
        "Source-reported means a complete source sentence was reproduced from supplied evidence. It does not establish truth, general entailment, or surrounding-document context. Interpretations and experiment proposals are not evidence-verified.",
    },
  };
}
