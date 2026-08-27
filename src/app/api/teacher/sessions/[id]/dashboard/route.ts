import { getTeacherIdentity } from "@/lib/auth/guards";
import { apiError } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await getTeacherIdentity())) return apiError("Teacher sign-in required.", 401);
  const { id } = await context.params;
  const snapshot = await getStore().getDashboardSnapshot(id);
  if (!snapshot) return apiError("Session not found.", 404);
  return Response.json({ ok: true, snapshot });
}
