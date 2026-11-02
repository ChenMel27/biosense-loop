import { randomUUID } from "node:crypto";

import { z } from "zod";

import { getTeacherIdentity } from "@/lib/auth/guards";
import { apiError, validationMessage } from "@/lib/http";
import { getStore } from "@/lib/store";

const classificationReviewSchema = z.object({
  signalId: z.string().trim().min(1).max(200),
  judgment: z.enum(["confirmed", "dismissed"]),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await getTeacherIdentity())) {
    return apiError("Teacher sign-in required.", 401);
  }
  const { id: sessionId } = await context.params;
  const parsed = classificationReviewSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return apiError(validationMessage(parsed.error));

  const store = getStore();
  if (!(await store.getSession(sessionId))) {
    return apiError("Session not found.", 404);
  }
  const createdAt = new Date().toISOString();
  const event = await store.saveTeacherReviewJudgment({
    id: randomUUID(),
    sessionId,
    ...parsed.data,
    createdAt,
  });
  if (!event) {
    return apiError("Review suggestion not found for this session.", 404);
  }

  return Response.json({
    ok: true,
    review: {
      signalId: parsed.data.signalId,
      judgment: parsed.data.judgment,
      reviewedAt: createdAt,
    },
  });
}
