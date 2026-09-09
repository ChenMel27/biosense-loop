import { createHmac, timingSafeEqual } from "node:crypto";

export const TEACHER_COOKIE = "exitloop_teacher";
export const STUDENT_COOKIE = "exitloop_student";

interface TokenPayload {
  sub: string;
  role: "teacher" | "student";
  sessionId?: string;
  exp: number;
}

function secret() {
  const value = process.env.SESSION_SIGNING_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SIGNING_SECRET is required in production.");
  }
  return "development-only-session-secret-change-me";
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function signBody(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function signToken(payload: Omit<TokenPayload, "exp">, ttlSeconds: number) {
  const body = encode(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1_000) + ttlSeconds }),
  );
  return `${body}.${signBody(body)}`;
}

export function verifyToken(token: string | undefined, role: TokenPayload["role"]) {
  if (!token) return null;
  const [body, suppliedSignature] = token.split(".");
  if (!body || !suppliedSignature) return null;
  const expectedSignature = signBody(body);
  const expected = Buffer.from(expectedSignature);
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as TokenPayload;
    if (payload.role !== role || payload.exp < Math.floor(Date.now() / 1_000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function passwordMatches(value: string) {
  const expected = process.env.TEACHER_PASSWORD ||
    (process.env.NODE_ENV === "production" ? "" : "demo-teacher");
  if (!expected) return false;
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export const secureCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

