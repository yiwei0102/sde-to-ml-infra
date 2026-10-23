import { beforeEach, expect, it, vi } from "vitest";
import { POST } from "../src/app/api/research/route";
import { runResearch } from "../src/lib/research-run";
import { SynthesisError } from "../src/lib/synthesis/synthesize";
vi.mock("server-only", () => ({}));
vi.mock("../src/lib/research-run", () => ({ runResearch: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
const query = { topic: "agents", start: "2023-01-01", end: "2023-12-31" };
function request(body = JSON.stringify(query)) {
  return new Request("http://localhost/api/research", { method: "POST", body });
}
it("rejects malformed, oversized and invalid queries before orchestration", async () => {
  for (const body of [
    "{",
    "x".repeat(4097),
    JSON.stringify({ ...query, topic: "***" }),
    JSON.stringify({ ...query, end: "bad" }),
  ])
    expect((await POST(request(body))).status).toBe(400);
  expect(runResearch).not.toHaveBeenCalled();
});
it("maps report states and disables caching", async () => {
  for (const [status, http] of [
    ["complete", 200],
    ["no-sources", 200],
    ["sources-unavailable", 503],
    ["synthesis-failed", 502],
  ] as const) {
    vi.mocked(runResearch).mockResolvedValue({ status } as Awaited<
      ReturnType<typeof runResearch>
    >);
    const response = await POST(request());
    expect(response.status).toBe(http);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  }
});
it("reports disabled or missing configuration without leaking internal exceptions", async () => {
  for (const code of ["disabled", "missing-config"] as const) {
    vi.mocked(runResearch).mockRejectedValue(new SynthesisError(code));
    expect((await POST(request())).status).toBe(503);
  }
  vi.mocked(runResearch).mockRejectedValue(
    new Error("sensitive upstream details"),
  );
  const response = await POST(request());
  expect(response.status).toBe(502);
  expect(JSON.stringify(await response.json())).not.toContain("sensitive");
});
