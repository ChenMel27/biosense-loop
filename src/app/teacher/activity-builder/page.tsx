import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TeacherActivityBuilder } from "@/components/TeacherActivityBuilder";
import { TeacherShell } from "@/components/TeacherShell";
import { getTeacherIdentity } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Activity builder" };
export const dynamic = "force-dynamic";

export default async function ActivityBuilderPage() {
  if (!(await getTeacherIdentity())) {
    redirect("/teacher/login?next=%2Fteacher%2Factivity-builder");
  }
  return (
    <TeacherShell active="builder">
      <div className="stack-lg">
        <TeacherActivityBuilder />
      </div>
    </TeacherShell>
  );
}
