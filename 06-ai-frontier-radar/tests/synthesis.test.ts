import { describe, expect, it, vi } from "vitest";
import OpenAI from "openai";
import {
  buildSynthesisInput,
  readSynthesisConfig,
  synthesizeSources,
} from "../src/lib/synthesis/synthesize";
import { sourceSchema } from "../src/lib/sources/normalize";
vi.mock("server-only", () => ({}));

const query = { topic: "agents", start: "2023-01-01", end: "2023-12-31" };
const source = sourceSchema.parse({
  id: "arxiv:2303.08774",
  provider: "arxiv",
  title: "Synthetic test source",
  url: "https://arxiv.org/abs/2303.08774v1",
  canonicalUrl: "https://arxiv.org/abs/2303.08774",
  published: "2023-03-15",
  updated: null,
  retrievedAt: "2026-10-22T00:00:00.000Z",
  authors: [],
  evidence: {
    text: "Synthetic test evidence about agents.",
    kind: "abstract",
    url: "https://arxiv.org/abs/2303.08774v1",
  },
});
const config = { apiKey: "synthetic-test-key", model: "gpt-6.1-sol" };
const generated = {
  findings: [
    {
      title: "Synthetic finding",
      sourceIds: [source.id],
      claims: [
        {
          text: source.evidence.text,
          sourceIds: [source.id],
          evidence: [{ sourceId: source.id, quote: source.evidence.text }],
        },
        { text: "An unsupported test statement.", sourceIds: [], evidence: [] },
      ],
      technicalSignificance: "Interpretation for testing.",
      experiment: {
        hypothesis: "A proposed test.",
        steps: ["Measure a baseline."],
        successCriteria: "Record the outcome.",
      },
      limitations: ["Synthetic evidence only."],
    },
  ],
};
function envelope(content: unknown, changes: Record<string, unknown> = {}) {
  return {
    id: "resp_test",
    object: "response",
    created_at: 0,
    status: "completed",
    model: config.model,
    output: [
      {
        id: "msg_test",
        type: "message",
        status: "completed",
        role: "assistant",
        content: [content],
      },
    ],
    usage: {
      input_tokens: 100,
      output_tokens: 50,
      total_tokens: 150,
      input_tokens_details: { cached_tokens: 0 },
      output_tokens_details: { reasoning_tokens: 0 },
    },
    ...changes,
  };
}
function setup(body: unknown, status = 200) {
  const transport = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
  const client = new OpenAI({
    apiKey: config.apiKey,
    maxRetries: 0,
    fetch: transport,
  });
  return { client, transport };
}
function output(data: unknown) {
  return { type: "output_text", text: JSON.stringify(data), annotations: [] };
}

describe("configuration and bounded prompt", () => {
  it("requires explicit opt-in and configured credentials/model", () => {
    expect(() => readSynthesisConfig({})).toThrow(/disabled/);
    expect(() =>
      readSynthesisConfig({
        ENABLE_LLM_SYNTHESIS: "true",
        OPENAI_API_KEY: "replace-with-your-api-key",
        OPENAI_MODEL: config.model,
      }),
    ).toThrow(/Configure/);
    expect(
      readSynthesisConfig({
        ENABLE_LLM_SYNTHESIS: "true",
        OPENAI_API_KEY: config.apiKey,
        OPENAI_MODEL: config.model,
      }),
    ).toEqual(config);
  });
  it("bounds evidence, reports clipping/omission, and rejects duplicate/empty sources", () => {
    const many = Array.from({ length: 10 }, (_, index) => ({
      ...source,
      id: `source-${index}`,
      evidence: { ...source.evidence, text: "x".repeat(2000) },
    }));
    const prompt = buildSynthesisInput(query, many);
    expect(prompt.sourceIds).toHaveLength(8);
    expect(prompt.truncatedSourceIds).toHaveLength(8);
    expect(prompt.omittedSourceIds).toEqual(["source-8", "source-9"]);
    expect(
      JSON.parse(prompt.content).untrustedSourceData[0].evidence,
    ).toHaveLength(1200);
    expect(() => buildSynthesisInput(query, [source, source])).toThrow(
      /unique/,
    );
    expect(() => buildSynthesisInput(query, [])).toThrow();
  });
});
describe("real SDK with mocked HTTP transport", () => {
  it("parses structured output and preserves labels, provenance IDs, and usage metadata", async () => {
    const { client, transport } = setup(envelope(output(generated)));
    const result = await synthesizeSources(query, [source], config, client);
    expect(result.metadata).toMatchObject({
      model: config.model,
      responseId: "resp_test",
      promptVersion: "research-v2",
      schemaVersion: "research-v2",
      usage: { inputTokens: 100, outputTokens: 50 },
    });
    expect(result.findings[0].claims.map((claim) => claim.support)).toEqual([
      "source-reported",
    ]);
    expect(result.findings[0].experimentLabel).toContain("not executed");
    expect(result.input.sourceIds).toEqual([source.id]);
    expect(result.evidenceValidation.withheldClaims).toMatchObject([
      { support: "unsupported", reason: "missing-evidence" },
    ]);
    expect(result.findings[0].claims[0].citations[0].url).toBe(source.url);
    expect(transport).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(transport.mock.calls[0][1]?.body));
    expect(body).toMatchObject({
      model: config.model,
      store: false,
      max_output_tokens: 2200,
      text: { format: { type: "json_schema", strict: true } },
    });
    expect(body.tools).toBeUndefined();
    expect(body.input[0].content).toContain("untrusted");
    expect(body.input[1].content).not.toContain(config.apiKey);
  });
  it("handles refusals without exposing raw refusal content", async () => {
    const { client } = setup(
      envelope({
        type: "refusal",
        refusal: "private upstream refusal details",
      }),
    );
    await expect(
      synthesizeSources(query, [source], config, client),
    ).rejects.toMatchObject({
      code: "refused",
      message: "The model declined to generate this research report.",
    });
  });
  it("rejects incomplete responses, even when their partial JSON is valid", async () => {
    const { client } = setup(
      envelope(output(generated), {
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
      }),
    );
    await expect(
      synthesizeSources(query, [source], config, client),
    ).rejects.toMatchObject({ code: "incomplete" });
  });
  it("rejects malformed JSON, schema mismatch, and model-invented citation fields", async () => {
    for (const content of [
      { type: "output_text", text: "{broken", annotations: [] },
      output({ findings: "wrong" }),
      output({
        findings: [
          { ...generated.findings[0], url: "https://invented.example" },
        ],
      }),
    ]) {
      const { client } = setup(envelope(content));
      await expect(
        synthesizeSources(query, [source], config, client),
      ).rejects.toMatchObject({ code: "invalid-output" });
    }
  });
  it("rejects unknown IDs and claim references outside a finding", async () => {
    for (const finding of [
      { ...generated.findings[0], sourceIds: ["invented"] },
      {
        ...generated.findings[0],
        claims: [{ text: "Test", sourceIds: ["invented"], evidence: [] }],
      },
    ]) {
      const { client } = setup(envelope(output({ findings: [finding] })));
      await expect(
        synthesizeSources(query, [source], config, client),
      ).rejects.toMatchObject({ code: "invalid-output" });
    }
  });
  it("withholds a fabricated claim using a real source ID after SDK parsing", async () => {
    const finding = {
      ...generated.findings[0],
      claims: [
        {
          text: "This test model achieves 100% accuracy.",
          sourceIds: [source.id],
          evidence: [{ sourceId: source.id, quote: source.evidence.text }],
        },
      ],
    };
    const { client } = setup(envelope(output({ findings: [finding] })));
    const result = await synthesizeSources(query, [source], config, client);
    expect(result.findings).toEqual([]);
    expect(result.evidenceValidation.withheldClaims[0].reason).toBe(
      "paraphrase-needs-semantic-review",
    );
  });
  it("allows an honest empty synthesis instead of inventing findings", async () => {
    const { client } = setup(envelope(output({ findings: [] })));
    expect(
      (await synthesizeSources(query, [source], config, client)).findings,
    ).toEqual([]);
  });
  it("sanitizes provider errors and does not retry", async () => {
    const { client, transport } = setup(
      { error: { message: "private upstream details", type: "server_error" } },
      500,
    );
    await expect(
      synthesizeSources(query, [source], config, client),
    ).rejects.toMatchObject({ code: "provider-error" });
    expect(transport).toHaveBeenCalledTimes(1);
  });
});
