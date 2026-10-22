import { researchQuerySchema, type ResearchQuery } from "../research";
import {
  arxivQueryUrl,
  parseFeed,
  selectSources,
  topicTerms,
  type Provider,
} from "./normalize";

const MAX_FEED_BYTES = 2_000_000;
export async function readLimitedText(
  body: ReadableStream<Uint8Array> | null,
  limit: number,
): Promise<string> {
  if (!body) throw new Error("Missing response body");
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) return text + decoder.decode();
      size += chunk.value.byteLength;
      if (size > limit) throw new Error("Response exceeds size limit");
      text += decoder.decode(chunk.value, { stream: true });
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}

// One process, one arXiv connection, at least three seconds between calls.
// A multi-instance deployment needs a shared limiter before enabling this endpoint.
let arxivBusy = false;
let arxivNextAt = 0;
async function fetchArxiv(url: string, fetcher: typeof fetch) {
  if (arxivBusy || Date.now() < arxivNextAt)
    throw new Error("arXiv cooldown: retry after three seconds");
  arxivBusy = true;
  arxivNextAt = Date.now() + 3000;
  try {
    return await fetchXml(url, fetcher);
  } finally {
    arxivBusy = false;
  }
}
async function fetchXml(url: string, fetcher: typeof fetch): Promise<string> {
  const response = await fetcher(url, {
    signal: AbortSignal.timeout(12_000),
    redirect: "error",
    cache: "no-store",
    headers: {
      Accept:
        "application/atom+xml, application/rss+xml, application/xml, text/xml",
      "User-Agent": "AIFrontierRadar/0.2 (local research demo)",
    },
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Source returned HTTP ${response.status}`);
  }
  return readLimitedText(response.body, MAX_FEED_BYTES);
}

export async function retrieveSources(
  input: ResearchQuery,
  fetcher: typeof fetch = fetch,
  now = new Date(),
) {
  const query = researchQuerySchema.parse(input);
  topicTerms(query.topic); // Reject punctuation-only queries before any network requests.
  const retrievedAt = now.toISOString();
  const providers: { provider: Provider; url: string }[] = [
    { provider: "arxiv", url: arxivQueryUrl(query) },
    { provider: "openai", url: "https://openai.com/news/rss.xml" },
  ];
  const results = await Promise.allSettled(
    providers.map(async ({ provider, url }) => {
      const xml =
        provider === "arxiv"
          ? await fetchArxiv(url, fetcher)
          : await fetchXml(url, fetcher);
      return parseFeed(xml, provider, retrievedAt);
    }),
  );
  const records = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value.sources : [],
  );
  const selected = selectSources(records, query);
  return {
    query,
    retrievedAt,
    sources: selected.sources,
    exclusions: [
      ...results.flatMap((result) =>
        result.status === "fulfilled" ? result.value.exclusions : [],
      ),
      ...selected.exclusions,
    ],
    providers: results.map((result, index) => ({
      provider: providers[index].provider,
      status:
        result.status === "fulfilled"
          ? ("ok" as const)
          : ("unavailable" as const),
      ...(result.status === "rejected"
        ? {
            message:
              result.reason instanceof Error &&
              /cooldown|HTTP \d{3}/.test(result.reason.message)
                ? result.reason.message
                : "Source retrieval failed (network, timeout, size limit, or invalid feed).",
          }
        : {}),
    })),
    limitations: [
      "Bounded discovery: 10 arXiv candidates plus the current OpenAI RSS feed; return at most 10 records per provider and disclose omissions. No pagination or exhaustive historical coverage.",
      "Topics use literal keyword matching. Missing publication dates are excluded; revision dates do not replace publication dates.",
      "Evidence is author-provided abstract/feed text, not fetched full text or independently verified claims. No LLM synthesis has occurred.",
    ],
  };
}
