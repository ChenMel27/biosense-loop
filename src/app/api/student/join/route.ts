import { createHash, randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getStudentIdentity } from "@/lib/auth/guards";
import { STUDENT_COOKIE, secureCookieOptions, signToken } from "@/lib/auth/tokens";
import { normalizeCode } from "@/lib/domain/assignment";
import { apiError, validationMessage } from "@/lib/http";
import { requestFingerprint, withinRateLimit } from "@/lib/rate-limit";
import { getStore } from "@/lib/store";
import { joinSchema } from "@/lib/domain/validation";

export async function POST(request: Request) {
  const parsed = joinSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(validationMessage(parsed.error));
  const fingerprint = requestFingerprint(request);
  const classKey = normalizeCode(parsed.data.joinCode);
  const displayName = parsed.data.displayName.replace(/\s+/g, " ").trim();
  const nameKey = displayName.toLocaleLowerCase();
  const nameRateKey = createHash("sha256").update(nameKey).digest("hex").slice(0, 16);
  const classroomBurstAllowed = withinRateLimit(`join-ip:${fingerprint}`, 120, 60_000);
  const repeatedGuessAllowed = withinRateLimit(
    `join-name:${fingerprint}:${classKey}:${nameRateKey}`,
    8,
    15 * 60_000,
  );
  if (!classroomBurstAllowed || !repeatedGuessAllowed) {
    return apiError("Too many join attempts. Please ask your teacher for help.", 429);
  }
  const store = getStore();
  const session = await store.getSessionByJoinCode(parsed.data.joinCode);
  if (!session || session.status !== "active") {
    return apiError("That class session is not open. Check the class code with your teacher.", 404);
  }
  const snapshot = await store.getDashboardSnapshot(session.id);
  const identity = await getStudentIdentity();
  let attempt = null;
  let resumed = false;

  if (identity?.sessionId === session.id) {
    const existingBundle = await store.getAttemptBundle(identity.sub);
    const existingName = snapshot?.submissionRows.find(
      (row) => row.participantTag === existingBundle?.attempt.participantTag,
    )?.displayName;
    if (
      existingBundle &&
      existingName?.replace(/\s+/g, " ").trim().toLocaleLowerCase() === nameKey
    ) {
      attempt = existingBundle.attempt;
      resumed = true;
    }
  }

  if (!attempt) {
    const nameAlreadyUsed = snapshot?.submissionRows.some(
      (row) => row.displayName?.replace(/\s+/g, " ").trim().toLocaleLowerCase() === nameKey,
    );
    if (nameAlreadyUsed) {
      return apiError(
        "That name is already in this class. If another student has the same name, add your last initial.",
        409,
      );
    }
    attempt = await store.claimAvailableAttempt(session);
    if (!attempt) {
      return apiError("This class is full. Ask your teacher for help.", 409);
    }
  }

  await store.appendEvent({
    id: randomUUID(),
    sessionId: session.id,
    attemptId: attempt.id,
    eventType: "student_joined",
    payload: {
      resumed: resumed || attempt.stage !== "initial",
      displayName,
    },
    createdAt: new Date().toISOString(),
  });
  const response = NextResponse.json({ ok: true, redirect: "/student/activity" });
  response.cookies.set(
    STUDENT_COOKIE,
    signToken(
      { sub: attempt.id, role: "student", sessionId: session.id },
      60 * 60 * 4,
    ),
    { ...secureCookieOptions, maxAge: 60 * 60 * 4 },
  );
  return response;
}
