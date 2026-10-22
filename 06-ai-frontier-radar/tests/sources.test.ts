import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  arxivQueryUrl,
  parseFeed,
  selectSources,
} from "../src/lib/sources/normalize";

const now = "2026-10-22T05:00:00.000Z";
const query = {
  topic: "language models",
  start: "2023-03-15",
  end: "2023-07-18",
};
// Synthetic protocol fixtures. These are not retrieved or cited research.
function atomEntry(
  id = "2303.08774v1",
  published = "2023-03-15T00:00:00Z",
  updated = published,
) {
  return `<entry><id>http://arxiv.org/abs/${id}</id><title> Language models </title><summary>An abstract about language models.</summary><published>${published}</published><updated>${updated}</updated><author><name>A. Researcher</name></author></entry>`;
}
function atom(entries = atomEntry()) {
  return `<feed xmlns="http://www.w3.org/2005/Atom">${entries}</feed>`;
}
function rssItem(
  url = "https://openai.com/index/test/?utm_source=demo#section",
  date = "Tue, 18 Jul 2023 12:00:00 GMT",
) {
  return `<item><title>Language models &amp; tools</title><link>${url.replaceAll("&", "&amp;")}</link><description><![CDATA[<p>Language models with <b>tools</b>.</p>]]></description><pubDate>${date}</pubDate></item>`;
}
function rss(items = rssItem()) {
  return `<rss version="2.0"><channel><title>Test feed</title>${items}</channel></rss>`;
}

describe("source normalization and selection", () => {
  it("preserves author evidence, publication/revision dates and version-specific provenance", () => {
    const { sources } = parseFeed(
      atom(
        atomEntry(
          "2303.08774v2",
          "2023-03-15T00:00:00Z",
          "2024-03-04T00:00:00Z",
        ),
      ),
      "arxiv",
      now,
    );
    expect(sources[0]).toMatchObject({
      id: "arxiv:2303.08774",
      url: "https://arxiv.org/abs/2303.08774v2",
      canonicalUrl: "https://arxiv.org/abs/2303.08774",
      published: "2023-03-15",
      updated: "2024-03-04",
      retrievedAt: now,
      authors: ["A. Researcher"],
      evidence: {
        kind: "abstract",
        text: "An abstract about language models.",
        url: "https://arxiv.org/abs/2303.08774v2",
      },
    });
  });
  it("supports legacy identifiers and singleton/multiple Atom entries", () => {
    expect(
      parseFeed(atom(atomEntry("cs/0301001v1") + atomEntry()), "arxiv", now)
        .sources,
    ).toHaveLength(2);
  });
  it("normalizes official links and plain-text feed evidence", () => {
    expect(parseFeed(rss(), "openai", now).sources[0]).toMatchObject({
      canonicalUrl: "https://openai.com/index/test",
      title: "Language models & tools",
      published: "2023-07-18",
      updated: null,
      evidence: {
        text: "Language models with tools.",
        kind: "feed-description",
      },
    });
  });
  it("rejects off-domain, credential-bearing and non-HTTPS official URLs", () => {
    for (const url of [
      "https://openai.com.evil.test/index/test",
      "https://user@openai.com/index/test",
      "http://openai.com/index/test",
      "https://openai.com:8443/index/test",
    ]) {
      expect(parseFeed(rss(rssItem(url)), "openai", now).exclusions).toEqual([
        { provider: "openai", reason: "invalid-record", count: 1 },
      ]);
    }
  });
  it("rejects malformed XML, entity declarations, wrong formats, and Atom API errors", () => {
    for (const xml of [
      "<feed>",
      '<!DOCTYPE feed [<!ENTITY x "boom">]><feed/>',
      "<html>blocked</html>",
      "<feed><entry><id>http://arxiv.org/api/errors#x</id></entry></feed>",
    ])
      expect(() => parseFeed(xml, "arxiv", now)).toThrow();
  });
  it("filters inclusively using publication dates, never revision dates", () => {
    const parsed = parseFeed(
      atom(
        atomEntry(
          "2303.08774v2",
          "2023-03-15T00:00:00Z",
          "2026-10-01T00:00:00Z",
        ) +
          atomEntry("2307.09288v1", "2023-07-18T23:59:00Z") +
          atomEntry("2301.00001v1", "2023-01-01T00:00:00Z"),
      ),
      "arxiv",
      now,
    );
    const selected = selectSources(parsed.sources, query);
    expect(selected.sources.map((source) => source.id)).toEqual([
      "arxiv:2307.09288",
      "arxiv:2303.08774",
    ]);
    expect(selected.exclusions).toContainEqual({
      provider: "arxiv",
      reason: "outside-range",
      count: 1,
    });
  });
  it("excludes unknown dates and discloses duplicate and topic exclusions", () => {
    const sources = parseFeed(
      atom(
        atomEntry() +
          atomEntry(
            "2303.08774v2",
            "2023-03-15T00:00:00Z",
            "2023-03-16T00:00:00Z",
          ) +
          atomEntry("2305.00001v1", "not-a-date"),
      ),
      "arxiv",
      now,
    ).sources;
    const selected = selectSources(sources, query);
    expect(selected.sources).toHaveLength(1);
    expect(selected.sources[0].url).toContain("v2");
    expect(selected.exclusions).toEqual(
      expect.arrayContaining([
        { provider: "arxiv", reason: "unknown-date", count: 1 },
        { provider: "arxiv", reason: "duplicate", count: 1 },
      ]),
    );
    expect(
      selectSources(sources, { ...query, topic: "quantum" }).exclusions,
    ).toContainEqual({ provider: "arxiv", reason: "topic-mismatch", count: 2 });
  });
  it("deduplicates official tracking variants and rejects timezone-free RSS dates", () => {
    const sources = parseFeed(
      rss(
        rssItem() +
          rssItem("https://openai.com/index/test?utm_source=other") +
          rssItem("https://openai.com/index/unknown", "2023-07-18"),
      ),
      "openai",
      now,
    ).sources;
    const selected = selectSources(sources, query);
    expect(selected.sources).toHaveLength(1);
    expect(selected.exclusions).toContainEqual({
      provider: "openai",
      reason: "unknown-date",
      count: 1,
    });
  });
  it("constructs a bounded date query without passing user query syntax through", () => {
    const url = new URL(arxivQueryUrl({ ...query, topic: 'LLM" OR all:*' }));
    expect(url.origin + url.pathname).toBe(
      "https://export.arxiv.org/api/query",
    );
    expect(url.searchParams.get("max_results")).toBe("10");
    expect(url.searchParams.get("search_query")).toBe(
      '(all:"LLM" AND all:"OR" AND all:"all") AND submittedDate:[202303150000 TO 202307182359]',
    );
    expect(() => arxivQueryUrl({ ...query, topic: "***" })).toThrow();
  });
});

describe("bounded retrieval", () => {
  beforeEach(() => vi.resetModules());
  it("returns both sources with explicit limitations and no paid provider calls", async () => {
    const { retrieveSources } = await import("../src/lib/sources/retrieve");
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (url, options) => {
        expect(options).toMatchObject({ redirect: "error", cache: "no-store" });
        return new Response(String(url).includes("arxiv") ? atom() : rss());
      });
    const result = await retrieveSources(query, fetcher, new Date(now));
    expect(result.sources).toHaveLength(2);
    expect(result.providers.map((provider) => provider.status)).toEqual([
      "ok",
      "ok",
    ]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.limitations).toHaveLength(3);
  });
  it("retains partial results on upstream HTTP failure", async () => {
    const { retrieveSources } = await import("../src/lib/sources/retrieve");
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (url) =>
        String(url).includes("arxiv")
          ? new Response("busy", { status: 429 })
          : new Response(rss()),
      );
    const result = await retrieveSources(query, fetcher);
    expect(result.sources).toHaveLength(1);
    expect(result.providers[0]).toMatchObject({
      status: "unavailable",
      message: "Source returned HTTP 429",
    });
  });
  it("reports total failure and handles timeout without leaking upstream details", async () => {
    const { retrieveSources } = await import("../src/lib/sources/retrieve");
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new DOMException("internal details", "TimeoutError"));
    const result = await retrieveSources(query, fetcher);
    expect(result.sources).toEqual([]);
    expect(
      result.providers.every((provider) => provider.status === "unavailable"),
    ).toBe(true);
    expect(JSON.stringify(result)).not.toContain("internal details");
  });
  it("blocks overlapping and repeated arXiv calls during cooldown", async () => {
    const { retrieveSources } = await import("../src/lib/sources/retrieve");
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(
        async (url) =>
          new Response(String(url).includes("arxiv") ? atom() : rss()),
      );
    await retrieveSources(query, fetcher);
    const second = await retrieveSources(query, fetcher);
    expect(second.providers[0]).toMatchObject({
      status: "unavailable",
      message: expect.stringContaining("cooldown"),
    });
    expect(
      fetcher.mock.calls.filter(([url]) => String(url).includes("arxiv")),
    ).toHaveLength(1);
  });
  it("limits streamed bytes and cancels oversized bodies", async () => {
    const { readLimitedText } = await import("../src/lib/sources/retrieve");
    await expect(
      readLimitedText(new Response("12345").body, 4),
    ).rejects.toThrow("size limit");
    await expect(readLimitedText(new Response("é").body, 1)).rejects.toThrow(
      "size limit",
    );
    await expect(readLimitedText(new Response("okay").body, 4)).resolves.toBe(
      "okay",
    );
  });
  it("rejects invalid input before making external requests", async () => {
    const { retrieveSources } = await import("../src/lib/sources/retrieve");
    const fetcher = vi.fn<typeof fetch>();
    await expect(
      retrieveSources({ ...query, topic: "***" }, fetcher),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
});

it("excludes impossible RSS calendar dates and limits output with omission counts", () => {
  const invalid = parseFeed(
    rss(
      rssItem(
        "https://openai.com/index/invalid",
        "Thu, 30 Feb 2023 12:00:00 GMT",
      ),
    ),
    "openai",
    now,
  );
  expect(selectSources(invalid.sources, query).exclusions).toContainEqual({
    provider: "openai",
    reason: "unknown-date",
    count: 1,
  });
  const items = Array.from({ length: 12 }, (_, index) =>
    rssItem(`https://openai.com/index/test-${index}`),
  ).join("");
  const selected = selectSources(
    parseFeed(rss(items), "openai", now).sources,
    query,
  );
  expect(selected.sources).toHaveLength(10);
  expect(selected.exclusions).toContainEqual({
    provider: "openai",
    reason: "result-limit",
    count: 2,
  });
});
