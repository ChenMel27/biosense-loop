import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { SessionDashboard } from "@/components/SessionDashboard";
import { TeacherShell } from "@/components/TeacherShell";
import { getTeacherIdentity } from "@/lib/auth/guards";
import { getStore } from "@/lib/store";

export const metadata: Metadata = { title: "Session dashboard" };
export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getTeacherIdentity())) redirect("/teacher/login");
  const { id } = await params;
  const snapshot = await getStore().getDashboardSnapshot(id);
  if (!snapshot) notFound();
  return <TeacherShell active="session"><div className="stack-lg"><Link className="back-link" href="/teacher">← All sessions</Link><SessionDashboard initialSnapshot={snapshot} /></div></TeacherShell>;
}
