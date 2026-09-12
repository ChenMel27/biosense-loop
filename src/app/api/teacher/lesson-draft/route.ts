import { createLessonDraft } from "@/lib/ai/lesson-draft";
import { getTeacherIdentity } from "@/lib/auth/guards";
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
    const teacherContext = String(form.get("teacherContext") ?? "").slice(0, 4_000);
    const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
    const result = await createLessonDraft({
      file,
      lessonNotes,
      teacherContext,
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
