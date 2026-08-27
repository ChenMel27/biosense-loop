import { NextResponse } from "next/server";

import { TEACHER_COOKIE, secureCookieOptions } from "@/lib/auth/tokens";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(TEACHER_COOKIE, "", { ...secureCookieOptions, maxAge: 0 });
  return response;
}
