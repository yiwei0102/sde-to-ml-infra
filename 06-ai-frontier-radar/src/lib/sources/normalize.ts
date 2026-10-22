import { XMLParser, XMLValidator } from "fast-xml-parser";
import { z } from "zod";
import { researchQuerySchema, type ResearchQuery } from "../research";

export const sourceSchema = z.object({
  id: z.string(),
  provider: z.enum(["arxiv", "openai"]),
  title: z.string().min(1),
  url: z.url(),
  canonicalUrl: z.url(),
  published: z.iso.date().nullable(),
  updated: z.iso.date().nullable(),
  retrievedAt: z.iso.datetime(),
  authors: z.array(z.string()),
  evidence: z.object({
    text: z.string().min(1),
    kind: z.enum(["abstract", "feed-description"]),
    url: z.url(),
  }),
});
export type Source = z.infer<typeof sourceSchema>;
export type Provider = Source["provider"];
export type Exclusion = {
  provider: Provider;
  reason:
    | "invalid-record"
    | "unknown-date"
    | "outside-range"
    | "topic-mismatch"
    | "duplicate"
    | "result-limit";
  count: number;
};
export type ParsedSources = { sources: Source[]; exclusions: Exclusion[] };

const record = z.record(z.string(), z.unknown());
function object(value: unknown): Record<string, unknown> {
  return record.parse(value);
}
function list(value: unknown): unknown[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}
function text(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}
function isoDate(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    !z.iso.datetime({ offset: true }).safeParse(value).success
  )
    return null;
  return new Date(value).toISOString().slice(0, 10);
}
function rssDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  // RSS dates carry an explicit timezone; do not let host locale guess one.
  const match = value
    .trim()
    .match(
      /^(?:[A-Za-z]{3},\s*)?(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s+\d{2}:\d{2}(?::\d{2})?\s+(?:GMT|UT|[+-]\d{4})$/,
    );
  if (!match) return null;
  const month =
    [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ].indexOf(match[2].toLowerCase()) + 1;
  if (
    !z.iso
      .date()
      .safeParse(
        `${match[3]}-${String(month).padStart(2, "0")}-${match[1].padStart(2, "0")}`,
      ).success
  )
    return null;
  const time = Date.parse(value);
  return Number.isFinite(time)
    ? new Date(time).toISOString().slice(0, 10)
    : null;
}
function arxivUrl(value: unknown) {
  const url = new URL(z.string().parse(value));
  if (
    !["http:", "https:"].includes(url.protocol) ||
    !["arxiv.org", "export.arxiv.org"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.port
  )
    throw new Error("Invalid arXiv URL");
  const match = url.pathname.match(
    /^\/abs\/((?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7}))(v\d+)?$/,
  );
  if (!match) throw new Error("Invalid arXiv identifier");
  return {
    id: `arxiv:${match[1]}`,
    canonicalUrl: `https://arxiv.org/abs/${match[1]}`,
    url: `https://arxiv.org/abs/${match[1]}${match[2] ?? ""}`,
  };
}
function officialUrl(value: unknown) {
  const url = new URL(z.string().parse(value));
  if (
    url.protocol !== "https:" ||
    url.hostname !== "openai.com" ||
    url.username ||
    url.password ||
    url.port ||
    !/^\/(index|news)\/.+/.test(url.pathname)
  )
    throw new Error("Not an allowed official article URL");
  url.hash = "";
  for (const key of [...url.searchParams.keys()])
    if (/^utm_|^(fbclid|gclid)$/.test(key)) url.searchParams.delete(key);
  url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}

export function parseFeed(
  xml: string,
  provider: Provider,
  retrievedAt: string,
): ParsedSources {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true)
    throw new Error("Invalid or unsafe XML");
  const parsed: unknown = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    trimValues: true,
  }).parse(xml);
  const root = object(parsed);
  const container =
    provider === "arxiv" ? object(root.feed) : object(object(root.rss).channel);
  const entries = list(container[provider === "arxiv" ? "entry" : "item"]);
  // arXiv returns errors as an Atom entry, including with HTTP 200.
  if (
    provider === "arxiv" &&
    entries.some(
      (entry) =>
        typeof object(entry).id === "string" &&
        String(object(entry).id).includes("/api/errors"),
    )
  )
    throw new Error("arXiv query error");
  const sources: Source[] = [];
  let invalid = 0;
  for (const value of entries) {
    try {
      const entry = object(value);
      const urls =
        provider === "arxiv"
          ? arxivUrl(entry.id)
          : (() => {
              const url = officialUrl(entry.link);
              return { id: `openai:${url}`, canonicalUrl: url, url };
            })();
      const evidenceText = text(
        entry[provider === "arxiv" ? "summary" : "description"],
      );
      sources.push(
        sourceSchema.parse({
          ...urls,
          provider,
          title: text(entry.title),
          published:
            provider === "arxiv"
              ? isoDate(entry.published)
              : rssDate(entry.pubDate),
          updated: provider === "arxiv" ? isoDate(entry.updated) : null,
          retrievedAt,
          authors:
            provider === "arxiv"
              ? list(entry.author)
                  .map((author) => text(object(author).name))
                  .filter(Boolean)
              : ["OpenAI"],
          evidence: {
            text: evidenceText,
            kind: provider === "arxiv" ? "abstract" : "feed-description",
            url: urls.url,
          },
        }),
      );
    } catch {
      invalid++;
    }
  }
  return {
    sources,
    exclusions: invalid
      ? [{ provider, reason: "invalid-record", count: invalid }]
      : [],
  };
}

export function selectSources(
  input: Source[],
  queryInput: ResearchQuery,
): ParsedSources {
  const query = researchQuerySchema.parse(queryInput);
  const terms = topicTerms(query.topic);
  const exclusions: Exclusion[] = [];
  function exclude(provider: Provider, reason: Exclusion["reason"]) {
    const prior = exclusions.find(
      (item) => item.provider === provider && item.reason === reason,
    );
    if (prior) prior.count++;
    else exclusions.push({ provider, reason, count: 1 });
  }
  const unique = new Map<string, Source>();
  // Choose the most recently revised record when multiple versions are returned.
  const ordered = [...input].sort((a, b) =>
    (b.updated ?? b.published ?? "").localeCompare(
      a.updated ?? a.published ?? "",
    ),
  );
  for (const source of ordered) {
    if (!source.published) {
      exclude(source.provider, "unknown-date");
      continue;
    }
    if (source.published < query.start || source.published > query.end) {
      exclude(source.provider, "outside-range");
      continue;
    }
    const haystack = `${source.title} ${source.evidence.text}`.toLowerCase();
    if (!terms.every((term) => haystack.includes(term.toLowerCase()))) {
      exclude(source.provider, "topic-mismatch");
      continue;
    }
    if (unique.has(source.id)) {
      exclude(source.provider, "duplicate");
      continue;
    }
    unique.set(source.id, source);
  }
  const counts = { arxiv: 0, openai: 0 };
  const sources = [...unique.values()]
    .sort(
      (a, b) =>
        b.published!.localeCompare(a.published!) || a.id.localeCompare(b.id),
    )
    .filter((source) => {
      if (++counts[source.provider] > 10) {
        exclude(source.provider, "result-limit");
        return false;
      }
      return true;
    });
  return { sources, exclusions };
}

export function topicTerms(topic: string): string[] {
  const terms = topic.match(/[\p{L}\p{N}]+(?:[-.][\p{L}\p{N}]+)*/gu) ?? [];
  if (!terms.length) throw new Error("Topic must contain letters or numbers.");
  return terms;
}
export function arxivQueryUrl(input: ResearchQuery): string {
  const query = researchQuerySchema.parse(input);
  const url = new URL("https://export.arxiv.org/api/query");
  const topic = topicTerms(query.topic)
    .map((term) => `all:"${term}"`)
    .join(" AND ");
  url.searchParams.set(
    "search_query",
    `(${topic}) AND submittedDate:[${query.start.replaceAll("-", "")}0000 TO ${query.end.replaceAll("-", "")}2359]`,
  );
  url.searchParams.set("sortBy", "submittedDate");
  url.searchParams.set("sortOrder", "descending");
  url.searchParams.set("max_results", "10");
  return url.toString();
}
