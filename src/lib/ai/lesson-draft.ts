import { createHash } from "node:crypto";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import {
  normalizeGradeLevel,
  type Course,
  type GradeLevel,
} from "@/lib/domain/curriculum";
import {
  isAcceptedLessonFilename,
  LESSON_FILE_FORMAT_LABEL,
  MAX_LESSON_FILE_BYTES,
  resolveLessonFileMime,
} from "@/lib/lesson-files";

export { MAX_LESSON_FILE_BYTES } from "@/lib/lesson-files";

export const lessonDraftModelSchema = z.object({
  lesson_title: z.string(),
  grade_band: z.string(),
  topic: z.string(),
  scope_boundary: z.string(),
  student_context: z.string(),
  student_prompt: z.string(),
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
  source_notes: z.array(z.string()),
  teacher_review_checks: z.array(z.string()),
});

export type LessonDraftModelOutput = z.infer<typeof lessonDraftModelSchema>;

export interface EditableLessonDraft {
  lessonTitle: string;
  gradeLevel: GradeLevel | "";
  course: Course;
  topic: string;
  scopeBoundary: string;
  studentContext: string;
  studentPrompt: string;
  requiredVocabulary: string;
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
  sourceNotes: string[];
  teacherReviewChecks: string[];
}

export interface LessonDraftRequest {
  file: File | null;
  lessonNotes: string;
  gradeLevel: GradeLevel;
  course: Course;
  learningObjective: string;
  essentialContent: string;
  evidenceStudentsShouldUse: string;
  commonConfusion: string;
  requiredVocabulary: string;
  teacherIdentity: string;
}

export function languageGuidanceForGrade(gradeLevel: GradeLevel) {
  if (gradeLevel === "Kindergarten") {
    return "Use very short, concrete sentences and one direction at a time. Keep required science words, and explain them with familiar surrounding language.";
  }
  const grade = Number(gradeLevel.replace("Grade ", ""));
  if (grade <= 5) {
    return "Use short, concrete sentences and one main task per question. Keep required science words, and explain them with familiar surrounding language.";
  }
  if (grade <= 9) {
    return "Use short, direct sentences, familiar everyday wording, and one clear task per question. Preserve required scientific words from the lesson, but simplify the language around them. For example, write 'there is very little carbon dioxide around the leaves' instead of 'carbon dioxide is greatly reduced.'";
  }
  return "Use concise, grade-appropriate directions and avoid unnecessary complexity. Preserve the lesson's scientific vocabulary and use it accurately.";
}

export function buildLessonDraftContext(input: Pick<
  LessonDraftRequest,
  | "lessonNotes"
  | "gradeLevel"
  | "course"
  | "learningObjective"
  | "essentialContent"
  | "evidenceStudentsShouldUse"
  | "commonConfusion"
  | "requiredVocabulary"
>) {
  const guidance = [
    ["Learning objective", input.learningObjective],
    ["Essential content", input.essentialContent],
    ["Evidence students should use", input.evidenceStudentsShouldUse],
    ["Common confusion to watch for", input.commonConfusion],
    ["Required vocabulary and terms", input.requiredVocabulary],
  ]
    .filter(([, value]) => value.trim())
    .map(([label, value]) => `${label}:\n${value.trim()}`)
    .join("\n\n");

  return [
    `Selected grade and course:\n${input.gradeLevel} ${input.course}`,
    `Student-facing language guidance:\n${languageGuidanceForGrade(input.gradeLevel)}`,
    guidance ? `Optional teacher guidance:\n${guidance}` : "",
    input.lessonNotes.trim()
      ? `Pasted lesson material:\n${input.lessonNotes.trim()}`
      : "Use the attached lesson file as the lesson material.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function cleanLine(value: string | undefined, fallback: string) {
  const cleaned = (value ?? "").trim().replace(/\s+/g, " ");
  return cleaned || fallback;
}

export function toEditableLessonDraft(
  raw: LessonDraftModelOutput,
  selection?: Pick<LessonDraftRequest, "gradeLevel" | "course"> &
    Partial<Pick<LessonDraftRequest, "requiredVocabulary">>,
): EditableLessonDraft {
  const targetIdeas = raw.target_ideas.slice(0, 3).map((idea, index) => ({
    id: `target_idea_${String(index + 1).padStart(2, "0")}`,
    label: cleanLine(idea.label, `Target idea ${index + 1}`),
    description: idea.description.trim(),
    suggestedTeacherResponse: idea.suggested_teacher_response.trim(),
  }));
  const possibleMisconceptions = raw.possible_misconceptions
    .slice(0, 4)
    .map((item, index) => ({
      id: `possible_misconception_${String(index + 1).padStart(2, "0")}`,
      label: cleanLine(item.label, `Possible misconception ${index + 1}`),
      description: item.description.trim(),
      sourceSupport: item.source_support.trim(),
      suggestedTeacherResponse: item.suggested_teacher_response.trim(),
    }));

  return {
    lessonTitle: cleanLine(raw.lesson_title, "Untitled lesson"),
    gradeLevel: selection?.gradeLevel ?? normalizeGradeLevel(raw.grade_band),
    course: selection?.course ?? "Biology",
    topic: cleanLine(raw.topic, "Teacher review needed"),
    scopeBoundary: cleanLine(
      raw.scope_boundary,
      "Classify only the scientific ideas and misconceptions reviewed for this lesson.",
    ),
    studentContext: raw.student_context.trim(),
    studentPrompt: raw.student_prompt.trim(),
    requiredVocabulary: selection?.requiredVocabulary?.trim() ?? "",
    targetIdeas,
    possibleMisconceptions,
    sourceNotes: raw.source_notes.map((note) => note.trim()).filter(Boolean).slice(0, 10),
    teacherReviewChecks: [
      ...raw.teacher_review_checks.map((check) => check.trim()).filter(Boolean),
      "Confirm that the question asks students to apply or explain the science, not only define a term.",
      "Confirm that students can answer thoughtfully in three to five complete sentences.",
      "Confirm that the language fits the selected grade while keeping required scientific vocabulary.",
      "Confirm the science content and possible misconceptions before using this draft.",
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
  if (!isAcceptedLessonFilename(file.name)) {
    throw new Error(`Use one of these file formats: ${LESSON_FILE_FORMAT_LABEL}.`);
  }
}

function authoringInstructions() {
  return `You help a biology teacher turn lesson materials into an editable ExitLoop activity draft. The draft is for teacher review, not automatic classroom use.

Use only information in the supplied lesson material and teacher guidance. Treat the selected grade and course as authoritative. Write every student-facing passage and question for that grade using the supplied language guidance. Preserve important scientific vocabulary from the lesson and any required vocabulary the teacher lists; simplify the surrounding language instead of replacing precise scientific terms with vague words. Return the selected grade in grade_band.

Focus the activity on one clearly defined scientific concept or relationship. Break that focus into no more than three essential target ideas only when the explanation genuinely requires separate parts. Create one application-based scenario and one open-ended question. The question must ask students to predict, explain a causal relationship, interpret evidence, or apply a scientific idea to the scenario. Do not create a definition-only or recall-only question. Tell students to use at least one detail from the scenario as evidence and write at least three complete sentences; three to five sentences should be enough. Keep the context brief enough for a four-to-six-minute exit ticket, and keep each direction direct and easy to follow.

State a short scope boundary for what the classifier should and should not evaluate. Identify two to four possible misconceptions that are directly relevant to the same focus. Do not call a misconception research-based unless the supplied materials include a supporting source. In source_support, name the exact source or section found in the supplied materials; otherwise write "Needs research or teacher confirmation."

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
    const mime = resolveLessonFileMime(input.file.name, input.file.type);
    content.push({
      type: "input_file",
      filename: input.file.name,
      file_data: `data:${mime};base64,${bytes.toString("base64")}`,
      ...(mime === "application/pdf" ? { detail: "low" as const } : {}),
    });
  }
  content.push({
    type: "input_text",
    text: buildLessonDraftContext(input),
  });

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 1,
    timeout: 60_000,
  });
  try {
    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL || "gpt-5.6",
      instructions: authoringInstructions(),
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
      draft: toEditableLessonDraft(response.output_parsed, input),
      model: response.model,
    };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error("OpenAI could not create the lesson draft. Check the API setup and try again.");
    }
    throw error;
  }
}
