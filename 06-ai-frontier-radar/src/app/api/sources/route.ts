import { researchQuerySchema } from "@/lib/research";
import { topicTerms } from "@/lib/sources/normalize";
import { readLimitedText, retrieveSources } from "@/lib/sources/retrieve";

export const runtime = "nodejs";
export async function POST(request: Request) {
  let input: unknown;
  try {
    input = JSON.parse(await readLimitedText(request.body, 4096));
  } catch {
    return Response.json(
      { error: "Expected a JSON body of at most 4096 bytes." },
      { status: 400 },
    );
  }
  const parsed = researchQuerySchema.safeParse(input);
  if (!parsed.success)
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  try {
    topicTerms(parsed.data.topic);
  } catch {
    return Response.json(
      { error: "Topic must contain letters or numbers." },
      { status: 400 },
    );
  }
  const result = await retrieveSources(parsed.data);
  return Response.json(result, {
    status: result.providers.every(
      (provider) => provider.status === "unavailable",
    )
      ? 503
      : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
