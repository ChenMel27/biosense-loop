import { cookies } from "next/headers";

import {
  STUDENT_COOKIE,
  TEACHER_COOKIE,
  verifyToken,
} from "@/lib/auth/tokens";

export async function getTeacherIdentity() {
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get(TEACHER_COOKIE)?.value, "teacher");
}

export async function getStudentIdentity() {
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get(STUDENT_COOKIE)?.value, "student");
}

