import { randomUUID } from "node:crypto";

import { z } from "zod";

import { getTeacherIdentity } from "@/lib/auth/guards";
import { apiError, validationMessage } from "@/lib/http";
import { getStore } from "@/lib/store";

const actionSchema = z.object({
  actionType: z.enum([
    "proceed",
    "whole_class_clarification",
    "small_group",
    "review_responses",
    "other",
  ]),
  note: z.string().trim().max(2_000).default(""),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await getTeacherIdentity())) return apiError("Teacher sign-in required.", 401);
  const { id } = await context.params;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(validationMessage(parsed.error));
  if (!(await getStore().getSession(id))) return apiError("Session not found.", 404);
  const action = {
    id: randomUUID(),
    sessionId: id,
    ...parsed.data,
    createdAt: new Date().toISOString(),
  };
  await getStore().saveTeacherAction(action);
  return Response.json({ ok: true, action });
}

