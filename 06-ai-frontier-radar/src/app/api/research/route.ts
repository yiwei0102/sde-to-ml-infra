import { researchQuerySchema } from "@/lib/research";
import { topicTerms } from "@/lib/sources/normalize";
import { readLimitedText } from "@/lib/sources/retrieve";
import { runResearch } from "@/lib/research-run";
import { SynthesisError } from "@/lib/synthesis/synthesize";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  let input: unknown;
  try {
    input = JSON.parse(await readLimitedText(request.body, 4096));
  } catch {
    return Response.json(
      { error: "Expected a JSON body of at most 4096 bytes." },
      { status: 400, headers },
    );
  }
  const parsed = researchQuerySchema.safeParse(input);
  if (!parsed.success)
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400, headers },
    );
  try {
    topicTerms(parsed.data.topic);
  } catch {
    return Response.json(
      { error: "Topic must contain letters or numbers." },
      { status: 400, headers },
    );
  }
  try {
    const report = await runResearch(parsed.data);
    return Response.json(report, {
      status:
        report.status === "sources-unavailable"
          ? 503
          : report.status === "synthesis-failed"
            ? 502
            : 200,
      headers,
    });
  } catch (error) {
    const failure =
      error instanceof SynthesisError
        ? error
        : new SynthesisError("provider-error");
    return Response.json(
      { error: { code: failure.code, message: failure.message } },
      {
        status:
          failure.code === "disabled" || failure.code === "missing-config"
            ? 503
            : 502,
        headers,
      },
    );
  }
}
