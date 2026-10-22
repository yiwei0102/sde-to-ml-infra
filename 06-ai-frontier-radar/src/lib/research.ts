import { z } from "zod";

const date = z.iso.date();
export const researchQuerySchema = z
  .object({
    topic: z
      .string()
      .trim()
      .min(1, "Enter a research topic.")
      .max(160, "Keep the topic under 160 characters."),
    start: date,
    end: date,
  })
  .refine((query) => query.start <= query.end, {
    message: "Start date must be on or before end date.",
    path: ["end"],
  });
export type ResearchQuery = z.infer<typeof researchQuerySchema>;
export const findingSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(["Models", "Agents"]),
  published: date,
  source: z.string(),
  url: z.url(),
  summary: z.string(),
  evidence: z.string(),
  interpretation: z.string(),
  experiment: z.string(),
  limitation: z.string(),
  keywords: z.array(z.string()),
});
export type Finding = z.infer<typeof findingSchema>;

// Hand-curated historical fixtures, not live retrieval or model output.
// Dates are first-submission dates. URLs reference version 1 to match those dates.
export const demoFindings: Finding[] = z.array(findingSchema).parse([
  {
    id: "llama-2",
    title: "Llama 2: open foundation and fine-tuned chat models",
    category: "Models",
    published: "2023-07-18",
    source: "Meta · arXiv",
    url: "https://arxiv.org/abs/2307.09288v1",
    summary:
      "A family of pretrained and chat-tuned language models gives engineers a concrete starting point for exploring self-hosted inference.",
    evidence:
      "The authors introduce pretrained and fine-tuned models ranging from 7B to 70B parameters.",
    interpretation:
      "A useful case study for separating base-model capability from chat alignment and serving constraints.",
    experiment:
      "Design a fixed prompt set and compare a base model with its chat variant. Track task quality, latency, and memory on the same hardware.",
    limitation:
      "This fixture does not establish performance on your workload. Check model licensing and hardware requirements before running an experiment.",
    keywords: [
      "AI",
      "language models",
      "LLM",
      "inference",
      "open models",
      "Llama",
      "evaluation",
    ],
  },
  {
    id: "gpt-4",
    title: "GPT-4 technical report: capabilities and limitations",
    category: "Models",
    published: "2023-03-15",
    source: "OpenAI · arXiv",
    url: "https://arxiv.org/abs/2303.08774v1",
    summary:
      "The report describes a large multimodal model and discusses both its capabilities and reliability limitations.",
    evidence:
      "The report describes a model accepting image and text inputs and producing text outputs.",
    interpretation:
      "Capability reports are starting points for evaluation; product reliability still needs task-specific measurement.",
    experiment:
      "Create a small factual question set with known answers. Measure correctness and unsupported statements separately using a model you can access.",
    limitation:
      "Historical report, not current API documentation. No present-day API access, pricing, or model performance is implied.",
    keywords: [
      "AI",
      "language models",
      "LLM",
      "multimodal",
      "evaluation",
      "GPT",
    ],
  },
  {
    id: "react",
    title: "ReAct: connecting reasoning with actions",
    category: "Agents",
    published: "2022-10-06",
    source: "Research paper · arXiv",
    url: "https://arxiv.org/abs/2210.03629v1",
    summary:
      "ReAct explores interleaving reasoning and task-specific actions so language models can interact with external information.",
    evidence:
      "The paper studies interleaved reasoning traces and actions on language and decision-making tasks.",
    interpretation:
      "Tool access creates an engineering question: when does retrieval improve an answer enough to justify added latency?",
    experiment:
      "Plan a comparison between a direct-answer baseline and a bounded retrieval workflow. Score answer accuracy, source support, and tool calls.",
    limitation:
      "Reported benchmark outcomes do not guarantee production reliability. The proposed comparison has not been run.",
    keywords: [
      "AI",
      "language models",
      "LLM",
      "agents",
      "tools",
      "retrieval",
      "ReAct",
    ],
  },
]);
export const initialQuery: ResearchQuery = {
  topic: "language models",
  start: "2022-10-01",
  end: "2023-07-31",
};

export function filterFindings(
  findings: Finding[],
  input: ResearchQuery,
): Finding[] {
  const query = researchQuerySchema.parse(input);
  const terms = query.topic.toLowerCase().split(/\s+/);
  return findings
    .filter((finding) => {
      const text = [finding.title, finding.summary, ...finding.keywords]
        .join(" ")
        .toLowerCase();
      return (
        finding.published >= query.start &&
        finding.published <= query.end &&
        terms.every((term) => text.includes(term))
      );
    })
    .sort((a, b) => b.published.localeCompare(a.published));
}
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
