import "server-only";
import { researchQuerySchema, type ResearchQuery } from "./research";
import { retrieveSources } from "./sources/retrieve";
import { topicTerms } from "./sources/normalize";
import {
  readSynthesisConfig,
  synthesizeSources,
  SynthesisError,
} from "./synthesis/synthesize";

export async function runResearch(input: ResearchQuery) {
  const query = researchQuerySchema.parse(input);
  topicTerms(query.topic);
  const config = readSynthesisConfig(); // Fail before retrieval or SDK calls when disabled.
  const retrieval = await retrieveSources(query);
  if (retrieval.sources.length === 0)
    return {
      status: retrieval.providers.every(
        (provider) => provider.status === "unavailable",
      )
        ? ("sources-unavailable" as const)
        : ("no-sources" as const),
      retrieval,
      synthesis: null,
    };
  try {
    const synthesis = await synthesizeSources(query, retrieval.sources, config);
    return { status: "complete" as const, retrieval, synthesis };
  } catch (error) {
    const failure =
      error instanceof SynthesisError
        ? error
        : new SynthesisError("provider-error");
    return {
      status: "synthesis-failed" as const,
      retrieval,
      synthesis: null,
      error: { code: failure.code, message: failure.message },
    };
  }
}
