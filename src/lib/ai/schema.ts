import { z } from "zod";

import { cellularRespirationPack } from "@/content/cellular-respiration";

const ideaIds = cellularRespirationPack.ideas.map((idea) => idea.id);
const misconceptionIds = cellularRespirationPack.alternativeConceptions.map(
  (idea) => idea.id,
);
const promptIds = [
  ...cellularRespirationPack.followUps.map((prompt) => prompt.id),
  cellularRespirationPack.fallbackPrompt.id,
];

export const classificationSchema = z.object({
  demonstrated_idea_ids: z.array(z.enum(ideaIds as [string, ...string[]])),
  missing_idea_ids: z.array(z.enum(ideaIds as [string, ...string[]])),
  possible_alternative_conception_ids: z.array(
    z.enum(misconceptionIds as [string, ...string[]]),
  ),
  classification_confidence: z.number().min(0).max(1),
  recommended_prompt_id: z.enum(promptIds as [string, ...string[]]),
  abstain: z.boolean(),
  reason_codes: z.array(
    z.enum([
      "explicit_evidence",
      "missing_relationship",
      "contradictory_statement",
      "too_short",
      "unclear_reference",
      "possible_prompt_copy",
      "insufficient_evidence",
    ]),
  ),
});

export type RawClassification = z.infer<typeof classificationSchema>;

export const CLASSIFIER_SCHEMA_VERSION = "cellular-respiration-classifier-v1";
