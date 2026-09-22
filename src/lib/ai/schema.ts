import { z } from "zod";

import { traitInheritancePack, type ContentPack } from "@/content/trait-inheritance";

export function createClassificationSchema(pack: ContentPack) {
  const ideaIds = pack.ideas.map((idea) => idea.id) as [string, ...string[]];
  const misconceptionIds = pack.alternativeConceptions.map((idea) => idea.id);
  const labelIds = [...ideaIds, ...misconceptionIds] as [string, ...string[]];
  const promptIds: [string, ...string[]] = [
    pack.fallbackPrompt.id,
    ...pack.followUps.map((prompt) => prompt.id),
  ];

  return z.object({
    demonstrated_idea_ids: z.array(z.enum(ideaIds)),
    missing_idea_ids: z.array(z.enum(ideaIds)),
    possible_alternative_conception_ids: misconceptionIds.length
      ? z.array(z.enum(misconceptionIds as [string, ...string[]]))
      : z.array(z.string()).length(0),
    evidence_spans: z.array(
      z.object({
        label_id: z.enum(labelIds),
        evidence_quote: z.string().min(1).max(500),
      }),
    ).max(labelIds.length),
    classification_confidence: z.number().min(0).max(1),
    recommended_prompt_id: z.enum(promptIds),
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
}

export const classificationSchema = createClassificationSchema(traitInheritancePack);

export type RawClassification = z.infer<typeof classificationSchema>;

export const CLASSIFIER_SCHEMA_VERSION = "teacher-approved-classifier-v3";
