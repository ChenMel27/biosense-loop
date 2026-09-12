import { describe, expect, it } from "vitest";

import {
  applyTeacherContentDraft,
  lessonDraftToContentDraft,
  TEACHER_COMPLETION_PROMPT_ID,
} from "@/content/teacher-draft";
import { traitInheritancePack } from "@/content/trait-inheritance";

describe("teacher content draft", () => {
  it("turns an uploaded lesson draft into the content used by a classroom session", () => {
    const contentDraft = lessonDraftToContentDraft({
      lessonTitle: "Cell transport",
      gradeBand: "Grade 10 biology",
      topic: "Osmosis",
      scopeBoundary: "Evaluate only water movement and membrane evidence.",
      studentContext: "A cell is placed in salt water.",
      studentPrompt: "Explain which way water moves and why.",
      nearTransferPrompt: "Explain water movement for a cell placed in fresh water.",
      completionQuestion: "Review the evidence link before continuing.",
      targetIdeas: [{ id: "water_direction", label: "Water movement", description: "The response states the direction of water movement.", suggestedTeacherResponse: "Draw a concentration diagram." }],
      possibleMisconceptions: [{ id: "water_pulled", label: "Salt pulls water", description: "The response describes a pulling force.", sourceSupport: "Teacher review", suggestedTeacherResponse: "Contrast a force claim with particle movement." }],
      followUpQuestions: [{ id: "trace_water", title: "Trace the water", question: "Where is water more concentrated?", targetKind: "target_idea", targetId: "water_direction" }, { id: "check_pull", title: "Check the force claim", question: "Does salt pull water, or do particles move down a concentration gradient?", targetKind: "possible_misconception", targetId: "water_pulled" }],
      clarificationQuestion: "Describe what is inside and outside the cell.",
      sourceNotes: [],
      teacherReviewChecks: [],
    });
    const pack = applyTeacherContentDraft(traitInheritancePack, contentDraft);

    expect(pack.title).toBe("Cell transport");
    expect(pack.initialPrompt.text).toContain("A cell is placed in salt water.");
    expect(pack.nearTransferPrompt.text).toContain("fresh water");
    expect(pack.completionPromptId).toBe(TEACHER_COMPLETION_PROMPT_ID);
    expect(pack.followUps.map((item) => item.id)).toEqual([
      "trace_water",
      "check_pull",
      TEACHER_COMPLETION_PROMPT_ID,
    ]);
  });

  it("applies added and removed concepts and teacher-selected question mappings", () => {
    const addedIdeaId = "teacher_idea_cell_location";
    const addedMisconceptionId = "teacher_misconception_genes_float";
    const addedQuestionId = "teacher_follow_up_cell_location";
    const result = applyTeacherContentDraft(traitInheritancePack, {
      initialPrompt: traitInheritancePack.initialPrompt.text,
      ideaIds: ["gene_trait_information", addedIdeaId],
      ideaLabels: {
        gene_trait_information: "Gene carries trait-related information",
        [addedIdeaId]: "Inherited information is located in cells",
      },
      ideaDescriptions: {
        gene_trait_information: traitInheritancePack.ideas[0].description,
        [addedIdeaId]: "The response explains where inherited information is found.",
      },
      misconceptionIds: ["genes_lack_hereditary_information", addedMisconceptionId],
      misconceptionLabels: {
        genes_lack_hereditary_information: "Genes do not carry hereditary information",
        [addedMisconceptionId]: "Genes float outside cells",
      },
      misconceptionDescriptions: {
        genes_lack_hereditary_information:
          traitInheritancePack.alternativeConceptions[1].description,
        [addedMisconceptionId]: "The response explicitly places genes outside cells.",
      },
      followUpIds: [addedQuestionId],
      followUpTitles: { [addedQuestionId]: "Locate the inherited information" },
      followUpPrompts: {
        [addedQuestionId]: "Where is the inherited information located in this case?",
        [traitInheritancePack.fallbackPrompt.id]: traitInheritancePack.fallbackPrompt.text,
      },
      followUpTargetIds: {
        [addedQuestionId]: [addedIdeaId, addedMisconceptionId],
        [traitInheritancePack.fallbackPrompt.id]: [addedIdeaId],
      },
    });

    expect(result.ideas.map((idea) => idea.id)).toEqual([
      "gene_trait_information",
      addedIdeaId,
    ]);
    expect(result.alternativeConceptions.map((item) => item.id)).toEqual([
      "genes_lack_hereditary_information",
      addedMisconceptionId,
    ]);
    expect(result.followUps).toHaveLength(1);
    expect(result.followUps[0]).toMatchObject({
      id: addedQuestionId,
      targets: [addedIdeaId, addedMisconceptionId],
    });
    expect(result.fallbackPrompt.targets).toEqual([
      "gene_trait_information",
      addedIdeaId,
      "genes_lack_hereditary_information",
      addedMisconceptionId,
    ]);
  });

  it("removes stale mappings when their idea or misconception is no longer active", () => {
    const result = applyTeacherContentDraft(traitInheritancePack, {
      initialPrompt: traitInheritancePack.initialPrompt.text,
      ideaIds: ["gene_on_chromosome"],
      ideaDescriptions: {
        gene_on_chromosome: traitInheritancePack.ideas[1].description,
      },
      misconceptionIds: ["genes_and_chromosomes_unrelated"],
      misconceptionDescriptions: {
        genes_and_chromosomes_unrelated:
          traitInheritancePack.alternativeConceptions[2].description,
      },
      followUpIds: ["inheritance_chromosome_probe_01"],
      followUpPrompts: {
        inheritance_chromosome_probe_01: traitInheritancePack.followUps[2].text,
        [traitInheritancePack.fallbackPrompt.id]: traitInheritancePack.fallbackPrompt.text,
      },
      followUpTargetIds: {
        inheritance_chromosome_probe_01: [
          "gene_on_chromosome",
          "removed_misconception",
        ],
      },
    });

    expect(result.followUps[0].targets).toEqual(["gene_on_chromosome"]);
  });
});
