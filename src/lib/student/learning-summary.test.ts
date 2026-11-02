import { describe, expect, it } from "vitest";

import { traitInheritancePack } from "@/content/trait-inheritance";
import type { AiDecision } from "@/lib/domain/types";
import {
  buildRevisionInstruction,
  buildStudentLearningSummary,
  type LearningFocusKind,
} from "@/lib/student/learning-summary";

function decision(overrides: Partial<AiDecision>): AiDecision {
  return {
    id: "decision-1",
    attemptId: "attempt-1",
    provider: "openai",
    model: "test-model",
    schemaVersion: "test-schema",
    displayedPromptId: "inheritance_gene_trait_probe_01",
    latencyMs: 10,
    fallbackReason: null,
    createdAt: "2026-09-22T12:00:00.000Z",
    demonstratedIdeaIds: ["gene_on_chromosome"],
    missingIdeaIds: ["gene_trait_information"],
    possibleAlternativeConceptionIds: [],
    evidenceSpans: [],
    routingTargetId: "gene_trait_information",
    classificationConfidence: 0.9,
    recommendedPromptId: "inheritance_gene_trait_probe_01",
    abstain: false,
    reasonCodes: [],
    teacherReviewSignals: [],
    ...overrides,
  };
}

describe("buildStudentLearningSummary", () => {
  it("names the one missing idea used for routing", () => {
    const result = buildStudentLearningSummary(
      traitInheritancePack,
      decision({}),
      traitInheritancePack.followUps[0],
    );

    expect(result.focusKind).toBe("missing_idea");
    expect(result.focusLabel).toBe("Gene carries trait-related information");
    expect(result.initiallyCovered).toEqual(["Gene is located on a chromosome"]);
  });

  it("distinguishes an explicit claim from an omitted idea", () => {
    const result = buildStudentLearningSummary(
      traitInheritancePack,
      decision({
        missingIdeaIds: [],
        possibleAlternativeConceptionIds: ["one_parent_determines_trait"],
        routingTargetId: "one_parent_determines_trait",
      }),
      traitInheritancePack.followUps[3],
    );

    expect(result.focusKind).toBe("claim_to_reconsider");
    expect(result.focusLabel).toBe("Only one parent determines the trait");
  });

  it("uses a clarification focus after abstention", () => {
    const result = buildStudentLearningSummary(
      traitInheritancePack,
      decision({ abstain: true, routingTargetId: null }),
      traitInheritancePack.fallbackPrompt,
    );

    expect(result.focusKind).toBe("clarify_reasoning");
    expect(result.focusLabel).toBe("Make the scientific connection easier to follow");
  });

  it("uses an evidence check when the initial explanation met the activity targets", () => {
    const result = buildStudentLearningSummary(
      traitInheritancePack,
      decision({
        demonstratedIdeaIds: traitInheritancePack.ideas.map((idea) => idea.id),
        missingIdeaIds: [],
        routingTargetId: null,
        displayedPromptId: traitInheritancePack.completionPromptId,
      }),
      traitInheritancePack.followUps.find(
        (prompt) => prompt.id === traitInheritancePack.completionPromptId,
      ) ?? null,
    );

    expect(result.focusKind).toBe("evidence_check");
    expect(result.focusLabel).toBe(
      "Check that the evidence and conclusion are clearly connected",
    );
  });

  it("does not expose teacher-only review suggestions in the student summary", () => {
    const result = buildStudentLearningSummary(
      traitInheritancePack,
      decision({
        teacherReviewSignals: [{
          id: "teacher-only-signal",
          category: "possible_out_of_bank_reasoning",
          quote: "the beetle wants the trait",
          startIndex: 0,
          endIndex: 26,
          proposedInterpretation: "Teacher-only proposed interpretation.",
          rationale: "Teacher-only rationale.",
        }],
      }),
      traitInheritancePack.followUps[0],
    );

    expect(JSON.stringify(result)).not.toContain("Teacher-only");
    expect(JSON.stringify(result)).not.toContain("teacher-only-signal");
  });
});

describe("buildRevisionInstruction", () => {
  it.each<[LearningFocusKind, string]>([
    ["missing_idea", "Add one sentence"],
    ["claim_to_reconsider", "Edit one sentence"],
    ["clarify_reasoning", "Edit or add one sentence"],
    ["evidence_check", "connects your evidence to your conclusion"],
  ])("gives a direct, answer-neutral instruction for %s", (focusKind, expectedText) => {
    const instruction = buildRevisionInstruction(focusKind);

    expect(instruction).toContain(expectedText);
    expect(instruction).toContain("Keep the parts of your first answer that still fit.");
    expect(instruction).toContain("You do not need to start over.");
    expect(instruction.toLowerCase()).not.toMatch(/gene|chromosome|parent|offspring/);
  });

  it("uses a neutral clarification instruction when no focus is available", () => {
    expect(buildRevisionInstruction()).toContain(
      "make the scientific connection easier to follow",
    );
  });
});
