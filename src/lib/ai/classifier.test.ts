import { describe, expect, it } from "vitest";

import { applyTeacherContentDraft } from "@/content/teacher-draft";
import { traitInheritancePack } from "@/content/trait-inheritance";
import {
  isLiveAiRoutingEnabled,
  normalizeClassificationResult,
} from "@/lib/ai/classifier";

describe("live AI routing configuration", () => {
  it("allows an adult demonstration when routing and a key are configured", () => {
    expect(isLiveAiRoutingEnabled({
      AI_ROUTING_ENABLED: "true",
      AI_DEMO_ROUTING_ENABLED: "true",
      OPENAI_API_KEY: "test-key",
    })).toBe(true);
  });

  it("allows an approved minors context without enabling demo mode", () => {
    expect(isLiveAiRoutingEnabled({
      AI_ROUTING_ENABLED: "true",
      MINOR_DATA_SAFEGUARDS_CONFIRMED: "true",
      OPENAI_API_KEY: "test-key",
    })).toBe(true);
  });

  it("keeps live routing off without an approved context", () => {
    expect(isLiveAiRoutingEnabled({
      AI_ROUTING_ENABLED: "true",
      OPENAI_API_KEY: "test-key",
    })).toBe(false);
  });

  it("keeps live routing off when the API key is missing", () => {
    expect(isLiveAiRoutingEnabled({
      AI_ROUTING_ENABLED: "true",
      AI_DEMO_ROUTING_ENABLED: "true",
    })).toBe(false);
  });
});

describe("teacher-approved prompt mappings", () => {
  it("replaces an AI-selected question when it does not match the identified idea", () => {
    const result = normalizeClassificationResult({
      demonstrated_idea_ids: ["gene_trait_information"],
      missing_idea_ids: ["gene_on_chromosome"],
      possible_alternative_conception_ids: [],
      classification_confidence: 0.9,
      recommended_prompt_id: "inheritance_both_parents_probe_01",
      abstain: false,
      reason_codes: ["missing_relationship"],
    }, traitInheritancePack);

    expect(result.recommendedPromptId).toBe("inheritance_chromosome_probe_01");
    expect(result.abstain).toBe(false);
  });

  it("uses a newly added question when the teacher links it to a new idea", () => {
    const addedIdeaId = "teacher_idea_cell_location";
    const addedQuestionId = "teacher_follow_up_cell_location";
    const pack = applyTeacherContentDraft(traitInheritancePack, {
      initialPrompt: traitInheritancePack.initialPrompt.text,
      ideaIds: [addedIdeaId],
      ideaLabels: { [addedIdeaId]: "Inherited information is located in cells" },
      ideaDescriptions: {
        [addedIdeaId]: "The response explains where inherited information is found.",
      },
      misconceptionIds: ["genes_lack_hereditary_information"],
      misconceptionDescriptions: {
        genes_lack_hereditary_information:
          traitInheritancePack.alternativeConceptions[1].description,
      },
      followUpIds: [addedQuestionId],
      followUpTitles: { [addedQuestionId]: "Locate the inherited information" },
      followUpPrompts: {
        [addedQuestionId]: "Where is the inherited information located?",
        [traitInheritancePack.fallbackPrompt.id]: traitInheritancePack.fallbackPrompt.text,
      },
      followUpTargetIds: { [addedQuestionId]: [addedIdeaId] },
    });
    const result = normalizeClassificationResult({
      demonstrated_idea_ids: [],
      missing_idea_ids: [addedIdeaId],
      possible_alternative_conception_ids: [],
      classification_confidence: 0.93,
      recommended_prompt_id: addedQuestionId,
      abstain: false,
      reason_codes: ["missing_relationship"],
    }, pack);

    expect(result.recommendedPromptId).toBe(addedQuestionId);
    expect(result.abstain).toBe(false);
  });
});
