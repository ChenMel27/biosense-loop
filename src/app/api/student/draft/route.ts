import { getStudentIdentity } from "@/lib/auth/guards";
import { apiError } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function PUT(request: Request) {
  const identity = await getStudentIdentity();
  if (!identity) return apiError("Your activity session has expired.", 401);
  const body = (await request.json().catch(() => null)) as {
    draftText?: unknown;
    stage?: unknown;
  } | null;
  const allowedStages = ["initial", "revision", "transfer"];
  if (
    !body ||
    typeof body.draftText !== "string" ||
    !allowedStages.includes(String(body.stage))
  ) {
    return apiError("Invalid draft.");
  }
  await getStore().saveDraft(
    identity.sub,
    body.draftText,
    body.stage as "initial" | "revision" | "transfer",
  );
  return Response.json({ ok: true, savedAt: new Date().toISOString() });
}
