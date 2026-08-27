import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { hashParticipantCode, normalizeCode } from "@/lib/domain/assignment";
import { STUDENT_COOKIE, secureCookieOptions, signToken } from "@/lib/auth/tokens";
import { apiError, validationMessage } from "@/lib/http";
import { requestFingerprint, withinRateLimit } from "@/lib/rate-limit";
import { getStore } from "@/lib/store";
import { joinSchema } from "@/lib/domain/validation";

export async function POST(request: Request) {
  const parsed = joinSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(validationMessage(parsed.error));
  const fingerprint = requestFingerprint(request);
  const codeKey = normalizeCode(parsed.data.participantCode);
  const classroomBurstAllowed = withinRateLimit(`join-ip:${fingerprint}`, 120, 60_000);
  const repeatedGuessAllowed = withinRateLimit(
    `join-code:${fingerprint}:${codeKey}`,
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
  const pepper = process.env.PARTICIPANT_CODE_PEPPER ||
    (process.env.NODE_ENV === "production" ? "" : "development-only-pepper");
  if (!pepper) return apiError("Participant access is not configured.", 503);
  const codeHash = hashParticipantCode(parsed.data.participantCode, pepper);
  const participant = await store.getParticipantByCodeHash(session.id, codeHash);
  if (!participant || !participant.eligible) {
    return apiError("That participant code is not available for this class session.", 403);
  }
  const attempt = await store.getOrCreateAttempt(session, participant);
  await store.appendEvent({
    id: randomUUID(),
    sessionId: session.id,
    attemptId: attempt.id,
    eventType: "student_joined",
    payload: { resumed: attempt.stage !== "initial" },
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
