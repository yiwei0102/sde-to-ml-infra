import { beforeEach, expect, it, vi } from "vitest";
import { retrieveSources } from "../src/lib/sources/retrieve";
import { POST } from "../src/app/api/sources/route";
vi.mock("../src/lib/sources/retrieve", async (original) => ({
  ...(await original<typeof import("../src/lib/sources/retrieve")>()),
  retrieveSources: vi.fn(),
}));
beforeEach(() => vi.mocked(retrieveSources).mockReset());
const query = { topic: "agents", start: "2023-01-01", end: "2023-12-31" };
function request(body: string) {
  return new Request("http://localhost/api/sources", { method: "POST", body });
}
it("rejects malformed, oversized, punctuation-only and invalid date requests before retrieval", async () => {
  for (const body of [
    "{",
    "x".repeat(4097),
    JSON.stringify({ ...query, topic: "***" }),
    JSON.stringify({ ...query, end: "bad" }),
  ])
    expect((await POST(request(body))).status).toBe(400);
  expect(retrieveSources).not.toHaveBeenCalled();
});
it("returns no-store responses for partial success and 503 for total failure", async () => {
  for (const [statuses, expected] of [
    [["ok", "unavailable"], 200],
    [["unavailable", "unavailable"], 503],
  ] as const) {
    vi.mocked(retrieveSources).mockResolvedValue({
      providers: statuses.map((status) => ({ status })),
    } as Awaited<ReturnType<typeof retrieveSources>>);
    const response = await POST(request(JSON.stringify(query)));
    expect(response.status).toBe(expected);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  }
});
