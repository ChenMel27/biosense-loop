import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/Brand";
import { SessionDashboard } from "@/components/SessionDashboard";
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
  return <div className="teacher-page"><AppHeader compact /><main className="shell teacher-main stack-lg"><Link className="back-link" href="/teacher">← All classroom sessions</Link><SessionDashboard initialSnapshot={snapshot} /></main></div>;
}
