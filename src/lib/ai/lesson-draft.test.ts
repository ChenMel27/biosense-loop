import { describe, expect, it } from "vitest";

import {
  buildLessonDraftContext,
  languageGuidanceForGrade,
  MAX_LESSON_FILE_BYTES,
  toEditableLessonDraft,
  validateLessonDraftInput,
} from "@/lib/ai/lesson-draft";
import {
  LESSON_FILE_ACCEPT,
  LESSON_FILE_FORMAT_LABEL,
  resolveLessonFileMime,
} from "@/lib/lesson-files";

const modelDraft = {
  lesson_title: "Cell transport",
  grade_band: "10th-grade biology",
  topic: "Diffusion and osmosis",
  scope_boundary: "Classify only the cell transport relationships covered in these notes.",
  student_context: "A cell is placed in a concentrated solution.",
  student_prompt: "Explain what happens to water and why.",
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
  source_notes: [],
  teacher_review_checks: ["Check the concentration language."],
};

describe("lesson draft authoring", () => {
  it("turns structured model output into stable editable IDs", () => {
    const draft = toEditableLessonDraft(modelDraft);
    expect(draft.targetIdeas[0].id).toBe("target_idea_01");
    expect(draft.possibleMisconceptions[0].id).toBe("possible_misconception_01");
    expect(draft.gradeLevel).toBe("Grade 10");
    expect(draft.course).toBe("Biology");
    expect(draft.requiredVocabulary).toBe("");
    expect(draft.teacherReviewChecks.at(-1)).toContain("Confirm the science content");
  });

  it("keeps the teacher-selected grade and course instead of model-inferred values", () => {
    const draft = toEditableLessonDraft(modelDraft, {
      gradeLevel: "Grade 7",
      course: "Biology",
      requiredVocabulary: "gene, chromosome",
    });

    expect(draft.gradeLevel).toBe("Grade 7");
    expect(draft.course).toBe("Biology");
    expect(draft.requiredVocabulary).toBe("gene, chromosome");
  });

  it("adds optional teacher guidance and grade-specific language direction", () => {
    const context = buildLessonDraftContext({
      lessonNotes: "Students compare chromosome evidence from two parent cells.",
      gradeLevel: "Grade 7",
      course: "Biology",
      learningObjective: "Explain how chromosomes carry inherited information.",
      essentialContent: "One relevant chromosome comes from each parent.",
      evidenceStudentsShouldUse: "Use the labeled chromosome diagram.",
      commonConfusion: "A gene is the visible trait itself.",
      requiredVocabulary: "gene, chromosome, inherited trait",
    });

    expect(context).toContain("Selected grade and course:\nGrade 7 Biology");
    expect(context).toContain("short, direct sentences");
    expect(context).toContain("very little carbon dioxide");
    expect(context).toContain("Learning objective:\nExplain how chromosomes carry inherited information.");
    expect(context).toContain("Required vocabulary and terms:\ngene, chromosome, inherited trait");
  });

  it("omits empty optional guidance while retaining vocabulary guidance by grade", () => {
    const context = buildLessonDraftContext({
      lessonNotes: "A lesson description with enough detail to create a draft.",
      gradeLevel: "Grade 3",
      course: "Biology",
      learningObjective: "",
      essentialContent: "",
      evidenceStudentsShouldUse: "",
      commonConfusion: "",
      requiredVocabulary: "",
    });

    expect(context).not.toContain("Optional teacher guidance");
    expect(languageGuidanceForGrade("Grade 3")).toContain("required science words");
  });

  it("requires a supported file or enough pasted lesson context", () => {
    expect(() => validateLessonDraftInput(null, "Too short")).toThrow(/Upload a lesson file/);
    expect(() => validateLessonDraftInput(null, "A complete lesson description with enough context for a useful draft.")).not.toThrow();
  });

  it("rejects unsupported and oversized files", () => {
    const unsupported = new File(["notes"], "lesson.exe", { type: "application/octet-stream" });
    expect(() => validateLessonDraftInput(unsupported, "")).toThrow(LESSON_FILE_FORMAT_LABEL);
    const oversized = new File([new Uint8Array(MAX_LESSON_FILE_BYTES + 1)], "lesson.pdf", { type: "application/pdf" });
    expect(() => validateLessonDraftInput(oversized, "")).toThrow(/under 4 MB/);
  });

  it("accepts the advertised PDF, PowerPoint, Word, and text formats", () => {
    for (const filename of [
      "lesson.PDF",
      "lesson.ppt",
      "lesson.PPTX",
      "lesson.doc",
      "lesson.docx",
      "lesson.txt",
      "lesson.md",
      "lesson.rtf",
      "lesson.odt",
    ]) {
      expect(() => validateLessonDraftInput(new File(["lesson"], filename), "")).not.toThrow();
    }
    expect(LESSON_FILE_ACCEPT).toContain(".ppt,.pptx");
  });

  it("uses the extension MIME for supported files even when the browser MIME is generic", () => {
    expect(resolveLessonFileMime("lesson.pptx", "application/octet-stream")).toBe(
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );
    expect(resolveLessonFileMime("lesson.pdf", "application/octet-stream")).toBe(
      "application/pdf",
    );
  });
});
