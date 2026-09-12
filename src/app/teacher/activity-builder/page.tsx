import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/Brand";
import { TeacherActivityBuilder } from "@/components/TeacherActivityBuilder";
import { getTeacherIdentity } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Activity builder" };
export const dynamic = "force-dynamic";

export default async function ActivityBuilderPage() {
  if (!(await getTeacherIdentity())) {
    redirect("/teacher/login?next=%2Fteacher%2Factivity-builder");
  }
  return (
    <div className="teacher-page">
      <AppHeader compact />
      <main className="shell teacher-main stack-lg">
        <Link className="back-link" href="/teacher">← Teacher workspace</Link>
        <TeacherActivityBuilder />
      </main>
    </div>
  );
}
