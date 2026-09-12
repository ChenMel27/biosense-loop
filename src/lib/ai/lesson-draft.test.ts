import { describe, expect, it } from "vitest";

import {
  MAX_LESSON_FILE_BYTES,
  toEditableLessonDraft,
  validateLessonDraftInput,
} from "@/lib/ai/lesson-draft";

const modelDraft = {
  lesson_title: "Cell transport",
  grade_band: "High school biology",
  topic: "Diffusion and osmosis",
  scope_boundary: "Classify only the cell transport relationships covered in these notes.",
  student_context: "A cell is placed in a concentrated solution.",
  student_prompt: "Explain what happens to water and why.",
  near_transfer_prompt: "Explain water movement for a cell placed in a different solution.",
  completion_question: "Reread your explanation and strengthen the evidence link if needed.",
  target_ideas: [
    {
      label: "Water moves across the membrane",
      description: "The response describes water movement across a selectively permeable membrane.",
      suggested_teacher_response: "Model the concentration difference with a diagram.",
    },
  ],
  possible_misconceptions: [
    {
      label: "Solute pulls water like a force",
      description: "The response treats osmosis as a pulling force.",
      source_support: "Needs research or teacher confirmation.",
      suggested_teacher_response: "Contrast particle motion with a pulling-force explanation.",
    },
  ],
  follow_up_questions: [
    {
      title: "Trace the water",
      question: "Where is water more concentrated, and which way does it move?",
      target_kind: "target_idea" as const,
      target_index: 9,
    },
  ],
  clarification_question: "Describe what changes inside and outside the cell.",
  source_notes: [],
  teacher_review_checks: ["Check the concentration language."],
};

describe("lesson draft authoring", () => {
  it("turns structured model output into stable editable IDs", () => {
    const draft = toEditableLessonDraft(modelDraft);
    expect(draft.targetIdeas[0].id).toBe("target_idea_01");
    expect(draft.possibleMisconceptions[0].id).toBe("possible_misconception_01");
    expect(draft.followUpQuestions[0]).toMatchObject({
      targetKind: "target_idea",
      targetId: "target_idea_01",
    });
    expect(draft.teacherReviewChecks.at(-1)).toContain("Confirm the science content");
  });

  it("requires a supported file or enough pasted lesson context", () => {
    expect(() => validateLessonDraftInput(null, "Too short")).toThrow(/Upload a lesson file/);
    expect(() => validateLessonDraftInput(null, "A complete lesson description with enough context for a useful draft.")).not.toThrow();
  });

  it("rejects unsupported and oversized files", () => {
    const unsupported = new File(["notes"], "lesson.exe", { type: "application/octet-stream" });
    expect(() => validateLessonDraftInput(unsupported, "")).toThrow(/PDF, Word, PowerPoint/);
    const oversized = new File([new Uint8Array(MAX_LESSON_FILE_BYTES + 1)], "lesson.pdf", { type: "application/pdf" });
    expect(() => validateLessonDraftInput(oversized, "")).toThrow(/under 4 MB/);
  });
});
