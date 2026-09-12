import { getTeacherIdentity } from "@/lib/auth/guards";
import { apiError } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await getTeacherIdentity())) return apiError("Teacher sign-in required.", 401);
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  if (!body || !["draft", "active", "closed"].includes(String(body.status))) {
    return apiError("Choose a valid session status.");
  }
  await getStore().updateSessionStatus(
    id,
    body.status as "draft" | "active" | "closed",
  );
  return Response.json({ ok: true });
}
