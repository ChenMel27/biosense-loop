import { traitInheritancePack } from "@/content/trait-inheritance";
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
  if (process.env.NODE_ENV === "production" && !process.env.PARTICIPANT_CODE_PEPPER) {
    return apiError("PARTICIPANT_CODE_PEPPER must be configured before creating a session.", 503);
  }
  const result = await getStore().createSession({
    title: parsed.data.title,
    participantCount: parsed.data.participantCount,
    durationMinutes: parsed.data.durationMinutes,
    contentVersionId: traitInheritancePack.versionId,
    contentDraft: parsed.data.authoringDraft,
  });
  return Response.json({ ok: true, ...result }, { status: 201 });
}
