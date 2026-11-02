import { createLessonDraft } from "@/lib/ai/lesson-draft";
import { getTeacherIdentity } from "@/lib/auth/guards";
import {
  courseOptions,
  normalizeGradeLevel,
  type Course,
} from "@/lib/domain/curriculum";
import { apiError } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const identity = await getTeacherIdentity();
  if (!identity) return apiError("Teacher sign-in required.", 401);

  try {
    const form = await request.formData();
    const fileValue = form.get("lessonFile");
    const lessonNotes = String(form.get("lessonNotes") ?? "").slice(0, 30_000);
    const gradeLevel = normalizeGradeLevel(String(form.get("gradeLevel") ?? ""));
    const courseValue = String(form.get("course") ?? "").trim();
    if (!gradeLevel) throw new Error("Select the grade for this activity.");
    if (!courseOptions.some((option) => option.value === courseValue)) {
      throw new Error("Select a valid course for this activity.");
    }
    const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
    const result = await createLessonDraft({
      file,
      lessonNotes,
      gradeLevel,
      course: courseValue as Course,
      learningObjective: String(form.get("learningObjective") ?? "").slice(0, 4_000),
      essentialContent: String(form.get("essentialContent") ?? "").slice(0, 6_000),
      evidenceStudentsShouldUse: String(form.get("evidenceStudentsShouldUse") ?? "").slice(0, 4_000),
      commonConfusion: String(form.get("commonConfusion") ?? "").slice(0, 4_000),
      requiredVocabulary: String(form.get("requiredVocabulary") ?? "").slice(0, 2_000),
      teacherIdentity: identity.sub,
    });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The lesson draft could not be created.";
    const status = message.startsWith("OpenAI") ? 503 : 400;
    console.error("Lesson draft creation failed", {
      errorType: error instanceof Error ? error.name : "unknown",
    });
    return apiError(message, status);
  }
}
