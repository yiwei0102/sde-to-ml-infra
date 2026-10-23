import { z } from "zod";

export const PROMPT_VERSION = "research-v1";
export const SCHEMA_VERSION = "research-v1";
// The model supplies IDs, never canonical URLs or publication dates.
export const synthesisSchema = z.strictObject({
  findings: z
    .array(
      z.strictObject({
        title: z.string().min(1).max(180),
        sourceIds: z.array(z.string().min(1)).min(1).max(8),
        claims: z
          .array(
            z.strictObject({
              text: z.string().min(1).max(600),
              sourceIds: z.array(z.string().min(1)).max(8),
            }),
          )
          .max(5),
        technicalSignificance: z.string().min(1).max(800),
        experiment: z.strictObject({
          hypothesis: z.string().min(1).max(400),
          steps: z.array(z.string().min(1).max(300)).min(1).max(5),
          successCriteria: z.string().min(1).max(400),
        }),
        limitations: z.array(z.string().min(1).max(400)).min(1).max(5),
      }),
    )
    .max(4),
});
export type GeneratedSynthesis = z.infer<typeof synthesisSchema>;
