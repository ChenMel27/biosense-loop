import { createHash } from "node:crypto";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

export const MAX_LESSON_FILE_BYTES = 4_000_000;

const acceptedExtensions = new Set([
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "txt",
  "md",
  "rtf",
  "odt",
]);

const mimeByExtension: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  md: "text/markdown",
  rtf: "application/rtf",
  odt: "application/vnd.oasis.opendocument.text",
};

export const lessonDraftModelSchema = z.object({
  lesson_title: z.string(),
  grade_band: z.string(),
  topic: z.string(),
  scope_boundary: z.string(),
  student_context: z.string(),
  student_prompt: z.string(),
  near_transfer_prompt: z.string(),
  completion_question: z.string(),
  target_ideas: z.array(
    z.object({
      label: z.string(),
      description: z.string(),
      suggested_teacher_response: z.string(),
    }),
  ),
  possible_misconceptions: z.array(
    z.object({
      label: z.string(),
      description: z.string(),
      source_support: z.string(),
      suggested_teacher_response: z.string(),
    }),
  ),
  follow_up_questions: z.array(
    z.object({
      title: z.string(),
      question: z.string(),
      target_kind: z.enum(["target_idea", "possible_misconception"]),
      target_index: z.number().int(),
    }),
  ),
  clarification_question: z.string(),
  source_notes: z.array(z.string()),
  teacher_review_checks: z.array(z.string()),
});

export type LessonDraftModelOutput = z.infer<typeof lessonDraftModelSchema>;

export interface EditableLessonDraft {
  lessonTitle: string;
  gradeBand: string;
  topic: string;
  scopeBoundary: string;
  studentContext: string;
  studentPrompt: string;
  nearTransferPrompt: string;
  completionQuestion: string;
  targetIdeas: Array<{
    id: string;
    label: string;
    description: string;
    suggestedTeacherResponse: string;
  }>;
  possibleMisconceptions: Array<{
    id: string;
    label: string;
    description: string;
    sourceSupport: string;
    suggestedTeacherResponse: string;
  }>;
  followUpQuestions: Array<{
    id: string;
    title: string;
    question: string;
    targetKind: "target_idea" | "possible_misconception";
    targetId: string;
  }>;
  clarificationQuestion: string;
  sourceNotes: string[];
  teacherReviewChecks: string[];
}

export interface LessonDraftRequest {
  file: File | null;
  lessonNotes: string;
  teacherContext: string;
  teacherIdentity: string;
}

function cleanLine(value: string | undefined, fallback: string) {
  const cleaned = (value ?? "").trim().replace(/\s+/g, " ");
  return cleaned || fallback;
}

function clampIndex(index: number, length: number) {
  if (length <= 1) return 0;
  return Math.min(Math.max(index, 0), length - 1);
}

export function toEditableLessonDraft(raw: LessonDraftModelOutput): EditableLessonDraft {
  const targetIdeas = raw.target_ideas.slice(0, 5).map((idea, index) => ({
    id: `target_idea_${String(index + 1).padStart(2, "0")}`,
    label: cleanLine(idea.label, `Target idea ${index + 1}`),
    description: idea.description.trim(),
    suggestedTeacherResponse: idea.suggested_teacher_response.trim(),
  }));
  const possibleMisconceptions = raw.possible_misconceptions
    .slice(0, 6)
    .map((item, index) => ({
      id: `possible_misconception_${String(index + 1).padStart(2, "0")}`,
      label: cleanLine(item.label, `Possible misconception ${index + 1}`),
      description: item.description.trim(),
      sourceSupport: item.source_support.trim(),
      suggestedTeacherResponse: item.suggested_teacher_response.trim(),
    }));

  const seenTargets = new Set<string>();
  const followUpQuestions = raw.follow_up_questions.slice(0, 12).map((item, index) => {
    const targets = item.target_kind === "target_idea" ? targetIdeas : possibleMisconceptions;
    const target = targets[clampIndex(item.target_index, targets.length)];
    const targetId = target?.id ?? targetIdeas[0]?.id ?? possibleMisconceptions[0]?.id ?? "clarification";
    seenTargets.add(targetId);
    return {
      id: `follow_up_${String(index + 1).padStart(2, "0")}`,
      title: cleanLine(item.title, `Follow-up question ${index + 1}`),
      question: item.question.trim(),
      targetKind: item.target_kind,
      targetId,
    };
  });

  return {
    lessonTitle: cleanLine(raw.lesson_title, "Untitled lesson"),
    gradeBand: cleanLine(raw.grade_band, "Teacher review needed"),
    topic: cleanLine(raw.topic, "Teacher review needed"),
    scopeBoundary: cleanLine(
      raw.scope_boundary,
      "Classify only the scientific ideas and misconceptions reviewed for this lesson.",
    ),
    studentContext: raw.student_context.trim(),
    studentPrompt: raw.student_prompt.trim(),
    nearTransferPrompt:
      raw.near_transfer_prompt?.trim() ||
      "Explain the same scientific relationship in a new example from this lesson.",
    completionQuestion:
      raw.completion_question?.trim() ||
      "Your explanation includes the target ideas. Reread it and revise only if you can connect your evidence and conclusion more clearly.",
    targetIdeas,
    possibleMisconceptions,
    followUpQuestions,
    clarificationQuestion: raw.clarification_question.trim(),
    sourceNotes: raw.source_notes.map((note) => note.trim()).filter(Boolean).slice(0, 10),
    teacherReviewChecks: [
      ...raw.teacher_review_checks.map((check) => check.trim()).filter(Boolean),
      ...(seenTargets.size < targetIdeas.length
        ? ["Add or revise follow-up questions so every target idea has a matching question."]
        : []),
      "Confirm the science content, misconceptions, and question wording before using this draft.",
    ].filter((value, index, values) => values.indexOf(value) === index).slice(0, 8),
  };
}

export function validateLessonDraftInput(file: File | null, lessonNotes: string) {
  const trimmedNotes = lessonNotes.trim();
  if (!file && trimmedNotes.length < 40) {
    throw new Error("Upload a lesson file or paste at least a few sentences of lesson context.");
  }
  if (!file) return;
  if (file.size > MAX_LESSON_FILE_BYTES) {
    throw new Error("Keep the lesson file under 4 MB.");
  }
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!acceptedExtensions.has(extension)) {
    throw new Error("Use a PDF, Word, PowerPoint, text, Markdown, RTF, or ODT file.");
  }
}

function authoringInstructions() {
  return `You help a biology teacher turn lesson materials into an editable ExitLoop activity draft. The draft is for teacher review, not automatic classroom use.

Use only information in the supplied lesson material and teacher context. Write clear, age-appropriate language. Create one short explanation task that students can complete after the lesson. Create a related transfer prompt that checks the same reasoning in a new example without requiring new content. State a short scope boundary for what the classifier should and should not evaluate. Identify three to five scientific relationships that a strong explanation should state. Identify three to six possible misconceptions that are directly relevant to the lesson. Do not call a misconception research-based unless the supplied materials include a supporting source. In source_support, name the exact source or section found in the supplied materials; otherwise write "Needs research or teacher confirmation." Create at least one focused follow-up question for each target idea and each possible misconception. A follow-up should help the student explain the missing or incompatible relationship without giving away a final answer. Create one completion question for a response that already includes every target idea and one clarification question for short, unclear, or off-topic responses.

Do not grade students, assign mastery, invent citations, or create facts that are not supported by the lesson materials. Include a short checklist of items the teacher still needs to verify. Return only the requested structured data.`;
}

export async function createLessonDraft(input: LessonDraftRequest) {
  validateLessonDraftInput(input.file, input.lessonNotes);
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI is not configured for lesson drafting.");
  }

  const content: Array<
    | { type: "input_text"; text: string }
    | { type: "input_file"; filename: string; file_data: string; detail?: "low" }
  > = [];
  if (input.file) {
    const bytes = Buffer.from(await input.file.arrayBuffer());
    const extension = input.file.name.split(".").pop()?.toLowerCase() ?? "";
    const mime = input.file.type || mimeByExtension[extension] || "application/octet-stream";
    content.push({
      type: "input_file",
      filename: input.file.name,
      file_data: `data:${mime};base64,${bytes.toString("base64")}`,
      ...(mime === "application/pdf" ? { detail: "low" as const } : {}),
    });
  }
  content.push({
    type: "input_text",
    text: [
      input.teacherContext.trim() ? `Teacher context:\n${input.teacherContext.trim()}` : "",
      input.lessonNotes.trim() ? `Pasted lesson material:\n${input.lessonNotes.trim()}` : "",
    ].filter(Boolean).join("\n\n") || "Use the attached lesson file to create the draft.",
  });

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 1,
    timeout: 60_000,
  });
  try {
    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL || "gpt-5.6",
      instructions: `${authoringInstructions()}\n\nThe target_index field is zero-based: use 0 for the first item in the chosen target list, 1 for the second, and so on.`,
      input: [{ role: "user", content }],
      text: { format: zodTextFormat(lessonDraftModelSchema, "exitloop_lesson_draft") },
      max_output_tokens: 3_500,
      store: false,
      safety_identifier: createHash("sha256")
        .update(`lesson-draft:${input.teacherIdentity}`)
        .digest("hex")
        .slice(0, 64),
    });
    if (!response.output_parsed) throw new Error("OpenAI did not return a lesson draft.");
    return {
      draft: toEditableLessonDraft(response.output_parsed),
      model: response.model,
    };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error("OpenAI could not create the lesson draft. Check the API setup and try again.");
    }
    throw error;
  }
}
