import { beforeEach, expect, it, vi } from "vitest";
import { runResearch } from "../src/lib/research-run";
import { retrieveSources } from "../src/lib/sources/retrieve";
import {
  readSynthesisConfig,
  synthesizeSources,
  SynthesisError,
} from "../src/lib/synthesis/synthesize";
vi.mock("server-only", () => ({}));
vi.mock("../src/lib/sources/retrieve", () => ({ retrieveSources: vi.fn() }));
vi.mock("../src/lib/synthesis/synthesize", async (original) => ({
  ...(await original<typeof import("../src/lib/synthesis/synthesize")>()),
  readSynthesisConfig: vi.fn(),
  synthesizeSources: vi.fn(),
}));
const query = { topic: "agents", start: "2023-01-01", end: "2023-12-31" };
const retrieval = {
  query,
  sources: [],
  providers: [{ provider: "arxiv", status: "ok" }],
  exclusions: [],
  limitations: [],
  retrievedAt: "2026-10-22T00:00:00.000Z",
} as Awaited<ReturnType<typeof retrieveSources>>;
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(readSynthesisConfig).mockReturnValue({
    apiKey: "synthetic",
    model: "gpt-6.1-sol",
  });
  vi.mocked(retrieveSources).mockResolvedValue(retrieval);
});
it("checks opt-in before any upstream request", async () => {
  vi.mocked(readSynthesisConfig).mockImplementation(() => {
    throw new SynthesisError("disabled");
  });
  await expect(runResearch(query)).rejects.toMatchObject({ code: "disabled" });
  expect(retrieveSources).not.toHaveBeenCalled();
  expect(synthesizeSources).not.toHaveBeenCalled();
});
it("skips the model for no matches or complete source failure", async () => {
  expect((await runResearch(query)).status).toBe("no-sources");
  vi.mocked(retrieveSources).mockResolvedValue({
    ...retrieval,
    providers: [{ provider: "arxiv", status: "unavailable" }],
  });
  expect((await runResearch(query)).status).toBe("sources-unavailable");
  expect(synthesizeSources).not.toHaveBeenCalled();
});
it("retains retrieved sources when synthesis fails", async () => {
  const available = {
    ...retrieval,
    sources: [{ id: "synthetic" }],
  } as typeof retrieval;
  vi.mocked(retrieveSources).mockResolvedValue(available);
  vi.mocked(synthesizeSources).mockRejectedValue(new SynthesisError("refused"));
  expect(await runResearch(query)).toMatchObject({
    status: "synthesis-failed",
    retrieval: available,
    synthesis: null,
    error: { code: "refused" },
  });
});
it("returns a complete report after one synthesis call", async () => {
  vi.mocked(retrieveSources).mockResolvedValue({
    ...retrieval,
    sources: [{ id: "synthetic" }],
  } as typeof retrieval);
  vi.mocked(synthesizeSources).mockResolvedValue({
    status: "generated",
    findings: [],
    metadata: {
      requestedModel: "gpt-6.1-sol",
      model: "gpt-6.1-sol",
      responseId: "synthetic",
      promptVersion: "research-v1",
      schemaVersion: "research-v1",
      usage: null,
    },
    input: { sourceIds: [], omittedSourceIds: [], truncatedSourceIds: [] },
    limitations: [],
  });
  expect((await runResearch(query)).status).toBe("complete");
  expect(synthesizeSources).toHaveBeenCalledTimes(1);
});
