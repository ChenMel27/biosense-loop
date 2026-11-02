import { describe, expect, it } from "vitest";

import {
  applyTeacherContentDraft,
  buildApprovedContentPack,
  lessonDraftToContentDraft,
  TEACHER_COMPLETION_PROMPT_ID,
  TEACHER_FALLBACK_PROMPT_ID,
} from "@/content/teacher-draft";
import { approveTeacherContentPack } from "@/content/approve-teacher-pack";
import { traitInheritancePack } from "@/content/trait-inheritance";

describe("teacher content draft", () => {
  it("forces every newly approved activity into the single-response flow", () => {
    const contentDraft = lessonDraftToContentDraft({
      lessonTitle: "Cell transport",
      gradeLevel: "Grade 10",
      course: "Biology",
      topic: "Osmosis",
      scopeBoundary: "Evaluate only water movement and membrane evidence.",
      studentContext: "A cell is placed in salt water during a lab investigation.",
      studentPrompt: "Predict which way water moves, explain why, and use one fact from the scenario as evidence.",
      requiredVocabulary: "osmosis, concentration gradient",
      targetIdeas: [{ id: "water_direction", label: "Water movement", description: "The response states the direction of water movement.", suggestedTeacherResponse: "Draw a concentration diagram." }],
      possibleMisconceptions: [{ id: "water_pulled", label: "Salt pulls water", description: "The response describes a pulling force.", sourceSupport: "Teacher review", suggestedTeacherResponse: "Contrast a force claim with particle movement." }],
      sourceNotes: [],
      teacherReviewChecks: [],
    });
    const approved = approveTeacherContentPack(
      { ...contentDraft, activityFlow: "legacy_learning_loop", includeTransfer: true },
      6,
      "2026-10-31T16:00:00.000Z",
    );

    expect(approved.contentPack.activityFlow).toBe("single_response");
    expect(approved.contentPack.includeTransfer).toBe(false);
    expect(approved.contentPack.minimumInitialSentences).toBe(3);
  });

  it("builds a standalone approved snapshot without inheriting demo content", () => {
    const draft = {
      title: "Photosynthesis and plant growth",
      gradeBand: "Grade 8 Biology",
      scopeBoundary: "Evaluate only matter sources, light energy, and evidence from the plant case.",
      initialPrompt: "Read the bean-plant results and explain why the plant in light produced more new material.",
      nearTransferPrompt: "Explain what happens to glucose production when carbon dioxide is reduced.",
      completionPromptId: TEACHER_COMPLETION_PROMPT_ID,
      ideaIds: ["matter_source"],
      ideaLabels: { matter_source: "Matter in glucose comes from carbon dioxide and water" },
      ideaDescriptions: { matter_source: "The response identifies the matter sources used to make glucose." },
      misconceptionIds: ["soil_is_main_source"],
      misconceptionLabels: { soil_is_main_source: "Most plant mass comes from soil" },
      misconceptionDescriptions: { soil_is_main_source: "The response explicitly claims soil supplies most new plant mass." },
      followUpIds: ["matter_probe", TEACHER_COMPLETION_PROMPT_ID],
      followUpTitles: {
        matter_probe: "Trace the matter",
        [TEACHER_COMPLETION_PROMPT_ID]: "Review your explanation",
        [TEACHER_FALLBACK_PROMPT_ID]: "Clarify your explanation",
      },
      followUpPrompts: {
        matter_probe: "Which substances supplied the atoms in the new glucose?",
        [TEACHER_COMPLETION_PROMPT_ID]: "Reread and clarify your evidence link if needed.",
        [TEACHER_FALLBACK_PROMPT_ID]: "Describe what changed between the two plants.",
      },
      followUpTargetIds: {
        matter_probe: ["matter_source", "soil_is_main_source"],
        [TEACHER_COMPLETION_PROMPT_ID]: ["matter_source"],
        [TEACHER_FALLBACK_PROMPT_ID]: ["matter_source", "soil_is_main_source"],
      },
      sourceNotes: ["Teacher slide 8 defines the matter inputs."],
      teacherReviewChecks: ["Confirm wording before class."],
    };
    const pack = buildApprovedContentPack(draft, {
      id: "teacher-photosynthesis-a1b2c3d4",
      versionId: "teacher-photosynthesis-20260921-a1b2c3d4",
      approvedAt: "2026-09-21T20:00:00.000Z",
      estimatedMinutes: 15,
    });

    expect(pack.teacherReviewStatus).toBe("approved");
    expect(pack.versionId).toBe("teacher-photosynthesis-20260921-a1b2c3d4");
    expect(pack.fallbackPrompt.id).toBe(TEACHER_FALLBACK_PROMPT_ID);
    expect(pack.initialPrompt.text).not.toContain("beetle");
    expect(pack.ideas.map((idea) => idea.id)).toEqual(["matter_source"]);
    expect(pack.alternativeConceptions.map((item) => item.id)).toEqual(["soil_is_main_source"]);
    expect(pack.authoringNotes).toEqual(["Teacher slide 8 defines the matter inputs."]);
    expect(pack.approvedAt).toBe("2026-09-21T20:00:00.000Z");
  });

  it("turns an uploaded lesson draft into the content used by a classroom session", () => {
    const contentDraft = lessonDraftToContentDraft({
      lessonTitle: "Cell transport",
      gradeLevel: "Grade 10",
      course: "Biology",
      topic: "Osmosis",
      scopeBoundary: "Evaluate only water movement and membrane evidence.",
      studentContext: "A cell is placed in salt water.",
      studentPrompt: "Explain which way water moves and why.",
      requiredVocabulary: "osmosis, concentration gradient",
      targetIdeas: [{ id: "water_direction", label: "Water movement", description: "The response states the direction of water movement.", suggestedTeacherResponse: "Draw a concentration diagram." }],
      possibleMisconceptions: [{ id: "water_pulled", label: "Salt pulls water", description: "The response describes a pulling force.", sourceSupport: "Teacher review", suggestedTeacherResponse: "Contrast a force claim with particle movement." }],
      sourceNotes: [],
      teacherReviewChecks: [],
    });
    const pack = applyTeacherContentDraft(traitInheritancePack, contentDraft);

    expect(pack.title).toBe("Cell transport");
    expect(pack.gradeBand).toBe("Grade 10 Biology");
    expect(pack.initialPrompt.text).toContain("A cell is placed in salt water.");
    expect(pack.activityFlow).toBe("single_response");
    expect(pack.includeTransfer).toBe(false);
    expect(pack.essentialVocabulary).toEqual(["osmosis", "concentration gradient"]);
    expect(pack.completionPromptId).toBe(TEACHER_COMPLETION_PROMPT_ID);
    expect(pack.followUps.map((item) => item.id)).toEqual([
      "analysis_idea_01",
      "analysis_misconception_01",
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
