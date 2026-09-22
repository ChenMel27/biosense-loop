import { approveTeacherContentPack } from "@/content/approve-teacher-pack";
import { getTeacherIdentity } from "@/lib/auth/guards";
import { teacherAuthoredSessionSchema } from "@/lib/domain/validation";
import { apiError, validationMessage } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET() {
  if (!(await getTeacherIdentity())) return apiError("Teacher sign-in required.", 401);
  return Response.json({ ok: true, sessions: await getStore().listSessions() });
}

export async function POST(request: Request) {
  if (!(await getTeacherIdentity())) return apiError("Teacher sign-in required.", 401);
  const parsed = teacherAuthoredSessionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(validationMessage(parsed.error));
  let configuration: ReturnType<typeof approveTeacherContentPack>;
  try {
    configuration = approveTeacherContentPack(
      parsed.data.authoringDraft,
      parsed.data.durationMinutes,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review the activity before opening it.";
    return apiError(message, 400);
  }
  try {
    const result = await getStore().createSession({
      title: parsed.data.title,
      participantCount: parsed.data.participantCount,
      durationMinutes: parsed.data.durationMinutes,
      contentPack: configuration.contentPack,
      approvedAt: configuration.approvedAt,
    });
    return Response.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    console.error("Session creation failed", {
      errorType: error instanceof Error ? error.name : "unknown",
    });
    return apiError("The session could not be saved. Please try again.", 503);
  }
}
