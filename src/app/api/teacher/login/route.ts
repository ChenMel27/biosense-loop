import { NextResponse } from "next/server";

import {
  TEACHER_COOKIE,
  passwordMatches,
  secureCookieOptions,
  signToken,
} from "@/lib/auth/tokens";
import { apiError } from "@/lib/http";
import { requestFingerprint, withinRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!withinRateLimit(`teacher-login:${requestFingerprint(request)}`, 8, 15 * 60_000)) {
    return apiError("Too many sign-in attempts. Try again later.", 429);
  }
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  if (!body || typeof body.password !== "string" || !passwordMatches(body.password)) {
    return apiError("The teacher password is incorrect.", 401);
  }
  const response = NextResponse.json({ ok: true, redirect: "/teacher" });
  response.cookies.set(
    TEACHER_COOKIE,
    signToken({ sub: "teacher", role: "teacher" }, 60 * 60 * 8),
    { ...secureCookieOptions, maxAge: 60 * 60 * 8 },
  );
  return response;
}

