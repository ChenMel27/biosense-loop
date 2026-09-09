import { randomUUID } from "node:crypto";

import { traitInheritancePack } from "@/content/trait-inheritance";
import { getTeacherIdentity } from "@/lib/auth/guards";
import { teacherUsabilitySubmissionSchema } from "@/lib/domain/validation";
import { apiError, validationMessage } from "@/lib/http";
import { getStore } from "@/lib/store";
import { calculateSusScore } from "@/lib/usability/summary";

export async function POST(request: Request) {
  if (!(await getTeacherIdentity())) return apiError("Teacher sign-in required.", 401);
  const parsed = teacherUsabilitySubmissionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return apiError(validationMessage(parsed.error));

  const submission = {
    id: randomUUID(),
    ...parsed.data,
    contentVersionId: traitInheritancePack.versionId,
    completedAt: new Date().toISOString(),
    susScore: calculateSusScore(parsed.data.susResponses),
  };
  await getStore().saveTeacherUsabilitySubmission(submission);
  return Response.json(
    { ok: true, submissionId: submission.id, susScore: submission.susScore },
    { status: 201 },
  );
}
