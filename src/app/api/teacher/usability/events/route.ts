import { randomUUID } from "node:crypto";

import { getTeacherIdentity } from "@/lib/auth/guards";
import { teacherUsabilityEventSchema } from "@/lib/domain/validation";
import { apiError, validationMessage } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  if (!(await getTeacherIdentity())) return apiError("Teacher sign-in required.", 401);
  const parsed = teacherUsabilityEventSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return apiError(validationMessage(parsed.error));

  await getStore().saveTeacherUsabilityEvent({
    id: randomUUID(),
    ...parsed.data,
    createdAt: new Date().toISOString(),
  });
  return Response.json({ ok: true }, { status: 201 });
}
