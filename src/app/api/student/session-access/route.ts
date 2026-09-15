import { normalizeCode } from "@/lib/domain/assignment";
import { apiError } from "@/lib/http";
import { requestFingerprint, withinRateLimit } from "@/lib/rate-limit";
import { getStore } from "@/lib/store";

export async function GET(request: Request) {
  const fingerprint = requestFingerprint(request);
  if (!withinRateLimit(`session-access:${fingerprint}`, 120, 60_000)) {
    return apiError("Too many requests. Please try again shortly.", 429);
  }
  const classCode = normalizeCode(new URL(request.url).searchParams.get("classCode") ?? "");
  if (classCode.length < 4 || classCode.length > 12) {
    return apiError("Enter a valid class code.");
  }
  const store = getStore();
  const session = await store.getSessionByJoinCode(classCode);
  if (!session || session.status !== "active") {
    return apiError("That class session is not open.", 404);
  }
  const configuration = await store.getTeacherActivityConfiguration(session.id);
  return Response.json({
    ok: true,
    collectStudentNames: Boolean(configuration?.contentDraft.collectStudentNames),
  });
}
